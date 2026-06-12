"use client";

import { useEffect, useState } from "react";

import { PlatformPageHeader } from "@/src/components/platform/PlatformPageHeader";
import { AppCard } from "@/src/components/ui/app-card";
import {
  AppTable,
  AppTableBody,
  AppTableCell,
  AppTableHead,
  AppTableHeader,
  AppTableRow,
} from "@/src/components/ui/app-table";
import { EmptyState } from "@/src/components/ui/empty-state";
import { SkeletonTable } from "@/src/components/ui/skeleton-card";
import { OverflowGuard } from "@/src/components/layout/OverflowGuard";
import { fetchPlatformJson } from "@/src/lib/platform-client";
import { Activity } from "lucide-react";
import { cn } from "@/src/lib/utils";

type DiagnosticEvent = {
  id: string;
  event_type: string;
  severity: string;
  message: string;
  created_at: string;
  workspaces?: { name?: string; slug?: string } | null;
};

function SeverityBadge({ severity }: { severity: string }) {
  const className = cn(
    "inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]",
    severity === "critical"
      ? "border-red-300 bg-red-100 text-red-300"
      : severity === "error"
        ? "border-red-500/30 bg-red-500/10 text-red-300"
        : severity === "warning"
          ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
          : "border-[var(--line)] bg-[var(--surface-2)] text-[var(--ink-soft)]",
  );
  return <span className={className}>{severity}</span>;
}

export default function PlatformDiagnosticsPage() {
  const [events, setEvents] = useState<DiagnosticEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlatformJson<{ events: DiagnosticEvent[] }>("/api/platform/diagnostics")
      .then((data) => setEvents(data.events ?? []))
      .catch((loadError) =>
        setError(loadError instanceof Error ? loadError.message : "Failed to load diagnostics"),
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="admin-page">
      <PlatformPageHeader
        title="Diagnostics"
        subtitle="Recent operational events, ingestion failures, rate limits, and platform warnings."
      />

      {error && (
        <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {loading ? (
        <SkeletonTable rows={8} cols={5} />
      ) : events.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No diagnostic events"
          description="Ingestion failures, rate limit hits, and platform warnings will appear here."
        />
      ) : (
        <OverflowGuard mode="scroll">
          <AppCard className="overflow-hidden">
            <AppTable className="min-w-[920px]">
              <AppTableHeader>
                <AppTableRow>
                  {["Time", "Severity", "Event", "Workspace", "Message"].map((col) => (
                    <AppTableHead key={col}>{col}</AppTableHead>
                  ))}
                </AppTableRow>
              </AppTableHeader>
              <AppTableBody>
                {events.map((event) => (
                  <AppTableRow key={event.id}>
                    <AppTableCell className="whitespace-nowrap text-xs text-[var(--ink-muted)]">
                      {new Date(event.created_at).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </AppTableCell>
                    <AppTableCell>
                      <SeverityBadge severity={event.severity} />
                    </AppTableCell>
                    <AppTableCell className="font-mono text-xs text-[var(--ink-soft)]">
                      {event.event_type}
                    </AppTableCell>
                    <AppTableCell className="text-sm text-[var(--ink-soft)]">
                      {event.workspaces?.name ?? "Global"}
                    </AppTableCell>
                    <AppTableCell className="max-w-xl text-sm text-[var(--ink-soft)]">
                      {event.message}
                    </AppTableCell>
                  </AppTableRow>
                ))}
              </AppTableBody>
            </AppTable>
          </AppCard>
        </OverflowGuard>
      )}
    </div>
  );
}
