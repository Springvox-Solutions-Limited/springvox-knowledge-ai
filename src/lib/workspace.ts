export type AppRole = 'platform_admin' | 'tenant_admin' | 'viewer';
export type LegacyAppRole = 'admin' | 'content_manager';
export type AnyAppRole = AppRole | LegacyAppRole;
export type WorkspaceStatus = 'active' | 'suspended' | 'trial' | 'inactive' | 'past_due' | 'expired';
export type WorkspacePlan = 'pilot' | 'starter' | 'business' | 'enterprise';
export type UserStatus = 'active' | 'suspended' | 'invited' | 'disabled';
export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'expired' | 'suspended';
export type BillingStatus = 'trialing' | 'active' | 'past_due' | 'expired' | 'suspended';

export type UserProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: AnyAppRole;
  workspace_id: string | null;
  status?: UserStatus;
};

export type WorkspaceSettings = {
  id: string;
  name: string;
  slug: string;
  status: WorkspaceStatus;
  plan: WorkspacePlan;
  subscription_status?: SubscriptionStatus | null;
  subscription_plan?: string | null;
  billing_status?: BillingStatus | null;
  trial_started_at?: string | null;
  trial_ends_at?: string | null;
  payment_required_at?: string | null;
  suspended_reason?: string | null;
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
export const WORKSPACE_RESTRICTED_STATUSES: WorkspaceStatus[] = [
  'suspended',
  'inactive',
  'past_due',
  'expired',
];
export const WORKSPACE_STATUSES: WorkspaceStatus[] = [
  'active',
  'suspended',
  'trial',
  'inactive',
  'past_due',
  'expired',
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
export const USER_STATUSES: UserStatus[] = ['active', 'suspended', 'invited', 'disabled'];
export const SUBSCRIPTION_STATUSES: SubscriptionStatus[] = [
  'trial',
  'active',
  'past_due',
  'expired',
  'suspended',
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
    return 'This workspace is currently suspended. Please contact Rekall-IQ support.';
  }

  if (status === 'expired') {
    return 'Your 14-day trial has ended. Please upgrade to continue using Rekall-IQ.';
  }

  if (status === 'past_due') {
    return 'Payment is required to continue using Rekall-IQ.';
  }

  if (status === 'inactive') {
    return 'This workspace is currently inactive.';
  }

  return null;
}

export function getUserStatusMessage(status: UserStatus | null | undefined) {
  if (status === 'suspended') {
    return 'Your account has been suspended. Contact your workspace administrator.';
  }

  if (status === 'disabled') {
    return 'Your account is disabled. Contact your workspace administrator.';
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
    return 'Workspace Admin';
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
    label: 'Essential',
    description: 'Foundational workspace plan for teams getting started with secure document intelligence.',
    suggestedDocuments: '20',
    suggestedUsers: '25',
    suggestedMonthlyQuestions: '1,000',
  },
  starter: {
    label: 'Starter',
    description: 'Entry-level workspace plan for smaller teams.',
    suggestedDocuments: '50',
    suggestedUsers: '50',
    suggestedMonthlyQuestions: '3,000',
  },
  business: {
    label: 'Business',
    description: 'Growth-oriented workspace plan for larger organisational rollouts.',
    suggestedDocuments: '200',
    suggestedUsers: '250',
    suggestedMonthlyQuestions: '15,000',
  },
  enterprise: {
    label: 'Enterprise',
    description: 'Custom workspace plan for large or specialized deployments.',
    suggestedDocuments: 'Custom',
    suggestedUsers: 'Custom',
    suggestedMonthlyQuestions: 'Custom',
  },
};
