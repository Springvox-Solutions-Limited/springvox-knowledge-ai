export type AppRole = 'admin' | 'content_manager' | 'viewer';

export type UserProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: AppRole;
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

export const ALL_ROLES: AppRole[] = ['admin', 'content_manager', 'viewer'];
export const MANAGER_ROLES: AppRole[] = ['admin', 'content_manager'];

export function isAdminRole(role: AppRole) {
  return role === 'admin';
}

export function isManagerRole(role: AppRole) {
  return MANAGER_ROLES.includes(role);
}
