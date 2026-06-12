"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { getAccessToken, getCurrentUserProfile } from "@/src/lib/auth-client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminSearchInput } from "@/src/components/dashboard/AdminSearchInput";
import { cn, truncate } from "@/src/lib/utils";
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
    loadKnowledgeGaps();
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

  if (profile && !isWorkspaceAdminRole(profile.role)) {
    return null;
  }

  return (
    <div className="admin-page">
      <AppPageHeader
        eyebrow="Question Review"
        title="Unanswered questions"
        subtitle="Review the questions that still need better document coverage and use them to improve your workspace."
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        <AdminSearchInput
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search by question or topic..."
          className="flex-1 lg:min-w-[20rem]"
        />
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as "all" | KnowledgeGap["status"])}
        >
          <SelectTrigger className="h-12 w-full rounded-xl border-[var(--line)] bg-[var(--surface)] px-4 text-sm shadow-sm focus-visible:border-teal-400 focus-visible:ring-[var(--accent-jade-100)] lg:w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-[var(--line)]">
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_OPTIONS.map((status) => (
              <SelectItem key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-300 font-medium flex items-start gap-3">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Error loading gaps</p>
            <p className="text-xs mt-1 opacity-90">{error}</p>
          </div>
        </div>
      )}

      <div className="admin-shell-card border border-[var(--line)] bg-[var(--surface)] overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 px-6 py-24">
            <div className="relative w-12 h-12">
              <Loader2 size={24} className="animate-spin text-[var(--ink-muted)]" />
            </div>
            <p className="text-sm font-medium text-[var(--ink-soft)]">
              Loading unanswered questions...
            </p>
          </div>
        ) : filteredKnowledgeGaps.length === 0 ? (
          <div className="px-6 py-24 text-center">
            <EmptyState
              icon={AlertTriangle}
              title="No unanswered questions found"
              description="Recent questions are being answered from your uploaded documents."
              className="border-0 bg-transparent py-0"
            />
          </div>
        ) : (
          <div className="divide-y divide-[var(--line)]">
            {filteredKnowledgeGaps.map((gap) => (
              <div
                key={gap.id}
                className="p-6 lg:p-8 transition-all hover:bg-[var(--surface-2)] group"
              >
                <div className="flex flex-col gap-6 lg:gap-8">
                  <div className="space-y-4 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={cn(
                          "rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider border transition-colors",
                          gap.status === "open"
                            ? "bg-red-500/10 text-red-300 border-red-500/30"
                            : gap.status === "resolved"
                              ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                              : gap.status === "ignored"
                                ? "bg-[var(--surface-2)] text-[var(--ink-soft)] border-[var(--line)]"
                                : "bg-[var(--surface-2)] text-[var(--ink-soft)] border-[var(--line)]",
                        )}
                      >
                        {gap.status}
                      </span>
                      <div className="h-6 w-px bg-[var(--surface-2)]" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                        <span className="font-bold text-[var(--ink)]">
                          {gap.occurrence_count}
                        </span>{" "}
                        {gap.occurrence_count === 1 ? "ask" : "asks"}
                      </span>
                    </div>
                    <p className="text-lg lg:text-xl font-semibold tracking-tight text-[var(--ink)] leading-snug">
                      {gap.question}
                    </p>
                    <div className="flex flex-wrap gap-x-8 gap-y-3 text-xs font-medium text-[var(--ink-muted)] pt-2">
                      <span className="flex items-center gap-2">
                        <span className="text-slate-300">•</span>
                        <span className="text-[var(--ink-muted)]">Reported:</span>{" "}
                        {new Date(gap.created_at).toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric", year: "numeric" },
                        )}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="text-slate-300">•</span>
                        <span className="text-[var(--ink-muted)]">Last seen:</span>{" "}
                        {new Date(gap.last_asked_at).toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric", year: "numeric" },
                        )}
                      </span>
                    </div>
                    {gap.sample_answer && (
                      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-4 mt-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)] mb-2">
                          No answer found
                        </p>
                        <p className="text-sm leading-relaxed text-[var(--ink-soft)]">
                          "{truncate(gap.sample_answer, 180)}"
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 lg:flex-nowrap pt-2 border-t border-[var(--line)]">
                    <div className="pt-2 flex items-center gap-2 w-full lg:w-auto">
                      {STATUS_OPTIONS.map((status) => (
                        <button
                          key={status}
                          type="button"
                          disabled={savingId === gap.id}
                          onClick={() => updateGapStatus(gap.id, status)}
                          className={cn(
                            "rounded-lg px-3 py-2 text-[11px] font-bold uppercase tracking-wider transition-all border",
                            status === gap.status
                              ? "bg-slate-950 text-white border-slate-950 shadow-lg shadow-slate-950/20"
                              : "bg-[var(--surface)] text-[var(--ink-soft)] border-[var(--line)] hover:border-[var(--line)] hover:text-[var(--ink)] hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed",
                          )}
                        >
                          {savingId === gap.id && status === gap.status ? (
                            <Loader2
                              size={14}
                              className="animate-spin inline"
                            />
                          ) : (
                            status
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
