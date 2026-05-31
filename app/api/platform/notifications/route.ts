import { createAuditLog } from '@/src/lib/audit-log';
import { requirePlatformAdminRequest, createPlatformErrorResponse } from '@/src/lib/platform-api';
import { getSupabaseAdmin } from '@/src/lib/supabase-server';
import { inngest } from '@/src/lib/inngest/client';

const TYPES = ['maintenance', 'billing_reminder', 'announcement', 'trial_notice', 'security_notice'];
const CHANNELS = ['in_app', 'email', 'both'];

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await requirePlatformAdminRequest(req);
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('platform_notifications')
      .select('id, workspace_id, type, title, message, channel, status, scheduled_for, sent_at, metadata, created_at, workspaces(name, slug)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return Response.json({ notifications: data || [] });
  } catch (error) {
    return createPlatformErrorResponse(error, 'Unexpected notifications error');
  }
}

export async function POST(req: Request) {
  try {
    const { user } = await requirePlatformAdminRequest(req);
    const body = await req.json();
    const workspaceId = typeof body.workspaceId === 'string' && body.workspaceId !== 'all' ? body.workspaceId : null;
    const type = typeof body.type === 'string' ? body.type : '';
    const channel = typeof body.channel === 'string' ? body.channel : 'in_app';
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const scheduledFor = typeof body.scheduledFor === 'string' && body.scheduledFor ? body.scheduledFor : null;

    if (!TYPES.includes(type)) return Response.json({ error: 'Invalid notification type' }, { status: 400 });
    if (!CHANNELS.includes(channel)) return Response.json({ error: 'Invalid notification channel' }, { status: 400 });
    if (!title || !message) return Response.json({ error: 'Title and message are required' }, { status: 400 });
    if (scheduledFor && Number.isNaN(new Date(scheduledFor).getTime())) {
      return Response.json({ error: 'Invalid scheduled date' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (workspaceId) {
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .select('id')
        .eq('id', workspaceId)
        .maybeSingle();
      if (workspaceError || !workspace) return Response.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const emailProviderConfigured = Boolean(process.env.RESEND_API_KEY);
    const sendInAppImmediately =
      !scheduledFor && (channel === 'in_app' || (channel === 'both' && !emailProviderConfigured));
    const { data: notification, error } = await supabase
      .from('platform_notifications')
      .insert({
        workspace_id: workspaceId,
        created_by: user.id,
        type,
        title,
        message,
        channel,
        scheduled_for: scheduledFor,
        status: scheduledFor ? 'queued' : sendInAppImmediately ? 'sent' : 'queued',
        sent_at: sendInAppImmediately ? new Date().toISOString() : null,
        metadata: {
          email_provider_configured: emailProviderConfigured,
          email_delivery: channel === 'in_app' ? 'not_requested' : emailProviderConfigured ? 'queued' : 'skipped_no_provider',
        },
      })
      .select('id')
      .single();

    if (error || !notification) throw error || new Error('Notification could not be saved');

    await createAuditLog({
      workspaceId,
      actorUserId: user.id,
      action: 'platform_notification.created',
      metadata: { notification_id: notification.id, type, channel, scheduled_for: scheduledFor },
    });

    if (!scheduledFor && (channel === 'email' || channel === 'both') && emailProviderConfigured) {
      await inngest.send({ name: 'platform/notification.send', data: { notificationId: notification.id } });
    }

    return Response.json({
      success: true,
      notificationId: notification.id,
      message:
        channel !== 'in_app' && !emailProviderConfigured
          ? 'Notification saved. Email delivery is skipped because Resend is not configured.'
          : 'Notification saved.',
    });
  } catch (error) {
    return createPlatformErrorResponse(error, 'Unexpected notification create error');
  }
}
