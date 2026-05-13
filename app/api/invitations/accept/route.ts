import { getAuthenticatedUser, getSupabaseAdmin } from '@/src/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    const body = await req.json();
    const token = typeof body.token === 'string' ? body.token.trim() : '';

    if (!token) {
      return Response.json({ error: 'Invitation token is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .select('id, workspace_id, email, role, status, expires_at, accepted_at')
      .eq('token', token)
      .single();

    if (invitationError || !invitation) {
      return Response.json({ error: 'Invitation not found' }, { status: 404 });
    }

    const now = Date.now();
    const expired = new Date(invitation.expires_at).getTime() < now;

    if (invitation.status === 'revoked') {
      return Response.json({ error: 'This invitation has been revoked' }, { status: 400 });
    }

    if (invitation.status === 'accepted') {
      return Response.json({ error: 'This invitation has already been accepted' }, { status: 400 });
    }

    if (expired) {
      await supabase
        .from('invitations')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('id', invitation.id);

      return Response.json({ error: 'This invitation has expired' }, { status: 400 });
    }

    if ((user.email || '').toLowerCase() !== invitation.email.toLowerCase()) {
      return Response.json({ error: 'You must sign in with the invited email address' }, { status: 403 });
    }

    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({
        email: user.email,
        workspace_id: invitation.workspace_id,
        role: invitation.role,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (profileUpdateError) {
      throw profileUpdateError;
    }

    const { error: inviteUpdateError } = await supabase
      .from('invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', invitation.id);

    if (inviteUpdateError) {
      throw inviteUpdateError;
    }

    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected invitation acceptance error';
    const status =
      message === 'Unauthorized' || message === 'Missing bearer token'
        ? 401
        : 500;

    return Response.json({ error: message }, { status });
  }
}
