export type AppRole = 'admin' | 'content_manager' | 'viewer';

export type UserProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: AppRole;
  workspace_id: string | null;
};

export const ALL_ROLES: AppRole[] = ['admin', 'content_manager', 'viewer'];
export const MANAGER_ROLES: AppRole[] = ['admin', 'content_manager'];

export function isManagerRole(role: AppRole) {
  return MANAGER_ROLES.includes(role);
}
