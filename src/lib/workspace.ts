export type AppRole = 'platform_admin' | 'tenant_admin' | 'viewer';
export type LegacyAppRole = 'admin' | 'content_manager';
export type AnyAppRole = AppRole | LegacyAppRole;
export type WorkspaceStatus = 'active' | 'suspended' | 'trial' | 'inactive';
export type WorkspacePlan = 'pilot' | 'starter' | 'business' | 'enterprise';

export type UserProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: AnyAppRole;
  workspace_id: string | null;
};

export type WorkspaceSettings = {
  id: string;
  name: string;
  slug: string;
  status: WorkspaceStatus;
  plan: WorkspacePlan;
  logo_url: string | null;
  primary_color: string | null;
  welcome_message: string | null;
  assistant_name: string | null;
  support_email: string | null;
  industry: string | null;
  website: string | null;
  updated_at: string | null;
};

export const FEEDBACK_RATINGS = [
  'helpful',
  'not_helpful',
  'wrong',
  'outdated',
  'needs_more_detail',
] as const;

export type FeedbackRating = (typeof FEEDBACK_RATINGS)[number];

export const ASSIGNABLE_ROLES: AppRole[] = ['tenant_admin', 'viewer'];
export const WORKSPACE_ACTIVE_STATUSES: WorkspaceStatus[] = ['active', 'trial'];
export const WORKSPACE_RESTRICTED_STATUSES: WorkspaceStatus[] = ['suspended', 'inactive'];
export const WORKSPACE_STATUSES: WorkspaceStatus[] = [
  'active',
  'suspended',
  'trial',
  'inactive',
];
export const WORKSPACE_PLANS: WorkspacePlan[] = [
  'pilot',
  'starter',
  'business',
  'enterprise',
];
export const ALL_ROLES: AnyAppRole[] = [
  'platform_admin',
  'tenant_admin',
  'viewer',
  'admin',
  'content_manager',
];
export const WORKSPACE_ADMIN_ROLES: AnyAppRole[] = [
  'platform_admin',
  'tenant_admin',
  'admin',
  'content_manager',
];

export function isPlatformAdminRole(role: AnyAppRole) {
  return role === 'platform_admin';
}

export function isTenantAdminRole(role: AnyAppRole) {
  return role === 'tenant_admin' || role === 'admin' || role === 'content_manager';
}

export function isWorkspaceAdminRole(role: AnyAppRole) {
  return isPlatformAdminRole(role) || isTenantAdminRole(role);
}

export function isWorkspaceOperationalStatus(status: WorkspaceStatus) {
  return WORKSPACE_ACTIVE_STATUSES.includes(status);
}

export function isWorkspaceRestrictedStatus(status: WorkspaceStatus) {
  return WORKSPACE_RESTRICTED_STATUSES.includes(status);
}

export function getWorkspaceStatusMessage(status: WorkspaceStatus) {
  if (status === 'suspended') {
    return 'This workspace is currently suspended. Please contact SpringVox support.';
  }

  if (status === 'inactive') {
    return 'This workspace is currently inactive.';
  }

  return null;
}

export function normalizeRole(role: AnyAppRole): AppRole {
  if (role === 'platform_admin') {
    return 'platform_admin';
  }

  if (role === 'tenant_admin' || role === 'admin' || role === 'content_manager') {
    return 'tenant_admin';
  }

  return 'viewer';
}

export function getRoleLabel(role: AnyAppRole) {
  if (role === 'platform_admin') {
    return 'Platform Admin';
  }

  if (role === 'tenant_admin' || role === 'admin' || role === 'content_manager') {
    return 'Tenant Admin';
  }

  return 'Viewer';
}

export function getDefaultRouteForRole(role: AnyAppRole) {
  if (role === 'platform_admin') {
    return '/platform';
  }

  return isTenantAdminRole(role) ? '/dashboard' : '/dashboard/chat';
}

export const PLAN_DETAILS: Record<
  WorkspacePlan,
  {
    label: string;
    description: string;
    suggestedDocuments: string;
    suggestedUsers: string;
    suggestedMonthlyQuestions: string;
  }
> = {
  pilot: {
    label: 'Pilot',
    description: 'Default manual plan for pilot companies and onboarding cohorts.',
    suggestedDocuments: '20',
    suggestedUsers: '25',
    suggestedMonthlyQuestions: '1,000',
  },
  starter: {
    label: 'Starter',
    description: 'Entry-level demo plan for smaller teams.',
    suggestedDocuments: '50',
    suggestedUsers: '50',
    suggestedMonthlyQuestions: '3,000',
  },
  business: {
    label: 'Business',
    description: 'Growth-oriented demo plan for larger internal rollouts.',
    suggestedDocuments: '200',
    suggestedUsers: '250',
    suggestedMonthlyQuestions: '15,000',
  },
  enterprise: {
    label: 'Enterprise',
    description: 'Custom demo plan for large or specialized deployments.',
    suggestedDocuments: 'Custom',
    suggestedUsers: 'Custom',
    suggestedMonthlyQuestions: 'Custom',
  },
};
