export type AppRole = 'platform_admin' | 'tenant_admin' | 'viewer';
export type LegacyAppRole = 'admin' | 'content_manager';
export type AnyAppRole = AppRole | LegacyAppRole;

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
