"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, Building2, FileText, MessageSquare, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { fetchPlatformJson } from "@/src/lib/platform-client";
import { PlatformPageHeader } from "@/src/components/platform/PlatformPageHeader";
import { PlanBadge, StatusBadge } from "@/src/components/platform/PlatformBadges";
import { EmptyState } from "@/src/components/ui/empty-state";
import { StatCard } from "@/src/components/ui/stat-card";

type Insights = {
  windowDays: number;
  totals: {
    totalWorkspaces: number;
    activeWorkspaces: number;
    totalUsers: number;
    totalDocuments: number;
    totalQuestions: number;
    openKnowledgeGaps: number;
    newCompanies: number;
    questionsPeriod: number;
    activeUsersPeriod: number;
    documentsPeriod: number;
  };
  daily: Array<{ date: string; questions: number; activeUsers: number; companies: number; documents: number }>;
  hourly: Array<{ hour: number; questions: number }>;
  status: Array<{ status: string; count: number }>;
  plans: Array<{ plan: string; count: number }>;
  topCompanies: Array<{ id: string; name: string; slug: string; plan: string; status: string; questions: number }>;
  funnel: { companies: number; withDocuments: number; withQuestions: number; activeLast7: number };
  ai: null | {
    requests: number;
    errors: number;
    noAnswers: number;
    errorRate: number | null;
    noAnswerRate: number | null;
    firstTokenP50: number | null;
    firstTokenP95: number | null;
    totalP95: number | null;
  };
};

const RANGES = [7, 30, 90] as const;

export default function PlatformAnalyticsPage() {
  const [days, setDays] = useState<(typeof RANGES)[number]>(30);
  const [data, setData] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchPlatformJson<Insights>(`/api/platform/insights?days=${days}`);
        if (!cancelled) setData(result);
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Failed to load analytics");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [days]);

  const totals = data?.totals;
  const daily = data?.daily ?? [];
  const hourly = data?.hourly ?? [];
  const ai = data?.ai;

  return (
    <div className="admin-page" aria-busy={loading}>
      <PlatformPageHeader
        title="Analytics"
        subtitle="Platform usage, growth, and AI quality."
        aside={
          <div className="flex items-center gap-1 rounded-md border border-[var(--line)] p-1">
            {RANGES.map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setDays(range)}
                className={`h-7 rounded px-2.5 text-[11px] font-medium transition-colors ${
                  days === range
                    ? "bg-[var(--accent-jade-50)] text-[var(--ink)]"
                    : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
                }`}
              >
                {range}d
              </button>
            ))}
          </div>
        }
      />

      {error ? (
        <div className="rounded-[10px] border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-300">{error}</div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Questions" value={totals?.questionsPeriod ?? 0} icon={MessageSquare} meta={`${days}d window`} />
        <StatCard label="Active users" value={totals?.activeUsersPeriod ?? 0} icon={Users} meta={`${totals?.totalUsers ?? 0} total`} />
        <StatCard label="New companies" value={totals?.newCompanies ?? 0} icon={Building2} meta={`${totals?.totalWorkspaces ?? 0} total`} />
        <StatCard label="New documents" value={totals?.documentsPeriod ?? 0} icon={FileText} meta={`${totals?.totalDocuments ?? 0} total`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.85fr)]">
        <section className="admin-shell-card p-4 sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[14px] font-semibold text-[var(--ink)]">Question volume</h2>
              <p className="mt-0.5 text-[12px] text-[var(--ink-muted)]">Daily questions across every workspace.</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-[var(--ink-muted)]">
              <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-jade)]" />Questions</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[var(--ink-muted)]" />Users</span>
            </div>
          </div>
          {daily.length === 0 ? (
            <EmptyState icon={Activity} title="No activity yet" description="Question volume appears here after companies start asking." className="border-0 bg-transparent py-12" />
          ) : (
            <ResponsiveContainer width="100%" height={230} minWidth={1}>
              <LineChart data={daily}>
                <CartesianGrid vertical={false} stroke="var(--line-soft)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--ink-muted)" }} tickFormatter={(value: string) => value.slice(5)} dy={8} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} width={28} tick={{ fontSize: 10, fill: "var(--ink-muted)" }} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid var(--line)", backgroundColor: "var(--surface)", fontSize: "12px", color: "var(--ink)" }} />
                <Line type="monotone" dataKey="questions" stroke="var(--accent-jade)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="activeUsers" stroke="var(--sage)" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </section>

        <section className="admin-shell-card p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[14px] font-semibold text-[var(--ink)]">AI quality</h2>
              <p className="mt-0.5 text-[12px] text-[var(--ink-muted)]">{days} day window.</p>
            </div>
            <Link href="/platform/diagnostics" className="text-[11px] font-medium text-[var(--ink-muted)] hover:text-[var(--ink)]">Inspect</Link>
          </div>
          {!ai ? (
            <p className="mt-8 rounded-md border border-dashed border-[var(--line)] px-3 py-6 text-center text-[12px] text-[var(--ink-muted)]">No AI metrics recorded yet.</p>
          ) : (
            <div className="mt-5 divide-y divide-[var(--line-soft)] text-[12px]">
              <Row label="First token p95" value={formatMs(ai.firstTokenP95)} />
              <Row label="Total p95" value={formatMs(ai.totalP95)} />
              <Row label="Error rate" value={ai.errorRate === null ? "—" : `${Math.round(ai.errorRate * 100)}%`} />
              <Row label="No-answer rate" value={ai.noAnswerRate === null ? "—" : `${Math.round(ai.noAnswerRate * 100)}%`} />
              <Row label="Requests" value={String(ai.requests)} />
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="admin-shell-card p-4 sm:p-5">
          <div className="mb-4">
            <h2 className="text-[14px] font-semibold text-[var(--ink)]">Company growth</h2>
            <p className="mt-0.5 text-[12px] text-[var(--ink-muted)]">New workspaces and documents per day.</p>
          </div>
          <ResponsiveContainer width="100%" height={210} minWidth={1}>
            <BarChart data={daily}>
              <CartesianGrid vertical={false} stroke="var(--line-soft)" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--ink-muted)" }} tickFormatter={(value: string) => value.slice(5)} dy={8} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} width={28} tick={{ fontSize: 10, fill: "var(--ink-muted)" }} />
              <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid var(--line)", backgroundColor: "var(--surface)", fontSize: "12px", color: "var(--ink)" }} />
              <Bar dataKey="companies" fill="var(--accent-jade)" radius={[3, 3, 0, 0]} maxBarSize={18} />
              <Bar dataKey="documents" fill="var(--ink-muted)" radius={[3, 3, 0, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section className="admin-shell-card p-4 sm:p-5">
          <div className="mb-4">
            <h2 className="text-[14px] font-semibold text-[var(--ink)]">When people ask</h2>
            <p className="mt-0.5 text-[12px] text-[var(--ink-muted)]">Questions by hour, UTC.</p>
          </div>
          {hourly.length === 0 ? (
            <EmptyState icon={Activity} title="No hourly activity" description="Hourly usage appears after questions are asked." className="border-0 bg-transparent py-10" />
          ) : (
            <div className="flex h-[180px] items-end gap-1">
              {Array.from({ length: 24 }).map((_, hour) => {
                const count = hourly.find((item) => item.hour === hour)?.questions ?? 0;
                const max = Math.max(1, ...hourly.map((item) => item.questions));
                return (
                  <div key={hour} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                    <div className="flex h-[160px] w-full items-end">
                      <div className="w-full rounded-t-[2px] bg-[var(--accent-jade)]" style={{ height: `${Math.max(2, (count / max) * 100)}%`, opacity: count ? 1 : 0.12 }} title={`${hour}:00 · ${count} questions`} />
                    </div>
                    <span className="text-[8px] tabular-nums text-[var(--ink-muted)]">{hour}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="admin-shell-card overflow-hidden">
          <div className="border-b border-[var(--line)] px-4 py-3.5 sm:px-5">
            <h2 className="text-[14px] font-semibold text-[var(--ink)]">Top companies</h2>
            <p className="mt-0.5 text-[12px] text-[var(--ink-muted)]">Question volume in this window.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left">
              <thead>
                <tr className="border-b border-[var(--line)] text-[11px] text-[var(--ink-muted)]">
                  <th className="px-4 py-2.5 font-medium sm:px-5">Company</th>
                  <th className="px-3 py-2.5 font-medium">Plan</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 text-right font-medium sm:px-5">Questions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line-soft)]">
                {(data?.topCompanies ?? []).map((company) => (
                  <tr key={company.id} className="transition-colors hover:bg-[var(--canvas-soft)]">
                    <td className="px-4 py-3 sm:px-5">
                      <Link href={`/platform/companies/${company.id}`} className="block truncate text-[12px] font-medium text-[var(--ink)] hover:text-[var(--accent-jade)]">{company.name}</Link>
                      <span className="mt-0.5 block truncate text-[10px] text-[var(--ink-muted)]">{company.slug}</span>
                    </td>
                    <td className="px-3 py-3"><PlanBadge plan={company.plan} /></td>
                    <td className="px-3 py-3"><StatusBadge status={company.status} /></td>
                    <td className="px-4 py-3 text-right text-[12px] font-medium tabular-nums text-[var(--ink-soft)] sm:px-5">{company.questions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-shell-card p-4 sm:p-5">
          <h2 className="text-[14px] font-semibold text-[var(--ink)]">Plan distribution</h2>
          <div className="mt-4 space-y-3">
            {(data?.plans ?? []).map((item) => {
              const max = Math.max(1, ...(data?.plans ?? []).map((plan) => plan.count));
              return (
                <div key={item.plan}>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="capitalize text-[var(--ink-soft)]">{item.plan}</span>
                    <span className="font-medium tabular-nums text-[var(--ink)]">{item.count}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
                    <div className="h-full rounded-full bg-[var(--accent-jade)]" style={{ width: `${(item.count / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
      <span className="text-[var(--ink-soft)]">{label}</span>
      <span className="font-medium tabular-nums text-[var(--ink)]">{value}</span>
    </div>
  );
}

function formatMs(value: number | null) {
  if (value === null) return "—";
  if (value >= 1000) return `${(value / 1000).toFixed(1)}s`;
  return `${Math.round(value)}ms`;
}
