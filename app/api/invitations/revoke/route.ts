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
    const invitationId = typeof body.id === 'string' ? body.id : '';

    if (!invitationId) {
      return Response.json({ error: 'Invitation id is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('invitations')
      .update({
        status: 'revoked',
        updated_at: new Date().toISOString(),
      })
      .eq('id', invitationId)
      .eq('workspace_id', profile.workspace_id);

    if (error) {
      throw error;
    }

    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected invitation revoke error';
    const status = getRequestErrorStatus(message);

    return Response.json({ error: message }, { status });
  }
}
