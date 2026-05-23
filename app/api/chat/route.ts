import { getRequestErrorStatus } from '@/src/lib/api-errors';
import {
  resolveOwnedChatSession,
  setSessionTitleFromFirstQuestionIfNeeded,
} from '@/src/lib/chat-sessions';
import {
  streamStrictAnswer,
  embedOne,
  getEmbeddingDimensions,
  getEmbeddingModelName,
  getEmbeddingProvider,
  STRICT_NO_ANSWER,
} from '@/src/lib/ai';
import { upsertKnowledgeGap } from '@/src/lib/knowledge-gaps';
import { COLLECTION_NAME, ensureQdrantCollection, qdrant } from '@/src/lib/qdrant';
import { compressSearchResults } from '@/src/lib/rag/context';
import { buildNoAnswerMessage, generateFollowUps } from '@/src/lib/rag/followups';
import { getRetrievalSettings } from '@/src/lib/rag/intent';
import { getAuthenticatedUserWithProfile, getSupabaseAdmin } from '@/src/lib/supabase-server';
import { assertWorkspaceOperational } from '@/src/lib/workspace-access';
import { ALL_ROLES, isWorkspaceAdminRole, type AnyAppRole } from '@/src/lib/workspace';

export const dynamic = 'force-dynamic';

type Citation = {
  filename: string;
  chunk_index: number;
  preview: string;
  document_id: string | null;
  chunk_text: string;
  uploaded_at: string | null;
  uploaded_by: string | null;
};

type ChatCompletePayload = {
  answer: string;
  citations: Citation[];
  chatMessageId: string;
  sessionId: string;
  statusMessage: string;
  noAnswer: boolean;
  followUps: string[];
};

function dedupeCitations(citations: Citation[]) {
  const seen = new Set<string>();

  return citations.filter((citation) => {
    const key = `${citation.filename}::${citation.chunk_index}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function shouldDebugRetrieval() {
  return process.env.RAG_DEBUG === 'true';
}

function buildStatusMessages(role: AnyAppRole) {
  if (isWorkspaceAdminRole(role)) {
    return {
      searching: 'Searching workspace documents...',
      matching: 'Reviewing matching sections...',
      preparing: 'Preparing a source-backed answer...',
      verifying: 'Verifying sources...',
      attaching: 'Attaching sources...',
    };
  }

  return {
    searching: 'Searching approved documents...',
    matching: 'Reviewing matching sources...',
    preparing: 'Preparing answer...',
    verifying: 'Checking source support...',
    attaching: 'Attaching sources...',
  };
}

function summarizeSearchResults(searchResults: Awaited<ReturnType<typeof qdrant.search>>) {
  return searchResults.slice(0, 5).map((result) => ({
    score: result.score,
    document_id: result.payload?.document_id || null,
    workspace_id: result.payload?.workspace_id || null,
    chunk_id: result.payload?.chunk_id || null,
    chunk_index: result.payload?.chunk_index || null,
    has_chunk_text: Boolean(result.payload?.chunk_text),
  }));
}

function logRetrievalDebug(label: string, payload: Record<string, unknown>) {
  if (!shouldDebugRetrieval()) {
    return;
  }

  console.info(`[RAG Debug] ${label}`, payload);
}

async function streamTextFallback(
  text: string,
  onChunk: (delta: string) => void,
  isAborted: () => boolean,
) {
  const tokens = text.match(/\S+\s*/g) || [text];

  for (const token of tokens) {
    if (isAborted()) {
      return;
    }

    onChunk(token);
    await new Promise((resolve) => setTimeout(resolve, 18));
  }
}

export async function POST(req: Request) {
  try {
    const { user, profile } = await getAuthenticatedUserWithProfile(req, ALL_ROLES);
    const { question, session_id } = await req.json();
    await assertWorkspaceOperational(profile.workspace_id!);

    if (typeof question !== 'string' || !question.trim()) {
      return Response.json({ error: 'Question is required' }, { status: 400 });
    }

    if (session_id !== undefined && session_id !== null && typeof session_id !== 'string') {
      return Response.json({ error: 'Invalid chat session' }, { status: 400 });
    }

    const normalizedQuestion = question.trim();
    const supabase = getSupabaseAdmin();
    const chatSession = await resolveOwnedChatSession(supabase, {
      sessionId: session_id,
      workspaceId: profile.workspace_id!,
      userId: user.id,
    });
    const encoder = new TextEncoder();
    let clientAborted = false;

    req.signal.addEventListener('abort', () => {
      clientAborted = true;
    });

    const stream = new ReadableStream({
      async start(controller) {
        let controllerClosed = false;

        const sendEvent = (event: string, payload: Record<string, unknown>) => {
          if (controllerClosed || clientAborted) {
            return;
          }

          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`),
          );
        };

        const closeStream = () => {
          if (!controllerClosed) {
            controllerClosed = true;
            controller.close();
          }
        };

        const failStream = (message: string) => {
          sendEvent('error', { message });
          closeStream();
        };

        try {
          const statuses = buildStatusMessages(profile.role);
          const retrievalSettings = getRetrievalSettings(normalizedQuestion);

          sendEvent('status', { message: statuses.searching });
          await ensureQdrantCollection();

          const queryVector = await embedOne(normalizedQuestion, 'query');
          const workspaceFilter = {
            must: [{ key: 'workspace_id', match: { value: profile.workspace_id } }],
          };

          logRetrievalDebug('query', {
            workspace_id: profile.workspace_id,
            collection: COLLECTION_NAME,
            embedding_provider: getEmbeddingProvider(),
            embedding_model: getEmbeddingModelName(),
            embedding_dimensions: getEmbeddingDimensions(),
            query: normalizedQuestion,
            query_vector_length: queryVector.length,
            intent: retrievalSettings.intent,
            top_k: retrievalSettings.topK,
            score_threshold: retrievalSettings.scoreThreshold,
            max_final_chunks: retrievalSettings.maxFinalChunks,
            max_context_characters: retrievalSettings.maxContextCharacters,
          });

          let searchResults = await qdrant.search(COLLECTION_NAME, {
            vector: queryVector,
            filter: workspaceFilter,
            limit: retrievalSettings.topK,
            score_threshold: retrievalSettings.scoreThreshold,
            with_payload: true,
          });

          logRetrievalDebug('qdrant-search', {
            result_count: searchResults.length,
            top_results: summarizeSearchResults(searchResults),
          });

          if (searchResults.length === 0 && retrievalSettings.scoreThreshold > 0) {
            logRetrievalDebug('qdrant-search-retry-no-threshold', {
              reason: 'No results passed score threshold; retrying once without score_threshold while preserving workspace filter.',
              previous_score_threshold: retrievalSettings.scoreThreshold,
            });

            searchResults = await qdrant.search(COLLECTION_NAME, {
              vector: queryVector,
              filter: workspaceFilter,
              limit: retrievalSettings.topK,
              with_payload: true,
            });

            logRetrievalDebug('qdrant-search-no-threshold', {
              result_count: searchResults.length,
              top_results: summarizeSearchResults(searchResults),
            });
          }

          if (clientAborted) {
            closeStream();
            return;
          }

          const documentIds = Array.from(
            new Set(
              searchResults
                .map((result) => String(result.payload?.document_id || ''))
                .filter(Boolean),
            ),
          );

          const documentMetaById = new Map<
            string,
            { created_at: string | null; user_id: string | null }
          >();

          if (documentIds.length > 0) {
            const { data: documentMeta, error: documentMetaError } = await supabase
              .from('documents')
              .select('id, created_at, user_id')
              .in('id', documentIds)
              .eq('workspace_id', profile.workspace_id);

            if (documentMetaError) {
              throw documentMetaError;
            }

            for (const item of documentMeta || []) {
              documentMetaById.set(item.id, {
                created_at: item.created_at || null,
                user_id: item.user_id || null,
              });
            }
          }

          let citations = dedupeCitations(
            searchResults.map((result) => {
              const documentId = String(result.payload?.document_id || '') || null;
              const documentMeta = documentId ? documentMetaById.get(documentId) : undefined;

              return {
                filename: String(result.payload?.filename || 'Unknown file'),
                chunk_index: Number(result.payload?.chunk_index || 0),
                preview: String(result.payload?.preview || ''),
                document_id: documentId,
                chunk_text: String(result.payload?.chunk_text || ''),
                uploaded_at: documentMeta?.created_at || null,
                uploaded_by: documentMeta?.user_id || null,
              };
            }),
          );

          let answer = STRICT_NO_ANSWER;
          let followUps: string[] = [];
          const retrievedFilenames = Array.from(
            new Set(searchResults.map((result) => String(result.payload?.filename || '')).filter(Boolean)),
          );

          if (searchResults.length > 0) {
            const compressedContext = compressSearchResults({
              searchResults,
              maxFinalChunks: retrievalSettings.maxFinalChunks,
              maxContextCharacters: retrievalSettings.maxContextCharacters,
            });
            logRetrievalDebug('context', {
              qdrant_result_count: searchResults.length,
              context_chunk_count: compressedContext.chunks.length,
              context_document_count: compressedContext.documentCount,
              context_character_count: compressedContext.characterCount,
            });

            sendEvent('status', { message: statuses.matching });
            sendEvent('status', { message: statuses.preparing });

            const streamResult = await streamStrictAnswer(normalizedQuestion, compressedContext.context);
            let generatedAnswer = '';

            for await (const chunk of streamResult.stream) {
              if (clientAborted) {
                closeStream();
                return;
              }

              const delta = chunk.text();
              if (!delta) {
                continue;
              }

              generatedAnswer += delta;
              sendEvent('chunk', { delta });
            }

            answer = generatedAnswer.trim() || STRICT_NO_ANSWER;
          } else {
            answer = buildNoAnswerMessage(retrievedFilenames);
            sendEvent('status', { message: statuses.matching });
            sendEvent('status', { message: statuses.preparing });

            await streamTextFallback(
              answer,
              (delta) => sendEvent('chunk', { delta }),
              () => clientAborted,
            );
          }

          if (clientAborted) {
            closeStream();
            return;
          }

          if (answer === STRICT_NO_ANSWER) {
            answer = buildNoAnswerMessage(retrievedFilenames);
          }

          const noAnswer = answer.startsWith("I couldn't find support");
          followUps = generateFollowUps({
            question: normalizedQuestion,
            answer,
            intent: retrievalSettings.intent,
            filenames: retrievedFilenames,
            noAnswer,
          });

          if (noAnswer) {
            citations = [];
          } else {
            sendEvent('status', { message: statuses.verifying });
            sendEvent('status', { message: statuses.attaching });
          }

          await setSessionTitleFromFirstQuestionIfNeeded(supabase, {
            sessionId: chatSession.id,
            question: normalizedQuestion,
          });

          const { data: insertedMessage, error: insertError } = await supabase
            .from('chat_messages')
            .insert({
              user_id: user.id,
              workspace_id: profile.workspace_id,
              session_id: chatSession.id,
              question: normalizedQuestion,
              answer,
              citations,
            })
            .select('id')
            .maybeSingle();

          if (insertError || !insertedMessage) {
            throw insertError;
          }

          if (noAnswer) {
            await upsertKnowledgeGap({
              supabase,
              workspaceId: profile.workspace_id!,
              userId: user.id,
              question: normalizedQuestion,
              sampleAnswer: answer,
            });
          }

          const completePayload: ChatCompletePayload = {
            answer,
            citations,
            chatMessageId: insertedMessage.id,
            sessionId: chatSession.id,
            statusMessage:
              noAnswer
                ? 'No supported answer found in the uploaded documents.'
                : 'Answer generated from verified sources',
            noAnswer,
            followUps,
          };

          sendEvent('complete', completePayload);

          closeStream();
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unexpected chat error';
          console.error('Chat stream error:', error);
          failStream(message);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected chat error';
    const status = getRequestErrorStatus(message);

    console.error('Chat error:', error);
    return Response.json({ error: message }, { status });
  }
}
