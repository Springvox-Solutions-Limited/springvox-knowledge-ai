"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ChevronRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getAccessToken, getCurrentUserProfile } from "@/src/lib/auth-client";
import { AdminSearchInput } from "@/src/components/dashboard/AdminSearchInput";
import { cn, timeAgo, truncate } from "@/src/lib/utils";
import { isWorkspaceAdminRole, type UserProfile } from "@/src/lib/workspace";
import { AppPageHeader } from "@/src/components/shared/AppPageHeader";
import { EmptyState } from "@/src/components/ui/empty-state";

type KnowledgeGap = {
  id: string;
  question: string;
  status: "open" | "reviewed" | "resolved" | "ignored";
  occurrence_count: number;
  last_asked_at: string;
  created_at: string;
  sample_answer?: string | null;
};

const STATUS_OPTIONS: KnowledgeGap["status"][] = [
  "open",
  "reviewed",
  "resolved",
  "ignored",
];

const NO_ANSWER_FALLBACK = "No answer found in the uploaded documents.";

const STATUS_DOT: Record<KnowledgeGap["status"], string> = {
  open: "bg-red-400",
  reviewed: "bg-amber-400",
  resolved: "bg-emerald-400",
  ignored: "bg-[var(--ink-muted)]",
};

const STATUS_TEXT: Record<KnowledgeGap["status"], string> = {
  open: "text-red-300",
  reviewed: "text-amber-300",
  resolved: "text-emerald-300",
  ignored: "text-[var(--ink-soft)]",
};

function formatStatus(status: KnowledgeGap["status"]) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function KnowledgeGapsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [knowledgeGaps, setKnowledgeGaps] = useState<KnowledgeGap[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | KnowledgeGap["status"]
  >("all");
  const [error, setError] = useState<string | null>(null);
  const [viewGap, setViewGap] = useState<KnowledgeGap | null>(null);

  const loadKnowledgeGaps = async () => {
    try {
      setLoading(true);
      const currentProfile = await getCurrentUserProfile();
      setProfile(currentProfile);

      if (!currentProfile || !isWorkspaceAdminRole(currentProfile.role)) {
        router.replace("/dashboard/chat");
        return;
      }

      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error("Authentication session expired");
      }

      const response = await fetch("/api/knowledge-gaps", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load knowledge gaps");
      }

      const data = await response.json();
      setKnowledgeGaps(data.knowledgeGaps || []);
      setError(null);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load knowledge gaps",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      loadKnowledgeGaps();
    });
    return () => window.cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateGapStatus = async (
    id: string,
    status: KnowledgeGap["status"],
  ) => {
    try {
      setSavingId(id);
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error("Authentication session expired");
      }

      const response = await fetch("/api/knowledge-gaps", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ id, status }),
      });

      if (!response.ok) {
        throw new Error("Failed to update knowledge gap");
      }

      await loadKnowledgeGaps();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Failed to update knowledge gap",
      );
    } finally {
      setSavingId(null);
    }
  };

  const filteredKnowledgeGaps = knowledgeGaps.filter((gap) => {
    const matchesSearch =
      !searchQuery ||
      gap.question.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || gap.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const gapStatusCounts: Record<"all" | KnowledgeGap["status"], number> = {
    all: knowledgeGaps.length,
    open: knowledgeGaps.filter((gap) => gap.status === "open").length,
    reviewed: knowledgeGaps.filter((gap) => gap.status === "reviewed").length,
    resolved: knowledgeGaps.filter((gap) => gap.status === "resolved").length,
    ignored: knowledgeGaps.filter((gap) => gap.status === "ignored").length,
  };

  const activeGap = viewGap
    ? (knowledgeGaps.find((gap) => gap.id === viewGap.id) ?? viewGap)
    : null;

  if (profile && !isWorkspaceAdminRole(profile.role)) {
    return null;
  }

  return (
    <div className="admin-page">
      <AppPageHeader
        title="Unanswered questions"
        subtitle="Review the questions that still need better document coverage and use them to improve your workspace."
      />

      <div className="flex flex-col gap-2 rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-2 lg:flex-row lg:items-center">
        <AdminSearchInput
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search by question or topic..."
          className="h-9 w-full rounded-md bg-[var(--canvas-soft)] px-2.5 shadow-none lg:max-w-xs"
          inputClassName="text-[13px]"
        />
        <div className="flex flex-wrap items-center gap-1 lg:ml-auto">
          {(["all", ...STATUS_OPTIONS] as const).map((status) => (
            <button
              key={status}
              type="button"
              aria-pressed={statusFilter === status}
              onClick={() =>
                setStatusFilter(status as "all" | KnowledgeGap["status"])
              }
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[11px] transition-colors",
                statusFilter === status
                  ? "bg-[var(--accent-jade-50)] text-[var(--ink)] ring-1 ring-inset ring-[var(--accent-jade-100)]"
                  : "text-[var(--ink-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  status === "all"
                    ? "bg-[var(--accent-jade)]"
                    : STATUS_DOT[status],
                )}
              />
              {status === "all" ? "All" : formatStatus(status)}
              <span className="tabular-nums text-[var(--ink-muted)]">
                {gapStatusCounts[status]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-[10px] border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-[12px] text-red-300">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="font-medium">Could not load unanswered questions</p>
            <p className="mt-0.5 wrap-anywhere opacity-90">{error}</p>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--surface)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[42rem] text-left">
            <thead>
              <tr className="border-b border-[var(--line)] bg-[var(--canvas-soft)]">
                <th className="px-3 py-2 text-[11px] font-medium text-[var(--ink-muted)]">
                  Question
                </th>
                <th className="w-16 px-3 py-2 text-[11px] font-medium text-[var(--ink-muted)]">
                  Asked
                </th>
                <th className="w-32 px-3 py-2 text-[11px] font-medium text-[var(--ink-muted)]">
                  Status
                </th>
                <th className="hidden w-28 px-3 py-2 text-[11px] font-medium text-[var(--ink-muted)] sm:table-cell">
                  Last asked
                </th>
                <th className="w-10 px-2 py-2">
                  <span className="sr-only">Details</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6">
                    <div className="space-y-2.5">
                      {[1, 2, 3, 4].map((row) => (
                        <div
                          key={row}
                          className="h-9 animate-pulse rounded bg-[var(--surface-2)]"
                        />
                      ))}
                    </div>
                  </td>
                </tr>
              ) : filteredKnowledgeGaps.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8">
                    <EmptyState
                      icon={AlertTriangle}
                      title="No unanswered questions found"
                      description={NO_ANSWER_FALLBACK}
                      className="border-0 bg-transparent py-0"
                    />
                  </td>
                </tr>
              ) : (
                filteredKnowledgeGaps.map((gap) => (
                  <tr
                    key={gap.id}
                    className="border-b border-[var(--line-soft)] last:border-b-0 hover:bg-[var(--canvas-soft)]"
                  >
                    <td className="max-w-[32rem] px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => setViewGap(gap)}
                        className="block w-full min-w-0 text-left"
                      >
                        <span className="line-clamp-2 text-[13px] font-medium leading-5 text-[var(--ink)]">
                          {gap.question}
                        </span>
                        <span className="mt-0.5 line-clamp-1 text-[11px] text-[var(--ink-muted)]">
                          {gap.sample_answer
                            ? truncate(gap.sample_answer, 140)
                            : NO_ANSWER_FALLBACK}
                        </span>
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-[12px] tabular-nums text-[var(--ink-soft)]">
                      {gap.occurrence_count}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <div className="inline-flex items-center gap-1.5">
                        <span
                          aria-hidden="true"
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            STATUS_DOT[gap.status],
                          )}
                        />
                        <select
                          aria-label={`Set status for ${gap.question}`}
                          value={gap.status}
                          disabled={savingId === gap.id}
                          onChange={(event) =>
                            updateGapStatus(
                              gap.id,
                              event.target.value as KnowledgeGap["status"],
                            )
                          }
                          className={cn(
                            "h-7 rounded-md border border-[var(--line)] bg-[var(--surface)] px-1.5 text-[11px] font-medium outline-none transition-colors [color-scheme:dark] focus:border-[var(--accent-jade-100)] disabled:cursor-not-allowed disabled:opacity-60",
                            STATUS_TEXT[gap.status],
                          )}
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {formatStatus(status)}
                            </option>
                          ))}
                        </select>
                        {savingId === gap.id && (
                          <Loader2
                            size={11}
                            className="animate-spin text-[var(--ink-muted)]"
                          />
                        )}
                      </div>
                    </td>
                    <td
                      className="hidden whitespace-nowrap px-3 py-2.5 text-[11px] text-[var(--ink-muted)] sm:table-cell"
                      title={formatDate(gap.last_asked_at)}
                    >
                      {timeAgo(gap.last_asked_at) || "—"}
                    </td>
                    <td className="px-2 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => setViewGap(gap)}
                        aria-label={`View details for ${gap.question}`}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--ink-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Sheet
        open={Boolean(viewGap)}
        onOpenChange={(open) => {
          if (!open) setViewGap(null);
        }}
      >
        <SheetContent
          side="right"
          className="w-[min(100vw-1rem,30rem)] border-[var(--line)] bg-[var(--surface)] p-0"
        >
          <div className="flex h-full flex-col overflow-y-auto">
            <SheetHeader className="border-b border-[var(--line)] p-4 pr-10">
              <p className="text-[11px] text-[var(--ink-muted)]">
                Unanswered question
              </p>
              <SheetTitle className="text-[14px] font-semibold leading-6 text-[var(--ink)]">
                {activeGap?.question}
              </SheetTitle>
            </SheetHeader>

            {activeGap ? (
              <div className="flex-1 space-y-4 p-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-md border border-[var(--line)] bg-[var(--canvas-soft)] p-2.5">
                    <p className="text-[11px] text-[var(--ink-muted)]">Asked</p>
                    <p className="mt-0.5 text-[13px] tabular-nums text-[var(--ink)]">
                      {activeGap.occurrence_count}×
                    </p>
                  </div>
                  <div className="rounded-md border border-[var(--line)] bg-[var(--canvas-soft)] p-2.5">
                    <p className="text-[11px] text-[var(--ink-muted)]">
                      Reported
                    </p>
                    <p className="mt-0.5 text-[12px] tabular-nums text-[var(--ink)]">
                      {formatDate(activeGap.created_at)}
                    </p>
                  </div>
                  <div className="rounded-md border border-[var(--line)] bg-[var(--canvas-soft)] p-2.5">
                    <p className="text-[11px] text-[var(--ink-muted)]">
                      Last asked
                    </p>
                    <p className="mt-0.5 text-[12px] tabular-nums text-[var(--ink)]">
                      {formatDate(activeGap.last_asked_at)}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-medium text-[var(--ink-muted)]">
                    Answer status
                  </p>
                  <p className="mt-1.5 rounded-md border border-[var(--line)] bg-[var(--canvas-soft)] p-3 text-[12px] leading-6 text-[var(--ink-soft)] whitespace-pre-line wrap-anywhere">
                    {activeGap.sample_answer
                      ? `"${activeGap.sample_answer}"`
                      : NO_ANSWER_FALLBACK}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-[11px] font-medium text-[var(--ink-muted)]">
                      Status
                    </p>
                    {savingId === activeGap.id && (
                      <Loader2
                        size={11}
                        className="animate-spin text-[var(--ink-muted)]"
                      />
                    )}
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {STATUS_OPTIONS.map((status) => (
                      <button
                        key={status}
                        type="button"
                        disabled={savingId === activeGap.id}
                        onClick={() => updateGapStatus(activeGap.id, status)}
                        className={cn(
                          "h-8 rounded-md border px-2.5 text-[11px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                          activeGap.status === status
                            ? "border-[var(--accent-jade-100)] bg-[var(--accent-jade-50)] text-[var(--ink)]"
                            : "border-[var(--line)] text-[var(--ink-soft)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]",
                        )}
                      >
                        {formatStatus(status)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
