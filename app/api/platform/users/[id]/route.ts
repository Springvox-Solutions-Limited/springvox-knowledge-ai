import { requirePlatformAdminRequest, createPlatformErrorResponse } from '@/src/lib/platform-api';
import { getDefaultWorkspaceId } from '@/src/lib/platform-server';
import { getSupabaseAdmin } from '@/src/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await requirePlatformAdminRequest(req);
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId') || '';

    if (!workspaceId) {
      return Response.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    if (id === user.id) {
      return Response.json({ error: 'You cannot remove yourself from a workspace here' }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();
    const { data: targetUser, error: targetLookupError } = await supabase
      .from('profiles')
      .select('id, role, workspace_id')
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .single();

    if (targetLookupError || !targetUser) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser.role === 'platform_admin') {
      return Response.json({ error: 'Platform admins cannot be removed here' }, { status: 403 });
    }

    const { data: workspaceTenantAdmins, error: tenantAdminError } = await supabase
      .from('profiles')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('role', 'tenant_admin');

    if (tenantAdminError) {
      throw tenantAdminError;
    }

    if (targetUser.role === 'tenant_admin' && (workspaceTenantAdmins || []).length <= 1) {
      return Response.json(
        { error: 'Assign another tenant admin before removing the current workspace admin' },
        { status: 409 },
      );
    }

    const defaultWorkspaceId = await getDefaultWorkspaceId();
    const { error } = await supabase
      .from('profiles')
      .update({
        workspace_id: defaultWorkspaceId,
        role: 'viewer',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('workspace_id', workspaceId);

    if (error) {
      throw error;
    }

    return Response.json({ success: true });
  } catch (error) {
    return createPlatformErrorResponse(error, 'Unexpected platform user removal error');
  }
}
