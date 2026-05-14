import { deleteDocumentVectors } from '@/src/lib/qdrant';
import { getAuthenticatedUserWithProfile, getSupabaseAdmin } from '@/src/lib/supabase-server';
import { WORKSPACE_ADMIN_ROLES } from '@/src/lib/workspace';

export const dynamic = 'force-dynamic';

export async function DELETE(req: Request) {
  try {
    const { profile } = await getAuthenticatedUserWithProfile(req, WORKSPACE_ADMIN_ROLES);
    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get('id');

    if (!documentId) {
      return Response.json({ error: 'Document id is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .select('id, file_path, workspace_id')
      .eq('id', documentId)
      .eq('workspace_id', profile.workspace_id)
      .single();

    if (documentError || !document) {
      return Response.json({ error: 'Document not found' }, { status: 404 });
    }

    await deleteDocumentVectors(document.id, profile.workspace_id!);

    const { error: chunkDeleteError } = await supabase
      .from('document_chunks')
      .delete()
      .eq('document_id', document.id)
      .eq('workspace_id', profile.workspace_id);

    if (chunkDeleteError) {
      throw chunkDeleteError;
    }

    if (document.file_path) {
      const { error: storageError } = await supabase.storage.from('documents').remove([document.file_path]);
      if (storageError) {
        throw storageError;
      }
    }

    const { error: documentDeleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', document.id)
      .eq('workspace_id', profile.workspace_id);

    if (documentDeleteError) {
      throw documentDeleteError;
    }

    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected delete error';
    const status =
      message === 'Unauthorized' || message === 'Missing bearer token'
        ? 401
        : message === 'Forbidden'
          ? 403
          : 500;

    console.error('Delete error:', error);
    return Response.json({ error: message }, { status });
  }
}
