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
import { buildAnswerIntelligenceInstructions } from '@/src/lib/rag/answer-intelligence';
import { compressSearchResults } from '@/src/lib/rag/context';
import { calculateAnswerConfidence, sourceConfidenceFromScore, type AnswerConfidence } from '@/src/lib/rag/confidence';
import { buildNoAnswerMessage, generateFollowUps } from '@/src/lib/rag/followups';
import { getRetrievalSettings } from '@/src/lib/rag/intent';
import {
  getQdrantFetchK,
  getRerankTopK,
  mergeRetrievalCandidates,
  rerankCandidates,
  searchQdrantVector,
  type RetrievalCandidate,
} from '@/src/lib/rag/retrieval';
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
  document_category?: string | null;
  relevance_score?: number;
  confidence?: AnswerConfidence;
};

type ChatCompletePayload = {
  answer: string;
  citations: Citation[];
  chatMessageId: string;
  sessionId: string;
  statusMessage: string;
  noAnswer: boolean;
  followUps: string[];
  confidence: AnswerConfidence;
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

type AnswerMode = 'summary' | 'detailed' | 'executive' | 'technical';

function normalizeAnswerMode(value: unknown): AnswerMode {
  return value === 'summary' || value === 'executive' || value === 'technical'
    ? value
    : 'detailed';
}

function extractKeywordTerms(question: string) {
  const quoted = Array.from(question.matchAll(/"([^"]{2,80})"/g)).map((match) => match[1]);
  const tokens = question
    .split(/\s+/)
    .map((token) => token.replace(/[^\w.-]/g, '').trim())
    .filter((token) => {
      if (token.length < 3) return false;
      return /\d/.test(token) || /[A-Z]{2,}/.test(token) || token.includes('-') || token.includes('.');
    });

  return Array.from(new Set([...quoted, ...tokens])).slice(0, 8);
}

function escapeIlikeTerm(term: string) {
  return term.replace(/[%_]/g, '').replace(/[^\w.\- ]/g, '').slice(0, 80);
}

async function keywordSearch({
  supabase,
  workspaceId,
  question,
  limit,
}: {
  supabase: ReturnType<typeof getSupabaseAdmin>;
  workspaceId: string;
  question: string;
  limit: number;
}): Promise<RetrievalCandidate[]> {
  const terms = extractKeywordTerms(question).map(escapeIlikeTerm).filter(Boolean);

  if (terms.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('document_chunks')
    .select('document_id, chunk_index, chunk_text, table_metadata, documents!inner(filename, document_category, document_keywords, document_summary)')
    .eq('workspace_id', workspaceId)
    .or(terms.map((term) => `chunk_text.ilike.%${term}%`).join(','))
    .limit(limit);

  if (error) {
    console.warn('[RAG] keyword search skipped', error);
  }

  const chunkRows = error ? [] : data || [];
  const { data: matchingDocuments } = await supabase
    .from('documents')
    .select('id, filename, document_category, document_keywords, document_summary')
    .eq('workspace_id', workspaceId)
    .or(
      terms
        .map((term) => `filename.ilike.%${term}%,document_category.ilike.%${term}%,document_summary.ilike.%${term}%`)
        .join(','),
    )
    .limit(6);
  const matchingDocumentIds = (matchingDocuments || []).map((document: any) => document.id);
  const { data: documentChunkRows } = matchingDocumentIds.length
    ? await supabase
        .from('document_chunks')
        .select('document_id, chunk_index, chunk_text, table_metadata, documents!inner(filename, document_category, document_keywords, document_summary)')
        .eq('workspace_id', workspaceId)
        .in('document_id', matchingDocumentIds)
        .limit(Math.max(1, Math.floor(limit / 2)))
    : { data: [] };

  return ([...chunkRows, ...(documentChunkRows || [])] as any[]).map((row: any, index: number) => {
    const document = Array.isArray(row.documents) ? row.documents[0] : row.documents;
    const chunkText = String(row.chunk_text || '');
    const matchCount = terms.filter((term) => chunkText.toLowerCase().includes(term.toLowerCase())).length;
    const score = Math.min(0.72, 0.42 + matchCount * 0.08);

    return {
      id: `keyword-${row.document_id}-${row.chunk_index}-${index}`,
      version: 0,
      score,
      hybrid_source: 'keyword',
      payload: {
        workspace_id: workspaceId,
        document_id: row.document_id,
        filename: document?.filename || 'Unknown file',
        document_category: document?.document_category || null,
        document_keywords: document?.document_keywords || [],
        document_summary: document?.document_summary || null,
        table_metadata: row.table_metadata || {},
        chunk_index: row.chunk_index,
        chunk_text: chunkText,
        preview: chunkText.slice(0, 180),
      },
    } as RetrievalCandidate;
  });
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
    const { question, session_id, answer_mode } = await req.json();
    await assertWorkspaceOperational(profile.workspace_id!);

    if (typeof question !== 'string' || !question.trim()) {
      return Response.json({ error: 'Question is required' }, { status: 400 });
    }

    if (session_id !== undefined && session_id !== null && typeof session_id !== 'string') {
      return Response.json({ error: 'Invalid chat session' }, { status: 400 });
    }

    const normalizedQuestion = question.trim();
    const answerMode = normalizeAnswerMode(answer_mode);
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
          const totalStartedAt = Date.now();
          const statuses = buildStatusMessages(profile.role);
          const retrievalSettings = getRetrievalSettings(normalizedQuestion);

          sendEvent('status', { message: statuses.searching });
          await ensureQdrantCollection();

          const queryVector = await embedOne(normalizedQuestion, 'query');
          const fetchK = Math.max(getQdrantFetchK(), retrievalSettings.topK);
          const rerankTopK = Math.max(getRerankTopK(), retrievalSettings.maxFinalChunks);

          logRetrievalDebug('query', {
            workspace_id: profile.workspace_id,
            collection: COLLECTION_NAME,
            embedding_provider: getEmbeddingProvider(),
            embedding_model: getEmbeddingModelName(),
            embedding_dimensions: getEmbeddingDimensions(),
            query: normalizedQuestion,
            query_vector_length: queryVector.length,
            intent: retrievalSettings.intent,
            qdrant_fetch_k: fetchK,
            rerank_top_k: rerankTopK,
            score_threshold: retrievalSettings.scoreThreshold,
            max_final_chunks: retrievalSettings.maxFinalChunks,
            max_context_characters: retrievalSettings.maxContextCharacters,
            answer_mode: answerMode,
          });

          const retrievalStartedAt = Date.now();
          let vectorResults = await searchQdrantVector({
            vector: queryVector,
            workspaceId: profile.workspace_id!,
            limit: fetchK,
            scoreThreshold: retrievalSettings.scoreThreshold,
          });
          const keywordResults = await keywordSearch({
            supabase,
            workspaceId: profile.workspace_id!,
            question: normalizedQuestion,
            limit: 12,
          });
          let searchResults = mergeRetrievalCandidates(vectorResults, keywordResults);
          const retrievalMs = Date.now() - retrievalStartedAt;

          logRetrievalDebug('qdrant-search', {
            vector_result_count: vectorResults.length,
            keyword_result_count: keywordResults.length,
            merged_result_count: searchResults.length,
            retrieval_ms: retrievalMs,
            top_results: summarizeSearchResults(searchResults as Awaited<ReturnType<typeof qdrant.search>>),
          });

          if (vectorResults.length === 0 && searchResults.length === 0 && retrievalSettings.scoreThreshold > 0) {
            logRetrievalDebug('qdrant-search-retry-no-threshold', {
              reason: 'No results passed score threshold; retrying once without score_threshold while preserving workspace filter.',
              previous_score_threshold: retrievalSettings.scoreThreshold,
            });

            vectorResults = await searchQdrantVector({
              vector: queryVector,
              workspaceId: profile.workspace_id!,
              limit: fetchK,
            });
            searchResults = mergeRetrievalCandidates(vectorResults, keywordResults);

            logRetrievalDebug('qdrant-search-no-threshold', {
              result_count: searchResults.length,
              top_results: summarizeSearchResults(searchResults as Awaited<ReturnType<typeof qdrant.search>>),
            });
          }

          const rerankStartedAt = Date.now();
          const rerankResult = await rerankCandidates({
            query: normalizedQuestion,
            candidates: searchResults,
          });
          searchResults = rerankResult.candidates.slice(0, rerankTopK);
          const rerankMs = Date.now() - rerankStartedAt;

          console.info('[RAG] retrieval', {
            provider: rerankResult.provider,
            workspace_id: profile.workspace_id,
            documents_retrieved: new Set(searchResults.map((result) => result.payload?.document_id).filter(Boolean)).size,
            candidates_retrieved: vectorResults.length + keywordResults.length,
            candidates_reranked: rerankResult.rerankedCount,
            retrieval_ms: retrievalMs,
            rerank_ms: rerankMs,
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
            {
              created_at: string | null;
              user_id: string | null;
              document_category: string | null;
              document_keywords: string[];
              document_summary: string | null;
            }
          >();

          if (documentIds.length > 0) {
            const { data: documentMeta, error: documentMetaError } = await supabase
              .from('documents')
              .select('id, created_at, user_id, document_category, document_keywords, document_summary')
              .in('id', documentIds)
              .eq('workspace_id', profile.workspace_id);

            if (documentMetaError) {
              throw documentMetaError;
            }

            for (const item of documentMeta || []) {
              documentMetaById.set(item.id, {
                created_at: item.created_at || null,
                user_id: item.user_id || null,
                document_category: item.document_category || null,
                document_keywords: item.document_keywords || [],
                document_summary: item.document_summary || null,
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
                document_category:
                  documentMeta?.document_category ||
                  String(result.payload?.document_category || '') ||
                  null,
                relevance_score: Number((result as RetrievalCandidate).rerank_score || result.score || 0),
                confidence: sourceConfidenceFromScore(Number((result as RetrievalCandidate).rerank_score || result.score || 0)),
              };
            }),
          );

          let answer = STRICT_NO_ANSWER;
          let followUps: string[] = [];
          let confidence: AnswerConfidence = 'low';
          const retrievedFilenames = Array.from(
            new Set(searchResults.map((result) => String(result.payload?.filename || '')).filter(Boolean)),
          );
          const generationStartedAt = Date.now();

          if (searchResults.length > 0) {
            const compressedContext = compressSearchResults({
              searchResults,
              maxFinalChunks: retrievalSettings.maxFinalChunks,
              maxContextCharacters: retrievalSettings.maxContextCharacters,
            });
            const preliminaryConfidence = calculateAnswerConfidence({
              retrievalScores: searchResults.map((result) => Number(result.score || 0)),
              rerankScores: searchResults
                .map((result) => Number((result as RetrievalCandidate).rerank_score || 0))
                .filter((score) => score > 0),
              documentCount: compressedContext.documentCount,
              contextChunkCount: compressedContext.chunks.length,
              noAnswer: false,
            });
            const documentCategories = Array.from(
              new Set(compressedContext.chunks.map((chunk) => chunk.documentCategory || '').filter(Boolean)),
            );
            const sourceTypes = Array.from(
              new Set(
                compressedContext.chunks
                  .map((chunk) => chunk.filename.split('.').pop()?.toLowerCase() || '')
                  .filter(Boolean),
              ),
            );
            const hasTableMetadata = compressedContext.chunks.some(
              (chunk) => chunk.tableMetadata && Object.keys(chunk.tableMetadata).length > 0,
            );
            const answerIntelligenceInstructions = buildAnswerIntelligenceInstructions({
              intent: retrievalSettings.intent,
              answerMode,
              confidence: preliminaryConfidence,
              documentCategories,
              sourceTypes,
              hasTableMetadata,
            });
            logRetrievalDebug('context', {
              qdrant_result_count: searchResults.length,
              context_chunk_count: compressedContext.chunks.length,
              context_document_count: compressedContext.documentCount,
              context_character_count: compressedContext.characterCount,
              preliminary_confidence: preliminaryConfidence,
              document_categories: documentCategories,
              source_types: sourceTypes,
              has_table_metadata: hasTableMetadata,
            });

            sendEvent('status', { message: statuses.matching });
            sendEvent('status', { message: statuses.preparing });

            const streamResult = await streamStrictAnswer(
              normalizedQuestion,
              compressedContext.context,
              answerMode,
              answerIntelligenceInstructions,
            );
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
          confidence = calculateAnswerConfidence({
            retrievalScores: searchResults.map((result) => Number(result.score || 0)),
            rerankScores: searchResults
              .map((result) => Number((result as RetrievalCandidate).rerank_score || 0))
              .filter((score) => score > 0),
            documentCount: new Set(searchResults.map((result) => result.payload?.document_id).filter(Boolean)).size,
            contextChunkCount: searchResults.length,
            noAnswer,
          });
          followUps = generateFollowUps({
            question: normalizedQuestion,
            answer,
            intent: retrievalSettings.intent,
            filenames: retrievedFilenames,
            documentCategories: citations.map((citation) => citation.document_category || '').filter(Boolean),
            hasTableMetadata: searchResults.some(
              (result) =>
                result.payload?.table_metadata &&
                typeof result.payload.table_metadata === 'object' &&
                Object.keys(result.payload.table_metadata).length > 0,
            ),
            noAnswer,
          });

          const generationMs = Date.now() - generationStartedAt;
          console.info('[RAG] timings', {
            retrieval_ms: retrievalMs,
            rerank_ms: rerankMs,
            generation_ms: generationMs,
            total_ms: Date.now() - totalStartedAt,
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
            confidence,
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
