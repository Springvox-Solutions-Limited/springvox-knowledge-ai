"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, ReceiptText } from "lucide-react";

import { EmptyState } from "@/src/components/ui/empty-state";
import { StatusBadge } from "@/src/components/platform/PlatformBadges";
import { PlatformPageHeader } from "@/src/components/platform/PlatformPageHeader";
import { fetchPlatformJson } from "@/src/lib/platform-client";
import { cn } from "@/src/lib/utils";

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
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await fetchPlatformJson<{ plans: PlanRecord[] }>(
          "/api/platform/plans",
        );
        if (!cancelled) setPlans(result.plans || []);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load plans",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const assignedWorkspaces = plans.reduce(
    (total, plan) => total + plan.workspaceCount,
    0,
  );

  return (
    <div className="admin-page" aria-busy={loading}>
      <PlatformPageHeader
        title="Plans"
        subtitle="Review workspace plan tiers and operational capacity guidance."
        privacyNote="Showing plan capacity guidance and workspace assignments."
        aside={
          <div className="flex items-center gap-4 text-[11px] text-[var(--ink-muted)]">
            <span>
              <span className="font-medium tabular-nums text-[var(--ink)]">
                {plans.length}
              </span>{" "}
              plans
            </span>
            <span>
              <span className="font-medium tabular-nums text-[var(--ink)]">
                {assignedWorkspaces}
              </span>{" "}
              workspaces assigned
            </span>
          </div>
        }
      />

      {error ? (
        <div className="rounded-[10px] border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-300">
          {error}
        </div>
      ) : null}

      <section className="admin-shell-card overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-2.5">
          <div>
            <h2 className="text-[13px] font-semibold text-[var(--ink)]">
              Plan capacity
            </h2>
            <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">
              Suggested limits and workspace assignment by tier.
            </p>
          </div>
          <span className="text-[11px] tabular-nums text-[var(--ink-muted)]">
            {loading ? "Loading" : `${plans.length} tiers`}
          </span>
        </div>

        {loading ? (
          <div className="px-4 py-10 text-center text-[12px] text-[var(--ink-muted)]">
            Loading plans...
          </div>
        ) : plans.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title="No plan tiers found"
            description="Plan capacity guidance will appear here once tiers are configured."
            className="rounded-none border-0 bg-transparent py-12"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-[var(--line)] text-[11px] text-[var(--ink-muted)]">
                  <th className="px-4 py-2 font-medium">Plan</th>
                  <th className="px-3 py-2 text-right font-medium">
                    Documents
                  </th>
                  <th className="px-3 py-2 text-right font-medium">Users</th>
                  <th className="px-3 py-2 text-right font-medium">
                    Questions / month
                  </th>
                  <th className="px-4 py-2 text-right font-medium">
                    Workspaces
                  </th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => {
                  const isOpen = expanded === plan.plan;
                  return (
                    <Fragment key={plan.plan}>
                      <tr className="border-b border-[var(--line-soft)] transition-colors last:border-0 hover:bg-[var(--canvas-soft)]">
                        <td className="h-11 py-1.5 pr-3 pl-4 align-middle">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setExpanded(isOpen ? null : plan.plan)
                              }
                              aria-expanded={isOpen}
                              aria-label={`${
                                isOpen ? "Collapse" : "Expand"
                              } ${plan.label} workspaces`}
                              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[var(--line)] text-[var(--ink-muted)] transition-colors hover:border-[var(--accent-jade-200)] hover:text-[var(--ink)]"
                            >
                              <ChevronRight
                                size={13}
                                strokeWidth={1.5}
                                className={cn(
                                  "transition-transform duration-150",
                                  isOpen && "rotate-90",
                                )}
                              />
                            </button>
                            <div className="min-w-0">
                              <p className="text-[12px] font-medium text-[var(--ink)]">
                                {plan.label}
                              </p>
                              <p
                                className="truncate text-[11px] text-[var(--ink-muted)]"
                                title={plan.description}
                              >
                                {plan.description}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="h-11 px-3 py-1.5 text-right align-middle text-[12px] tabular-nums text-[var(--ink-soft)]">
                          {plan.suggestedDocuments}
                        </td>
                        <td className="h-11 px-3 py-1.5 text-right align-middle text-[12px] tabular-nums text-[var(--ink-soft)]">
                          {plan.suggestedUsers}
                        </td>
                        <td className="h-11 px-3 py-1.5 text-right align-middle text-[12px] tabular-nums text-[var(--ink-soft)]">
                          {plan.suggestedMonthlyQuestions}
                        </td>
                        <td className="h-11 px-4 py-1.5 text-right align-middle text-[12px] font-medium tabular-nums text-[var(--ink)]">
                          {plan.workspaceCount}
                        </td>
                      </tr>
                      {isOpen ? (
                        <tr className="border-b border-[var(--line-soft)]">
                          <td
                            colSpan={5}
                            className="bg-[var(--canvas-soft)] px-4 py-3"
                          >
                            <p className="text-[11px] leading-5 text-[var(--ink-soft)]">
                              {plan.description}
                            </p>
                            <p className="mt-1 font-mono text-[10px] text-[var(--ink-muted)]">
                              plan key · {plan.plan}
                            </p>

                            <div className="mt-2.5 overflow-hidden rounded-md border border-[var(--line)] bg-[var(--surface)]">
                              {plan.companies.length === 0 ? (
                                <p className="px-3 py-4 text-center text-[11px] text-[var(--ink-muted)]">
                                  No workspaces are assigned to this plan.
                                </p>
                              ) : (
                                <table className="w-full text-left">
                                  <thead>
                                    <tr className="border-b border-[var(--line)] text-[10px] text-[var(--ink-muted)]">
                                      <th className="px-3 py-1.5 font-medium">
                                        Workspace
                                      </th>
                                      <th className="px-3 py-1.5 font-medium">
                                        Status
                                      </th>
                                      <th className="px-3 py-1.5 text-right font-medium">
                                        Created
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {plan.companies.map((company) => (
                                      <tr
                                        key={company.id}
                                        className="h-8 border-b border-[var(--line-soft)] transition-colors last:border-0 hover:bg-[var(--canvas-soft)]"
                                      >
                                        <td className="max-w-[22rem] px-3 py-1 align-middle">
                                          <Link
                                            href={`/platform/companies/${company.id}`}
                                            className="flex min-w-0 items-baseline gap-2 text-[12px] font-medium text-[var(--ink)] hover:text-[var(--accent-jade)]"
                                          >
                                            <span className="truncate">
                                              {company.name}
                                            </span>
                                            <span className="truncate font-mono text-[10px] font-normal text-[var(--ink-muted)]">
                                              {company.slug}
                                            </span>
                                          </Link>
                                        </td>
                                        <td className="px-3 py-1 align-middle">
                                          <StatusBadge status={company.status} />
                                        </td>
                                        <td className="px-3 py-1 text-right align-middle">
                                          <span className="font-mono text-[10px] tabular-nums text-[var(--ink-muted)]">
                                            {formatDate(company.created_at)}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
