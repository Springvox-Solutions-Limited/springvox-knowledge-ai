"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  MessageSquare,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getAccessToken, getCurrentUserProfile } from "@/src/lib/auth-client";
import { cn } from "@/src/lib/utils";
import { isWorkspaceAdminRole, type UserProfile } from "@/src/lib/workspace";
import { AppPageHeader } from "@/src/components/shared/AppPageHeader";
import { EmptyState } from "@/src/components/ui/empty-state";
import { StatCard } from "@/src/components/ui/stat-card";
import { SkeletonKpiGrid, SkeletonCard } from "@/src/components/ui/skeleton-card";

type AnalyticsData = {
  workspace: { name: string; assistant_name: string | null } | null;
  summary: Record<string, number>;
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
    last_asked_at: string;
  }>;
  dailyQuestionCounts: Array<{ date: string; count: number }>;
  feedbackSummary: {
    recentNegativeFeedback: Array<{
      id: string;
      rating: string;
      created_at: string;
      chat_message_id: string | null;
    }>;
  };
};

export default function AnalyticsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAnalytics() {
      const currentProfile = await getCurrentUserProfile();
      setProfile(currentProfile);

      if (!currentProfile || !isWorkspaceAdminRole(currentProfile.role)) {
        router.replace("/dashboard/chat");
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
        setError("Failed to load analytics");
        setLoading(false);
        return;
      }

      setData(await response.json());
      setLoading(false);
    }

    loadAnalytics();
  }, [router]);

  if (profile && !isWorkspaceAdminRole(profile.role)) {
    return null;
  }

  if (loading) {
    return (
      <div className="admin-page">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-[var(--surface-2)]" />
        <SkeletonKpiGrid count={4} />
        <div className="grid gap-4 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr),340px]">
          <SkeletonCard className="h-64" />
          <div className="flex flex-col gap-6">
            <SkeletonCard className="h-48" />
            <SkeletonCard className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-[10px] border border-red-500/30 bg-red-500/10 p-8 text-center">
        <p className="text-sm font-bold text-red-300">
          {error || "Analytics unavailable."}
        </p>
      </div>
    );
  }

  const totalQuestions = data.summary.totalQuestions || 0;
  const sourceBacked = data.summary.sourceBackedAnswers || 0;
  const fallback = data.summary.fallbackAnswers || 0;
  const gapRate = totalQuestions
    ? Math.round((fallback / totalQuestions) * 100)
    : 0;
  const healthScore = Math.max(0, 100 - gapRate);
  const recentNegativeFeedback =
    data.feedbackSummary.recentNegativeFeedback.length || 0;

  const hasRecentQuestions = data.recentQuestions.length > 0;
  const hasKnowledgeGaps = data.recentKnowledgeGaps.length > 0;

  return (
    <div className="admin-page">
      <AppPageHeader
        title="Analytics"
        subtitle="Question volume, answer coverage, and knowledge gaps for this workspace."
        aside={
          <span className="inline-flex items-center rounded-md border border-[var(--line)] px-2.5 py-1.5 text-[11px] text-[var(--ink-muted)]">
            Last 14 days
          </span>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Questions asked"
          value={totalQuestions}
          icon={MessageSquare}
          meta={`${data.summary.questionsLast7Days || 0} in 7 days`}
        />
        <StatCard
          label="Answer coverage"
          value={`${healthScore}%`}
          icon={ShieldCheck}
          meta={`${sourceBacked} sourced`}
        />
        <StatCard
          label="Unanswered"
          value={data.summary.openKnowledgeGaps || 0}
          icon={Search}
          meta={`${gapRate}% no-answer rate`}
        />
        <StatCard
          label="Team members"
          value={data.summary.totalUsers || 0}
          icon={Users}
          meta={`${data.summary.pendingInvitations || 0} pending`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.85fr)]">
        <section className="admin-shell-card min-w-0 p-4 sm:p-5">
          <header className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[14px] font-semibold text-[var(--ink)]">Question activity</h2>
              <p className="mt-0.5 text-[12px] text-[var(--ink-muted)]">Daily volume across the workspace.</p>
            </div>
            <BarChart3 size={16} className="text-[var(--ink-muted)]" strokeWidth={1.5} />
          </header>
          {data.dailyQuestionCounts.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="No activity yet"
              description="Question volume appears here after your team starts asking."
              className="border-0 bg-transparent py-10"
            />
          ) : (
            <div className="min-w-0">
              <ResponsiveContainer width="100%" height={214} minWidth={1}>
                <BarChart data={data.dailyQuestionCounts} barCategoryGap="28%">
                  <CartesianGrid vertical={false} stroke="var(--line-soft)" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "var(--ink-muted)" }}
                    dy={8}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                    tick={{ fontSize: 10, fill: "var(--ink-muted)" }}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--canvas-soft)" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid var(--line)",
                      backgroundColor: "var(--surface)",
                      fontSize: "12px",
                      color: "var(--ink)",
                    }}
                  />
                  <Bar dataKey="count" fill="var(--accent-jade)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="admin-shell-card p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[14px] font-semibold text-[var(--ink)]">Answer coverage</h2>
              <p className="mt-0.5 text-[12px] text-[var(--ink-muted)]">Answers backed by a source.</p>
            </div>
            <span className="text-[24px] font-semibold tabular-nums tracking-tight text-[var(--ink)]">{healthScore}%</span>
          </div>
          <div className="mt-5 flex h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
            <div className="bg-[var(--accent-jade)]" style={{ width: `${healthScore}%` }} />
            <div className="bg-[var(--line)]" style={{ width: `${100 - healthScore}%` }} />
          </div>
          <div className="mt-5 divide-y divide-[var(--line-soft)] text-[12px]">
            <div className="flex items-center justify-between py-2.5">
              <span className="flex items-center gap-2 text-[var(--ink-soft)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-jade)]" />
                Answers with sources
              </span>
              <span className="font-medium tabular-nums text-[var(--ink)]">{sourceBacked}</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="flex items-center gap-2 text-[var(--ink-soft)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--ink-muted)]" />
                No answer found
              </span>
              <span className="font-medium tabular-nums text-[var(--ink)]">{fallback}</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-[var(--ink-soft)]">Open gaps</span>
              <Link href="/dashboard/knowledge-gaps" className="font-medium text-[var(--accent-jade)] hover:text-[var(--accent-jade-hover)]">
                {data.summary.openKnowledgeGaps || 0}
              </Link>
            </div>
          </div>
          <p className="mt-3 text-[11px] leading-5 text-[var(--ink-muted)]">
            {recentNegativeFeedback > 0
              ? `${recentNegativeFeedback} recent response${recentNegativeFeedback === 1 ? "" : "s"} marked not helpful.`
              : "No recent feedback flags."}
          </p>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.85fr)]">
        <section className="admin-shell-card min-w-0 overflow-hidden">
          <header className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3.5 sm:px-5">
            <div>
              <h2 className="text-[14px] font-semibold text-[var(--ink)]">Recent questions</h2>
              <p className="mt-0.5 text-[12px] text-[var(--ink-muted)]">Latest activity from your team.</p>
            </div>
            <Link href="/dashboard/chat" className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--ink-muted)] hover:text-[var(--ink)]">
              Open chat <ArrowRight size={12} />
            </Link>
          </header>
          {!hasRecentQuestions ? (
            <EmptyState
              icon={MessageSquare}
              title="No recent questions"
              description="Recent activity will appear here."
              className="border-0 bg-transparent py-10"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left">
                <thead>
                  <tr className="border-b border-[var(--line)] text-[11px] text-[var(--ink-muted)]">
                    <th className="px-4 py-2.5 font-medium sm:px-5">Question</th>
                    <th className="px-3 py-2.5 font-medium">Outcome</th>
                    <th className="px-3 py-2.5 font-medium">Review</th>
                    <th className="px-4 py-2.5 text-right font-medium sm:px-5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line-soft)]">
                  {data.recentQuestions.slice(0, 6).map((item) => (
                    <tr key={item.id} className="transition-colors hover:bg-[var(--canvas-soft)]">
                      <td className="max-w-[360px] px-4 py-3 sm:px-5">
                        <p className="line-clamp-1 text-[12px] font-medium text-[var(--ink)]">{item.question}</p>
                        <p className="mt-0.5 truncate text-[10px] text-[var(--ink-muted)]" title={item.user_email}>{item.user_email}</p>
                      </td>
                      <td className="px-3 py-3">
                        <span className={cn("inline-flex items-center gap-1.5 text-[11px]", item.had_sources ? "text-[var(--ink-soft)]" : "text-[var(--ink-muted)]")}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", item.had_sources ? "bg-emerald-400" : "bg-[var(--ink-muted)]")} />
                          {item.had_sources ? "Sourced" : "No answer"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-[11px] text-[var(--ink-muted)]">
                        {item.knowledge_gap ? "Needs review" : "Covered"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-[11px] tabular-nums text-[var(--ink-muted)] sm:px-5">
                        {new Date(item.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="admin-shell-card p-4 sm:p-5">
          <header className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[14px] font-semibold text-[var(--ink)]">Needs attention</h2>
              <p className="mt-0.5 text-[12px] text-[var(--ink-muted)]">Questions without document support.</p>
            </div>
            <Link href="/dashboard/knowledge-gaps" className="text-[11px] font-medium text-[var(--ink-muted)] hover:text-[var(--ink)]">View all</Link>
          </header>
          {!hasKnowledgeGaps ? (
            <EmptyState
              icon={ShieldCheck}
              title="No unanswered questions"
              description="New gaps will appear here."
              className="border-0 bg-transparent py-8"
            />
          ) : (
            <div className="divide-y divide-[var(--line-soft)]">
              {data.recentKnowledgeGaps.slice(0, 5).map((item) => (
                <div key={item.id} className="py-3 first:pt-0 last:pb-0">
                  <p className="line-clamp-2 text-[12px] leading-5 text-[var(--ink)]">{item.question}</p>
                  <div className="mt-1.5 flex items-center justify-between gap-3 text-[10px] text-[var(--ink-muted)]">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                      {item.occurrence_count} {item.occurrence_count === 1 ? "mention" : "mentions"}
                    </span>
                    <span className="tabular-nums">
                      {new Date(item.last_asked_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link href="/dashboard/knowledge-gaps" className="mt-4 inline-flex h-8 w-full items-center justify-center rounded-md border border-[var(--line)] text-[11px] font-medium text-[var(--ink-soft)] transition-colors hover:bg-[var(--canvas-soft)] hover:text-[var(--ink)]">
            Review unanswered questions
          </Link>
        </section>
      </div>
    </div>
  );
}
