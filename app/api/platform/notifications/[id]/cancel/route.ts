import { createAuditLog } from '@/src/lib/audit-log';
import { requirePlatformAdminRequest, createPlatformErrorResponse } from '@/src/lib/platform-api';
import { getSupabaseAdmin } from '@/src/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requirePlatformAdminRequest(req);
    const { id } = await params;
    const supabase = getSupabaseAdmin();
    const { data: notification, error: lookupError } = await supabase
      .from('platform_notifications')
      .select('id, workspace_id, status')
      .eq('id', id)
      .maybeSingle();

    if (lookupError || !notification) return Response.json({ error: 'Notification not found' }, { status: 404 });
    if (notification.status === 'sent') return Response.json({ error: 'Sent notifications cannot be cancelled' }, { status: 400 });

    const { error } = await supabase
      .from('platform_notifications')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (error) throw error;

    await createAuditLog({
      workspaceId: notification.workspace_id,
      actorUserId: user.id,
      action: 'platform_notification.cancelled',
      metadata: { notification_id: id },
    });

    return Response.json({ success: true });
  } catch (error) {
    return createPlatformErrorResponse(error, 'Unexpected notification cancel error');
  }
}
