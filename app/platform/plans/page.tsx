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
        subtitle="Review workspace plan tiers and operational capacity guidance."
        privacyNote="Showing plan capacity guidance and workspace assignments."
      />

      {error && <Alert className="rounded-2xl border-red-500/30 bg-red-500/10 text-red-300"><AlertDescription>{error}</AlertDescription></Alert>}

      <div className="space-y-6">
        {loading ? (
          <AppCard className="p-6 text-sm text-[var(--ink-muted)]">Loading plans...</AppCard>
        ) : (
          plans.map((plan) => (
            <AppCard key={plan.plan} className="p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <PlanBadge plan={plan.plan} />
                  <h2 className="text-2xl font-bold text-[var(--ink)]">{plan.label}</h2>
                  <p className="max-w-2xl text-sm text-[var(--ink-soft)]">{plan.description}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <PlanMetric label="Suggested documents" value={plan.suggestedDocuments} />
                  <PlanMetric label="Suggested users" value={plan.suggestedUsers} />
                  <PlanMetric label="Suggested monthly questions" value={plan.suggestedMonthlyQuestions} />
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[var(--ink)]">Workspaces on this plan</p>
                  <span className="text-lg font-bold text-[var(--ink)]">{plan.workspaceCount}</span>
                </div>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {plan.companies.length === 0 ? (
                  <p className="text-sm text-[var(--ink-muted)]">No companies assigned to this plan yet.</p>
                ) : (
                  plan.companies.map((company) => (
                    <Link key={company.id} href={`/platform/companies/${company.id}`} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 transition hover:border-[var(--line)] hover:shadow-md">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-[var(--ink)]">{company.name}</p>
                        <StatusBadge status={company.status} />
                      </div>
                      <p className="mt-2 text-xs text-[var(--ink-muted)]">{company.slug}</p>
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
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-muted)]">{label}</p>
      <p className="mt-2 text-lg font-bold text-[var(--ink)]">{value}</p>
    </div>
  );
}
