import { createAuditLog } from '@/src/lib/audit-log';
import { requirePlatformAdminRequest, createPlatformErrorResponse } from '@/src/lib/platform-api';
import { getSupabaseAdmin } from '@/src/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * Permanently delete a platform notification (and its per-user read receipts).
 * Unlike "cancel", this also removes already-sent notifications so they stop
 * appearing for every workspace — used to clear stale/test broadcasts.
 */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requirePlatformAdminRequest(req);
    const { id } = await params;
    const supabase = getSupabaseAdmin();

    const { data: notification, error: lookupError } = await supabase
      .from('platform_notifications')
      .select('id, workspace_id')
      .eq('id', id)
      .maybeSingle();

    if (lookupError || !notification) {
      return Response.json({ error: 'Notification not found' }, { status: 404 });
    }

    // Remove read receipts first (no FK cascade guaranteed), then the notification.
    await supabase.from('user_notification_reads').delete().eq('notification_id', id);

    const { error } = await supabase.from('platform_notifications').delete().eq('id', id);
    if (error) throw error;

    await createAuditLog({
      workspaceId: notification.workspace_id,
      actorUserId: user.id,
      action: 'platform_notification.deleted',
      metadata: { notification_id: id },
    });

    return Response.json({ success: true });
  } catch (error) {
    return createPlatformErrorResponse(error, 'Unexpected notification delete error');
  }
}
