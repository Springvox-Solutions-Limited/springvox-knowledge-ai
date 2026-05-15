"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { fetchPlatformJson } from '@/src/lib/platform-client';
import { PlanBadge, StatusBadge } from '@/src/components/platform/PlatformBadges';
import { PlatformPageHeader } from '@/src/components/platform/PlatformPageHeader';
import { AppCard } from '@/src/components/ui/app-card';

type PlanRecord = {
  plan: string;
  label: string;
  description: string;
  suggestedDocuments: string;
  suggestedUsers: string;
  suggestedMonthlyQuestions: string;
  workspaceCount: number;
  companies: Array<{
    id: string;
    name: string;
    slug: string;
    status: string;
    created_at: string;
  }>;
};

export default function PlatformPlansPage() {
  const [plans, setPlans] = useState<PlanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const result = await fetchPlatformJson<{ plans: PlanRecord[] }>('/api/platform/plans');
        setPlans(result.plans || []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load plans');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div className="admin-page">
      <PlatformPageHeader
        title="Plans"
        subtitle="Manage demo plan labels for company workspaces."
        privacyNote="Plan limits are display-only in this phase. Billing and payment processing are not enabled."
      />

      {error && <Alert className="rounded-2xl border-red-200 bg-red-50 text-red-700"><AlertDescription>{error}</AlertDescription></Alert>}

      <div className="space-y-6">
        {loading ? (
          <AppCard className="p-6 text-sm text-slate-500">Loading plans...</AppCard>
        ) : (
          plans.map((plan) => (
            <AppCard key={plan.plan} className="p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <PlanBadge plan={plan.plan} />
                  <h2 className="text-2xl font-bold text-slate-950">{plan.label}</h2>
                  <p className="max-w-2xl text-sm text-slate-600">{plan.description}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <PlanMetric label="Suggested documents" value={plan.suggestedDocuments} />
                  <PlanMetric label="Suggested users" value={plan.suggestedUsers} />
                  <PlanMetric label="Suggested monthly questions" value={plan.suggestedMonthlyQuestions} />
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-950">Workspaces on this plan</p>
                  <span className="text-lg font-bold text-slate-950">{plan.workspaceCount}</span>
                </div>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {plan.companies.length === 0 ? (
                  <p className="text-sm text-slate-500">No companies assigned to this plan yet.</p>
                ) : (
                  plan.companies.map((company) => (
                    <Link key={company.id} href={`/platform/companies/${company.id}`} className="rounded-2xl border border-slate-100 bg-white p-4 transition hover:border-slate-200 hover:shadow-md">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-slate-950">{company.name}</p>
                        <StatusBadge status={company.status} />
                      </div>
                      <p className="mt-2 text-xs text-slate-500">{company.slug}</p>
                    </Link>
                  ))
                )}
              </div>
            </AppCard>
          ))
        )}
      </div>
    </div>
  );
}

function PlanMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-bold text-slate-950">{value}</p>
    </div>
  );
}
