"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { fetchPlatformJson } from '@/src/lib/platform-client';
import { PlanBadge, StatusBadge } from '@/src/components/platform/PlatformBadges';
import { PlatformPageHeader } from '@/src/components/platform/PlatformPageHeader';

type AnalyticsResponse = Awaited<ReturnType<typeof buildEmptyAnalytics>>;

function buildEmptyAnalytics() {
  return Promise.resolve({
    totals: {
      totalWorkspaces: 0,
      activeWorkspaces: 0,
      suspendedWorkspaces: 0,
      trialWorkspaces: 0,
      inactiveWorkspaces: 0,
      totalUsers: 0,
      totalTenantAdmins: 0,
      totalViewers: 0,
      totalPlatformAdmins: 0,
      totalDocuments: 0,
      totalQuestions: 0,
      totalUnansweredQuestions: 0,
      totalFeedback: 0,
      newCompaniesLast7Days: 0,
      questionsLast7Days: 0,
    },
    topCompaniesByQuestions: [] as Array<{ id: string; name: string; slug: string; plan: string; status: string; totalQuestions: number }>,
    companiesByOpenQuestions: [] as Array<{ id: string; name: string; slug: string; openKnowledgeGaps: number }>,
    recentCompanies: [] as Array<{ id: string; name: string; slug: string; plan: string; status: string; created_at: string }>,
    recentUserSignups: [] as Array<{ id: string; email: string | null; role: string; workspace_name: string; created_at: string }>,
    workspacesByPlan: [] as Array<{ plan: string; count: number }>,
    workspacesByStatus: [] as Array<{ status: string; count: number }>,
  });
}

export default function PlatformAnalyticsPage() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const result = await fetchPlatformJson<AnalyticsResponse>('/api/platform/analytics');
        setData(result);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const totals = data?.totals || {
    totalWorkspaces: 0,
    activeWorkspaces: 0,
    suspendedWorkspaces: 0,
    trialWorkspaces: 0,
    inactiveWorkspaces: 0,
    totalUsers: 0,
    totalTenantAdmins: 0,
    totalViewers: 0,
    totalPlatformAdmins: 0,
    totalDocuments: 0,
    totalQuestions: 0,
    totalUnansweredQuestions: 0,
    totalFeedback: 0,
    newCompaniesLast7Days: 0,
    questionsLast7Days: 0,
  };

  return (
    <div className="admin-page">
      <PlatformPageHeader
        title="Platform Analytics"
        subtitle="Track usage, activity, and workspace health."
      />

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          ['Companies', totals.totalWorkspaces],
          ['Active', totals.activeWorkspaces],
          ['Suspended', totals.suspendedWorkspaces],
          ['Users', totals.totalUsers],
          ['Questions', totals.totalQuestions],
        ].map(([label, value]) => (
          <div key={label} className="admin-kpi-card">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-950">{value}</h2>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <AnalyticsPanel title="Workspaces by plan" loading={loading}>
          <div className="space-y-3">
            {(data?.workspacesByPlan || []).map((item) => (
              <div key={item.plan} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                <PlanBadge plan={item.plan} />
                <span className="text-lg font-bold text-slate-950">{item.count}</span>
              </div>
            ))}
          </div>
        </AnalyticsPanel>

        <AnalyticsPanel title="Workspaces by status" loading={loading}>
          <div className="space-y-3">
            {(data?.workspacesByStatus || []).map((item) => (
              <div key={item.status} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                <StatusBadge status={item.status} />
                <span className="text-lg font-bold text-slate-950">{item.count}</span>
              </div>
            ))}
          </div>
        </AnalyticsPanel>

        <AnalyticsPanel title="Top active companies" loading={loading}>
          <div className="space-y-4">
            {(data?.topCompaniesByQuestions || []).map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex items-center justify-between gap-3">
                  <Link href={`/platform/companies/${item.id}`} className="font-semibold text-slate-950 hover:text-cyan-700">{item.name}</Link>
                  <span className="text-sm font-bold text-slate-700">{item.totalQuestions} questions</span>
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                  <span>{item.slug}</span>
                  <PlanBadge plan={item.plan} />
                  <StatusBadge status={item.status} />
                </div>
              </div>
            ))}
          </div>
        </AnalyticsPanel>

        <AnalyticsPanel title="Recent user signups" loading={loading}>
          <div className="space-y-4">
            {(data?.recentUserSignups || []).map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 p-4">
                <div>
                  <p className="text-sm font-semibold text-slate-950">{item.email || 'No email'}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.workspace_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{item.role}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDate(item.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </AnalyticsPanel>
      </div>
    </div>
  );
}

function AnalyticsPanel({
  title,
  loading,
  children,
}: {
  title: string;
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="admin-shell-card p-6">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">{title}</p>
      <div className="mt-5">
        {loading ? <p className="text-sm text-slate-500">Loading...</p> : children}
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
