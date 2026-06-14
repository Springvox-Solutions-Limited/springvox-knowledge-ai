import { createAuditLog } from '@/src/lib/audit-log';
import { getRequestErrorStatus } from '@/src/lib/api-errors';
import { getAuthenticatedUserWithProfile, getSupabaseAdmin } from '@/src/lib/supabase-server';
import { assertWorkspaceOperational } from '@/src/lib/workspace-access';
import { isWorkspaceAdminRole, USER_STATUSES } from '@/src/lib/workspace';
import { sendEmail } from '@/src/lib/email';
import { buildAccountStatusEmail } from '@/src/lib/email/templates/lifecycle';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request) {
  try {
    const { user, profile } = await getAuthenticatedUserWithProfile(req);
    await assertWorkspaceOperational(profile.workspace_id!);

    if (!isWorkspaceAdminRole(profile.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const userId = typeof body.userId === 'string' ? body.userId : '';
    const status = typeof body.status === 'string' ? body.status : '';

    if (!userId || !USER_STATUSES.includes(status as (typeof USER_STATUSES)[number])) {
      return Response.json({ error: 'Invalid user status request' }, { status: 400 });
    }

    if (status === 'invited') {
      return Response.json({ error: 'Invited status is managed through invitations' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: targetUser, error: targetLookupError } = await supabase
      .from('profiles')
      .select('id, workspace_id, role, status, email')
      .eq('id', userId)
      .eq('workspace_id', profile.workspace_id)
      .single();

    if (targetLookupError || !targetUser) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser.role === 'platform_admin') {
      return Response.json({ error: 'Platform admin users are managed from the platform console' }, { status: 403 });
    }

    if (userId === user.id && status !== 'active') {
      const { count, error: countError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', profile.workspace_id)
        .in('role', ['tenant_admin', 'admin', 'content_manager'])
        .eq('status', 'active');

      if (countError) {
        throw countError;
      }

      if ((count || 0) <= 1) {
        return Response.json(
          { error: 'Assign another active workspace admin before suspending your own account' },
          { status: 409 },
        );
      }
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .eq('workspace_id', profile.workspace_id);

    if (updateError) {
      throw updateError;
    }

    await createAuditLog({
      workspaceId: profile.workspace_id!,
      actorUserId: user.id,
      targetUserId: userId,
      action: status === 'active' ? 'user.activated' : 'user.suspended',
      metadata: {
        previous_status: targetUser.status,
        next_status: status,
        target_email: targetUser.email,
      },
    });

    // Notify the affected user inline (best-effort; never fail the action on email).
    if (targetUser.email) {
      try {
        const { data: workspaceRow } = await supabase
          .from('workspaces')
          .select('name')
          .eq('id', profile.workspace_id)
          .maybeSingle();
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
        await sendEmail({
          to: targetUser.email,
          ...buildAccountStatusEmail({
            workspaceName: workspaceRow?.name || 'your workspace',
            suspended: status !== 'active',
            appUrl,
          }),
        });
      } catch (statusEmailError) {
        console.warn('User status updated, but notification email failed:', statusEmailError);
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected user status update error';
    const status = getRequestErrorStatus(message);

    console.error('Users status PATCH error:', error);
    return Response.json({ error: message }, { status });
  }
}
