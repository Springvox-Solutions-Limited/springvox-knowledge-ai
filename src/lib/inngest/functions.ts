import { v4 as uuidv4 } from 'uuid';
import { inngest } from './client';
import { getSupabaseAdmin } from '@/src/lib/supabase-server';
import { buildPreview, chunkDocumentText } from '@/src/lib/documents';
import { embedMany, getEmbeddingProvider } from '@/src/lib/ai';
import { COLLECTION_NAME, ensureQdrantCollection, qdrant } from '@/src/lib/qdrant';
import { parseDocument } from '@/src/lib/document-parsers';

type SerializedError = {
  message: string;
  name?: string;
  stack?: string;
  code?: unknown;
  status?: unknown;
  details?: unknown;
  body?: unknown;
  raw?: string;
};

export function serializeError(error: unknown): SerializedError {
  if (error instanceof Error) {
    const extended = error as Error & {
      code?: unknown;
      status?: unknown;
      details?: unknown;
      body?: unknown;
      cause?: unknown;
    };

    return {
      message: error.message || error.name || 'Unknown error',
      name: error.name,
      stack: error.stack,
      code: extended.code,
      status: extended.status,
      details: extended.details || extended.cause,
      body: extended.body,
    };
  }

  if (typeof error === 'string') {
    return { message: error };
  }

  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>;
    const message =
      getStringValue(record.message) ||
      getStringValue(record.error_description) ||
      getStringValue(record.error) ||
      getStringValue(record.hint) ||
      safeStringify(error) ||
      'Unknown object error';

    return {
      message,
      name: getStringValue(record.name),
      stack: getStringValue(record.stack),
      code: record.code,
      status: record.status || record.statusCode,
      details: record.details || record.hint || record.cause,
      body: record.body || record.response || record.data,
      raw: safeStringify(error),
    };
  }

  return {
    message: error == null ? 'Unknown error' : String(error),
  };
}

function getStringValue(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function safeStringify(value: unknown) {
  try {
    const seen = new WeakSet<object>();

    return JSON.stringify(value, (_key, nestedValue) => {
      if (typeof nestedValue === 'object' && nestedValue !== null) {
        if (seen.has(nestedValue)) {
          return '[Circular]';
        }

        seen.add(nestedValue);
      }

      return nestedValue;
    });
  } catch {
    try {
      return String(value);
    } catch {
      return null;
    }
  }
}

function formatSerializedError(serialized: SerializedError) {
  const parts = [serialized.message];

  if (serialized.code) {
    parts.push(`code=${String(serialized.code)}`);
  }

  if (serialized.status) {
    parts.push(`status=${String(serialized.status)}`);
  }

  if (serialized.details) {
    parts.push(`details=${safeStringify(serialized.details) || String(serialized.details)}`);
  }

  if (serialized.body) {
    parts.push(`body=${safeStringify(serialized.body) || String(serialized.body)}`);
  }

  return parts.filter(Boolean).join(' | ').slice(0, 2000);
}

function toOperationError(operation: string, error: unknown) {
  const serialized = serializeError(error);
  const wrapped = new Error(`${operation} failed: ${formatSerializedError(serialized)}`);
  wrapped.name = serialized.name || 'IngestionOperationError';
  wrapped.stack = serialized.stack || wrapped.stack;
  return wrapped;
}

function isMissingDocumentMetadataColumnError(error: unknown) {
  const serialized = serializeError(error);
  const message = serialized.message.toLowerCase();

  return (
    serialized.code === 'PGRST204' &&
    (message.includes("'parser' column") ||
      message.includes("'parser_metadata' column") ||
      message.includes("'word_count' column"))
  );
}

async function runLoggedOperation<T>(operation: string, fn: () => Promise<T> | T) {
  console.info(`[Inngest] ${operation} started`);

  try {
    const result = await fn();
    console.info(`[Inngest] ${operation} completed`);
    return result;
  } catch (error) {
    const serialized = serializeError(error);
    console.error(`[Inngest] ${operation} failed`, serialized);
    throw toOperationError(operation, error);
  }
}

export const processDocument = inngest.createFunction(
  { id: "process-document", retries: 3, triggers: [{ event: "document/process.started" }] },
  async ({ event, step }) => {
    const { documentId, workspaceId, storagePath, originalFilename, mimeType, userId } =
      event.data as any;

    try {
      // Keep the full file, extracted text, chunks, and vectors inside this step.
      // Inngest checkpoints step return values, so returning those large payloads
      // can exceed response limits for PDFs, spreadsheets, and presentations.
      const processedSummary = await step.run("process-document", async () => {
        const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'documents';
        if (!storagePath) {
          throw toOperationError('download-file', new Error("Missing document storage path"));
        }

        const supabase = getSupabaseAdmin();
        const buffer = await runLoggedOperation('download-file', async () => {
          console.info(`[Inngest] Downloading document from bucket: "${bucket}", path: "${storagePath}"`);
          const { data, error } = await supabase.storage
            .from(bucket)
            .download(storagePath);

          if (error) {
            throw toOperationError('download-file', error);
          }

          if (!data) {
            throw new Error("File not found in storage");
          }

          return Buffer.from(await data.arrayBuffer());
        });

        const parsedResult = await runLoggedOperation('parse-content', () =>
          parseDocument({
            buffer,
            filename: originalFilename,
            mimeType,
          }),
        );

        const parserMetadata = parsedResult.metadata;
        const chunks = chunkDocumentText(parsedResult.text);

        if (chunks.length === 0) {
          throw new Error('No readable text could be extracted from this document.');
        }

        await runLoggedOperation('qdrant-ensure-collection', () => ensureQdrantCollection());

        await runLoggedOperation('cleanup-existing-index', async () => {
          await qdrant.delete(COLLECTION_NAME, {
            filter: {
              must: [
                { key: 'document_id', match: { value: documentId } },
                { key: 'workspace_id', match: { value: workspaceId } },
              ],
            },
          });

          const { error: chunkDeleteError } = await supabase
            .from('document_chunks')
            .delete()
            .eq('document_id', documentId)
            .eq('workspace_id', workspaceId);

          if (chunkDeleteError) {
            throw toOperationError('cleanup-existing-index', chunkDeleteError);
          }
        });
        
        const chunkRows = [];
        const points = [];
        const vectors = await runLoggedOperation('embed-many', () => embedMany(chunks, { inputType: 'document' }));
        
        for (const [index, chunkText] of chunks.entries()) {
          const chunkIndex = index + 1;
          const pointId = uuidv4();
          // NOTE: If Qdrant or the embedding provider fails here, this whole step retries natively via Inngest
          const vector = vectors[index];

          chunkRows.push({
            user_id: userId,
            workspace_id: workspaceId,
            document_id: documentId,
            chunk_index: chunkIndex,
            chunk_text: chunkText,
            qdrant_point_id: pointId,
          });

          points.push({
            id: pointId,
            vector,
            payload: {
              workspace_id: workspaceId,
              uploaded_by: userId,
              document_id: documentId,
              filename: originalFilename,
              chunk_index: chunkIndex,
              chunk_text: chunkText,
              preview: buildPreview(chunkText),
            },
          });
        }

        await runLoggedOperation('qdrant-upsert', async () => {
          await qdrant.upsert(COLLECTION_NAME, {
            wait: true,
            points,
          });
        });

        await runLoggedOperation('insert-chunks', async () => {
          const { error: chunkInsertError } = await supabase.from('document_chunks').insert(chunkRows);
          if (chunkInsertError) {
            throw toOperationError('insert-chunks', chunkInsertError);
          }
        });

        await runLoggedOperation('mark-ready', async () => {
          const { error: completeError } = await supabase
            .from('documents')
            .update({
              status: 'ready',
              error_message: null,
              total_chunks: chunkRows.length,
              parser: parserMetadata?.parser || null,
              parser_metadata: parserMetadata || null,
              word_count: parserMetadata?.wordCount || null,
            })
            .eq('id', documentId);

          if (completeError) {
            if (isMissingDocumentMetadataColumnError(completeError)) {
              console.warn(
                '[Inngest] mark-ready metadata columns missing; falling back to core document status update. Run sql/document_parser_metadata.sql to store parser metadata.',
                serializeError(completeError),
              );

              const { error: fallbackError } = await supabase
                .from('documents')
                .update({
                  status: 'ready',
                  error_message: null,
                  total_chunks: chunkRows.length,
                })
                .eq('id', documentId);

              if (fallbackError) {
                throw toOperationError('mark-ready', fallbackError);
              }

              return;
            }

            throw toOperationError('mark-ready', completeError);
          }
        });

        return {
          totalChunks: chunkRows.length,
          parser: parserMetadata?.parser || null,
          embeddingProvider: getEmbeddingProvider(),
          wordCount: parserMetadata?.wordCount || null,
        };
      });

      return { success: true, documentId, totalChunks: processedSummary.totalChunks };
    } catch (error) {
      const serialized = serializeError(error);
      const readableMessage = formatSerializedError(serialized);
      console.error('[Inngest] process-document failed', serialized);

      // Record failure on the document
      await step.run("mark-failed", async () => {
        const supabase = getSupabaseAdmin();
        const { error: markFailedError } = await supabase
          .from('documents')
          .update({
            status: 'failed',
            error_message: readableMessage,
          })
          .eq('id', documentId);

        if (markFailedError) {
          console.error('[Inngest] mark-failed failed', serializeError(markFailedError));
        }
      });
      // Rethrow to fail the Inngest function
      throw toOperationError('process-document', error);
    }
  }
);
