"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3 } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { fetchPlatformJson } from '@/src/lib/platform-client';
import { PlanBadge, StatusBadge } from '@/src/components/platform/PlatformBadges';
import { PlatformPageHeader } from '@/src/components/platform/PlatformPageHeader';
import { AppCard } from '@/src/components/ui/app-card';
import { EmptyState } from '@/src/components/ui/empty-state';
import { StatCard } from '@/src/components/ui/stat-card';
import { getRoleLabel } from '@/src/lib/workspace';

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

      {error && <Alert className="rounded-2xl border-red-200 bg-red-50 text-red-700"><AlertDescription>{error}</AlertDescription></Alert>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          ['Companies', totals.totalWorkspaces],
          ['Active', totals.activeWorkspaces],
          ['Suspended', totals.suspendedWorkspaces],
          ['Users', totals.totalUsers],
          ['Questions', totals.totalQuestions],
        ].map(([label, value]) => (
          <StatCard key={label} label={String(label)} value={value} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <AnalyticsPanel title="Workspaces by plan" loading={loading}>
          {(data?.workspacesByPlan || []).length === 0 ? (
            <EmptyState icon={BarChart3} title="No plan data yet" description="Workspace plan distribution will appear here." className="border-0 bg-transparent py-8" />
          ) : (
            <div className="h-65 min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <BarChart data={data?.workspacesByPlan || []}>
                  <CartesianGrid vertical={false} stroke="#eef2f7" />
                  <XAxis dataKey="plan" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0d1f35" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </AnalyticsPanel>

        <AnalyticsPanel title="Workspaces by status" loading={loading}>
          {(data?.workspacesByStatus || []).length === 0 ? (
            <EmptyState icon={BarChart3} title="No status data yet" description="Workspace status distribution will appear here." className="border-0 bg-transparent py-8" />
          ) : (
            <div className="h-65 min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <BarChart data={data?.workspacesByStatus || []}>
                  <CartesianGrid vertical={false} stroke="#eef2f7" />
                  <XAxis dataKey="status" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#14b8a6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </AnalyticsPanel>

        <AnalyticsPanel title="Top active companies" loading={loading}>
          <div className="space-y-4">
            {(data?.topCompaniesByQuestions || []).map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex items-center justify-between gap-3">
                  <Link href={`/platform/companies/${item.id}`} className="min-w-0 truncate font-semibold text-slate-950 hover:text-cyan-700" title={item.name}>{item.name}</Link>
                  <span className="shrink-0 text-sm font-bold text-slate-700">{item.totalQuestions} questions</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="max-w-full truncate" title={item.slug}>{item.slug}</span>
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
              <div key={item.id} className="flex items-start justify-between gap-3 rounded-2xl border border-slate-100 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950" title={item.email || ''}>{item.email || 'No email'}</p>
                  <p className="mt-1 truncate text-xs text-slate-500" title={item.workspace_name}>{item.workspace_name}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{getRoleLabel(item.role as any)}</p>
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
    <AppCard className="p-6">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">{title}</p>
      <div className="mt-5">
        {loading ? <p className="text-sm text-slate-500">Loading...</p> : children}
      </div>
    </AppCard>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
