import 'server-only';

import { getSupabaseAdmin } from '@/src/lib/supabase-server';
import type { UserProfile } from '@/src/lib/workspace';

export const NOTIFICATION_TYPES = [
  'maintenance',
  'billing_reminder',
  'announcement',
  'trial_notice',
  'security_notice',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export type TenantNotification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  channel: 'in_app' | 'both';
  created_at: string;
  read_at: string | null;
  is_read: boolean;
};

type NotificationRow = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  channel: 'in_app' | 'both';
  created_at: string;
};

export async function getTenantNotifications({
  userId,
  profile,
  type,
  limit,
  unreadOnly,
}: {
  userId: string;
  profile: UserProfile;
  type?: string | null;
  limit?: number;
  unreadOnly?: boolean;
}) {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const safeType = type && NOTIFICATION_TYPES.includes(type as NotificationType) ? type : null;

  let query = supabase
    .from('platform_notifications')
    .select('id, type, title, message, channel, created_at')
    .or(`workspace_id.is.null,workspace_id.eq.${profile.workspace_id}`)
    .in('channel', ['in_app', 'both'])
    .eq('status', 'sent')
    .or(`scheduled_for.is.null,scheduled_for.lte.${now}`)
    .order('created_at', { ascending: false });

  if (safeType) {
    query = query.eq('type', safeType);
  }

  const { data, error } = await query.limit(100);
  if (error) {
    throw error;
  }

  const rows = (data || []) as NotificationRow[];
  const notificationIds = rows.map((notification) => notification.id);
  const readAtByNotificationId = new Map<string, string>();

  if (notificationIds.length > 0) {
    const { data: reads, error: readsError } = await supabase
      .from('user_notification_reads')
      .select('notification_id, read_at')
      .eq('user_id', userId)
      .in('notification_id', notificationIds);

    if (readsError) {
      throw readsError;
    }

    for (const read of reads || []) {
      readAtByNotificationId.set(read.notification_id, read.read_at);
    }
  }

  const allNotifications = rows.map<TenantNotification>((notification) => {
    const readAt = readAtByNotificationId.get(notification.id) || null;

    return {
      ...notification,
      read_at: readAt,
      is_read: Boolean(readAt),
    };
  });

  const unreadCount = allNotifications.filter((notification) => !notification.is_read).length;
  const filteredNotifications = unreadOnly
    ? allNotifications.filter((notification) => !notification.is_read)
    : allNotifications;

  return {
    notifications: typeof limit === 'number' ? filteredNotifications.slice(0, limit) : filteredNotifications,
    unreadCount,
  };
}

export async function markTenantNotificationRead({
  userId,
  profile,
  notificationId,
}: {
  userId: string;
  profile: UserProfile;
  notificationId: string;
}) {
  const { notifications } = await getTenantNotifications({ userId, profile });
  const notification = notifications.find((item) => item.id === notificationId);

  if (!notification) {
    throw new Error('Notification not found');
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('user_notification_reads')
    .upsert(
      {
        notification_id: notificationId,
        user_id: userId,
        read_at: new Date().toISOString(),
      },
      { onConflict: 'notification_id,user_id' },
    );

  if (error) {
    throw error;
  }
}

export async function markAllTenantNotificationsRead({
  userId,
  profile,
  type,
}: {
  userId: string;
  profile: UserProfile;
  type?: string | null;
}) {
  const { notifications } = await getTenantNotifications({ userId, profile, type });
  const unreadNotifications = notifications.filter((notification) => !notification.is_read);

  if (unreadNotifications.length === 0) {
    return { marked: 0 };
  }

  const now = new Date().toISOString();
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('user_notification_reads').upsert(
    unreadNotifications.map((notification) => ({
      notification_id: notification.id,
      user_id: userId,
      read_at: now,
    })),
    { onConflict: 'notification_id,user_id' },
  );

  if (error) {
    throw error;
  }

  return { marked: unreadNotifications.length };
}
