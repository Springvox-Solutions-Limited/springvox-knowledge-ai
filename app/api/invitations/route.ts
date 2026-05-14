import { getRequestErrorStatus } from '@/src/lib/api-errors';
import { getAuthenticatedUserWithProfile, getSupabaseAdmin } from '@/src/lib/supabase-server';
import { assertWorkspaceOperational } from '@/src/lib/workspace-access';
import { ASSIGNABLE_ROLES, isWorkspaceAdminRole } from '@/src/lib/workspace';

export const dynamic = 'force-dynamic';

function buildInviteUrl(token: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${appUrl.replace(/\/$/, '')}/invite/${token}`;
}

export async function GET(req: Request) {
  try {
    const { profile } = await getAuthenticatedUserWithProfile(req);
    await assertWorkspaceOperational(profile.workspace_id!);

    if (!isWorkspaceAdminRole(profile.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('invitations')
      .select('id, email, role, token, invited_by, status, expires_at, accepted_at, created_at, updated_at')
      .eq('workspace_id', profile.workspace_id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const invitations = (data || []).map((invitation) => ({
      ...invitation,
      invite_url: buildInviteUrl(invitation.token),
    }));

    return Response.json({ invitations });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected invitations error';
    const status = getRequestErrorStatus(message);

    return Response.json({ error: message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const { user, profile } = await getAuthenticatedUserWithProfile(req);
    await assertWorkspaceOperational(profile.workspace_id!);

    if (!isWorkspaceAdminRole(profile.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const role = typeof body.role === 'string' ? body.role : '';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'A valid email is required' }, { status: 400 });
    }

    if (!ASSIGNABLE_ROLES.includes(role as (typeof ASSIGNABLE_ROLES)[number])) {
      return Response.json({ error: 'Invalid role selected' }, { status: 400 });
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('invitations')
      .insert({
        workspace_id: profile.workspace_id,
        email,
        role,
        token,
        invited_by: user.id,
        status: 'pending',
        expires_at: expiresAt,
      })
      .select('id, email, role, token, invited_by, status, expires_at, accepted_at, created_at, updated_at')
      .single();

    if (error || !data) {
      throw error || new Error('Failed to create invitation');
    }

    return Response.json({
      invitation: {
        ...data,
        invite_url: buildInviteUrl(data.token),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected invitation creation error';
    const status = getRequestErrorStatus(message);

    return Response.json({ error: message }, { status });
  }
}
