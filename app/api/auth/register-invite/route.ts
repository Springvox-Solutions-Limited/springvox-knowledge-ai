import { safeErrorMessage } from '@/src/lib/api-errors';
import { createAuditLog } from '@/src/lib/audit-log';
import { validatePassword } from '@/src/lib/password-policy';
import {
  assertRateLimit,
  BETA_RATE_LIMITS,
  getClientIp,
  maybeRateLimitResponse,
} from '@/src/lib/rate-limit';
import { getSupabaseAdmin } from '@/src/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();
  let createdUserId: string | null = null;

  try {
    const body = await req.json();
    const token = typeof body.token === 'string' ? body.token.trim() : '';
    const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!token) {
      return Response.json({ error: 'Invitation token is required' }, { status: 400 });
    }

    if (!fullName) {
      return Response.json({ error: 'Full name is required' }, { status: 400 });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return Response.json({ error: passwordError }, { status: 400 });
    }

    await assertRateLimit({
      key: getClientIp(req),
      scope: 'invite_register',
      ...BETA_RATE_LIMITS.invite_register,
    });

    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .select('id, email, status, expires_at, workspace_id, role')
      .eq('token', token)
      .single();

    if (invitationError || !invitation) {
      return Response.json({ error: 'Invalid invite' }, { status: 404 });
    }

    if (invitation.status === 'revoked') {
      return Response.json({ error: 'This invitation has been revoked' }, { status: 400 });
    }

    if (invitation.status === 'accepted') {
      return Response.json({ error: 'This invitation has already been accepted' }, { status: 400 });
    }

    if (new Date(invitation.expires_at).getTime() < Date.now()) {
      return Response.json({ error: 'This invitation has expired' }, { status: 400 });
    }

    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', invitation.email.toLowerCase())
      .maybeSingle();

    if (existingUser) {
      return Response.json(
        { error: 'An account already exists for this invited email. Please log in instead.' },
        { status: 409 },
      );
    }

    const { data: createdUser, error: createUserError } = await supabase.auth.admin.createUser({
      email: invitation.email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (createUserError || !createdUser.user) {
      throw createUserError || new Error('Failed to create invited user');
    }

    createdUserId = createdUser.user.id;

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        email: invitation.email,
        full_name: fullName,
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', createdUserId);

    if (profileError) {
      throw profileError;
    }

    await createAuditLog({
      workspaceId: invitation.workspace_id,
      actorUserId: createdUserId,
      targetUserId: createdUserId,
      action: 'user.registered_via_invite',
      metadata: { invited_email: invitation.email, role: invitation.role },
    });

    return Response.json({
      success: true,
      email: invitation.email,
    });
  } catch (error) {
    const rateLimitResponse = maybeRateLimitResponse(error);
    if (rateLimitResponse) return rateLimitResponse;

    if (createdUserId) {
      await supabase.auth.admin.deleteUser(createdUserId);
    }

    const message = error instanceof Error ? error.message : 'Unexpected invitation registration error';
    return Response.json({ error: safeErrorMessage(message) }, { status: 500 });
  }
}
