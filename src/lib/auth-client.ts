import { supabase } from '@/src/lib/supabase';
import type { UserProfile } from '@/src/lib/workspace';

export async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session?.access_token || null;
}

export async function getCurrentUserProfile() {
  const { data: userResult, error: userError } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!userResult.user) {
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, workspace_id')
    .eq('id', userResult.user.id)
    .single();

  if (error) {
    throw error;
  }

  return data as UserProfile;
}
