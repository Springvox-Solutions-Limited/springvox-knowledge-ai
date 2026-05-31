"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Check, Inbox } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppButton } from "@/src/components/ui/app-button";
import { AppCard } from "@/src/components/ui/app-card";
import { EmptyState } from "@/src/components/ui/empty-state";
import { getAccessToken } from "@/src/lib/auth-client";
import { cn } from "@/src/lib/utils";

type NotificationType =
  | "maintenance"
  | "billing_reminder"
  | "announcement"
  | "trial_notice"
  | "security_notice";

type TenantNotification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  created_at: string;
  read_at: string | null;
  is_read: boolean;
};

const typeOptions = [
  { value: "all", label: "All types" },
  { value: "maintenance", label: "Maintenance" },
  { value: "billing_reminder", label: "Billing" },
  { value: "announcement", label: "Announcements" },
  { value: "trial_notice", label: "Trial" },
  { value: "security_notice", label: "Security" },
];

export default function DashboardNotificationsPage() {
  const [notifications, setNotifications] = useState<TenantNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = async () => {
    try {
      setError(null);
      const token = await getAccessToken();
      if (!token) {
        throw new Error("Missing bearer token");
      }

      const params = new URLSearchParams();
      if (typeFilter !== "all") {
        params.set("type", typeFilter);
      }

      const response = await fetch(`/api/notifications?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load notifications");
      }

      setNotifications(result.notifications || []);
      setUnreadCount(result.unreadCount || 0);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadNotifications();
  }, [typeFilter]);

  const markRead = async (notificationId: string) => {
    try {
      setSavingId(notificationId);
      const token = await getAccessToken();
      if (!token) {
        throw new Error("Missing bearer token");
      }

      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to mark notification as read");
      }

      await loadNotifications();
    } catch (readError) {
      setError(readError instanceof Error ? readError.message : "Failed to mark notification as read");
    } finally {
      setSavingId(null);
    }
  };

  const markAllRead = async () => {
    try {
      setSavingId("all");
      const token = await getAccessToken();
      if (!token) {
        throw new Error("Missing bearer token");
      }

      const response = await fetch("/api/notifications/read-all", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: typeFilter === "all" ? null : typeFilter,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to mark notifications as read");
      }

      await loadNotifications();
    } catch (readError) {
      setError(readError instanceof Error ? readError.message : "Failed to mark notifications as read");
    } finally {
      setSavingId(null);
    }
  };

  const filteredUnreadCount = useMemo(
    () => notifications.filter((notification) => !notification.is_read).length,
    [notifications],
  );

  return (
    <div className="admin-page">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-700">
            Workspace Notices
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            Notifications
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Review SpringVox announcements, maintenance notes, billing reminders, and security updates for your workspace.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white px-4 text-sm shadow-sm focus-visible:border-cyan-400 focus-visible:ring-cyan-100 sm:w-52">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200">
              {typeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <AppButton
            tone="secondary"
            onClick={markAllRead}
            disabled={savingId === "all" || filteredUnreadCount === 0}
            className="h-11"
          >
            <Check size={16} />
            Mark all read
          </AppButton>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <AppCard className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Unread
          </p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{unreadCount}</p>
        </AppCard>
        <AppCard className="p-5 sm:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Notification scope
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            This center includes notifications sent directly to your workspace and global SpringVox notices.
          </p>
        </AppCard>
      </div>

      {error ? (
        <Alert className="rounded-2xl border-red-200 bg-red-50 text-red-700">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-3">
        {loading ? (
          <AppCard className="p-6 text-sm text-slate-500">Loading notifications...</AppCard>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No notifications yet"
            description="Workspace and global notices from SpringVox will appear here."
          />
        ) : (
          notifications.map((notification) => (
            <AppCard
              key={notification.id}
              className={cn(
                "p-5 transition",
                !notification.is_read && "border-cyan-200 bg-cyan-50/30",
              )}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn(
                      "rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]",
                      getNotificationTypeClass(notification.type),
                    )}>
                      {formatNotificationType(notification.type)}
                    </span>
                    {!notification.is_read ? (
                      <span className="rounded-full bg-cyan-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                        Unread
                      </span>
                    ) : (
                      <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                        Read
                      </span>
                    )}
                    <span className="text-xs font-medium text-slate-400">
                      {formatDate(notification.created_at)}
                    </span>
                  </div>
                  <h2 className="mt-3 text-base font-semibold text-slate-950">
                    {notification.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {notification.message}
                  </p>
                </div>
                {!notification.is_read ? (
                  <AppButton
                    tone="secondary"
                    onClick={() => markRead(notification.id)}
                    disabled={savingId === notification.id}
                    className="h-10 shrink-0 text-xs"
                  >
                    <Bell size={15} />
                    Mark read
                  </AppButton>
                ) : null}
              </div>
            </AppCard>
          ))
        )}
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatNotificationType(type: string) {
  return type.replace(/_/g, " ");
}

function getNotificationTypeClass(type: string) {
  if (type === "maintenance") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (type === "billing_reminder" || type === "trial_notice") {
    return "border-cyan-200 bg-cyan-50 text-cyan-700";
  }

  if (type === "security_notice") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-slate-200 bg-white text-slate-600";
}
