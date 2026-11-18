import 'server-only';

import { getSupabaseAdmin } from '@/src/lib/supabase-server';

export async function createAuditLog({
  workspaceId,
  actorUserId,
  targetUserId,
  action,
  metadata,
}: {
  workspaceId: string | null;
  actorUserId: string;
  targetUserId?: string | null;
  action: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('audit_logs').insert({
    workspace_id: workspaceId,
    actor_user_id: actorUserId,
    target_user_id: targetUserId || null,
    action,
    metadata: metadata || {},
  });

  if (error) {
    console.warn('Audit log write failed:', error);
  }
}
