import { getSupabaseAdmin } from '@/src/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const supabase = getSupabaseAdmin();
    const { data: invitation, error } = await supabase
      .from('invitations')
      .select('id, email, role, status, expires_at, accepted_at, workspace_id')
      .eq('token', token)
      .single();

    if (error || !invitation) {
      return Response.json({ error: 'Invitation not found' }, { status: 404 });
    }

    const { data: workspace } = await supabase
      .from('workspaces')
      .select('name, assistant_name')
      .eq('id', invitation.workspace_id)
      .single();

    return Response.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expires_at: invitation.expires_at,
        accepted_at: invitation.accepted_at,
        workspace_name: workspace?.name || 'Workspace',
        assistant_name: workspace?.assistant_name || 'Rekall-IQ',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected invitation lookup error';
    return Response.json({ error: message }, { status: 500 });
  }
}
