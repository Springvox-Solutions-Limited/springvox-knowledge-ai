"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, Wrench } from "lucide-react";

import { EmptyState } from "@/src/components/ui/empty-state";
import { PlatformPageHeader } from "@/src/components/platform/PlatformPageHeader";
import { fetchPlatformJson } from "@/src/lib/platform-client";
import { cn } from "@/src/lib/utils";

type DiagnosticEvent = {
  id: string;
  event_type: string;
  severity: string;
  message: string;
  created_at: string;
  workspaces?: { name?: string; slug?: string } | null;
};

type PlatformHealth = {
  resendConfigured: boolean;
  emailFrom: string | null;
  emailFromIsDefault: boolean;
  inngestConfigured: boolean;
  appUrlConfigured: boolean;
  stuckDocuments: number;
};

type AiHealth = {
  requests: number;
  errors: number;
  noAnswers: number;
  errorRate: number | null;
  noAnswerRate: number | null;
  firstTokenP50: number | null;
  firstTokenP95: number | null;
  totalP50: number | null;
  totalP95: number | null;
};

const SEVERITY_STYLES: Record<
  string,
  { label: string; className: string; dot: string }
> = {
  critical: {
    label: "Critical",
    className: "border-red-400/40 bg-red-500/10 text-red-300",
    dot: "bg-red-400",
  },
  error: {
    label: "Error",
    className: "border-red-500/30 bg-red-500/10 text-red-300",
    dot: "bg-red-400",
  },
  warning: {
    label: "Warning",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    dot: "bg-amber-400",
  },
  info: {
    label: "Info",
    className: "border-[var(--line)] bg-[var(--surface-2)] text-[var(--ink-soft)]",
    dot: "bg-[var(--ink-muted)]",
  },
};

export default function PlatformDiagnosticsPage() {
  const [events, setEvents] = useState<DiagnosticEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<PlatformHealth | null>(null);
  const [ai, setAi] = useState<AiHealth | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchPlatformJson<{ events: DiagnosticEvent[] }>("/api/platform/diagnostics")
      .then((data) => {
        if (!cancelled) setEvents(data.events ?? []);
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load diagnostics",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    fetchPlatformJson<{ health: PlatformHealth }>("/api/platform/health")
      .then((data) => {
        if (!cancelled) setHealth(data.health);
      })
      .catch(() => {
        if (!cancelled) setHealth(null);
      });

    fetchPlatformJson<{ ai: AiHealth | null }>(
      "/api/platform/insights?days=7",
    )
      .then((data) => {
        if (!cancelled) setAi(data.ai ?? null);
      })
      .catch(() => {
        if (!cancelled) setAi(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const healthItems = health
    ? [
        {
          label: "Email provider",
          ok: health.resendConfigured,
          warnOnly: false,
          detail: health.resendConfigured
            ? "Resend key set"
            : "RESEND_API_KEY missing",
        },
        {
          label: "Email sender",
          ok: !health.emailFromIsDefault,
          warnOnly: false,
          detail: health.emailFromIsDefault
            ? "Using placeholder"
            : health.emailFrom || "Set",
        },
        {
          label: "Inngest",
          ok: health.inngestConfigured,
          warnOnly: true,
          detail: health.inngestConfigured
            ? "Keys set"
            : "Not connected (dev only?)",
        },
        {
          label: "App URL",
          ok: health.appUrlConfigured,
          warnOnly: false,
          detail: health.appUrlConfigured
            ? "Configured"
            : "NEXT_PUBLIC_APP_URL missing",
        },
        {
          label: "Stuck documents",
          ok: health.stuckDocuments === 0,
          warnOnly: false,
          detail:
            health.stuckDocuments === 0
              ? "None"
              : `${health.stuckDocuments} stuck`,
        },
      ]
    : [];

  const showAi = Boolean(ai && ai.requests > 0);

  return (
    <div className="admin-page" aria-busy={loading}>
      <PlatformPageHeader
        title="Diagnostics"
        subtitle="Recent operational events, ingestion failures, rate limits, and platform warnings."
        aside={
          <span className="text-[11px] tabular-nums text-[var(--ink-muted)]">
            {loading ? "Loading" : `${events.length} events`}
          </span>
        }
      />

      {error ? (
        <div className="rounded-[10px] border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-300">
          {error}
        </div>
      ) : null}

      {health ? (
        <section className="admin-shell-card overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-2.5">
            <div>
              <h2 className="text-[13px] font-semibold text-[var(--ink)]">
                Platform configuration
              </h2>
              <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">
                Missing configuration causes silent queue and delivery failures.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-px bg-[var(--line-soft)] sm:grid-cols-3 lg:grid-cols-5">
            {healthItems.map((item) => (
              <div
                key={item.label}
                className="bg-[var(--surface)] px-3.5 py-3"
              >
                <p className="text-[11px] text-[var(--ink-muted)]">
                  {item.label}
                </p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "h-1.5 w-1.5 shrink-0 rounded-full",
                      item.ok
                        ? "bg-emerald-400"
                        : item.warnOnly
                          ? "bg-amber-400"
                          : "bg-red-400",
                    )}
                  />
                  <span
                    className={cn(
                      "text-[12px] font-medium",
                      item.ok
                        ? "text-[var(--ink)]"
                        : item.warnOnly
                          ? "text-amber-300"
                          : "text-red-300",
                    )}
                  >
                    {item.ok ? "OK" : item.warnOnly ? "Check" : "Action needed"}
                  </span>
                </div>
                <p
                  className="mt-1 truncate text-[10px] text-[var(--ink-muted)]"
                  title={item.detail}
                >
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {showAi && ai ? (
        <section className="admin-shell-card overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-2.5">
            <div className="flex items-baseline gap-2">
              <h2 className="text-[13px] font-semibold text-[var(--ink)]">
                AI health
              </h2>
              <span className="text-[11px] text-[var(--ink-muted)]">
                Last 7 days
              </span>
            </div>
            <Link
              href="/platform/analytics"
              className="text-[11px] font-medium text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)]"
            >
              Analytics
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-4 sm:grid-cols-3 lg:grid-cols-5">
            <Metric label="First token p95" value={formatMs(ai.firstTokenP95)} />
            <Metric label="Total p95" value={formatMs(ai.totalP95)} />
            <Metric label="Requests" value={ai.requests.toLocaleString()} />
            <Metric
              label="Error rate"
              value={
                ai.errorRate === null
                  ? "—"
                  : `${Math.round(ai.errorRate * 100)}%`
              }
            />
            <Metric
              label="No-answer rate"
              value={
                ai.noAnswerRate === null
                  ? "—"
                  : `${Math.round(ai.noAnswerRate * 100)}%`
              }
            />
          </div>
        </section>
      ) : null}

      <section className="admin-shell-card overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-2.5">
          <div>
            <h2 className="text-[13px] font-semibold text-[var(--ink)]">
              Operational events
            </h2>
            <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">
              Ingestion failures, rate limits, and platform warnings.
            </p>
          </div>
          <span className="text-[11px] tabular-nums text-[var(--ink-muted)]">
            {loading ? "Loading" : `${events.length} shown`}
          </span>
        </div>

        {loading ? (
          <div className="px-4 py-10 text-center text-[12px] text-[var(--ink-muted)]">
            Loading diagnostic events...
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No diagnostic events"
            description="Ingestion failures, rate limit hits, and platform warnings will appear here."
            className="rounded-none border-0 bg-transparent py-12"
          />
        ) : (
          <div className="max-h-[520px] overflow-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="sticky top-0 z-10 bg-[var(--canvas-soft)]">
                <tr className="border-b border-[var(--line)] text-[11px] text-[var(--ink-muted)]">
                  <th className="px-4 py-2 font-medium">Time</th>
                  <th className="px-3 py-2 font-medium">Severity</th>
                  <th className="px-3 py-2 font-medium">Event</th>
                  <th className="px-3 py-2 font-medium">Workspace</th>
                  <th className="px-4 py-2 font-medium">Message</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr
                    key={event.id}
                    className="border-b border-[var(--line-soft)] transition-colors last:border-0 hover:bg-[var(--canvas-soft)]"
                  >
                    <td className="h-10 px-4 py-2 align-middle">
                      <span
                        className="whitespace-nowrap font-mono text-[11px] tabular-nums text-[var(--ink-soft)]"
                        title={new Date(event.created_at).toLocaleString()}
                      >
                        {formatEventDate(event.created_at)}
                      </span>
                    </td>
                    <td className="h-10 px-3 py-2 align-middle">
                      <SeverityBadge severity={event.severity} />
                    </td>
                    <td className="h-10 max-w-[16rem] px-3 py-2 align-middle">
                      <span
                        className="block truncate font-mono text-[11px] text-[var(--ink-soft)]"
                        title={event.event_type}
                      >
                        {event.event_type}
                      </span>
                    </td>
                    <td className="h-10 max-w-[12rem] px-3 py-2 align-middle">
                      <span className="block truncate text-[12px] text-[var(--ink-soft)]">
                        {event.workspaces?.name ?? "Global"}
                      </span>
                    </td>
                    <td className="h-10 max-w-[30rem] px-4 py-2 align-middle">
                      <span
                        className="block truncate text-[12px] text-[var(--ink-soft)]"
                        title={event.message}
                      >
                        {event.message}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="flex items-center gap-1.5 text-[11px] text-[var(--ink-muted)]">
        <Wrench size={12} strokeWidth={1.5} aria-hidden="true" />
        Events are read-only and retained for platform debugging.
      </p>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const key = severity?.toLowerCase() ?? "";
  const style = SEVERITY_STYLES[key];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium",
        style?.className ??
          "border-[var(--line)] bg-[var(--surface-2)] text-[var(--ink-soft)]",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          style?.dot ?? "bg-[var(--ink-muted)]",
        )}
      />
      {style?.label ?? sentenceCase(severity)}
    </span>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-[var(--ink-muted)]">{label}</p>
      <p className="mt-1 text-[16px] font-medium tabular-nums tracking-tight text-[var(--ink)]">
        {value}
      </p>
    </div>
  );
}

function formatMs(value: number | null) {
  if (value === null) return "—";
  if (value >= 1000) return `${(value / 1000).toFixed(1)}s`;
  return `${Math.round(value)}ms`;
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

function sentenceCase(value: string) {
  if (!value) return "Info";
  return value.charAt(0).toUpperCase() + value.slice(1);
}
