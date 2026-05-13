import 'server-only';

import { createClient, type User } from '@supabase/supabase-js';
import type { AppRole, UserProfile } from '@/src/lib/workspace';

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
  allowedRoles?: AppRole[],
): Promise<{ user: User; profile: UserProfile }> {
  const user = await getAuthenticatedUser(request);
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, workspace_id')
    .eq('id', user.id)
    .single();

  if (error || !data) {
    throw new Error('Profile not found');
  }

  const profile = data as UserProfile;

  if (!profile.workspace_id) {
    throw new Error('Workspace not assigned');
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    throw new Error('Forbidden');
  }

  return { user, profile };
}
