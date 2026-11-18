import 'server-only';

import { createClient, type User } from '@supabase/supabase-js';
import { getUserStatusMessage, type AnyAppRole, type UserProfile } from '@/src/lib/workspace';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
}

if (!supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
}

if (!serviceRoleKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
}

function createServerSupabaseClient(key: string) {
  return createClient(supabaseUrl, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function getSupabaseAdmin() {
  return createServerSupabaseClient(serviceRoleKey);
}

export async function getAuthenticatedUser(request: Request): Promise<User> {
  const authorization = request.headers.get('authorization');

  if (!authorization?.startsWith('Bearer ')) {
    throw new Error('Missing bearer token');
  }

  const accessToken = authorization.slice('Bearer '.length).trim();
  if (!accessToken) {
    throw new Error('Missing bearer token');
  }

  const supabase = createServerSupabaseClient(supabaseAnonKey);
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user) {
    throw new Error('Unauthorized');
  }

  return data.user;
}

export async function getAuthenticatedUserWithProfile(
  request: Request,
  allowedRoles?: AnyAppRole[],
): Promise<{ user: User; profile: UserProfile }> {
  const user = await getAuthenticatedUser(request);
  const profile = await getUserProfileById(user.id);

  if (!profile.workspace_id) {
    throw new Error('Workspace not assigned');
  }

  const statusMessage = getUserStatusMessage(profile.status);
  if (statusMessage) {
    throw new Error(statusMessage);
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    throw new Error('Forbidden');
  }

  return { user, profile };
}

export async function getUserProfileById(userId: string): Promise<UserProfile> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, workspace_id, status')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) {
    throw new Error('Profile not found');
  }

  return data as UserProfile;
}

export async function getAuthenticatedUserWithAnyProfile(
  request: Request,
  allowedRoles?: AnyAppRole[],
): Promise<{ user: User; profile: UserProfile }> {
  const user = await getAuthenticatedUser(request);
  const profile = await getUserProfileById(user.id);

  const statusMessage = getUserStatusMessage(profile.status);
  if (statusMessage) {
    throw new Error(statusMessage);
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    throw new Error('Forbidden');
  }

  return { user, profile };
}
