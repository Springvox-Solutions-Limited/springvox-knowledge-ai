import 'server-only';

import { getSupabaseAdmin } from '@/src/lib/supabase-server';
import {
  getWorkspaceStatusMessage,
  isWorkspaceOperationalStatus,
  type WorkspaceStatus,
} from '@/src/lib/workspace';

export type WorkspaceAccessSnapshot = {
  id: string;
  name: string;
  slug: string;
  status: WorkspaceStatus;
  plan: string | null;
};

export async function getWorkspaceAccessSnapshot(workspaceId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('workspaces')
    .select('id, name, slug, status, plan')
    .eq('id', workspaceId)
    .maybeSingle();

  if (error || !data) {
    throw error || new Error('Workspace not found');
  }

  return data as WorkspaceAccessSnapshot;
}

export async function assertWorkspaceOperational(workspaceId: string) {
  const workspace = await getWorkspaceAccessSnapshot(workspaceId);

  if (!isWorkspaceOperationalStatus(workspace.status)) {
    throw new Error(getWorkspaceStatusMessage(workspace.status) || 'Workspace access is restricted.');
  }

  return workspace;
}
