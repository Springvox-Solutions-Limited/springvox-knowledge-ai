"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { getAccessToken, getCurrentUserProfile } from "@/src/lib/auth-client";
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
        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value as "all" | KnowledgeGap["status"],
            )
          }
          className="admin-input shrink-0 px-4 py-3 text-sm font-medium transition-colors hover:border-slate-300 lg:min-w-[11rem] lg:w-auto"
        >
          <option value="all">All statuses</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-5 text-sm text-red-700 font-medium flex items-start gap-3">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Error loading gaps</p>
            <p className="text-xs mt-1 opacity-90">{error}</p>
          </div>
        </div>
      )}

      <div className="admin-shell-card border border-slate-200 bg-white overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 px-6 py-24">
            <div className="relative w-12 h-12">
              <Loader2 size={24} className="animate-spin text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600">
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
          <div className="divide-y divide-slate-100">
            {filteredKnowledgeGaps.map((gap, idx) => (
              <div
                key={gap.id}
                className="p-6 lg:p-8 transition-all hover:bg-slate-50/50 group"
              >
                <div className="flex flex-col gap-6 lg:gap-8">
                  <div className="space-y-4 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={cn(
                          "rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider border transition-colors",
                          gap.status === "open"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : gap.status === "resolved"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : gap.status === "ignored"
                                ? "bg-slate-100 text-slate-600 border-slate-200"
                                : "bg-blue-50 text-blue-700 border-blue-200",
                        )}
                      >
                        {gap.status}
                      </span>
                      <div className="h-6 w-px bg-slate-200" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        <span className="font-black text-slate-900">
                          {gap.occurrence_count}
                        </span>{" "}
                        {gap.occurrence_count === 1 ? "ask" : "asks"}
                      </span>
                    </div>
                    <p className="text-lg lg:text-xl font-semibold tracking-tight text-slate-950 leading-snug">
                      {gap.question}
                    </p>
                    <div className="flex flex-wrap gap-x-8 gap-y-3 text-xs font-medium text-slate-500 pt-2">
                      <span className="flex items-center gap-2">
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-400">Reported:</span>{" "}
                        {new Date(gap.created_at).toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric", year: "numeric" },
                        )}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-400">Last seen:</span>{" "}
                        {new Date(gap.last_asked_at).toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric", year: "numeric" },
                        )}
                      </span>
                    </div>
                    {gap.sample_answer && (
                      <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-4 mt-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                          No answer found
                        </p>
                        <p className="text-sm leading-relaxed text-slate-700">
                          "{truncate(gap.sample_answer, 180)}"
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 lg:flex-nowrap pt-2 border-t border-slate-100">
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
                              : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed",
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
