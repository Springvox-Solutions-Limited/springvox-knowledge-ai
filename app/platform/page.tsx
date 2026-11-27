"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, Building2, FileText, MessageSquare, Users } from "lucide-react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
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
    suspendedWorkspaces: number;
    trialWorkspaces: number;
    totalUsers: number;
    totalDocuments: number;
    totalQuestions: number;
    openKnowledgeGaps: number;
    totalFeedback: number;
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
    totalP50: number | null;
    totalP95: number | null;
  };
};

const RANGES = [7, 30, 90] as const;

export default function PlatformOverviewPage() {
  const [days, setDays] = useState<(typeof RANGES)[number]>(7);
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
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load platform insights");
        }
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
  const ai = data?.ai;
  const topCompanies = data?.topCompanies ?? [];
  const daily = data?.daily ?? [];
  const funnel = data?.funnel;

  return (
    <div className="admin-page" aria-busy={loading}>
      <PlatformPageHeader
        title="Platform overview"
        subtitle="Company health, product activity, and AI quality across the platform."
        privacyNote="Tenant document contents and private conversations are not exposed here."
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
        <div className="rounded-[10px] border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-300">
          {error}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Companies" value={totals?.totalWorkspaces ?? 0} icon={Building2} meta={`${totals?.activeWorkspaces ?? 0} active`} />
        <StatCard label="Platform users" value={totals?.totalUsers ?? 0} icon={Users} meta={`${totals?.activeUsersPeriod ?? 0} active`} />
        <StatCard label="Questions" value={totals?.questionsPeriod ?? 0} icon={MessageSquare} meta={`${days}d window`} />
        <StatCard label="Documents" value={totals?.documentsPeriod ?? 0} icon={FileText} meta={`${totals?.totalDocuments ?? 0} total`} />
        <StatCard
          label="AI health"
          value={ai?.firstTokenP95 ? `${Math.round(ai.firstTokenP95 / 100) / 10}s` : "—"}
          icon={Activity}
          meta={ai ? `${ai.errors} errors` : "No metrics"}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.85fr)]">
        <section className="admin-shell-card min-w-0 p-4 sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[14px] font-semibold text-[var(--ink)]">Platform activity</h2>
              <p className="mt-0.5 text-[12px] text-[var(--ink-muted)]">Questions and active users per day.</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-[var(--ink-muted)]">
              <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-jade)]" />Questions</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[var(--ink-muted)]" />Users</span>
            </div>
          </div>
          {daily.length === 0 ? (
            <EmptyState icon={Activity} title="No activity yet" description="Activity appears after companies start asking questions." className="border-0 bg-transparent py-12" />
          ) : (
            <ResponsiveContainer width="100%" height={238} minWidth={1}>
              <ComposedChart data={daily}>
                <CartesianGrid vertical={false} stroke="var(--line-soft)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--ink-muted)" }} tickFormatter={(value: string) => value.slice(5)} dy={8} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} width={28} tick={{ fontSize: 10, fill: "var(--ink-muted)" }} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid var(--line)", backgroundColor: "var(--surface)", fontSize: "12px", color: "var(--ink)" }}
                  cursor={{ fill: "var(--canvas-soft)" }}
                />
                <Bar dataKey="questions" fill="var(--accent-jade)" radius={[3, 3, 0, 0]} maxBarSize={22} />
                <Line type="monotone" dataKey="activeUsers" stroke="var(--sage)" strokeWidth={1.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </section>

        <section className="admin-shell-card p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[14px] font-semibold text-[var(--ink)]">AI health</h2>
              <p className="mt-0.5 text-[12px] text-[var(--ink-muted)]">Last {days} days.</p>
            </div>
            <Link href="/platform/diagnostics" className="text-[11px] font-medium text-[var(--ink-muted)] hover:text-[var(--ink)]">Inspect</Link>
          </div>
          {!ai ? (
            <p className="mt-8 rounded-md border border-dashed border-[var(--line)] px-3 py-6 text-center text-[12px] text-[var(--ink-muted)]">
              No AI metrics recorded yet.
            </p>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4">
              <Metric label="First token p95" value={formatMs(ai.firstTokenP95)} />
              <Metric label="Total p95" value={formatMs(ai.totalP95)} />
              <Metric label="Requests" value={String(ai.requests)} />
              <Metric label="Errors" value={ai.errorRate === null ? "—" : `${Math.round(ai.errorRate * 100)}%`} />
              <Metric label="No-answer" value={ai.noAnswerRate === null ? "—" : `${Math.round(ai.noAnswerRate * 100)}%`} />
              <Metric label="No-answer count" value={String(ai.noAnswers)} />
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="admin-shell-card min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3.5 sm:px-5">
            <div>
              <h2 className="text-[14px] font-semibold text-[var(--ink)]">Company activity</h2>
              <p className="mt-0.5 text-[12px] text-[var(--ink-muted)]">Highest question volume in this window.</p>
            </div>
            <Link href="/platform/companies" className="text-[11px] font-medium text-[var(--ink-muted)] hover:text-[var(--ink)]">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left">
              <thead>
                <tr className="border-b border-[var(--line)] text-[11px] text-[var(--ink-muted)]">
                  <th className="px-4 py-2.5 font-medium sm:px-5">Company</th>
                  <th className="px-3 py-2.5 font-medium">Plan</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 text-right font-medium sm:px-5">Questions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line-soft)]">
                {topCompanies.map((company) => (
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
                {topCompanies.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-10 text-center text-[12px] text-[var(--ink-muted)]">No company activity in this period.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <div className="space-y-4">
          <section className="admin-shell-card p-4 sm:p-5">
            <h2 className="text-[14px] font-semibold text-[var(--ink)]">Activation funnel</h2>
            <div className="mt-4 space-y-3">
              {[
                ["Companies", funnel?.companies ?? 0],
                ["With documents", funnel?.withDocuments ?? 0],
                ["With questions", funnel?.withQuestions ?? 0],
                ["Active in 7 days", funnel?.activeLast7 ?? 0],
              ].map(([label, value]) => {
                const numeric = Number(value);
                const base = Math.max(1, funnel?.companies ?? 0);
                return (
                  <div key={String(label)}>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[var(--ink-soft)]">{label}</span>
                      <span className="font-medium tabular-nums text-[var(--ink)]">{numeric}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
                      <div className="h-full rounded-full bg-[var(--accent-jade)]" style={{ width: `${Math.min(100, (numeric / base) * 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="admin-shell-card p-4 sm:p-5">
            <h2 className="text-[14px] font-semibold text-[var(--ink)]">Workspace status</h2>
            <div className="mt-3 space-y-2.5">
              {(data?.status ?? []).map((item) => (
                <div key={item.status} className="flex items-center justify-between gap-3 text-[12px]">
                  <StatusBadge status={item.status} />
                  <span className="font-medium tabular-nums text-[var(--ink-soft)]">{item.count}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-[var(--ink-muted)]">{label}</p>
      <p className="mt-1 text-[18px] font-medium tabular-nums tracking-tight text-[var(--ink)]">{value}</p>
    </div>
  );
}

function formatMs(value: number | null) {
  if (value === null) return "—";
  if (value >= 1000) return `${(value / 1000).toFixed(1)}s`;
  return `${Math.round(value)}ms`;
}
