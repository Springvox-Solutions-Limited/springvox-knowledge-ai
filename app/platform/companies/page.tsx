"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { ResponsiveToolbar } from "@/src/components/layout/ResponsiveToolbar";
import { AppButton } from "@/src/components/ui/app-button";
import { AppCard } from "@/src/components/ui/app-card";
import { SearchBar } from "@/src/components/ui/search-bar";
import {
  AppTable,
  AppTableBody,
  AppTableCell,
  AppTableHead,
  AppTableHeader,
  AppTableRow,
} from "@/src/components/ui/app-table";
import {
  PlanBadge,
  StatusBadge,
} from "@/src/components/platform/PlatformBadges";
import { WORKSPACE_PLANS, WORKSPACE_STATUSES } from "@/src/lib/workspace";
import { PlatformPageHeader } from "@/src/components/platform/PlatformPageHeader";

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

export default function PlatformCompaniesPage() {
  const PAGE_SIZE = 8;
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

    setLoading(true);
    load();
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
    setCurrentPage(1);
  }, [search, statusFilter, planFilter]);

  return (
    <div className="admin-page">
      <PlatformPageHeader
        title="Companies"
        subtitle="View workspaces, plans, and team status."
      />

      <ResponsiveToolbar className="lg:grid lg:grid-cols-[1.3fr_0.35fr_0.35fr]">
        <SearchBar
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by company, slug, or workspace admin email"
          className="h-12 px-4"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-12 w-full rounded-xl border-[var(--line)] bg-[var(--surface)] px-4 text-sm shadow-sm focus-visible:border-teal-400 focus-visible:ring-[var(--accent-jade-100)]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-[var(--line)]">
            <SelectItem value="all">All statuses</SelectItem>
            {WORKSPACE_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="h-12 w-full rounded-xl border-[var(--line)] bg-[var(--surface)] px-4 text-sm shadow-sm focus-visible:border-teal-400 focus-visible:ring-[var(--accent-jade-100)]">
            <SelectValue placeholder="All plans" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-[var(--line)]">
            <SelectItem value="all">All plans</SelectItem>
            {WORKSPACE_PLANS.map((plan) => (
              <SelectItem key={plan} value={plan}>
                {plan}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </ResponsiveToolbar>
      {hasFilters ? (
        <div className="flex justify-stretch sm:justify-end">
          <AppButton
            tone="secondary"
            className="h-10 w-full px-4 text-xs sm:w-auto"
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
              setPlanFilter("all");
            }}
          >
            Clear filters
          </AppButton>
        </div>
      ) : null}

      {error && (
        <Alert className="rounded-2xl border-red-500/30 bg-red-500/10 text-red-300">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <OverflowGuard className="hidden md:block" mode="scroll">
        <AppCard className="overflow-hidden">
          <AppTable className="min-w-[960px] table-fixed">
            <colgroup>
              <col className="w-[24%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
              <col className="w-[20%]" />
              <col className="w-[8%]" />
              <col className="w-[9%]" />
              <col className="w-[9%]" />
              <col className="w-[11%]" />
              <col className="w-[9%]" />
            </colgroup>
            <AppTableHeader>
              <AppTableRow>
                {[
                  "Company",
                  "Status",
                  "Plan",
                  "Tenant Admin",
                  "Users",
                  "Documents",
                  "Questions",
                  "Created",
                  "Actions",
                ].map((column) => (
                  <AppTableHead key={column}>{column}</AppTableHead>
                ))}
              </AppTableRow>
            </AppTableHeader>
            <AppTableBody>
              {loading ? (
                <AppTableRow>
                  <AppTableCell
                    colSpan={9}
                    className="py-12 text-center text-sm text-[var(--ink-muted)]"
                  >
                    Loading companies...
                  </AppTableCell>
                </AppTableRow>
              ) : rows.length === 0 ? (
                <AppTableRow>
                  <AppTableCell
                    colSpan={9}
                    className="py-12 text-center text-sm text-[var(--ink-muted)]"
                  >
                    No workspaces matched your filters.
                  </AppTableCell>
                </AppTableRow>
              ) : (
                pagedRows.map((company) => (
                  <AppTableRow key={company.id}>
                    <AppTableCell className="max-w-[16rem]">
                      <Link
                        href={`/platform/companies/${company.id}`}
                        className="block truncate font-semibold text-[var(--ink)] hover:text-[var(--accent-jade)]"
                        title={company.name}
                      >
                        {company.name}
                      </Link>
                      <p
                        className="mt-1 truncate text-xs text-[var(--ink-muted)]"
                        title={company.slug}
                      >
                        {company.slug}
                      </p>
                    </AppTableCell>
                    <AppTableCell>
                      <StatusBadge status={company.status} />
                    </AppTableCell>
                    <AppTableCell>
                      <PlanBadge plan={company.plan} />
                    </AppTableCell>
                    <AppTableCell className="max-w-[16rem] text-sm text-[var(--ink-soft)]">
                      <span
                        className="block truncate"
                        title={company.tenant_admin_email || ""}
                      >
                        {company.tenant_admin_email || "Not assigned"}
                      </span>
                    </AppTableCell>
                    <AppTableCell className="text-sm font-semibold text-[var(--ink)]">
                      {company.total_users}
                    </AppTableCell>
                    <AppTableCell className="text-sm font-semibold text-[var(--ink)]">
                      {company.total_documents}
                    </AppTableCell>
                    <AppTableCell className="text-sm font-semibold text-[var(--ink)]">
                      {company.total_questions}
                    </AppTableCell>
                    <AppTableCell className="text-sm text-[var(--ink-soft)]">
                      {formatDate(company.created_at)}
                    </AppTableCell>
                    <AppTableCell>
                      <AppButton
                        asChild
                        tone="secondary"
                        className="h-9 rounded-lg px-3 text-xs text-[var(--accent-jade)] hover:text-[var(--accent-jade)]"
                      >
                        <Link href={`/platform/companies/${company.id}`}>
                          View
                        </Link>
                      </AppButton>
                    </AppTableCell>
                  </AppTableRow>
                ))
              )}
            </AppTableBody>
          </AppTable>
        </AppCard>
      </OverflowGuard>

      {!loading && rows.length > 0 ? (
        <MobileCardList>
          {pagedRows.map((company) => (
            <AppCard key={`${company.id}-mobile`} className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p
                      className="truncate font-semibold text-[var(--ink)]"
                      title={company.name}
                    >
                      {company.name}
                    </p>
                    <p
                      className="mt-1 truncate text-xs text-[var(--ink-muted)]"
                      title={company.slug}
                    >
                      {company.slug}
                    </p>
                  </div>
                  <StatusBadge status={company.status} />
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--ink-muted)]">
                  <PlanBadge plan={company.plan} />
                  <span>{company.total_users} users</span>
                  <span>{company.total_documents} documents</span>
                  <span>{company.total_questions} questions</span>
                </div>
                <p
                  className="truncate text-sm text-[var(--ink-soft)]"
                  title={company.tenant_admin_email || ""}
                >
                  {company.tenant_admin_email || "No workspace admin assigned"}
                </p>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-[var(--ink-muted)]">
                    Created {formatDate(company.created_at)}
                  </span>
                  <AppButton
                    asChild
                    tone="secondary"
                    className="h-9 px-3 text-xs"
                  >
                    <Link href={`/platform/companies/${company.id}`}>View</Link>
                  </AppButton>
                </div>
              </div>
            </AppCard>
          ))}
        </MobileCardList>
      ) : null}
      {rows.length > PAGE_SIZE ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[var(--ink-muted)]">
            Showing {(currentPage - 1) * PAGE_SIZE + 1}-
            {Math.min(currentPage * PAGE_SIZE, rows.length)} of {rows.length}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <AppButton
              tone="secondary"
              disabled={currentPage === 1}
              className="h-10 px-3 text-xs"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              Previous
            </AppButton>
            <AppButton
              tone="secondary"
              disabled={currentPage === totalPages}
              className="h-10 px-3 text-xs"
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
            >
              Next
            </AppButton>
          </div>
        </div>
      ) : null}
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
