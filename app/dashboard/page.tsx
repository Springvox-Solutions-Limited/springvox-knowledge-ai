"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CircleAlert,
  FileText,
  MessageSquare,
  Upload,
  Users,
} from "lucide-react";

import { getAccessToken, getCurrentUserProfile } from "@/src/lib/auth-client";
import { cn } from "@/src/lib/utils";
import { timeAgo } from "@/src/lib/utils";
import { type UserProfile } from "@/src/lib/workspace";
import { AppPageHeader } from "@/src/components/shared/AppPageHeader";
import { AppButton } from "@/src/components/ui/app-button";
import { EmptyState } from "@/src/components/ui/empty-state";
import { StatCard } from "@/src/components/ui/stat-card";

type AnalyticsSummary = {
  totalDocuments: number;
  completedDocuments: number;
  failedDocuments: number;
  totalChunks: number;
  totalQuestions: number;
  questionsLast7Days: number;
  openKnowledgeGaps: number;
  totalUsers: number;
  viewers: number;
  tenantAdmins: number;
  platformAdmins: number;
  pendingInvitations: number;
  totalFeedback: number;
  helpfulFeedback: number;
  negativeFeedback: number;
};

type AnalyticsResponse = {
  workspace: { name: string; assistant_name: string | null } | null;
  summary: AnalyticsSummary;
  recentQuestions: Array<{
    id: string;
    question: string;
    user_email: string;
    had_sources: boolean;
    knowledge_gap: boolean;
    created_at: string;
  }>;
  recentKnowledgeGaps: Array<{
    id: string;
    question: string;
    occurrence_count: number;
    status: string;
  }>;
};

const EMPTY_SUMMARY: AnalyticsSummary = {
  totalDocuments: 0,
  completedDocuments: 0,
  failedDocuments: 0,
  totalChunks: 0,
  totalQuestions: 0,
  questionsLast7Days: 0,
  openKnowledgeGaps: 0,
  totalUsers: 0,
  viewers: 0,
  tenantAdmins: 0,
  platformAdmins: 0,
  pendingInvitations: 0,
  totalFeedback: 0,
  helpfulFeedback: 0,
  negativeFeedback: 0,
};

function HealthBar({
  value,
  tone = "jade",
}: {
  value: number;
  tone?: "jade" | "amber" | "red";
}) {
  const fill =
    tone === "jade"
      ? "bg-[var(--accent-jade)]"
      : tone === "amber"
        ? "bg-amber-400/80"
        : "bg-red-400/80";

  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
      <div
        className={cn("h-full rounded-full transition-all", fill)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export default function DashboardOverview() {
  const [summary, setSummary] = useState<AnalyticsSummary>(EMPTY_SUMMARY);
  const [recentQuestions, setRecentQuestions] = useState<
    AnalyticsResponse["recentQuestions"]
  >([]);
  const [recentKnowledgeGaps, setRecentKnowledgeGaps] = useState<
    AnalyticsResponse["recentKnowledgeGaps"]
  >([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSummary() {
      const currentProfile = await getCurrentUserProfile();
      setProfile(currentProfile);

      if (!currentProfile || currentProfile.role === "viewer") {
        setLoading(false);
        return;
      }

      const accessToken = await getAccessToken();
      if (!accessToken) {
        setLoading(false);
        return;
      }

      const response = await fetch("/api/analytics/summary", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        setLoading(false);
        return;
      }

      const data = (await response.json()) as AnalyticsResponse;
      setSummary(data.summary || EMPTY_SUMMARY);
      setRecentQuestions(data.recentQuestions || []);
      setRecentKnowledgeGaps(data.recentKnowledgeGaps || []);
      setLoading(false);
    }

    fetchSummary();
  }, []);

  if (profile?.role === "viewer") {
    return null;
  }

  const cards = [
    {
      title: "Documents ready",
      value: summary.completedDocuments,
      icon: FileText,
    },
    {
      title: "Questions asked",
      value: summary.totalQuestions,
      icon: MessageSquare,
      meta: `${summary.questionsLast7Days} in 7 days`,
    },
    {
      title: "Team members",
      value: summary.totalUsers,
      icon: Users,
      meta: `${summary.pendingInvitations} pending`,
    },
    {
      title: "Open gaps",
      value: summary.openKnowledgeGaps,
      icon: CircleAlert,
      alert: summary.openKnowledgeGaps > 0,
      meta: summary.openKnowledgeGaps > 0 ? "Needs attention" : undefined,
    },
  ];

  const readinessPct =
    summary.totalDocuments > 0
      ? Math.round((summary.completedDocuments / summary.totalDocuments) * 100)
      : 0;
  const sourcedCount = recentQuestions.filter((q) => q.had_sources).length;
  const coveragePct =
    recentQuestions.length > 0
      ? Math.round((sourcedCount / recentQuestions.length) * 100)
      : null;
  const hasDocuments = summary.totalDocuments > 0;

  if (loading) {
    return (
      <div className="admin-page animate-pulse">
        <div className="space-y-2">
          <div className="h-8 w-2/3 max-w-md rounded-lg bg-[var(--surface-2)]" />
          <div className="h-4 w-1/2 max-w-sm rounded bg-[var(--surface-2)]" />
        </div>
        <div className="rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-5">
          <div className="h-4 w-40 rounded bg-[var(--surface-2)]" />
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item}>
                <div className="h-3 w-20 rounded bg-[var(--surface-2)]" />
                <div className="mt-2 h-1.5 w-full rounded-full bg-[var(--surface-2)]" />
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-32 rounded-[10px] border border-[var(--line)] bg-[var(--surface)]"
            />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.5fr_0.9fr]">
          <div className="h-72 rounded-[10px] border border-[var(--line)] bg-[var(--surface)]" />
          <div className="space-y-4">
            <div className="h-40 rounded-[10px] border border-[var(--line)] bg-[var(--surface)]" />
            <div className="h-40 rounded-[10px] border border-[var(--line)] bg-[var(--surface)]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <AppPageHeader
        title="Overview"
        subtitle={
          hasDocuments
            ? `${summary.completedDocuments} documents ready · ${summary.totalQuestions} questions answered · ${summary.totalUsers} team members`
            : "Upload your first documents to start answering questions from your company knowledge."
        }
        aside={
          <div className="flex flex-wrap items-center gap-2">
            <AppButton asChild tone="primary" className="h-9 px-3 text-[12px]">
              <Link href="/dashboard/chat">
                <MessageSquare size={14} />
                Ask a question
              </Link>
            </AppButton>
            <AppButton asChild tone="secondary" className="h-9 px-3 text-[12px]">
              <Link href="/dashboard/upload">
                <Upload size={14} />
                Upload
              </Link>
            </AppButton>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.title} href="/dashboard/analytics" className="block">
            <StatCard
              label={card.title}
              value={card.value}
              icon={card.icon}
              meta={card.meta}
              className={cn(card.alert && "border-red-500/30")}
            />
          </Link>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.85fr)]">
        <section className="admin-shell-card min-w-0 overflow-hidden">
          <header className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3.5 sm:px-5">
            <div>
              <h2 className="text-[14px] font-semibold text-[var(--ink)]">Recent questions</h2>
              <p className="mt-0.5 text-[12px] text-[var(--ink-muted)]">What your team has been asking.</p>
            </div>
            <Link href="/dashboard/analytics" className="text-[11px] font-medium text-[var(--ink-muted)] hover:text-[var(--ink)]">
              View all
            </Link>
          </header>
          {recentQuestions.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No questions yet"
              description="Activity appears here once your team starts asking."
              action={
                <AppButton asChild tone="subtle" className="h-9 px-3 text-[12px]">
                  <Link href="/dashboard/chat">Ask the first question</Link>
                </AppButton>
              }
              className="border-0 bg-transparent py-10"
            />
          ) : (
            <ul className="divide-y divide-[var(--line-soft)]">
              {recentQuestions.slice(0, 6).map((question) => (
                <li key={question.id} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--canvas-soft)] sm:px-5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-[10px] font-medium text-[var(--ink-muted)]">
                    {(question.user_email || "?").charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-medium text-[var(--ink)]">{question.question}</p>
                    <p className="mt-0.5 truncate text-[10px] text-[var(--ink-muted)]">
                      {question.user_email ? question.user_email.split("@")[0] : "Workspace member"} · {timeAgo(question.created_at)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 text-[10px] font-medium",
                      question.knowledge_gap
                        ? "text-red-300"
                        : question.had_sources
                          ? "text-emerald-300"
                          : "text-[var(--ink-muted)]",
                    )}
                  >
                    {question.knowledge_gap ? "Gap" : question.had_sources ? "Sourced" : "No answer"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-4">
          <section className="admin-shell-card p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[14px] font-semibold text-[var(--ink)]">Knowledge health</h2>
                <p className="mt-0.5 text-[12px] text-[var(--ink-muted)]">A quick read on your workspace.</p>
              </div>
              <Link href="/dashboard/analytics" className="text-[11px] font-medium text-[var(--ink-muted)] hover:text-[var(--ink)]">
                Details
              </Link>
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] text-[var(--ink-soft)]">Documents ready</span>
                  <span className="text-[11px] font-medium tabular-nums text-[var(--ink)]">
                    {summary.completedDocuments}/{summary.totalDocuments}
                  </span>
                </div>
                <div className="mt-2"><HealthBar value={readinessPct} tone={readinessPct === 100 ? "jade" : readinessPct > 0 ? "amber" : "red"} /></div>
              </div>
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] text-[var(--ink-soft)]">Answers with sources</span>
                  <span className="text-[11px] font-medium tabular-nums text-[var(--ink)]">
                    {coveragePct === null ? "—" : `${coveragePct}%`}
                  </span>
                </div>
                <div className="mt-2"><HealthBar value={coveragePct ?? 0} tone={coveragePct === null || coveragePct < 50 ? "amber" : "jade"} /></div>
              </div>
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] text-[var(--ink-soft)]">Open knowledge gaps</span>
                  <span className={cn("text-[11px] font-medium tabular-nums", summary.openKnowledgeGaps > 0 ? "text-red-300" : "text-[var(--ink)]")}>
                    {summary.openKnowledgeGaps}
                  </span>
                </div>
                <div className="mt-2"><HealthBar value={Math.min(100, summary.openKnowledgeGaps * 20)} tone={summary.openKnowledgeGaps > 0 ? "red" : "jade"} /></div>
              </div>
            </div>
          </section>

          {recentKnowledgeGaps.length > 0 && (
            <section className="admin-shell-card p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[14px] font-semibold text-[var(--ink)]">Needs attention</h2>
                <Link href="/dashboard/knowledge-gaps" className="text-[11px] font-medium text-[var(--ink-muted)] hover:text-[var(--ink)]">View all</Link>
              </div>
              <div className="mt-3 divide-y divide-[var(--line-soft)]">
                {recentKnowledgeGaps.slice(0, 3).map((gap) => (
                  <div key={gap.id} className="flex items-start gap-2.5 py-2.5 first:pt-0 last:pb-0">
                    <span className="mt-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500/10 px-1 text-[9px] font-medium text-red-300">{gap.occurrence_count}</span>
                    <p className="line-clamp-2 text-[11px] leading-5 text-[var(--ink-soft)]">{gap.question}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
