"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { fetchPlatformJson } from "@/src/lib/platform-client";
import { PlatformPageHeader } from "@/src/components/platform/PlatformPageHeader";
import { AppCard } from "@/src/components/ui/app-card";
import { AppButton } from "@/src/components/ui/app-button";
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

type AuditLog = {
  id: string;
  workspace_id: string | null;
  workspace_name: string | null;
  actor_email: string | null;
  target_email: string | null;
  action: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export default function PlatformAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [action, setAction] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const params = new URLSearchParams();
      if (action) params.set("action", action);
      if (workspaceId) params.set("workspaceId", workspaceId);
      if (targetUserId) params.set("targetUserId", targetUserId);
      if (from) params.set("from", new Date(from).toISOString());
      if (to) params.set("to", new Date(to).toISOString());
      const data = await fetchPlatformJson<{ logs: AuditLog[] }>(`/api/platform/audit-logs?${params.toString()}`);
      setLogs(data.logs || []);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    void load();
  }, []);

  return (
    <div className="admin-page">
      <PlatformPageHeader title="Audit Logs" subtitle="Review platform and workspace administration actions." />

      <ResponsiveToolbar className="xl:grid xl:grid-cols-5">
        <Input value={action} onChange={(event) => setAction(event.target.value)} placeholder="Action contains..." className="h-12 rounded-xl border-[var(--line)]" />
        <Input value={workspaceId} onChange={(event) => setWorkspaceId(event.target.value)} placeholder="Workspace ID" className="h-12 rounded-xl border-[var(--line)]" />
        <Input value={targetUserId} onChange={(event) => setTargetUserId(event.target.value)} placeholder="Target user ID" className="h-12 rounded-xl border-[var(--line)]" />
        <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="h-12 rounded-xl border-[var(--line)]" />
        <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="h-12 rounded-xl border-[var(--line)]" />
      </ResponsiveToolbar>
      <div className="flex justify-end">
        <AppButton tone="secondary" onClick={load} className="h-10 px-4 text-xs">Apply filters</AppButton>
      </div>

      {error ? <Alert className="border-red-500/30 bg-red-500/10 text-red-300"><AlertDescription>{error}</AlertDescription></Alert> : null}

      <OverflowGuard mode="scroll">
        <AppCard className="overflow-hidden">
          <AppTable className="min-w-[980px]">
            <AppTableHeader>
              <AppTableRow>
                {["Date", "Actor", "Workspace", "Target", "Action", "Metadata"].map((column) => <AppTableHead key={column}>{column}</AppTableHead>)}
              </AppTableRow>
            </AppTableHeader>
            <AppTableBody>
              {loading ? (
                <AppTableRow><AppTableCell colSpan={6} className="py-12 text-center text-sm text-[var(--ink-muted)]">Loading audit logs...</AppTableCell></AppTableRow>
              ) : logs.length === 0 ? (
                <AppTableRow><AppTableCell colSpan={6} className="py-12 text-center text-sm text-[var(--ink-muted)]">No audit logs found.</AppTableCell></AppTableRow>
              ) : logs.map((log) => (
                <AppTableRow key={log.id}>
                  <AppTableCell className="text-sm text-[var(--ink-soft)]">{new Date(log.created_at).toLocaleString()}</AppTableCell>
                  <AppTableCell className="max-w-[14rem] truncate text-sm text-[var(--ink-soft)]" title={log.actor_email || ""}>{log.actor_email || "System"}</AppTableCell>
                  <AppTableCell className="max-w-[14rem] truncate text-sm text-[var(--ink-soft)]" title={log.workspace_name || ""}>{log.workspace_name || log.workspace_id || "Global"}</AppTableCell>
                  <AppTableCell className="max-w-[14rem] truncate text-sm text-[var(--ink-soft)]" title={log.target_email || ""}>{log.target_email || "None"}</AppTableCell>
                  <AppTableCell className="text-sm font-semibold text-[var(--ink)]">{log.action}</AppTableCell>
                  <AppTableCell className="max-w-[24rem] truncate text-xs text-[var(--ink-muted)]" title={JSON.stringify(log.metadata)}>{JSON.stringify(log.metadata)}</AppTableCell>
                </AppTableRow>
              ))}
            </AppTableBody>
          </AppTable>
        </AppCard>
      </OverflowGuard>
    </div>
  );
}
