"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AppButton } from "@/src/components/ui/app-button";
import { EmptyState } from "@/src/components/ui/empty-state";
import { PlatformPageHeader } from "@/src/components/platform/PlatformPageHeader";
import { fetchPlatformJson } from "@/src/lib/platform-client";
import { cn } from "@/src/lib/utils";

type WorkspaceOption = { id: string; name: string; slug: string };
type NotificationRow = {
  id: string;
  workspace_id: string | null;
  type: string;
  title: string;
  message: string;
  channel: string;
  status: string;
  scheduled_for: string | null;
  sent_at: string | null;
  created_at: string;
  workspaces?: { name: string; slug: string } | null;
};

const TYPES = [
  "maintenance",
  "billing_reminder",
  "announcement",
  "trial_notice",
  "security_notice",
];
const CHANNELS = ["in_app", "email", "both"];

const controlClass =
  "h-9 w-full rounded-lg border border-[var(--line)] bg-[var(--canvas-soft)] px-2.5 text-[12px] text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--ink-muted)] [color-scheme:dark] focus:border-[var(--accent-jade)] focus:ring-2 focus:ring-[var(--accent-jade-100)]";

const fieldLabelClass =
  "mb-1 block text-[10px] font-medium text-[var(--ink-muted)]";

const STATUS_STYLES: Record<string, string> = {
  queued: "bg-amber-400",
  sent: "bg-emerald-400",
  failed: "bg-red-400",
  cancelled: "bg-[var(--ink-muted)]",
};

export default function PlatformNotificationsPage() {
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([]);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [workspaceId, setWorkspaceId] = useState("all");
  const [type, setType] = useState("announcement");
  const [channel, setChannel] = useState("in_app");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const [workspaceData, notificationData] = await Promise.all([
      fetchPlatformJson<{ workspaces: WorkspaceOption[] }>(
        "/api/platform/workspaces",
      ),
      fetchPlatformJson<{ notifications: NotificationRow[] }>(
        "/api/platform/notifications",
      ),
    ]);
    setWorkspaces(workspaceData.workspaces || []);
    setNotifications(notificationData.notifications || []);
  };

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void load()
        .catch((loadError) => {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load notifications",
          );
        })
        .finally(() => setLoading(false));
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const sendNotification = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError(null);
      const response = await fetchPlatformJson<{ message: string }>(
        "/api/platform/notifications",
        {
          method: "POST",
          body: JSON.stringify({
            workspaceId,
            type,
            channel,
            title,
            message,
            scheduledFor: scheduledFor
              ? new Date(scheduledFor).toISOString()
              : null,
          }),
        },
      );
      setNotice(response.message || "Notification saved.");
      setTitle("");
      setMessage("");
      setScheduledFor("");
      await load();
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : "Failed to save notification",
      );
    } finally {
      setSaving(false);
    }
  };

  const cancelNotification = async (id: string) => {
    try {
      await fetchPlatformJson(`/api/platform/notifications/${id}/cancel`, {
        method: "PATCH",
      });
      await load();
    } catch (cancelError) {
      setError(
        cancelError instanceof Error
          ? cancelError.message
          : "Failed to cancel notification",
      );
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await fetchPlatformJson(`/api/platform/notifications/${id}`, {
        method: "DELETE",
      });
      await load();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete notification",
      );
    }
  };

  return (
    <div className="admin-page" aria-busy={loading || saving}>
      <PlatformPageHeader
        title="Notifications"
        subtitle="Send workspace or global notices through in-app and email channels."
        aside={
          <span className="text-[11px] tabular-nums text-[var(--ink-muted)]">
            {notifications.length} notifications
          </span>
        }
      />

      {error ? (
        <div className="rounded-[10px] border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-300">
          {error}
        </div>
      ) : null}
      {notice ? (
        <div className="rounded-[10px] border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-300">
          {notice}
        </div>
      ) : null}

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(320px,380px)_minmax(0,1fr)]">
        <section className="admin-shell-card overflow-hidden">
          <div className="border-b border-[var(--line)] px-4 py-2.5">
            <h2 className="text-[13px] font-semibold text-[var(--ink)]">
              Compose
            </h2>
            <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">
              Send now or schedule for later.
            </p>
          </div>
          <form onSubmit={sendNotification} className="space-y-3 p-4">
            <div>
              <span className={fieldLabelClass}>Target workspace</span>
              <Select value={workspaceId} onValueChange={setWorkspaceId}>
                <SelectTrigger
                  aria-label="Target workspace"
                  className="h-9 w-full rounded-lg border-[var(--line)] bg-[var(--canvas-soft)] px-2.5 text-[12px] text-[var(--ink)]"
                >
                  <SelectValue placeholder="Target workspace" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-[12px]">
                    All workspaces
                  </SelectItem>
                  {workspaces.map((workspace) => (
                    <SelectItem
                      key={workspace.id}
                      value={workspace.id}
                      className="text-[12px]"
                    >
                      {workspace.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <span className={fieldLabelClass}>Type</span>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger
                    aria-label="Notification type"
                    className="h-9 w-full rounded-lg border-[var(--line)] bg-[var(--canvas-soft)] px-2.5 text-[12px] text-[var(--ink)]"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES.map((item) => (
                      <SelectItem
                        key={item}
                        value={item}
                        className="text-[12px]"
                      >
                        {sentenceCase(item)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <span className={fieldLabelClass}>Channel</span>
                <Select value={channel} onValueChange={setChannel}>
                  <SelectTrigger
                    aria-label="Notification channel"
                    className="h-9 w-full rounded-lg border-[var(--line)] bg-[var(--canvas-soft)] px-2.5 text-[12px] text-[var(--ink)]"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHANNELS.map((item) => (
                      <SelectItem
                        key={item}
                        value={item}
                        className="text-[12px]"
                      >
                        {channelLabel(item)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label
                htmlFor="notification-schedule"
                className={fieldLabelClass}
              >
                Schedule for
              </label>
              <input
                id="notification-schedule"
                type="datetime-local"
                value={scheduledFor}
                onChange={(event) => setScheduledFor(event.target.value)}
                className={controlClass}
              />
              <p className="mt-1 text-[10px] text-[var(--ink-muted)]">
                Leave empty to send or queue immediately.
              </p>
            </div>

            <div>
              <label htmlFor="notification-title" className={fieldLabelClass}>
                Title
              </label>
              <input
                id="notification-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Notification title"
                required
                className={controlClass}
              />
            </div>

            <div>
              <label htmlFor="notification-message" className={fieldLabelClass}>
                Message
              </label>
              <Textarea
                id="notification-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Write a clear, professional message..."
                required
                className="min-h-24 rounded-lg border-[var(--line)] bg-[var(--canvas-soft)] px-2.5 py-2 text-[13px] leading-5 text-[var(--ink)] focus-visible:border-[var(--accent-jade)] focus-visible:ring-2 focus-visible:ring-[var(--accent-jade-100)]"
              />
            </div>

            <div className="flex items-center justify-end pt-1">
              <AppButton
                type="submit"
                tone="primary"
                disabled={saving}
                className="h-9 px-3 text-[12px]"
              >
                {saving ? "Saving..." : "Send now / queue"}
              </AppButton>
            </div>
          </form>
        </section>

        <section className="admin-shell-card min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-2.5">
            <div>
              <h2 className="text-[13px] font-semibold text-[var(--ink)]">
                Sent history
              </h2>
              <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">
                Queued, sent, and cancelled notices.
              </p>
            </div>
            <span className="text-[11px] tabular-nums text-[var(--ink-muted)]">
              {loading ? "Loading" : `${notifications.length} shown`}
            </span>
          </div>

          {loading ? (
            <div className="px-4 py-10 text-center text-[12px] text-[var(--ink-muted)]">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No notifications yet"
              description="Composed notices appear here with their delivery status."
              className="rounded-none border-0 bg-transparent py-12"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead>
                  <tr className="border-b border-[var(--line)] text-[11px] text-[var(--ink-muted)]">
                    <th className="px-4 py-2 font-medium">Title</th>
                    <th className="px-3 py-2 font-medium">Target</th>
                    <th className="px-3 py-2 font-medium">Type</th>
                    <th className="px-3 py-2 font-medium">Channel</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Created</th>
                    <th className="px-4 py-2 text-right font-medium">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-[var(--line-soft)] transition-colors last:border-0 hover:bg-[var(--canvas-soft)]"
                    >
                      <td className="h-11 max-w-[18rem] px-4 py-1.5 align-middle">
                        <p
                          className="truncate text-[12px] font-medium text-[var(--ink)]"
                          title={item.title}
                        >
                          {item.title}
                        </p>
                        <p
                          className="truncate text-[11px] text-[var(--ink-muted)]"
                          title={item.message}
                        >
                          {item.message}
                        </p>
                      </td>
                      <td className="h-11 max-w-[12rem] px-3 py-1.5 align-middle">
                        <span className="block truncate text-[12px] text-[var(--ink-soft)]">
                          {item.workspaces?.name || "All workspaces"}
                        </span>
                      </td>
                      <td className="h-11 px-3 py-1.5 align-middle text-[12px] text-[var(--ink-soft)]">
                        {sentenceCase(item.type)}
                      </td>
                      <td className="h-11 px-3 py-1.5 align-middle text-[12px] text-[var(--ink-soft)]">
                        {channelLabel(item.channel)}
                      </td>
                      <td className="h-11 px-3 py-1.5 align-middle">
                        <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--ink-soft)]">
                          <span
                            aria-hidden="true"
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              STATUS_STYLES[item.status] ??
                                "bg-[var(--ink-muted)]",
                            )}
                          />
                          {sentenceCase(item.status)}
                        </span>
                      </td>
                      <td className="h-11 px-3 py-1.5 align-middle">
                        <span className="whitespace-nowrap font-mono text-[11px] tabular-nums text-[var(--ink-muted)]">
                          {formatDate(item.created_at)}
                        </span>
                      </td>
                      <td className="h-11 px-4 py-1.5 align-middle">
                        <div className="flex justify-end gap-1.5">
                          {item.status === "queued" ? (
                            <AppButton
                              tone="secondary"
                              className="h-7 px-2 text-[11px]"
                              onClick={() => cancelNotification(item.id)}
                            >
                              Cancel
                            </AppButton>
                          ) : null}
                          <AppButton
                            tone="destructive"
                            className="h-7 px-2 text-[11px]"
                            onClick={() => deleteNotification(item.id)}
                          >
                            Delete
                          </AppButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function channelLabel(value: string) {
  if (value === "in_app") return "In app";
  if (value === "both") return "Both";
  return sentenceCase(value);
}

function sentenceCase(value: string) {
  if (!value) return "";
  const text = value.replaceAll("_", " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
