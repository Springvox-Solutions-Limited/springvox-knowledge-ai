import 'server-only';

import { getSupabaseAdmin } from '@/src/lib/supabase-server';
import { PLAN_DETAILS, type WorkspacePlan, type WorkspaceStatus } from '@/src/lib/workspace';

type WorkspaceRow = {
  id: string;
  name: string;
  slug: string;
  status: WorkspaceStatus;
  plan: WorkspacePlan;
  suspension_reason: string | null;
  suspended_at: string | null;
  suspended_by: string | null;
  plan_updated_at: string | null;
  internal_notes: string | null;
  assistant_name: string | null;
  support_email: string | null;
  industry: string | null;
  website: string | null;
  created_at: string;
  updated_at: string | null;
};

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  status: string;
  workspace_id: string | null;
  created_at: string;
  updated_at: string;
};

type DocumentRow = {
  id: string;
  workspace_id: string;
  filename: string;
  status: string;
  created_at: string;
  total_chunks: number | null;
};

type ChatRow = {
  id: string;
  workspace_id: string;
  created_at: string;
};

type KnowledgeGapRow = {
  id: string;
  workspace_id: string;
  status: string;
  created_at: string;
  last_asked_at: string | null;
};

type FeedbackRow = {
  id: string;
  workspace_id: string;
  created_at: string;
};

type InvitationRow = {
  id: string;
  workspace_id: string;
  created_at: string;
  status: string;
};

type WorkspaceUsageSummary = {
  totalUsers: number;
  tenantAdmins: number;
  viewers: number;
  totalDocuments: number;
  totalQuestions: number;
  openKnowledgeGaps: number;
  totalFeedback: number;
  lastActivity: string | null;
};

function maxIsoDate(values: Array<string | null | undefined>) {
  const valid = values.filter(Boolean) as string[];
  if (valid.length === 0) {
    return null;
  }

  return valid.reduce((latest, value) => (value > latest ? value : latest));
}

function buildUsageMaps(
  workspaces: WorkspaceRow[],
  profiles: ProfileRow[],
  documents: DocumentRow[],
  chats: ChatRow[],
  knowledgeGaps: KnowledgeGapRow[],
  feedback: FeedbackRow[],
  invitations: InvitationRow[],
) {
  const workspaceIds = new Set(workspaces.map((workspace) => workspace.id));
  const profilesByWorkspace = new Map<string, ProfileRow[]>();
  const documentsByWorkspace = new Map<string, DocumentRow[]>();
  const chatsByWorkspace = new Map<string, ChatRow[]>();
  const gapsByWorkspace = new Map<string, KnowledgeGapRow[]>();
  const feedbackByWorkspace = new Map<string, FeedbackRow[]>();
  const invitationsByWorkspace = new Map<string, InvitationRow[]>();

  for (const workspaceId of workspaceIds) {
    profilesByWorkspace.set(workspaceId, []);
    documentsByWorkspace.set(workspaceId, []);
    chatsByWorkspace.set(workspaceId, []);
    gapsByWorkspace.set(workspaceId, []);
    feedbackByWorkspace.set(workspaceId, []);
    invitationsByWorkspace.set(workspaceId, []);
  }

  for (const profile of profiles) {
    if (profile.workspace_id && profilesByWorkspace.has(profile.workspace_id)) {
      profilesByWorkspace.get(profile.workspace_id)!.push(profile);
    }
  }

  for (const document of documents) {
    if (documentsByWorkspace.has(document.workspace_id)) {
      documentsByWorkspace.get(document.workspace_id)!.push(document);
    }
  }

  for (const chat of chats) {
    if (chatsByWorkspace.has(chat.workspace_id)) {
      chatsByWorkspace.get(chat.workspace_id)!.push(chat);
    }
  }

  for (const gap of knowledgeGaps) {
    if (gapsByWorkspace.has(gap.workspace_id)) {
      gapsByWorkspace.get(gap.workspace_id)!.push(gap);
    }
  }

  for (const item of feedback) {
    if (feedbackByWorkspace.has(item.workspace_id)) {
      feedbackByWorkspace.get(item.workspace_id)!.push(item);
    }
  }

  for (const invitation of invitations) {
    if (invitationsByWorkspace.has(invitation.workspace_id)) {
      invitationsByWorkspace.get(invitation.workspace_id)!.push(invitation);
    }
  }

  return {
    profilesByWorkspace,
    documentsByWorkspace,
    chatsByWorkspace,
    gapsByWorkspace,
    feedbackByWorkspace,
    invitationsByWorkspace,
  };
}

function buildWorkspaceUsageSummary(
  workspaceId: string,
  maps: ReturnType<typeof buildUsageMaps>,
): WorkspaceUsageSummary {
  const profiles = maps.profilesByWorkspace.get(workspaceId) || [];
  const documents = maps.documentsByWorkspace.get(workspaceId) || [];
  const chats = maps.chatsByWorkspace.get(workspaceId) || [];
  const gaps = maps.gapsByWorkspace.get(workspaceId) || [];
  const feedback = maps.feedbackByWorkspace.get(workspaceId) || [];
  const invitations = maps.invitationsByWorkspace.get(workspaceId) || [];

  return {
    totalUsers: profiles.length,
    tenantAdmins: profiles.filter((item) => item.role === 'tenant_admin').length,
    viewers: profiles.filter((item) => item.role === 'viewer').length,
    totalDocuments: documents.length,
    totalQuestions: chats.length,
    openKnowledgeGaps: gaps.filter((item) => item.status === 'open').length,
    totalFeedback: feedback.length,
    lastActivity: maxIsoDate([
      ...profiles.map((item) => item.updated_at || item.created_at),
      ...documents.map((item) => item.created_at),
      ...chats.map((item) => item.created_at),
      ...gaps.map((item) => item.last_asked_at || item.created_at),
      ...feedback.map((item) => item.created_at),
      ...invitations.map((item) => item.created_at),
    ]),
  };
}

async function loadPlatformBaseData() {
  const supabase = getSupabaseAdmin();

  const [
    workspacesResult,
    profilesResult,
    documentsResult,
    chatsResult,
    gapsResult,
    feedbackResult,
    invitationsResult,
  ] = await Promise.all([
    supabase
      .from('workspaces')
      .select('id, name, slug, status, plan, suspension_reason, suspended_at, suspended_by, plan_updated_at, internal_notes, assistant_name, support_email, industry, website, created_at, updated_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('id, email, full_name, role, status, workspace_id, created_at, updated_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('documents')
      .select('id, workspace_id, filename, status, created_at, total_chunks')
      .order('created_at', { ascending: false }),
    supabase
      .from('chat_messages')
      .select('id, workspace_id, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('knowledge_gaps')
      .select('id, workspace_id, status, created_at, last_asked_at')
      .order('last_asked_at', { ascending: false }),
    supabase
      .from('answer_feedback')
      .select('id, workspace_id, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('invitations')
      .select('id, workspace_id, created_at, status')
      .order('created_at', { ascending: false }),
  ]);

  if (workspacesResult.error) throw workspacesResult.error;
  if (profilesResult.error) throw profilesResult.error;
  if (documentsResult.error) throw documentsResult.error;
  if (chatsResult.error) throw chatsResult.error;
  if (gapsResult.error) throw gapsResult.error;
  if (feedbackResult.error) throw feedbackResult.error;
  if (invitationsResult.error) throw invitationsResult.error;

  const workspaces = (workspacesResult.data || []) as WorkspaceRow[];
  const profiles = (profilesResult.data || []) as ProfileRow[];
  const documents = (documentsResult.data || []) as DocumentRow[];
  const chats = (chatsResult.data || []) as ChatRow[];
  const knowledgeGaps = (gapsResult.data || []) as KnowledgeGapRow[];
  const feedback = (feedbackResult.data || []) as FeedbackRow[];
  const invitations = (invitationsResult.data || []) as InvitationRow[];

  const maps = buildUsageMaps(
    workspaces,
    profiles,
    documents,
    chats,
    knowledgeGaps,
    feedback,
    invitations,
  );

  return {
    workspaces,
    profiles,
    documents,
    chats,
    knowledgeGaps,
    feedback,
    invitations,
    maps,
  };
}

export async function getPlatformSummary() {
  const data = await loadPlatformBaseData();
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString();

  return {
    totals: {
      totalWorkspaces: data.workspaces.length,
      activeWorkspaces: data.workspaces.filter((workspace) => workspace.status === 'active').length,
      suspendedWorkspaces: data.workspaces.filter((workspace) => workspace.status === 'suspended').length,
      trialWorkspaces: data.workspaces.filter((workspace) => workspace.status === 'trial').length,
      inactiveWorkspaces: data.workspaces.filter((workspace) => workspace.status === 'inactive').length,
      totalUsers: data.profiles.length,
      totalTenantAdmins: data.profiles.filter((profile) => profile.role === 'tenant_admin').length,
      totalViewers: data.profiles.filter((profile) => profile.role === 'viewer').length,
      totalPlatformAdmins: data.profiles.filter((profile) => profile.role === 'platform_admin').length,
      totalDocuments: data.documents.length,
      totalQuestions: data.chats.length,
      totalUnansweredQuestions: data.knowledgeGaps.filter((gap) => gap.status === 'open').length,
      totalFeedback: data.feedback.length,
      newCompaniesLast7Days: data.workspaces.filter((workspace) => workspace.created_at >= since).length,
      questionsLast7Days: data.chats.filter((chat) => chat.created_at >= since).length,
    },
    topCompaniesByQuestions: data.workspaces
      .map((workspace) => ({
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        plan: workspace.plan,
        status: workspace.status,
        totalQuestions: data.maps.chatsByWorkspace.get(workspace.id)?.length || 0,
      }))
      .sort((left, right) => right.totalQuestions - left.totalQuestions)
      .slice(0, 5),
    companiesByOpenQuestions: data.workspaces
      .map((workspace) => ({
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        openKnowledgeGaps:
          data.maps.gapsByWorkspace.get(workspace.id)?.filter((gap) => gap.status === 'open').length || 0,
      }))
      .sort((left, right) => right.openKnowledgeGaps - left.openKnowledgeGaps)
      .slice(0, 5),
    recentCompanies: data.workspaces.slice(0, 6).map((workspace) => ({
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      status: workspace.status,
      plan: workspace.plan,
      created_at: workspace.created_at,
    })),
    recentUserSignups: data.profiles
      .slice(0, 8)
      .map((profile) => {
        const workspace = data.workspaces.find((item) => item.id === profile.workspace_id);
        return {
          id: profile.id,
          email: profile.email,
          role: profile.role,
          workspace_name: workspace?.name || 'No workspace',
          created_at: profile.created_at,
        };
      }),
    workspacesByPlan: Object.keys(PLAN_DETAILS).map((plan) => ({
      plan,
      count: data.workspaces.filter((workspace) => workspace.plan === plan).length,
    })),
    workspacesByStatus: ['active', 'trial', 'suspended', 'inactive'].map((status) => ({
      status,
      count: data.workspaces.filter((workspace) => workspace.status === status).length,
    })),
  };
}

export async function getPlatformCompanies(filters?: {
  search?: string;
  status?: string;
  plan?: string;
}) {
  const data = await loadPlatformBaseData();
  const search = filters?.search?.trim().toLowerCase() || '';

  return data.workspaces
    .filter((workspace) => {
      if (filters?.status && filters.status !== 'all' && workspace.status !== filters.status) {
        return false;
      }

      if (filters?.plan && filters.plan !== 'all' && workspace.plan !== filters.plan) {
        return false;
      }

      if (!search) {
        return true;
      }

      const tenantAdminEmails =
        data.maps.profilesByWorkspace
          .get(workspace.id)
          ?.filter((profile) => profile.role === 'tenant_admin')
          .map((profile) => profile.email?.toLowerCase() || '') || [];

      return (
        workspace.name.toLowerCase().includes(search) ||
        workspace.slug.toLowerCase().includes(search) ||
        tenantAdminEmails.some((email) => email.includes(search))
      );
    })
    .map((workspace) => {
      const usage = buildWorkspaceUsageSummary(workspace.id, data.maps);
      const tenantAdmin = (data.maps.profilesByWorkspace.get(workspace.id) || []).find(
        (profile) => profile.role === 'tenant_admin',
      );

      return {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        status: workspace.status,
        plan: workspace.plan,
        tenant_admin_email: tenantAdmin?.email || null,
        total_users: usage.totalUsers,
        total_documents: usage.totalDocuments,
        total_questions: usage.totalQuestions,
        open_unanswered_questions: usage.openKnowledgeGaps,
        created_at: workspace.created_at,
        last_activity: usage.lastActivity,
      };
    });
}

export async function getPlatformCompanyDetail(workspaceId: string) {
  const data = await loadPlatformBaseData();
  const workspace = data.workspaces.find((item) => item.id === workspaceId);

  if (!workspace) {
    throw new Error('Workspace not found');
  }

  const profiles = data.maps.profilesByWorkspace.get(workspaceId) || [];
  const documents = data.maps.documentsByWorkspace.get(workspaceId) || [];
  const chats = data.maps.chatsByWorkspace.get(workspaceId) || [];
  const knowledgeGaps = data.maps.gapsByWorkspace.get(workspaceId) || [];
  const feedback = data.maps.feedbackByWorkspace.get(workspaceId) || [];
  const usage = buildWorkspaceUsageSummary(workspaceId, data.maps);
  const recentQuestionActivity = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const dayKey = date.toISOString().slice(0, 10);
    return {
      date: dayKey,
      questions: chats.filter((chat) => chat.created_at.slice(0, 10) === dayKey).length,
    };
  });

  return {
    workspace: {
      ...workspace,
    },
    usage: {
      ...usage,
      totalTenantAdmins: profiles.filter((item) => item.role === 'tenant_admin').length,
      totalViewers: profiles.filter((item) => item.role === 'viewer').length,
      feedbackCount: feedback.length,
    },
    users: profiles.map((profile) => ({
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      role: profile.role,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    })),
    documents: documents.map((document) => ({
      id: document.id,
      filename: document.filename,
      status: document.status,
      created_at: document.created_at,
      total_sections: document.total_chunks || 0,
    })),
    questionActivity: {
      totalQuestions: chats.length,
      openKnowledgeGaps: knowledgeGaps.filter((item) => item.status === 'open').length,
      recentQuestionActivity,
    },
  };
}

export async function getPlatformUsers(filters?: {
  search?: string;
  role?: string;
  workspaceId?: string;
  status?: string;
}) {
  const data = await loadPlatformBaseData();
  const search = filters?.search?.trim().toLowerCase() || '';
  const supabase = getSupabaseAdmin();
  const lastSignInByUserId = new Map<string, string | null>();

  try {
    const { data: authUsers } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    for (const user of authUsers.users || []) {
      lastSignInByUserId.set(user.id, user.last_sign_in_at || null);
    }
  } catch {
    // Last sign-in is helpful operational metadata, but the users page should still load if Auth Admin is unavailable.
  }

  return data.profiles
    .filter((profile) => {
      const workspace = data.workspaces.find((item) => item.id === profile.workspace_id);

      if (filters?.role && filters.role !== 'all' && profile.role !== filters.role) {
        return false;
      }

      if (filters?.workspaceId && filters.workspaceId !== 'all' && profile.workspace_id !== filters.workspaceId) {
        return false;
      }

      if (filters?.status && filters.status !== 'all' && profile.status !== filters.status) {
        return false;
      }

      if (!search) {
        return true;
      }

      return (
        (profile.email || '').toLowerCase().includes(search) ||
        (profile.full_name || '').toLowerCase().includes(search) ||
        (workspace?.name || '').toLowerCase().includes(search)
      );
    })
    .map((profile) => {
      const workspace = data.workspaces.find((item) => item.id === profile.workspace_id);
      return {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        status: profile.status || 'active',
        workspace_id: profile.workspace_id,
        workspace_name: workspace?.name || 'No workspace',
        workspace_status: workspace?.status || null,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        last_sign_in_at: lastSignInByUserId.get(profile.id) || null,
      };
    });
}

export async function getPlatformPlans() {
  const data = await loadPlatformBaseData();

  return Object.entries(PLAN_DETAILS).map(([plan, detail]) => ({
    plan,
    ...detail,
    workspaceCount: data.workspaces.filter((workspace) => workspace.plan === plan).length,
    companies: data.workspaces
      .filter((workspace) => workspace.plan === plan)
      .map((workspace) => ({
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        status: workspace.status,
        created_at: workspace.created_at,
      })),
  }));
}

export async function getDefaultWorkspaceId() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('workspaces')
    .select('id')
    .eq('slug', 'default')
    .single();

  if (error || !data) {
    throw error || new Error('Default workspace not found');
  }

  return data.id as string;
}
