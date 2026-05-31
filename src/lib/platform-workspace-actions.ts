import 'server-only';

import { createAuditLog } from '@/src/lib/audit-log';
import { inngest } from '@/src/lib/inngest/client';
import { getSupabaseAdmin } from '@/src/lib/supabase-server';

export async function updatePlatformWorkspaceStatus({
  workspaceId,
  actorUserId,
  action,
  reason,
}: {
  workspaceId: string;
  actorUserId: string;
  action: 'activate' | 'suspend' | 'expire';
  reason?: string | null;
}) {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { data: workspace, error: lookupError } = await supabase
    .from('workspaces')
    .select('id')
    .eq('id', workspaceId)
    .maybeSingle();

  if (lookupError || !workspace) {
    throw lookupError || new Error('Workspace not found');
  }

  const payload =
    action === 'activate'
      ? {
          status: 'active',
          subscription_status: 'active',
          billing_status: 'active',
          payment_required_at: null,
          suspended_reason: null,
          suspension_reason: null,
          suspended_at: null,
          suspended_by: null,
          updated_at: now,
        }
      : action === 'suspend'
        ? {
            status: 'suspended',
            subscription_status: 'suspended',
            billing_status: 'suspended',
            suspended_reason: reason || null,
            suspension_reason: reason || null,
            suspended_at: now,
            suspended_by: actorUserId,
            updated_at: now,
          }
        : {
            status: 'expired',
            subscription_status: 'expired',
            billing_status: 'expired',
            payment_required_at: now,
            updated_at: now,
          };

  const { error } = await supabase.from('workspaces').update(payload).eq('id', workspaceId);
  if (error) throw error;

  await createAuditLog({
    workspaceId,
    actorUserId,
    action: `workspace.${action}`,
    metadata: { reason: reason || null },
  });
}

export async function scheduleWorkspaceDeletion({
  workspaceId,
  actorUserId,
  reason,
  retentionDays = 14,
}: {
  workspaceId: string;
  actorUserId: string;
  reason?: string | null;
  retentionDays?: number;
}) {
  const supabase = getSupabaseAdmin();
  const now = new Date();
  const scheduledFor = new Date(now.getTime() + retentionDays * 24 * 60 * 60 * 1000);
  const { error } = await supabase
    .from('workspaces')
    .update({
      status: 'suspended',
      subscription_status: 'suspended',
      billing_status: 'suspended',
      deletion_status: 'scheduled',
      deletion_requested_at: now.toISOString(),
      deletion_scheduled_for: scheduledFor.toISOString(),
      deletion_reason: reason || null,
      suspended_reason: reason || 'Workspace deletion scheduled.',
      suspension_reason: reason || 'Workspace deletion scheduled.',
      updated_at: now.toISOString(),
    })
    .eq('id', workspaceId);

  if (error) throw error;

  await createAuditLog({
    workspaceId,
    actorUserId,
    action: 'workspace.deletion_scheduled',
    metadata: { scheduled_for: scheduledFor.toISOString(), reason: reason || null },
  });
}

export async function cancelWorkspaceDeletion({
  workspaceId,
  actorUserId,
}: {
  workspaceId: string;
  actorUserId: string;
}) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('workspaces')
    .update({
      status: 'active',
      subscription_status: 'active',
      billing_status: 'active',
      deletion_status: 'cancelled',
      deletion_scheduled_for: null,
      deletion_reason: null,
      suspended_reason: null,
      suspension_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', workspaceId);

  if (error) throw error;

  await createAuditLog({
    workspaceId,
    actorUserId,
    action: 'workspace.deletion_cancelled',
  });
}

export async function forceWorkspaceDeletion({
  workspaceId,
  actorUserId,
  confirmation,
}: {
  workspaceId: string;
  actorUserId: string;
  confirmation: string;
}) {
  if (confirmation !== 'DELETE WORKSPACE') {
    throw new Error('Type DELETE WORKSPACE to confirm force deletion.');
  }

  await createAuditLog({
    workspaceId,
    actorUserId,
    action: 'workspace.force_delete_requested',
  });

  await inngest.send({
    name: 'workspace/delete.started',
    data: { workspaceId, actorUserId, force: true },
  });
}

export async function extendPlatformWorkspaceTrial({
  workspaceId,
  actorUserId,
  days,
}: {
  workspaceId: string;
  actorUserId: string;
  days: 7 | 14;
}) {
  const supabase = getSupabaseAdmin();
  const { data: workspace, error: lookupError } = await supabase
    .from('workspaces')
    .select('trial_ends_at')
    .eq('id', workspaceId)
    .maybeSingle();

  if (lookupError || !workspace) throw lookupError || new Error('Workspace not found');

  const base = workspace.trial_ends_at && new Date(workspace.trial_ends_at).getTime() > Date.now()
    ? new Date(workspace.trial_ends_at)
    : new Date();
  base.setDate(base.getDate() + days);

  const { error } = await supabase
    .from('workspaces')
    .update({
      status: 'active',
      subscription_status: 'trial',
      billing_status: 'trialing',
      trial_ends_at: base.toISOString(),
      payment_required_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', workspaceId);

  if (error) throw error;

  await createAuditLog({
    workspaceId,
    actorUserId,
    action: 'workspace.trial_extended',
    metadata: { days, trial_ends_at: base.toISOString() },
  });
}

export async function updatePlatformWorkspaceBilling({
  workspaceId,
  actorUserId,
  action,
}: {
  workspaceId: string;
  actorUserId: string;
  action: 'paid_active' | 'past_due';
}) {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { data: workspace, error: lookupError } = await supabase
    .from('workspaces')
    .select('id')
    .eq('id', workspaceId)
    .maybeSingle();

  if (lookupError || !workspace) {
    throw lookupError || new Error('Workspace not found');
  }

  const payload =
    action === 'paid_active'
      ? {
          status: 'active',
          subscription_status: 'active',
          billing_status: 'active',
          subscription_plan: 'paid',
          payment_required_at: null,
          suspended_reason: null,
          suspension_reason: null,
          updated_at: now,
        }
      : {
          status: 'past_due',
          subscription_status: 'past_due',
          billing_status: 'past_due',
          payment_required_at: now,
          updated_at: now,
        };

  const { error } = await supabase.from('workspaces').update(payload).eq('id', workspaceId);
  if (error) throw error;

  await createAuditLog({
    workspaceId,
    actorUserId,
    action: `workspace.billing_${action}`,
    metadata: payload,
  });
}
