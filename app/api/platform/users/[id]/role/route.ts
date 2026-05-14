import { requirePlatformAdminRequest, createPlatformErrorResponse } from '@/src/lib/platform-api';
import { getSupabaseAdmin } from '@/src/lib/supabase-server';
import { ASSIGNABLE_ROLES } from '@/src/lib/workspace';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await requirePlatformAdminRequest(req);
    const { id } = await params;
    const body = await req.json();
    const role = typeof body.role === 'string' ? body.role : '';
    const workspaceId = typeof body.workspaceId === 'string' ? body.workspaceId : '';
    const resetWorkspaceTenantAdmins = body.resetWorkspaceTenantAdmins === true;

    if (!workspaceId || !ASSIGNABLE_ROLES.includes(role as (typeof ASSIGNABLE_ROLES)[number])) {
      return Response.json({ error: 'Invalid role update request' }, { status: 400 });
    }

    if (id === user.id) {
      return Response.json({ error: 'Platform admins cannot update their own role here' }, { status: 403 });
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
      return Response.json({ error: 'Platform admin roles remain SQL-only in this phase' }, { status: 403 });
    }

    const now = new Date().toISOString();

    if (resetWorkspaceTenantAdmins && role === 'tenant_admin') {
      const { error: resetError } = await supabase
        .from('profiles')
        .update({
          role: 'viewer',
          updated_at: now,
        })
        .eq('workspace_id', workspaceId)
        .eq('role', 'tenant_admin')
        .neq('id', id);

      if (resetError) {
        throw resetError;
      }
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        role,
        updated_at: now,
      })
      .eq('id', id)
      .eq('workspace_id', workspaceId);

    if (error) {
      throw error;
    }

    return Response.json({ success: true });
  } catch (error) {
    return createPlatformErrorResponse(error, 'Unexpected platform role update error');
  }
}
