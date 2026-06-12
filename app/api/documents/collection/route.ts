import { getRequestErrorStatus } from '@/src/lib/api-errors';
import { getAuthenticatedUserWithProfile, getSupabaseAdmin } from '@/src/lib/supabase-server';
import { assertWorkspaceOperational } from '@/src/lib/workspace-access';
import { isWorkspaceAdminRole } from '@/src/lib/workspace';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request) {
  try {
    const { profile } = await getAuthenticatedUserWithProfile(req);
    await assertWorkspaceOperational(profile.workspace_id!);

    if (!isWorkspaceAdminRole(profile.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const documentId = typeof body.documentId === 'string' ? body.documentId : '';
    const collectionId =
      typeof body.collectionId === 'string' && body.collectionId ? body.collectionId : null;

    if (!documentId) {
      return Response.json({ error: 'documentId is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // If a collection is supplied, verify it belongs to this workspace.
    if (collectionId) {
      const { data: collection, error: collectionError } = await supabase
        .from('collections')
        .select('id')
        .eq('id', collectionId)
        .eq('workspace_id', profile.workspace_id)
        .maybeSingle();

      if (collectionError || !collection) {
        return Response.json({ error: 'Collection not found' }, { status: 404 });
      }
    }

    const { error } = await supabase
      .from('documents')
      .update({ collection_id: collectionId })
      .eq('id', documentId)
      .eq('workspace_id', profile.workspace_id);

    if (error) throw error;

    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected collection update error';
    return Response.json({ error: message }, { status: getRequestErrorStatus(message) });
  }
}
