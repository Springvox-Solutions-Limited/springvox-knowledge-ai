"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchPlatformJson } from "@/src/lib/platform-client";
import { PlatformPageHeader } from "@/src/components/platform/PlatformPageHeader";
import { AppButton } from "@/src/components/ui/app-button";
import { AppCard } from "@/src/components/ui/app-card";
import { ResponsiveToolbar } from "@/src/components/layout/ResponsiveToolbar";
import { OverflowGuard } from "@/src/components/layout/OverflowGuard";
import {
  AppTable,
  AppTableBody,
  AppTableCell,
  AppTableHead,
  AppTableHeader,
  AppTableRow,
} from "@/src/components/ui/app-table";

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

const TYPES = ["maintenance", "billing_reminder", "announcement", "trial_notice", "security_notice"];
const CHANNELS = ["in_app", "email", "both"];

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
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const [workspaceData, notificationData] = await Promise.all([
      fetchPlatformJson<{ workspaces: WorkspaceOption[] }>("/api/platform/workspaces"),
      fetchPlatformJson<{ notifications: NotificationRow[] }>("/api/platform/notifications"),
    ]);
    setWorkspaces(workspaceData.workspaces || []);
    setNotifications(notificationData.notifications || []);
  };

  useEffect(() => {
    void load().catch((loadError) =>
      setError(loadError instanceof Error ? loadError.message : "Failed to load notifications"),
    );
  }, []);

  const sendNotification = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError(null);
      const response = await fetchPlatformJson<{ message: string }>("/api/platform/notifications", {
        method: "POST",
        body: JSON.stringify({
          workspaceId,
          type,
          channel,
          title,
          message,
          scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : null,
        }),
      });
      setNotice(response.message || "Notification saved.");
      setTitle("");
      setMessage("");
      setScheduledFor("");
      await load();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Failed to save notification");
    } finally {
      setSaving(false);
    }
  };

  const cancelNotification = async (id: string) => {
    try {
      await fetchPlatformJson(`/api/platform/notifications/${id}/cancel`, { method: "PATCH" });
      await load();
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : "Failed to cancel notification");
    }
  };

  return (
    <div className="admin-page">
      <PlatformPageHeader title="Notifications" subtitle="Send workspace or global notices through in-app and email channels." />

      {error ? <Alert className="border-red-500/30 bg-red-500/10 text-red-300"><AlertDescription>{error}</AlertDescription></Alert> : null}
      {notice ? <Alert className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300"><AlertDescription>{notice}</AlertDescription></Alert> : null}

      <AppCard className="p-5">
        <form onSubmit={sendNotification} className="space-y-4">
          <ResponsiveToolbar className="xl:grid xl:grid-cols-4">
            <Select value={workspaceId} onValueChange={setWorkspaceId}>
              <SelectTrigger className="h-12 rounded-xl border-[var(--line)]"><SelectValue placeholder="Target workspace" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All workspaces</SelectItem>
                {workspaces.map((workspace) => <SelectItem key={workspace.id} value={workspace.id}>{workspace.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-12 rounded-xl border-[var(--line)]"><SelectValue /></SelectTrigger>
              <SelectContent>{TYPES.map((item) => <SelectItem key={item} value={item}>{item.replaceAll("_", " ")}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger className="h-12 rounded-xl border-[var(--line)]"><SelectValue /></SelectTrigger>
              <SelectContent>{CHANNELS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
            </Select>
            <Input type="datetime-local" value={scheduledFor} onChange={(event) => setScheduledFor(event.target.value)} className="h-12 rounded-xl border-[var(--line)]" />
          </ResponsiveToolbar>
          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Notification title" required className="h-12 rounded-xl border-[var(--line)]" />
          <Textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write a clear, professional message..." required className="min-h-28 rounded-xl border-[var(--line)]" />
          <AppButton type="submit" disabled={saving}>{saving ? "Saving..." : "Send now / queue"}</AppButton>
        </form>
      </AppCard>

      <OverflowGuard mode="scroll">
        <AppCard className="overflow-hidden">
          <AppTable className="min-w-[980px]">
            <AppTableHeader>
              <AppTableRow>{["Title", "Target", "Type", "Channel", "Status", "Created", "Actions"].map((column) => <AppTableHead key={column}>{column}</AppTableHead>)}</AppTableRow>
            </AppTableHeader>
            <AppTableBody>
              {notifications.length === 0 ? (
                <AppTableRow><AppTableCell colSpan={7} className="py-12 text-center text-sm text-[var(--ink-muted)]">No notifications yet.</AppTableCell></AppTableRow>
              ) : notifications.map((item) => (
                <AppTableRow key={item.id}>
                  <AppTableCell className="max-w-[18rem]"><p className="truncate font-semibold text-[var(--ink)]">{item.title}</p><p className="truncate text-xs text-[var(--ink-muted)]">{item.message}</p></AppTableCell>
                  <AppTableCell className="text-sm text-[var(--ink-soft)]">{item.workspaces?.name || "All workspaces"}</AppTableCell>
                  <AppTableCell className="text-sm text-[var(--ink-soft)]">{item.type}</AppTableCell>
                  <AppTableCell className="text-sm text-[var(--ink-soft)]">{item.channel}</AppTableCell>
                  <AppTableCell className="text-sm text-[var(--ink-soft)]">{item.status}</AppTableCell>
                  <AppTableCell className="text-sm text-[var(--ink-soft)]">{new Date(item.created_at).toLocaleDateString()}</AppTableCell>
                  <AppTableCell>{item.status === "queued" ? <AppButton tone="destructive" className="h-8 px-3 text-xs" onClick={() => cancelNotification(item.id)}>Cancel</AppButton> : <span className="text-xs text-[var(--ink-muted)]">No action</span>}</AppTableCell>
                </AppTableRow>
              ))}
            </AppTableBody>
          </AppTable>
        </AppCard>
      </OverflowGuard>
    </div>
  );
}
