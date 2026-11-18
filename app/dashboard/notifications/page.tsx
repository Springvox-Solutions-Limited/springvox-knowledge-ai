"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Check, Loader2 } from "lucide-react";

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

const FILTERS = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "maintenance", label: "Maintenance" },
  { value: "billing_reminder", label: "Billing" },
  { value: "announcement", label: "Announcements" },
  { value: "trial_notice", label: "Trial" },
  { value: "security_notice", label: "Security" },
];

const TYPE_LABEL: Record<string, string> = {
  maintenance: "Maintenance",
  billing_reminder: "Billing",
  announcement: "Announcement",
  trial_notice: "Trial",
  security_notice: "Security",
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DashboardNotificationsPage() {
  const [notifications, setNotifications] = useState<TenantNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = async (nextFilter = filter) => {
    try {
      setError(null);
      const token = await getAccessToken();
      if (!token) throw new Error("Missing bearer token");

      const params = new URLSearchParams();
      if (nextFilter !== "all" && nextFilter !== "unread") {
        params.set("type", nextFilter);
      }

      const response = await fetch(`/api/notifications?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to load notifications");

      setNotifications(result.notifications || []);
      setUnreadCount(result.unreadCount || 0);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void loadNotifications(filter);
    });
    return () => window.cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const notifyShell = () => {
    window.dispatchEvent(new Event("viewer:notifications-changed"));
  };

  const markRead = async (notificationId: string) => {
    try {
      setSavingId(notificationId);
      const token = await getAccessToken();
      if (!token) throw new Error("Missing bearer token");
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to mark notification as read");
      await loadNotifications(filter);
      notifyShell();
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
      if (!token) throw new Error("Missing bearer token");
      const response = await fetch("/api/notifications/read-all", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type: filter === "all" || filter === "unread" ? null : filter }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to mark notifications as read");
      await loadNotifications(filter);
      notifyShell();
    } catch (readError) {
      setError(readError instanceof Error ? readError.message : "Failed to mark notifications as read");
    } finally {
      setSavingId(null);
    }
  };

  const visible = useMemo(
    () => (filter === "unread" ? notifications.filter((item) => !item.is_read) : notifications),
    [filter, notifications],
  );

  return (
    <div className="mx-auto w-full max-w-[840px] px-5 pb-24 pt-6 sm:px-8 sm:pt-8 lg:pb-12">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--line)] pb-5">
        <div className="min-w-0">
          <h1 className="text-[24px] font-medium leading-8 tracking-[-0.02em] text-[var(--ink)]">
            Notifications
          </h1>
          <p className="mt-1 max-w-[56ch] text-[12px] leading-5 text-[var(--ink-muted)]">
            Maintenance, billing, trial, security, and workspace announcements.
          </p>
        </div>
        <button
          type="button"
          onClick={markAllRead}
          disabled={savingId === "all" || unreadCount === 0}
          className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-[var(--line)] px-2.5 text-[12px] text-[var(--ink-soft)] transition-colors hover:border-[var(--ink-muted)] hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {savingId === "all" ? (
            <Loader2 size={13} className="animate-spin motion-reduce:animate-none" />
          ) : (
            <Check size={13} />
          )}
          Mark all read
        </button>
      </header>

      <div className="mt-3 flex flex-wrap gap-1">
        {FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              setLoading(true);
              setFilter(option.value);
            }}
            aria-pressed={filter === option.value}
            className={cn(
              "h-8 rounded-[6px] px-2.5 text-[12px] transition-colors",
              filter === option.value
                ? "bg-[var(--surface)] text-[var(--ink)]"
                : "text-[var(--ink-muted)] hover:bg-[var(--canvas-soft)] hover:text-[var(--ink-soft)]",
            )}
          >
            {option.label}
            {option.value === "unread" && unreadCount > 0 ? (
              <span className="ml-1 text-[10px] text-[var(--accent-jade)]">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {error ? (
        <p role="alert" className="mt-4 text-[12px] leading-5 text-red-300">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="mt-6 space-y-2">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-14 rounded-[6px] bg-[var(--surface)] opacity-60" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="mt-14 flex flex-col items-center text-center">
          <span className="flex h-9 w-9 items-center justify-center rounded-[6px] border border-[var(--line)] bg-[var(--surface)]">
            <Bell size={15} strokeWidth={1.5} className="text-[var(--ink-muted)]" />
          </span>
          <p className="mt-3 text-[13px] font-medium text-[var(--ink)]">
            {filter === "unread" ? "No unread notifications" : "Nothing in the inbox"}
          </p>
          <p className="mt-1 max-w-[38ch] text-[12px] leading-5 text-[var(--ink-muted)]">
            Announcements and workspace notices will appear here.
          </p>
        </div>
      ) : (
        <ul className="mt-4">
          {visible.map((notification) => (
            <li
              key={notification.id}
              className={cn(
                "group border-b border-[var(--line)] py-3.5",
                !notification.is_read && "border-l-2 border-l-[var(--accent-jade)] pl-3",
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13px] font-medium text-[var(--ink)]">
                      {notification.title}
                    </p>
                    <span className="rounded-[3px] bg-[var(--surface)] px-1.5 py-0.5 text-[10px] text-[var(--ink-muted)]">
                      {TYPE_LABEL[notification.type] || notification.type}
                    </span>
                    {!notification.is_read ? (
                      <span className="h-1 w-1 rounded-full bg-[var(--accent-jade)]" aria-label="Unread" />
                    ) : null}
                  </div>
                  <p className="mt-1 max-w-[62ch] whitespace-pre-wrap text-[12px] leading-5 text-[var(--ink-soft)]">
                    {notification.message}
                  </p>
                  <p className="mt-1 text-[11px] text-[var(--ink-muted)]">
                    {formatDate(notification.created_at)}
                  </p>
                </div>

                {!notification.is_read ? (
                  <button
                    type="button"
                    onClick={() => markRead(notification.id)}
                    disabled={savingId === notification.id}
                    className="inline-flex h-8 shrink-0 items-center gap-1 rounded-[6px] px-2 text-[11px] text-[var(--ink-muted)] opacity-100 transition-colors hover:bg-[var(--surface)] hover:text-[var(--ink)] sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 disabled:opacity-40"
                  >
                    {savingId === notification.id ? (
                      <Loader2 size={10} className="animate-spin motion-reduce:animate-none" />
                    ) : null}
                    Mark read
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
