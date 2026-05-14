import { getRequestErrorStatus } from '@/src/lib/api-errors';
import { streamStrictAnswer, getEmbedding, STRICT_NO_ANSWER } from '@/src/lib/gemini';
import { upsertKnowledgeGap } from '@/src/lib/knowledge-gaps';
import { COLLECTION_NAME, ensureQdrantCollection, qdrant } from '@/src/lib/qdrant';
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

function getRagTopK() {
  const value = Number(process.env.RAG_TOP_K || 3);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 3;
}

function getRagScoreThreshold() {
  const value = Number(process.env.RAG_SCORE_THRESHOLD || 0.55);
  return Number.isFinite(value) && value >= 0 ? value : 0.55;
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

function createContextFromResults(
  searchResults: Awaited<ReturnType<typeof qdrant.search>>,
) {
  return searchResults
    .map((result, index) => {
      const filename = String(result.payload?.filename || 'Unknown file');
      const chunkNumber = Number(result.payload?.chunk_index || 0);
      const preview = String(result.payload?.preview || '');
      const chunkText = String(result.payload?.chunk_text || '');

      return [
        `Source ${index + 1}:`,
        `Filename: ${filename}`,
        `Chunk Number: ${chunkNumber}`,
        `Preview: ${preview}`,
        `Content: ${chunkText}`,
      ].join('\n');
    })
    .join('\n\n');
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
    const { question } = await req.json();
    await assertWorkspaceOperational(profile.workspace_id!);

    if (typeof question !== 'string' || !question.trim()) {
      return Response.json({ error: 'Question is required' }, { status: 400 });
    }

    const normalizedQuestion = question.trim();
    const supabase = getSupabaseAdmin();
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

          sendEvent('status', { message: statuses.searching });
          await ensureQdrantCollection();

          const queryVector = await getEmbedding(normalizedQuestion);
          const searchResults = await qdrant.search(COLLECTION_NAME, {
            vector: queryVector,
            filter: {
              must: [{ key: 'workspace_id', match: { value: profile.workspace_id } }],
            },
            limit: getRagTopK(),
            score_threshold: getRagScoreThreshold(),
            with_payload: true,
          });

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

          if (searchResults.length > 0) {
            const context = createContextFromResults(searchResults);
            sendEvent('status', { message: statuses.matching });
            sendEvent('status', { message: statuses.preparing });

            const streamResult = await streamStrictAnswer(normalizedQuestion, context);
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
            sendEvent('status', { message: statuses.matching });
            sendEvent('status', { message: statuses.preparing });

            await streamTextFallback(
              STRICT_NO_ANSWER,
              (delta) => sendEvent('chunk', { delta }),
              () => clientAborted,
            );
          }

          if (clientAborted) {
            closeStream();
            return;
          }

          if (answer === STRICT_NO_ANSWER) {
            citations = [];
          } else {
            sendEvent('status', { message: statuses.verifying });
            sendEvent('status', { message: statuses.attaching });
          }

          const { data: insertedMessage, error: insertError } = await supabase
            .from('chat_messages')
            .insert({
              user_id: user.id,
              workspace_id: profile.workspace_id,
              question: normalizedQuestion,
              answer,
              citations,
            })
            .select('id')
            .single();

          if (insertError || !insertedMessage) {
            throw insertError;
          }

          if (answer === STRICT_NO_ANSWER) {
            await upsertKnowledgeGap({
              supabase,
              workspaceId: profile.workspace_id!,
              userId: user.id,
              question: normalizedQuestion,
              sampleAnswer: answer,
            });
          }

          sendEvent('complete', {
            answer,
            citations,
            chatMessageId: insertedMessage.id,
            statusMessage:
              answer === STRICT_NO_ANSWER
                ? 'No supported answer found in the uploaded documents.'
                : 'Answer generated from verified sources',
            noAnswer: answer === STRICT_NO_ANSWER,
          });

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
