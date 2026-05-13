import { getAuthenticatedUserWithProfile, getSupabaseAdmin } from '@/src/lib/supabase-server';
import { ALL_ROLES, isAdminRole } from '@/src/lib/workspace';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request) {
  try {
    const { user, profile } = await getAuthenticatedUserWithProfile(req);

    if (!isAdminRole(profile.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const userId = typeof body.userId === 'string' ? body.userId : '';
    const nextRole = typeof body.role === 'string' ? body.role : '';
    const confirmSelfDemotion = body.confirmSelfDemotion === true;

    if (!userId || !ALL_ROLES.includes(nextRole as (typeof ALL_ROLES)[number])) {
      return Response.json({ error: 'Invalid role change request' }, { status: 400 });
    }

    if (userId === user.id && nextRole !== 'admin' && !confirmSelfDemotion) {
      return Response.json({ error: 'Self-demotion requires confirmation' }, { status: 409 });
    }

    const supabase = getSupabaseAdmin();
    const { data: targetUser, error: targetLookupError } = await supabase
      .from('profiles')
      .select('id, workspace_id, role, email')
      .eq('id', userId)
      .eq('workspace_id', profile.workspace_id)
      .single();

    if (targetLookupError || !targetUser) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        role: nextRole,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .eq('workspace_id', profile.workspace_id);

    if (updateError) {
      throw updateError;
    }

    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected role update error';
    const status =
      message === 'Unauthorized' || message === 'Missing bearer token'
        ? 401
        : message === 'Forbidden'
          ? 403
          : 500;

    console.error('Users PATCH error:', error);
    return Response.json({ error: message }, { status });
  }
}
