import { createRequire } from 'module';
import { v4 as uuidv4 } from 'uuid';
import { inngest } from './client';
import { getSupabaseAdmin } from '@/src/lib/supabase-server';
import { buildPreview, chunkDocumentText, getFileExtension } from '@/src/lib/documents';
import { getEmbedding } from '@/src/lib/gemini';
import { COLLECTION_NAME, ensureQdrantCollection, qdrant } from '@/src/lib/qdrant';

export const processDocument = inngest.createFunction(
  { id: "process-document", retries: 3, triggers: [{ event: "document/process.started" }] },
  async ({ event, step }) => {
    const { documentId, workspaceId, storagePath, originalFilename, userId } = event.data as any;

    try {
      // Step 1: Download from Supabase
      const fileBuffer = await step.run("download-file", async () => {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase.storage
          .from("documents")
          .download(storagePath);
          
        if (error || !data) {
          throw error || new Error("File not found in storage");
        }
        return Buffer.from(await data.arrayBuffer()).toString("base64");
      });

      // Step 2: Parse Content
      const extractedText = await step.run("parse-content", async () => {
        const extension = getFileExtension(originalFilename);
        const buffer = Buffer.from(fileBuffer, "base64");
        
        if (extension === '.pdf') {
          const require = createRequire(import.meta.url);
          const pdfParse = require("pdf-parse/lib/pdf-parse.js") as (
            buffer: Buffer,
          ) => Promise<{ text: string }>;
          
          const parsed = await pdfParse(buffer);
          return parsed.text || '';
        } else if (extension === '.txt') {
          return buffer.toString("utf-8");
        }
        throw new Error("Unsupported file extension");
      });

      // Step 3: Chunk Content
      const chunks = await step.run("chunk-content", async () => {
        const chunked = chunkDocumentText(extractedText);
        if (chunked.length === 0) {
          throw new Error('No text could be extracted from the uploaded document');
        }
        return chunked;
      });

      // Step 4: Generate Embeddings & Push to Qdrant
      const { chunkRows, points } = await step.run("generate-embeddings", async () => {
        await ensureQdrantCollection();
        
        const chunkRows = [];
        const points = [];
        
        for (const [index, chunkText] of chunks.entries()) {
          const chunkIndex = index + 1;
          const pointId = uuidv4();
          // NOTE: If Qdrant or Gemini fails here, this whole step retries natively via Inngest
          const vector = await getEmbedding(chunkText);

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
        
        return { chunkRows, points };
      });

      // Step 5: Index Qdrant
      await step.run("index-qdrant", async () => {
        await qdrant.upsert(COLLECTION_NAME, {
          wait: true,
          points,
        });
      });

      // Step 6: Save Chunks and Mark Ready
      await step.run("mark-ready", async () => {
        const supabase = getSupabaseAdmin();
        const { error: chunkInsertError } = await supabase.from('document_chunks').insert(chunkRows);
        if (chunkInsertError) throw chunkInsertError;

        const { error: completeError } = await supabase
          .from('documents')
          .update({
            status: 'ready',
            error_message: null,
            total_chunks: chunkRows.length,
          })
          .eq('id', documentId);

        if (completeError) throw completeError;
      });

      return { success: true, documentId, totalChunks: chunks.length };
    } catch (error) {
      // Record failure on the document
      await step.run("mark-failed", async () => {
        const supabase = getSupabaseAdmin();
        await supabase
          .from('documents')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : "Unknown error during processing",
          })
          .eq('id', documentId);
      });
      // Rethrow to fail the Inngest function
      throw error;
    }
  }
);
