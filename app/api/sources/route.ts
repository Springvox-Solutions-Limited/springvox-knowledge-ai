import { getAuthenticatedUserWithProfile, getSupabaseAdmin } from '@/src/lib/supabase-server';
import { ALL_ROLES } from '@/src/lib/workspace';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { profile } = await getAuthenticatedUserWithProfile(req, ALL_ROLES);
    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get('documentId');
    const chunkIndex = Number(searchParams.get('chunkIndex'));

    if (!documentId || !Number.isFinite(chunkIndex) || chunkIndex <= 0) {
      return Response.json({ error: 'documentId and chunkIndex are required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .select('id, filename, created_at, user_id, workspace_id')
      .eq('id', documentId)
      .eq('workspace_id', profile.workspace_id)
      .single();

    if (documentError || !document) {
      return Response.json({ error: 'Source not found' }, { status: 404 });
    }

    const { data: chunk, error: chunkError } = await supabase
      .from('document_chunks')
      .select('document_id, chunk_index, chunk_text, workspace_id')
      .eq('document_id', documentId)
      .eq('workspace_id', profile.workspace_id)
      .eq('chunk_index', chunkIndex)
      .single();

    if (chunkError || !chunk) {
      return Response.json({ error: 'Source not found' }, { status: 404 });
    }

    return Response.json({
      source: {
        document_id: document.id,
        filename: document.filename,
        chunk_index: chunk.chunk_index,
        preview: chunk.chunk_text.slice(0, 220),
        chunk_text: chunk.chunk_text,
        uploaded_at: document.created_at,
        uploaded_by: document.user_id,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected source error';
    const status =
      message === 'Unauthorized' || message === 'Missing bearer token'
        ? 401
        : message === 'Forbidden'
          ? 403
          : 500;

    console.error('Sources GET error:', error);
    return Response.json({ error: message }, { status });
  }
}
