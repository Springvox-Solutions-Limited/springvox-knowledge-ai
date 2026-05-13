import { createRequire } from 'module';

import {
  buildPreview,
  chunkDocumentText,
  getFileExtension,
  isSupportedDocument,
  MAX_FILE_SIZE_BYTES,
  sanitizeFilename,
} from '@/src/lib/documents';
import { getEmbedding } from '@/src/lib/gemini';
import { COLLECTION_NAME, deleteDocumentVectors, ensureQdrantCollection, qdrant } from '@/src/lib/qdrant';
import { getAuthenticatedUserWithProfile, getSupabaseAdmin } from '@/src/lib/supabase-server';
import { MANAGER_ROLES } from '@/src/lib/workspace';
import { v4 as uuidv4 } from 'uuid';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const require = createRequire(import.meta.url);
  const pdfParse = require("pdf-parse/lib/pdf-parse.js") as (
    buffer: Buffer,
  ) => Promise<{
    text: string;
  }>;

  let authenticatedUserId: string | null = null;
  let authenticatedWorkspaceId: string | null = null;
  let documentId: string | null = null;
  let uploadedFilePath: string | null = null;

  try {
    const { user, profile } = await getAuthenticatedUserWithProfile(req, MANAGER_ROLES);
    authenticatedUserId = user.id;
    authenticatedWorkspaceId = profile.workspace_id;
    const supabase = getSupabaseAdmin();
    const formData = await req.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return Response.json({ error: 'A PDF or TXT file is required' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return Response.json({ error: 'File too large. Maximum size is 4MB.' }, { status: 400 });
    }

    if (!isSupportedDocument(file)) {
      return Response.json({ error: 'Unsupported file type. Only PDF and TXT are allowed.' }, { status: 400 });
    }

    const filename = sanitizeFilename(file.name);
    if (!filename) {
      return Response.json({ error: 'Invalid filename' }, { status: 400 });
    }

    documentId = crypto.randomUUID();
    uploadedFilePath = `${user.id}/${documentId}/${filename}`;

    const { error: documentError } = await supabase
      .from('documents')
      .insert({
        id: documentId,
        workspace_id: profile.workspace_id,
        user_id: user.id,
        filename,
        file_path: uploadedFilePath,
        file_type: file.type || getFileExtension(filename),
        status: 'processing',
        error_message: null,
        total_chunks: 0,
      });

    if (documentError) {
      throw documentError || new Error('Failed to create document record');
    }

    const { error: uploadError } = await supabase.storage.from('documents').upload(uploadedFilePath, file, {
      upsert: false,
      contentType: file.type || 'application/octet-stream',
    });

    if (uploadError) {
      throw uploadError;
    }

    let extractedText = '';
    const extension = getFileExtension(filename);

    if (extension === '.pdf') {
      const buffer = Buffer.from(await file.arrayBuffer());
      const parsed = await pdfParse(buffer);
      extractedText = parsed.text || '';
    } else if (extension === '.txt') {
      extractedText = await file.text();
    }

    const chunks = chunkDocumentText(extractedText);
    if (chunks.length === 0) {
      throw new Error('No text could be extracted from the uploaded document');
    }

    await ensureQdrantCollection();

    const chunkRows: Array<{
      user_id: string;
      workspace_id: string;
      document_id: string;
      chunk_index: number;
      chunk_text: string;
      qdrant_point_id: string;
    }> = [];

    const points: Array<{
      id: string;
      vector: number[];
      payload: {
        workspace_id: string;
        uploaded_by: string;
        document_id: string;
        filename: string;
        chunk_index: number;
        chunk_text: string;
        preview: string;
      };
    }> = [];

    for (const [index, chunkText] of chunks.entries()) {
      const chunkIndex = index + 1;
      const pointId = uuidv4();
      const vector = await getEmbedding(chunkText);

      chunkRows.push({
        user_id: user.id,
        workspace_id: profile.workspace_id,
        document_id: documentId,
        chunk_index: chunkIndex,
        chunk_text: chunkText,
        qdrant_point_id: pointId,
      });

      points.push({
        id: pointId,
        vector,
        payload: {
          workspace_id: profile.workspace_id,
          uploaded_by: user.id,
          document_id: documentId,
          filename,
          chunk_index: chunkIndex,
          chunk_text: chunkText,
          preview: buildPreview(chunkText),
        },
      });
    }

    const { error: chunkInsertError } = await supabase.from('document_chunks').insert(chunkRows);
    if (chunkInsertError) {
      throw chunkInsertError;
    }

    await qdrant.upsert(COLLECTION_NAME, {
      wait: true,
      points,
    });

    const { error: completeError } = await supabase
      .from('documents')
      .update({
        status: 'completed',
        error_message: null,
        total_chunks: chunkRows.length,
      })
      .eq('id', documentId)
      .eq('user_id', user.id);

    if (completeError) {
      throw completeError;
    }

    return Response.json({
      success: true,
      documentId,
      totalChunks: chunkRows.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected upload error';
    const status =
      message === 'Unauthorized' || message === 'Missing bearer token'
        ? 401
        : message === 'Forbidden'
          ? 403
        : message.startsWith('Unsupported file type') ||
            message.startsWith('No text') ||
            message === 'Invalid filename'
          ? 400
          : 500;

    if (documentId && authenticatedUserId && authenticatedWorkspaceId) {
      const supabase = getSupabaseAdmin();

      try {
        await supabase
          .from('document_chunks')
          .delete()
          .eq('document_id', documentId)
          .eq('workspace_id', authenticatedWorkspaceId);

        await deleteDocumentVectors(documentId, authenticatedWorkspaceId);

        if (uploadedFilePath) {
          await supabase.storage.from('documents').remove([uploadedFilePath]);
        }

        await supabase
          .from('documents')
          .update({
            status: 'failed',
            error_message: message,
            total_chunks: 0,
          })
          .eq('id', documentId)
          .eq('workspace_id', authenticatedWorkspaceId);
      } catch (cleanupError) {
        console.error('Upload cleanup error:', cleanupError);
      }
    }

    console.error('Upload error:', error);
    return Response.json({ error: message }, { status });
  }
}
