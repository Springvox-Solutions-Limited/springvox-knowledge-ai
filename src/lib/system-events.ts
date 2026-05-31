import 'server-only';

import { getSupabaseAdmin } from '@/src/lib/supabase-server';

export type SystemEventSeverity = 'info' | 'warning' | 'error' | 'critical';

function sanitizeMetadata(metadata: Record<string, unknown> = {}) {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (/key|secret|token|password|authorization/i.test(key)) {
      sanitized[key] = '[redacted]';
    } else if (typeof value === 'string') {
      sanitized[key] = value.slice(0, 500);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export async function logSystemEvent({
  workspaceId,
  userId,
  eventType,
  severity = 'info',
  message,
  metadata,
}: {
  workspaceId?: string | null;
  userId?: string | null;
  eventType: string;
  severity?: SystemEventSeverity;
  message: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('system_events').insert({
      workspace_id: workspaceId || null,
      user_id: userId || null,
      event_type: eventType,
      severity,
      message: message.slice(0, 1000),
      metadata: sanitizeMetadata(metadata),
    });

    if (error) {
      console.warn('[SystemEvents] write failed:', error.message);
    }
  } catch (error) {
    console.warn('[SystemEvents] unavailable:', error instanceof Error ? error.message : 'Unknown error');
  }
}
