import { requirePlatformAdminRequest, createPlatformErrorResponse } from '@/src/lib/platform-api';
import { getSupabaseAdmin } from '@/src/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await requirePlatformAdminRequest(req);
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId') || '';
    const action = searchParams.get('action') || '';
    const targetUserId = searchParams.get('targetUserId') || '';
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';
    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('audit_logs')
      .select('id, workspace_id, actor_user_id, target_user_id, action, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(200);

    if (workspaceId) query = query.eq('workspace_id', workspaceId);
    if (action) query = query.ilike('action', `%${action}%`);
    if (targetUserId) query = query.eq('target_user_id', targetUserId);
    if (from) query = query.gte('created_at', from);
    if (to) query = query.lte('created_at', to);

    const { data: logs, error } = await query;
    if (error) throw error;

    const userIds = Array.from(new Set((logs || []).flatMap((log) => [log.actor_user_id, log.target_user_id]).filter(Boolean)));
    const workspaceIds = Array.from(new Set((logs || []).map((log) => log.workspace_id).filter(Boolean)));
    const [{ data: profiles }, { data: workspaces }] = await Promise.all([
      userIds.length
        ? supabase.from('profiles').select('id, email, full_name').in('id', userIds)
        : Promise.resolve({ data: [] as any[] }),
      workspaceIds.length
        ? supabase.from('workspaces').select('id, name, slug').in('id', workspaceIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const profileById = new Map((profiles || []).map((profile) => [profile.id, profile]));
    const workspaceById = new Map((workspaces || []).map((workspace) => [workspace.id, workspace]));

    return Response.json({
      logs: (logs || []).map((log) => ({
        ...log,
        actor_email: log.actor_user_id ? profileById.get(log.actor_user_id)?.email || null : null,
        target_email: log.target_user_id ? profileById.get(log.target_user_id)?.email || null : null,
        workspace_name: log.workspace_id ? workspaceById.get(log.workspace_id)?.name || null : null,
      })),
    });
  } catch (error) {
    return createPlatformErrorResponse(error, 'Unexpected audit log error');
  }
}
