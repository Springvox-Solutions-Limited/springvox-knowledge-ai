import { supabase } from '@/src/lib/supabase';
import type { UserProfile, WorkspaceSettings } from '@/src/lib/workspace';

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

export async function getCurrentWorkspaceSettings() {
  const profile = await getCurrentUserProfile();

  if (!profile?.workspace_id) {
    return null;
  }

  const { data, error } = await supabase
    .from('workspaces')
    .select('id, name, slug, logo_url, primary_color, welcome_message, assistant_name, support_email, industry, website, updated_at')
    .eq('id', profile.workspace_id)
    .single();

  if (error) {
    throw error;
  }

  return data as WorkspaceSettings;
}
