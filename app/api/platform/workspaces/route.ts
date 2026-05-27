import { requirePlatformAdminRequest, createPlatformErrorResponse } from '@/src/lib/platform-api';
import { getSupabaseAdmin } from '@/src/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await requirePlatformAdminRequest(req);
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get('search') || '').trim().toLowerCase();
    const status = searchParams.get('status') || 'all';

    const supabase = getSupabaseAdmin();
    const [workspacesResult, profilesResult, documentsResult, chatsResult] = await Promise.all([
      supabase
        .from('workspaces')
        .select('id, name, slug, status, plan, subscription_status, subscription_plan, billing_status, trial_started_at, trial_ends_at, payment_required_at, suspended_reason, suspension_reason, created_at, updated_at')
        .order('created_at', { ascending: false }),
      supabase
        .from('profiles')
        .select('id, email, full_name, role, status, workspace_id, created_at, updated_at'),
      supabase
        .from('documents')
        .select('id, workspace_id, created_at'),
      supabase
        .from('chat_messages')
        .select('id, workspace_id, created_at'),
    ]);

    if (workspacesResult.error) throw workspacesResult.error;
    if (profilesResult.error) throw profilesResult.error;
    if (documentsResult.error) throw documentsResult.error;
    if (chatsResult.error) throw chatsResult.error;

    const profiles = profilesResult.data || [];
    const documents = documentsResult.data || [];
    const chats = chatsResult.data || [];

    const workspaces = (workspacesResult.data || [])
      .filter((workspace) => {
        if (status !== 'all' && workspace.status !== status && workspace.subscription_status !== status) {
          return false;
        }

        if (!search) return true;

        const owner = profiles.find((profile) => profile.workspace_id === workspace.id && profile.role === 'tenant_admin');
        return (
          workspace.name.toLowerCase().includes(search) ||
          workspace.slug.toLowerCase().includes(search) ||
          (owner?.email || '').toLowerCase().includes(search)
        );
      })
      .map((workspace) => {
        const workspaceProfiles = profiles.filter((profile) => profile.workspace_id === workspace.id);
        const owner = workspaceProfiles.find((profile) => profile.role === 'tenant_admin') || workspaceProfiles[0];
        const workspaceDocuments = documents.filter((document) => document.workspace_id === workspace.id);
        const workspaceChats = chats.filter((chat) => chat.workspace_id === workspace.id);
        const lastActivity = [
          workspace.updated_at,
          ...workspaceProfiles.map((profile) => profile.updated_at || profile.created_at),
          ...workspaceDocuments.map((document) => document.created_at),
          ...workspaceChats.map((chat) => chat.created_at),
        ].filter(Boolean).sort().pop() || null;

        return {
          ...workspace,
          owner_email: owner?.email || null,
          users_count: workspaceProfiles.length,
          documents_count: workspaceDocuments.length,
          questions_count: workspaceChats.length,
          last_activity: lastActivity,
        };
      });

    return Response.json({ workspaces });
  } catch (error) {
    return createPlatformErrorResponse(error, 'Unexpected platform workspaces error');
  }
}
