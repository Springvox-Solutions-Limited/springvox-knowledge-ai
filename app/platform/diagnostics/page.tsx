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

function HealthChip({
  label,
  ok,
  detail,
  warnOnly = false,
}: {
  label: string;
  ok: boolean;
  detail: string;
  warnOnly?: boolean;
}) {
  const tone = ok
    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
    : warnOnly
      ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
      : "border-red-500/30 bg-red-500/10 text-red-300";
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">{label}</p>
      <span className={cn("mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold", tone)}>
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        {ok ? "OK" : warnOnly ? "Check" : "Action needed"}
      </span>
      <p className="mt-2 truncate text-xs text-[var(--ink-soft)]" title={detail}>{detail}</p>
    </div>
  );
}

type PlatformHealth = {
  resendConfigured: boolean;
  emailFrom: string | null;
  emailFromIsDefault: boolean;
  inngestConfigured: boolean;
  appUrlConfigured: boolean;
  stuckDocuments: number;
};

export default function PlatformDiagnosticsPage() {
  const [events, setEvents] = useState<DiagnosticEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<PlatformHealth | null>(null);

  useEffect(() => {
    fetchPlatformJson<{ events: DiagnosticEvent[] }>("/api/platform/diagnostics")
      .then((data) => setEvents(data.events ?? []))
      .catch((loadError) =>
        setError(loadError instanceof Error ? loadError.message : "Failed to load diagnostics"),
      )
      .finally(() => setLoading(false));

    fetchPlatformJson<{ health: PlatformHealth }>("/api/platform/health")
      .then((data) => setHealth(data.health))
      .catch(() => setHealth(null));
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

      {health && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <HealthChip
            label="Email provider"
            ok={health.resendConfigured}
            detail={health.resendConfigured ? "Resend key set" : "RESEND_API_KEY missing"}
          />
          <HealthChip
            label="Email sender"
            ok={!health.emailFromIsDefault}
            detail={health.emailFromIsDefault ? "Using placeholder" : health.emailFrom || "Set"}
          />
          <HealthChip
            label="Inngest"
            ok={health.inngestConfigured}
            detail={health.inngestConfigured ? "Keys set" : "Not connected (dev only?)"}
            warnOnly
          />
          <HealthChip
            label="App URL"
            ok={health.appUrlConfigured}
            detail={health.appUrlConfigured ? "Configured" : "NEXT_PUBLIC_APP_URL missing"}
          />
          <HealthChip
            label="Stuck documents"
            ok={health.stuckDocuments === 0}
            detail={health.stuckDocuments === 0 ? "None" : `${health.stuckDocuments} stuck`}
          />
        </div>
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
