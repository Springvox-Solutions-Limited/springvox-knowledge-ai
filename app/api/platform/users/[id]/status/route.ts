import { createAuditLog } from '@/src/lib/audit-log';
import { requirePlatformAdminRequest, createPlatformErrorResponse } from '@/src/lib/platform-api';
import { getSupabaseAdmin } from '@/src/lib/supabase-server';
import { USER_STATUSES } from '@/src/lib/workspace';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await requirePlatformAdminRequest(req);
    const { id } = await params;
    const body = await req.json();
    const status = typeof body.status === 'string' ? body.status : '';
    const workspaceId = typeof body.workspaceId === 'string' ? body.workspaceId : '';

    if (!workspaceId || !USER_STATUSES.includes(status as (typeof USER_STATUSES)[number])) {
      return Response.json({ error: 'Invalid user status request' }, { status: 400 });
    }

    if (status === 'invited') {
      return Response.json({ error: 'Invited status is managed through invitations' }, { status: 400 });
    }

    if (id === user.id && status !== 'active') {
      return Response.json({ error: 'Platform admins cannot suspend their own account here' }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();
    const { data: targetUser, error: targetLookupError } = await supabase
      .from('profiles')
      .select('id, role, workspace_id, status, email')
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .single();

    if (targetLookupError || !targetUser) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser.role === 'tenant_admin' && status !== 'active') {
      const { count, error: countError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .eq('role', 'tenant_admin')
        .eq('status', 'active');

      if (countError) {
        throw countError;
      }

      if ((count || 0) <= 1) {
        return Response.json(
          { error: 'Assign another active workspace admin before suspending this user' },
          { status: 409 },
        );
      }
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('workspace_id', workspaceId);

    if (error) {
      throw error;
    }

    await createAuditLog({
      workspaceId,
      actorUserId: user.id,
      targetUserId: id,
      action:
        status === 'active'
          ? 'user.activated'
          : status === 'disabled'
            ? 'user.disabled'
            : 'user.suspended',
      metadata: {
        previous_status: targetUser.status,
        next_status: status,
        target_email: targetUser.email,
        actor_scope: 'platform_admin',
      },
    });

    return Response.json({ success: true });
  } catch (error) {
    return createPlatformErrorResponse(error, 'Unexpected platform user status update error');
  }
}
