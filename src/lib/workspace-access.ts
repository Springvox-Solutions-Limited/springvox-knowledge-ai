import 'server-only';

import { getSupabaseAdmin } from '@/src/lib/supabase-server';
import {
  getWorkspaceStatusMessage,
  isWorkspaceOperationalStatus,
  type BillingStatus,
  type SubscriptionStatus,
  type WorkspaceStatus,
} from '@/src/lib/workspace';

export type WorkspaceAccessSnapshot = {
  id: string;
  name: string;
  slug: string;
  status: WorkspaceStatus;
  plan: string | null;
  subscription_status: SubscriptionStatus | null;
  subscription_plan: string | null;
  billing_status: BillingStatus | null;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  payment_required_at: string | null;
  suspended_reason: string | null;
};

export async function getWorkspaceAccessSnapshot(workspaceId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('workspaces')
    .select('id, name, slug, status, plan, subscription_status, subscription_plan, billing_status, trial_started_at, trial_ends_at, payment_required_at, suspended_reason')
    .eq('id', workspaceId)
    .maybeSingle();

  if (error || !data) {
    throw error || new Error('Workspace not found');
  }

  return data as WorkspaceAccessSnapshot;
}

export async function assertWorkspaceOperational(workspaceId: string) {
  const workspace = await getWorkspaceAccessSnapshot(workspaceId);
  const now = Date.now();
  const trialEndsAt = workspace.trial_ends_at ? new Date(workspace.trial_ends_at).getTime() : null;

  if (
    workspace.subscription_status === 'trial' &&
    trialEndsAt &&
    Number.isFinite(trialEndsAt) &&
    trialEndsAt <= now
  ) {
    throw new Error('Your 14-day trial has ended. Please upgrade to continue using SpringVox.');
  }

  if (
    workspace.subscription_status &&
    ['past_due', 'expired', 'suspended'].includes(workspace.subscription_status)
  ) {
    throw new Error(getWorkspaceStatusMessage(workspace.subscription_status as WorkspaceStatus) || 'Workspace access is restricted.');
  }

  if (!isWorkspaceOperationalStatus(workspace.status)) {
    throw new Error(getWorkspaceStatusMessage(workspace.status) || 'Workspace access is restricted.');
  }

  return workspace;
}
