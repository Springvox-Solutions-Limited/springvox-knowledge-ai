import { getRequestErrorStatus } from '@/src/lib/api-errors';
import { getAuthenticatedUserWithProfile, getSupabaseAdmin } from '@/src/lib/supabase-server';
import { assertWorkspaceOperational } from '@/src/lib/workspace-access';
import { isWorkspaceAdminRole } from '@/src/lib/workspace';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { profile } = await getAuthenticatedUserWithProfile(req);
    await assertWorkspaceOperational(profile.workspace_id!);

    if (!isWorkspaceAdminRole(profile.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id, name')
      .eq('id', profile.workspace_id)
      .single();

    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, workspace_id, created_at, updated_at')
      .eq('workspace_id', profile.workspace_id)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    const users = (data || []).map((item) => ({
      ...item,
      workspace_name: workspace?.name || 'Default Workspace',
    }));

    return Response.json({ users });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected users error';
    const status = getRequestErrorStatus(message);

    console.error('Users GET error:', error);
    return Response.json({ error: message }, { status });
  }
}
