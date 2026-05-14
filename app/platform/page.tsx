"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, FileText, MessageSquare, Users } from 'lucide-react';

import { fetchPlatformJson } from '@/src/lib/platform-client';
import { PlanBadge, StatusBadge } from '@/src/components/platform/PlatformBadges';
import { PlatformPageHeader } from '@/src/components/platform/PlatformPageHeader';

type SummaryResponse = {
  totals: {
    totalWorkspaces: number;
    activeWorkspaces: number;
    suspendedWorkspaces: number;
    trialWorkspaces: number;
    totalUsers: number;
    totalDocuments: number;
    totalQuestions: number;
    totalUnansweredQuestions: number;
    totalFeedback: number;
    newCompaniesLast7Days: number;
    questionsLast7Days: number;
  };
  topCompaniesByQuestions: Array<{
    id: string;
    name: string;
    slug: string;
    plan: string;
    status: string;
    totalQuestions: number;
  }>;
  companiesByOpenQuestions: Array<{
    id: string;
    name: string;
    slug: string;
    openKnowledgeGaps: number;
  }>;
  recentCompanies: Array<{
    id: string;
    name: string;
    slug: string;
    status: string;
    plan: string;
    created_at: string;
  }>;
};

const EMPTY_DATA: SummaryResponse = {
  totals: {
    totalWorkspaces: 0,
    activeWorkspaces: 0,
    suspendedWorkspaces: 0,
    trialWorkspaces: 0,
    totalUsers: 0,
    totalDocuments: 0,
    totalQuestions: 0,
    totalUnansweredQuestions: 0,
    totalFeedback: 0,
    newCompaniesLast7Days: 0,
    questionsLast7Days: 0,
  },
  topCompaniesByQuestions: [],
  companiesByOpenQuestions: [],
  recentCompanies: [],
};

export default function PlatformOverviewPage() {
  const [data, setData] = useState<SummaryResponse>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const result = await fetchPlatformJson<SummaryResponse>('/api/platform/summary');
        setData(result);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load platform summary');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const cards = [
    { label: 'Companies', value: data.totals.totalWorkspaces, icon: Building2 },
    { label: 'Platform users', value: data.totals.totalUsers, icon: Users },
    { label: 'Uploaded documents', value: data.totals.totalDocuments, icon: FileText },
    { label: 'Questions asked', value: data.totals.totalQuestions, icon: MessageSquare },
    { label: 'Suspended workspaces', value: data.totals.suspendedWorkspaces, icon: Building2 },
    { label: 'Trial workspaces', value: data.totals.trialWorkspaces, icon: Building2 },
  ];

  return (
    <div className="admin-page">
      <PlatformPageHeader
        title="Platform Overview"
        subtitle="Monitor companies, users, plans, and workspace status."
      />

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {cards.map((card) => (
          <div key={card.label} className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-xl bg-cyan-50 p-2.5 text-cyan-800">
                <card.icon size={20} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{loading ? 'Loading' : 'Live'}</span>
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">{card.label}</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{card.value}</h2>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="admin-shell-card p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Recent companies</p>
              <h2 className="mt-1 text-lg font-bold text-slate-950">Newest workspaces</h2>
            </div>
            <Link href="/platform/companies" className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700 hover:text-cyan-900">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {data.recentCompanies.length === 0 ? (
              <p className="text-sm text-slate-500">No companies created yet.</p>
            ) : (
              data.recentCompanies.map((company) => (
                <div key={company.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <Link href={`/platform/companies/${company.id}`} className="text-sm font-semibold text-slate-950 hover:text-cyan-700">
                        {company.name}
                      </Link>
                      <p className="mt-1 text-xs text-slate-500">{company.slug}</p>
                    </div>
                    <StatusBadge status={company.status} />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <PlanBadge plan={company.plan} />
                    <span className="text-xs text-slate-500">{formatDate(company.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="admin-shell-card p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Platform activity</p>
            <div className="mt-4 space-y-3">
              <MetricRow label="New companies in last 7 days" value={data.totals.newCompaniesLast7Days} />
              <MetricRow label="Questions in last 7 days" value={data.totals.questionsLast7Days} />
              <MetricRow label="Open unanswered questions" value={data.totals.totalUnansweredQuestions} />
              <MetricRow label="Feedback submitted" value={data.totals.totalFeedback} />
            </div>
          </div>

          <div className="admin-shell-card p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Status distribution</p>
            <div className="mt-4 space-y-3">
              {[
                { label: 'Active', count: data.totals.activeWorkspaces, status: 'active' },
                { label: 'Trial', count: data.totals.trialWorkspaces, status: 'trial' },
                { label: 'Suspended', count: data.totals.suspendedWorkspaces, status: 'suspended' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={item.status} />
                    <span className="text-sm font-medium text-slate-600">{item.label}</span>
                  </div>
                  <span className="text-lg font-bold text-slate-950">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <span className="text-lg font-bold text-slate-950">{value}</span>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
