"use client";

import { useEffect, useState } from "react";
import { ScrollText } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AppButton } from "@/src/components/ui/app-button";
import { EmptyState } from "@/src/components/ui/empty-state";
import { PlatformPageHeader } from "@/src/components/platform/PlatformPageHeader";
import { fetchPlatformJson } from "@/src/lib/platform-client";
import { cn } from "@/src/lib/utils";

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

const inputClass =
  "h-9 w-full rounded-lg border border-[var(--line)] bg-[var(--canvas-soft)] px-2.5 text-[12px] text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--ink-muted)] [color-scheme:dark] focus:border-[var(--accent-jade)] focus:ring-2 focus:ring-[var(--accent-jade-100)]";

const labelClass = "block text-[10px] font-medium text-[var(--ink-muted)]";

export default function PlatformAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [action, setAction] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AuditLog | null>(null);

  const load = async () => {
    try {
      const params = new URLSearchParams();
      if (action) params.set("action", action);
      if (workspaceId) params.set("workspaceId", workspaceId);
      if (targetUserId) params.set("targetUserId", targetUserId);
      if (from) params.set("from", new Date(from).toISOString());
      if (to) params.set("to", new Date(to).toISOString());
      const data = await fetchPlatformJson<{ logs: AuditLog[] }>(
        `/api/platform/audit-logs?${params.toString()}`,
      );
      setLogs(data.logs || []);
      setError(null);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load audit logs",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setLoading(true);
      void load();
    });
    return () => window.cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    void load();
  };

  return (
    <div className="admin-page" aria-busy={loading}>
      <PlatformPageHeader
        title="Audit logs"
        subtitle="Review platform and workspace administration actions."
        aside={
          <span className="text-[11px] tabular-nums text-[var(--ink-muted)]">
            {logs.length} events
          </span>
        }
      />

      {error ? (
        <div className="rounded-[10px] border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-300">
          {error}
        </div>
      ) : null}

      <section className="admin-shell-card">
        <form
          onSubmit={applyFilters}
          className="grid items-end gap-2 p-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)_150px_150px_auto]"
        >
          <label className="space-y-1">
            <span className={labelClass}>Action</span>
            <input
              value={action}
              onChange={(event) => setAction(event.target.value)}
              placeholder="Contains..."
              className={inputClass}
            />
          </label>
          <label className="space-y-1">
            <span className={labelClass}>Workspace</span>
            <input
              value={workspaceId}
              onChange={(event) => setWorkspaceId(event.target.value)}
              placeholder="Workspace ID"
              className={inputClass}
            />
          </label>
          <label className="space-y-1">
            <span className={labelClass}>Target user</span>
            <input
              value={targetUserId}
              onChange={(event) => setTargetUserId(event.target.value)}
              placeholder="User ID"
              className={inputClass}
            />
          </label>
          <label className="space-y-1">
            <span className={labelClass}>From</span>
            <input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              aria-label="From date"
              className={inputClass}
            />
          </label>
          <label className="space-y-1">
            <span className={labelClass}>To</span>
            <input
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              aria-label="To date"
              className={inputClass}
            />
          </label>
          <AppButton
            type="submit"
            tone="primary"
            disabled={loading}
            className="h-9 px-3 text-[12px]"
          >
            {loading ? "Loading..." : "Apply filters"}
          </AppButton>
        </form>
      </section>

      <section className="admin-shell-card overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-2.5">
          <div>
            <h2 className="text-[13px] font-semibold text-[var(--ink)]">
              Events
            </h2>
            <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">
              Most recent administration actions first.
            </p>
          </div>
          <span className="text-[11px] tabular-nums text-[var(--ink-muted)]">
            {loading ? "Loading" : `${logs.length} shown`}
          </span>
        </div>

        {loading ? (
          <div className="px-4 py-10 text-center text-[12px] text-[var(--ink-muted)]">
            Loading audit logs...
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title="No audit logs found"
            description="Administration actions will appear here once they are recorded."
            className="rounded-none border-0 bg-transparent py-12"
          />
        ) : (
          <div className="max-h-[calc(100dvh-21rem)] min-h-[200px] overflow-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead className="sticky top-0 z-10 bg-[var(--canvas-soft)]">
                <tr className="border-b border-[var(--line)] text-[11px] text-[var(--ink-muted)]">
                  <th className="px-4 py-2 font-medium">Time</th>
                  <th className="px-3 py-2 font-medium">Actor</th>
                  <th className="px-3 py-2 font-medium">Workspace</th>
                  <th className="px-3 py-2 font-medium">Target</th>
                  <th className="px-3 py-2 font-medium">Action</th>
                  <th className="px-3 py-2 font-medium">Metadata</th>
                  <th className="px-4 py-2 text-right font-medium">
                    <span className="sr-only">Details</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-[var(--line-soft)] transition-colors last:border-0 hover:bg-[var(--canvas-soft)]"
                  >
                    <td className="h-10 px-4 py-2 align-middle">
                      <span
                        className="whitespace-nowrap font-mono text-[11px] tabular-nums text-[var(--ink-soft)]"
                        title={formatFullDate(log.created_at)}
                      >
                        {formatEventDate(log.created_at)}
                      </span>
                    </td>
                    <td className="h-10 max-w-[13rem] px-3 py-2 align-middle">
                      <span
                        className="block truncate text-[12px] text-[var(--ink-soft)]"
                        title={log.actor_email || ""}
                      >
                        {log.actor_email || "System"}
                      </span>
                    </td>
                    <td className="h-10 max-w-[13rem] px-3 py-2 align-middle">
                      <span
                        className="block truncate text-[12px] text-[var(--ink-soft)]"
                        title={log.workspace_name || log.workspace_id || ""}
                      >
                        {log.workspace_name || log.workspace_id || "Global"}
                      </span>
                    </td>
                    <td className="h-10 max-w-[13rem] px-3 py-2 align-middle">
                      <span
                        className="block truncate text-[12px] text-[var(--ink-soft)]"
                        title={log.target_email || ""}
                      >
                        {log.target_email || "None"}
                      </span>
                    </td>
                    <td className="h-10 max-w-[16rem] px-3 py-2 align-middle">
                      <span
                        className="block truncate font-mono text-[11px] text-[var(--ink)]"
                        title={log.action}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="h-10 max-w-[20rem] px-3 py-2 align-middle">
                      <span
                        className="block truncate font-mono text-[10px] text-[var(--ink-muted)]"
                        title={formatMetadata(log.metadata)}
                      >
                        {formatMetadata(log.metadata)}
                      </span>
                    </td>
                    <td className="h-10 px-4 py-2 text-right align-middle">
                      <button
                        type="button"
                        onClick={() => setSelected(log)}
                        className="inline-flex h-7 items-center rounded-md border border-[var(--line)] px-2 text-[11px] font-medium text-[var(--ink-soft)] transition-colors hover:border-[var(--accent-jade-200)] hover:text-[var(--ink)]"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Sheet
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <SheetContent className="w-[min(92vw,34rem)] max-w-[34rem] gap-0 border-l border-[var(--line)] bg-[var(--surface)] p-0">
          <SheetHeader className="border-b border-[var(--line)] px-4 py-3 pr-12">
            <SheetTitle className="text-[14px] font-semibold text-[var(--ink)]">
              Audit event
            </SheetTitle>
            <p className="truncate font-mono text-[11px] text-[var(--ink-muted)]">
              {selected?.action}
            </p>
          </SheetHeader>
          {selected ? (
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <dl className="divide-y divide-[var(--line-soft)]">
                <Detail label="Time" value={formatFullDate(selected.created_at)} />
                <Detail
                  label="Actor"
                  value={selected.actor_email || "System"}
                />
                <Detail
                  label="Workspace"
                  value={
                    selected.workspace_name ||
                    selected.workspace_id ||
                    "Global"
                  }
                  mono={!selected.workspace_name && Boolean(selected.workspace_id)}
                />
                <Detail
                  label="Target"
                  value={selected.target_email || "None"}
                />
                <Detail label="Action" value={selected.action} mono />
              </dl>
              <div className="mt-4">
                <p className="mb-1.5 text-[11px] font-medium text-[var(--ink-muted)]">
                  Metadata
                </p>
                <pre className="max-h-[45vh] overflow-auto rounded-md border border-[var(--line)] bg-[var(--canvas-soft)] p-3 font-mono text-[11px] leading-5 whitespace-pre-wrap break-words text-[var(--ink-soft)]">
                  {JSON.stringify(selected.metadata ?? {}, null, 2)}
                </pre>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Detail({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 py-2 first:pt-0 last:pb-0">
      <dt className="text-[11px] text-[var(--ink-muted)]">{label}</dt>
      <dd
        className={cn(
          "wrap-anywhere text-[12px] text-[var(--ink-soft)]",
          mono && "font-mono text-[11px]",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function formatEventDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFullDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function formatMetadata(metadata: Record<string, unknown> | null | undefined) {
  if (!metadata) return "—";
  const json = JSON.stringify(metadata);
  return json === "{}" ? "—" : json;
}
