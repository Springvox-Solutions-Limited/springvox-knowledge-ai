"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Search } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/src/components/ui/empty-state";
import { PlatformPageHeader } from "@/src/components/platform/PlatformPageHeader";
import { fetchPlatformJson } from "@/src/lib/platform-client";

type UsageRow = {
  workspace_id: string;
  workspace_name: string;
  slug: string;
  questions_today: number;
  questions_month: number;
  uploads_today: number;
  uploads_month: number;
  documents_count: number;
  storage_bytes: number;
  embedding_calls: number;
  rerank_calls: number;
  llm_calls: number;
};

type SortKey =
  | "questions_month"
  | "uploads_month"
  | "documents_count"
  | "storage_bytes";

const SORTS: Array<{ value: SortKey; label: string }> = [
  { value: "questions_month", label: "Questions (month)" },
  { value: "uploads_month", label: "Uploads (month)" },
  { value: "documents_count", label: "Documents" },
  { value: "storage_bytes", label: "Storage" },
];

export default function PlatformUsagePage() {
  const [usage, setUsage] = useState<UsageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("questions_month");
  const [period, setPeriod] = useState<{ today: string; month: string } | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    fetchPlatformJson<{ usage: UsageRow[] }>("/api/platform/usage")
      .then((data) => {
        if (!cancelled) {
          setUsage(data.usage || []);
          setPeriod(readPeriod());
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load usage",
          );
          setPeriod(readPeriod());
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return usage
      .filter(
        (row) =>
          !normalized ||
          row.workspace_name.toLowerCase().includes(normalized) ||
          row.slug.toLowerCase().includes(normalized),
      )
      .sort(
        (a, b) =>
          b[sort] - a[sort] || a.workspace_name.localeCompare(b.workspace_name),
      );
  }, [usage, query, sort]);

  const totalQuestionsMonth = usage.reduce(
    (total, row) => total + row.questions_month,
    0,
  );

  return (
    <div className="admin-page" aria-busy={loading}>
      <PlatformPageHeader
        title="Usage"
        subtitle="Workspace usage metering for billing readiness, support, and capacity planning."
        privacyNote="Usage is aggregated in UTC for today and month to date. Document contents are not shown."
        aside={
          <div className="flex items-center gap-4 text-[11px] text-[var(--ink-muted)]">
            <span>
              <span className="font-medium tabular-nums text-[var(--ink)]">
                {usage.length}
              </span>{" "}
              workspaces
            </span>
            <span>
              <span className="font-medium tabular-nums text-[var(--ink)]">
                {totalQuestionsMonth.toLocaleString()}
              </span>{" "}
              questions this month
            </span>
          </div>
        }
      />

      {error ? (
        <div className="rounded-[10px] border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-300">
          {error}
        </div>
      ) : null}

      <section className="admin-shell-card flex flex-col gap-2 p-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            size={13}
            className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[var(--ink-muted)]"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter by workspace or slug"
            aria-label="Filter by workspace or slug"
            className="h-9 w-full rounded-lg border border-[var(--line)] bg-[var(--canvas-soft)] pr-2.5 pl-8 text-[12px] text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--ink-muted)] focus:border-[var(--accent-jade)] focus:ring-2 focus:ring-[var(--accent-jade-100)]"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={sort}
            onValueChange={(value) => setSort(value as SortKey)}
          >
            <SelectTrigger
              aria-label="Sort workspaces"
              className="h-9 w-[178px] rounded-lg border-[var(--line)] bg-[var(--canvas-soft)] px-2.5 text-[12px] text-[var(--ink)]"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORTS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="text-[12px]"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[var(--ink-muted)] lg:ml-auto">
          <span className="tabular-nums">
            Today · {period?.today ?? "—"}
          </span>
          <span className="h-3 w-px bg-[var(--line)]" aria-hidden="true" />
          <span className="tabular-nums">
            Month to date · {period?.month ?? "—"}
          </span>
        </div>
      </section>

      <section className="admin-shell-card overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-2.5">
          <div>
            <h2 className="text-[13px] font-semibold text-[var(--ink)]">
              Workspace usage
            </h2>
            <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">
              Questions, uploads, documents, and AI calls by workspace.
            </p>
          </div>
          <span className="text-[11px] tabular-nums text-[var(--ink-muted)]">
            {loading ? "Loading" : `${rows.length} of ${usage.length}`}
          </span>
        </div>

        {loading ? (
          <div className="px-4 py-10 text-center text-[12px] text-[var(--ink-muted)]">
            Loading usage...
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Activity}
            title={query ? "No matching workspaces" : "No usage recorded"}
            description={
              query
                ? "Try a different workspace name or slug."
                : "Usage appears after workspaces start asking questions and uploading documents."
            }
            className="rounded-none border-0 bg-transparent py-12"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left">
              <thead>
                <tr className="border-b border-[var(--line-soft)] text-[10px] text-[var(--ink-muted)]">
                  <th
                    rowSpan={2}
                    className="px-4 pt-2 pb-1.5 text-left align-bottom font-medium"
                  >
                    Workspace
                  </th>
                  <th
                    colSpan={2}
                    className="border-l border-[var(--line-soft)] px-3 pt-2 pb-1 text-center font-medium"
                  >
                    Questions
                  </th>
                  <th
                    colSpan={2}
                    className="border-l border-[var(--line-soft)] px-3 pt-2 pb-1 text-center font-medium"
                  >
                    Uploads
                  </th>
                  <th
                    rowSpan={2}
                    className="border-l border-[var(--line-soft)] px-3 pt-2 pb-1.5 text-right align-bottom font-medium"
                  >
                    Documents
                  </th>
                  <th
                    rowSpan={2}
                    className="border-l border-[var(--line-soft)] px-3 pt-2 pb-1.5 text-right align-bottom font-medium"
                  >
                    Storage
                  </th>
                  <th
                    colSpan={3}
                    className="border-l border-[var(--line-soft)] px-3 pt-2 pb-1 text-center font-medium"
                  >
                    AI calls
                  </th>
                </tr>
                <tr className="border-b border-[var(--line)] text-[10px] text-[var(--ink-muted)]">
                  <th className="border-l border-[var(--line-soft)] px-3 pb-1.5 text-right font-normal">
                    Today
                  </th>
                  <th className="px-3 pb-1.5 text-right font-normal">Month</th>
                  <th className="border-l border-[var(--line-soft)] px-3 pb-1.5 text-right font-normal">
                    Today
                  </th>
                  <th className="px-3 pb-1.5 text-right font-normal">Month</th>
                  <th className="border-l border-[var(--line-soft)] px-3 pb-1.5 text-right font-normal">
                    LLM
                  </th>
                  <th className="px-3 pb-1.5 text-right font-normal">
                    Embedding
                  </th>
                  <th className="px-3 pb-1.5 text-right font-normal">Rerank</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.workspace_id}
                    className="border-b border-[var(--line-soft)] transition-colors last:border-0 hover:bg-[var(--canvas-soft)]"
                  >
                    <td className="h-10 max-w-[18rem] px-4 py-1.5 align-middle">
                      <p className="truncate text-[12px] font-medium text-[var(--ink)]">
                        {row.workspace_name}
                      </p>
                      <p className="truncate font-mono text-[10px] text-[var(--ink-muted)]">
                        {row.slug}
                      </p>
                    </td>
                    <td className="h-10 border-l border-[var(--line-soft)] px-3 py-1.5 text-right align-middle text-[12px] tabular-nums text-[var(--ink-soft)]">
                      {row.questions_today.toLocaleString()}
                    </td>
                    <td className="h-10 px-3 py-1.5 text-right align-middle text-[12px] font-medium tabular-nums text-[var(--ink)]">
                      {row.questions_month.toLocaleString()}
                    </td>
                    <td className="h-10 border-l border-[var(--line-soft)] px-3 py-1.5 text-right align-middle text-[12px] tabular-nums text-[var(--ink-soft)]">
                      {row.uploads_today.toLocaleString()}
                    </td>
                    <td className="h-10 px-3 py-1.5 text-right align-middle text-[12px] tabular-nums text-[var(--ink-soft)]">
                      {row.uploads_month.toLocaleString()}
                    </td>
                    <td className="h-10 border-l border-[var(--line-soft)] px-3 py-1.5 text-right align-middle text-[12px] tabular-nums text-[var(--ink-soft)]">
                      {row.documents_count.toLocaleString()}
                    </td>
                    <td className="h-10 border-l border-[var(--line-soft)] px-3 py-1.5 text-right align-middle text-[12px] tabular-nums text-[var(--ink-soft)]">
                      {formatBytes(row.storage_bytes)}
                    </td>
                    <td className="h-10 border-l border-[var(--line-soft)] px-3 py-1.5 text-right align-middle text-[12px] tabular-nums text-[var(--ink-soft)]">
                      {row.llm_calls.toLocaleString()}
                    </td>
                    <td className="h-10 px-3 py-1.5 text-right align-middle text-[12px] tabular-nums text-[var(--ink-soft)]">
                      {row.embedding_calls.toLocaleString()}
                    </td>
                    <td className="h-10 px-3 py-1.5 text-right align-middle text-[12px] tabular-nums text-[var(--ink-soft)]">
                      {row.rerank_calls.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-[var(--line)] bg-[var(--canvas-soft)]">
                <tr className="text-[11px] font-medium text-[var(--ink)]">
                  <td className="h-10 px-4 py-1.5 align-middle">
                    Total ({rows.length})
                  </td>
                  <td className="h-10 border-l border-[var(--line-soft)] px-3 py-1.5 text-right align-middle tabular-nums">
                    {sum(rows, "questions_today").toLocaleString()}
                  </td>
                  <td className="h-10 px-3 py-1.5 text-right align-middle tabular-nums">
                    {sum(rows, "questions_month").toLocaleString()}
                  </td>
                  <td className="h-10 border-l border-[var(--line-soft)] px-3 py-1.5 text-right align-middle tabular-nums">
                    {sum(rows, "uploads_today").toLocaleString()}
                  </td>
                  <td className="h-10 px-3 py-1.5 text-right align-middle tabular-nums">
                    {sum(rows, "uploads_month").toLocaleString()}
                  </td>
                  <td className="h-10 border-l border-[var(--line-soft)] px-3 py-1.5 text-right align-middle tabular-nums">
                    {sum(rows, "documents_count").toLocaleString()}
                  </td>
                  <td className="h-10 border-l border-[var(--line-soft)] px-3 py-1.5 text-right align-middle tabular-nums">
                    {formatBytes(sum(rows, "storage_bytes"))}
                  </td>
                  <td className="h-10 border-l border-[var(--line-soft)] px-3 py-1.5 text-right align-middle tabular-nums">
                    {sum(rows, "llm_calls").toLocaleString()}
                  </td>
                  <td className="h-10 px-3 py-1.5 text-right align-middle tabular-nums">
                    {sum(rows, "embedding_calls").toLocaleString()}
                  </td>
                  <td className="h-10 px-3 py-1.5 text-right align-middle tabular-nums">
                    {sum(rows, "rerank_calls").toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function readPeriod() {
  const now = new Date();
  return {
    today: now.toLocaleDateString(undefined, {
      timeZone: "UTC",
      month: "short",
      day: "numeric",
    }),
    month: now.toLocaleDateString(undefined, {
      timeZone: "UTC",
      month: "long",
      year: "numeric",
    }),
  };
}

function sum(
  rows: UsageRow[],
  key:
    | "questions_today"
    | "questions_month"
    | "uploads_today"
    | "uploads_month"
    | "documents_count"
    | "storage_bytes"
    | "llm_calls"
    | "embedding_calls"
    | "rerank_calls",
) {
  return rows.reduce((total, row) => total + row[key], 0);
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}
