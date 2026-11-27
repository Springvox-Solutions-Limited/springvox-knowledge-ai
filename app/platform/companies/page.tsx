"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchPlatformJson } from "@/src/lib/platform-client";
import { MobileCardList } from "@/src/components/layout/MobileCardList";
import { OverflowGuard } from "@/src/components/layout/OverflowGuard";
import { AppButton } from "@/src/components/ui/app-button";
import { AppCard } from "@/src/components/ui/app-card";
import { SearchBar } from "@/src/components/ui/search-bar";
import { PlanBadge, StatusBadge } from "@/src/components/platform/PlatformBadges";
import { PlatformPageHeader } from "@/src/components/platform/PlatformPageHeader";
import { PLAN_DETAILS, WORKSPACE_PLANS, WORKSPACE_STATUSES } from "@/src/lib/workspace";

type CompanyRecord = {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
  tenant_admin_email: string | null;
  total_users: number;
  total_documents: number;
  total_questions: number;
  open_unanswered_questions: number;
  created_at: string;
  last_activity: string | null;
};

const selectTriggerClass =
  "h-9 w-full rounded-md border-[var(--line)] bg-[var(--surface)] px-2.5 text-[12px] text-[var(--ink)] shadow-none focus:border-[var(--accent-jade)] focus:ring-2 focus:ring-[var(--accent-jade-100)]";

export default function PlatformCompaniesPage() {
  const PAGE_SIZE = 8;
  const router = useRouter();
  const [companies, setCompanies] = useState<CompanyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function load() {
      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (statusFilter !== "all") params.set("status", statusFilter);
        if (planFilter !== "all") params.set("plan", planFilter);
        const result = await fetchPlatformJson<{ companies: CompanyRecord[] }>(
          `/api/platform/companies?${params.toString()}`,
        );
        setCompanies(result.companies || []);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load companies",
        );
      } finally {
        setLoading(false);
      }
    }

    const frame = window.requestAnimationFrame(() => {
      setLoading(true);
      load();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [search, statusFilter, planFilter]);

  const rows = useMemo(() => companies, [companies]);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pagedRows = rows.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const hasFilters =
    Boolean(search) || statusFilter !== "all" || planFilter !== "all";

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setCurrentPage(1));
    return () => window.cancelAnimationFrame(frame);
  }, [search, statusFilter, planFilter]);

  return (
    <div className="admin-page" aria-busy={loading}>
      <PlatformPageHeader
        title="Companies"
        subtitle="Every company workspace, with plan, ownership, and activity in one place."
        aside={
          <span className="text-[11px] tabular-nums text-[var(--ink-muted)]">
            {loading
              ? "Loading…"
              : `${rows.length} ${rows.length === 1 ? "company" : "companies"}`}
          </span>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchBar
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search company, slug, or workspace admin email"
          className="h-9 rounded-md px-2.5 shadow-none focus-within:border-[var(--accent-jade)] focus-within:ring-2 focus-within:ring-[var(--accent-jade-100)] sm:flex-1"
          inputClassName="text-[12px]"
        />
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1 sm:w-[142px] sm:flex-none">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className={selectTriggerClass}>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent className="rounded-md border-[var(--line)]">
                <SelectItem value="all" className="text-[12px]">
                  All statuses
                </SelectItem>
                {WORKSPACE_STATUSES.map((status) => (
                  <SelectItem key={status} value={status} className="text-[12px]">
                    {formatStatusLabel(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-0 flex-1 sm:w-[142px] sm:flex-none">
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className={selectTriggerClass}>
                <SelectValue placeholder="All plans" />
              </SelectTrigger>
              <SelectContent className="rounded-md border-[var(--line)]">
                <SelectItem value="all" className="text-[12px]">
                  All plans
                </SelectItem>
                {WORKSPACE_PLANS.map((plan) => (
                  <SelectItem key={plan} value={plan} className="text-[12px]">
                    {PLAN_DETAILS[plan].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {hasFilters ? (
            <AppButton
              tone="ghost"
              className="h-9 shrink-0 px-2 text-[11px]"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setPlanFilter("all");
              }}
            >
              Clear filters
            </AppButton>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="rounded-[10px] border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-300">
          {error}
        </div>
      ) : null}

      <section className="admin-shell-card overflow-hidden">
        <div className="hidden md:block">
          <OverflowGuard mode="scroll">
            <table className="w-full min-w-[900px] text-left">
              <thead>
                <tr className="border-b border-[var(--line)] text-[11px] text-[var(--ink-muted)]">
                  <th className="px-4 py-2.5 font-medium sm:px-5">Company</th>
                  <th className="px-4 py-2.5 font-medium">Owner</th>
                  <th className="px-3 py-2.5 font-medium">Plan</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 text-right font-medium">
                    Documents
                  </th>
                  <th className="px-3 py-2.5 text-right font-medium">
                    Questions
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium sm:px-5">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line-soft)]">
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center text-[12px] text-[var(--ink-muted)]"
                    >
                      Loading companies…
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center text-[12px] text-[var(--ink-muted)]"
                    >
                      No companies match these filters.
                    </td>
                  </tr>
                ) : (
                  pagedRows.map((company) => (
                    <tr
                      key={company.id}
                      className="group cursor-pointer transition-colors hover:bg-[var(--canvas-soft)]"
                      onClick={() =>
                        router.push(`/platform/companies/${company.id}`)
                      }
                    >
                      <td className="max-w-[18rem] px-4 py-1.5 sm:px-5">
                        <Link
                          href={`/platform/companies/${company.id}`}
                          onClick={(event) => event.stopPropagation()}
                          className="block truncate text-[12px] font-medium leading-4 text-[var(--ink)] hover:text-[var(--accent-jade)]"
                          title={company.name}
                        >
                          {company.name}
                        </Link>
                        <p
                          className="truncate text-[11px] leading-4 text-[var(--ink-muted)]"
                          title={company.slug}
                        >
                          {company.slug}
                        </p>
                      </td>
                      <td className="max-w-[15rem] px-4 py-2.5">
                        <span
                          className="block truncate text-[12px] text-[var(--ink-soft)]"
                          title={company.tenant_admin_email || ""}
                        >
                          {company.tenant_admin_email || "Not assigned"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <PlanBadge plan={company.plan} />
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusBadge status={company.status} />
                      </td>
                      <td className="px-3 py-2.5 text-right text-[12px] tabular-nums text-[var(--ink-soft)]">
                        {company.total_documents}
                      </td>
                      <td className="px-3 py-2.5 text-right text-[12px] tabular-nums text-[var(--ink-soft)]">
                        {company.total_questions}
                      </td>
                      <td className="px-4 py-2.5 text-right sm:px-5">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="text-[11px] tabular-nums text-[var(--ink-muted)]">
                            {formatDate(company.created_at)}
                          </span>
                          <ChevronRight
                            size={13}
                            className="text-[var(--ink-muted)] opacity-0 transition-opacity group-hover:opacity-100"
                            aria-hidden="true"
                          />
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </OverflowGuard>
        </div>

        <div className="md:hidden">
          {loading ? (
            <p className="px-4 py-10 text-center text-[12px] text-[var(--ink-muted)]">
              Loading companies…
            </p>
          ) : rows.length === 0 ? (
            <p className="px-4 py-10 text-center text-[12px] text-[var(--ink-muted)]">
              No companies match these filters.
            </p>
          ) : (
            <MobileCardList className="gap-2.5 p-3">
              {pagedRows.map((company) => (
                <AppCard
                  key={`${company.id}-mobile`}
                  className="rounded-[10px] p-3.5"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/platform/companies/${company.id}`}
                          className="block truncate text-[13px] font-medium text-[var(--ink)] hover:text-[var(--accent-jade)]"
                          title={company.name}
                        >
                          {company.name}
                        </Link>
                        <p
                          className="mt-0.5 truncate text-[11px] text-[var(--ink-muted)]"
                          title={company.slug}
                        >
                          {company.slug}
                        </p>
                      </div>
                      <StatusBadge status={company.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--ink-muted)]">
                      <PlanBadge plan={company.plan} />
                      <span className="tabular-nums">
                        {company.total_users} users
                      </span>
                      <span className="tabular-nums">
                        {company.total_documents} documents
                      </span>
                      <span className="tabular-nums">
                        {company.total_questions} questions
                      </span>
                    </div>
                    <p
                      className="truncate text-[12px] text-[var(--ink-soft)]"
                      title={company.tenant_admin_email || ""}
                    >
                      {company.tenant_admin_email ||
                        "No workspace admin assigned"}
                    </p>
                    <div className="flex items-center justify-between gap-3 border-t border-[var(--line-soft)] pt-2.5">
                      <span className="text-[11px] tabular-nums text-[var(--ink-muted)]">
                        Created {formatDate(company.created_at)}
                      </span>
                      <AppButton
                        asChild
                        tone="secondary"
                        className="h-7 px-2 text-[11px]"
                      >
                        <Link href={`/platform/companies/${company.id}`}>
                          View
                        </Link>
                      </AppButton>
                    </div>
                  </div>
                </AppCard>
              ))}
            </MobileCardList>
          )}
        </div>

        {rows.length > PAGE_SIZE ? (
          <div className="flex items-center justify-between gap-3 border-t border-[var(--line)] px-4 py-2">
            <p className="text-[11px] tabular-nums text-[var(--ink-muted)]">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, rows.length)} of {rows.length}
            </p>
            <div className="flex items-center gap-1.5">
              <AppButton
                tone="secondary"
                disabled={currentPage === 1}
                className="h-7 px-2 text-[11px]"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              >
                Previous
              </AppButton>
              <span className="px-1 text-[11px] tabular-nums text-[var(--ink-muted)]">
                {currentPage} / {totalPages}
              </span>
              <AppButton
                tone="secondary"
                disabled={currentPage === totalPages}
                className="h-7 px-2 text-[11px]"
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
              >
                Next
              </AppButton>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatStatusLabel(value: string) {
  if (value === "past_due") return "Past due";
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, " ");
}
