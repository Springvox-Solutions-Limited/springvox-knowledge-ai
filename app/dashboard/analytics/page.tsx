"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  FileText,
  Loader2,
  MessageSquare,
  Search,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
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
      <div className="flex h-[320px] flex-col items-center justify-center gap-4 rounded-[32px] border border-slate-200 bg-white shadow-sm">
        <Loader2 size={28} className="animate-spin text-slate-900" />
        <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-slate-400">
          Loading analytics...
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-[28px] border border-red-100 bg-red-50/50 p-8 text-center">
        <p className="text-sm font-bold text-red-600">
          {error || "Analytics unavailable."}
        </p>
      </div>
    );
  }

  const totalQuestions = data.summary.totalQuestions || 0;
  const sourceBacked = data.summary.sourceBackedAnswers || 0;
  const fallback = data.summary.fallbackAnswers || 0;
  const gapRate = totalQuestions ? Math.round((fallback / totalQuestions) * 100) : 0;
  const healthScore = Math.max(0, 100 - gapRate);
  const recentNegativeFeedback =
    data.feedbackSummary.recentNegativeFeedback.length || 0;

  const pieData = [
    { name: "Answers with sources", value: sourceBacked, color: "#0f172a" },
    { name: "No answer found", value: fallback, color: "#cbd5e1" },
  ];

  const userSummaryData = [
    { label: "Users", value: data.summary.totalUsers || 0 },
    { label: "Admins", value: data.summary.tenantAdmins || 0 },
    { label: "Invites", value: data.summary.pendingInvitations || 0 },
  ];

  const hasRecentQuestions = data.recentQuestions.length > 0;
  const hasKnowledgeGaps = data.recentKnowledgeGaps.length > 0;

  return (
    <div className="admin-page">
      <AppPageHeader
        eyebrow="Analytics"
        title={`${data.workspace?.name || "Workspace"} analytics`}
        subtitle="Track question activity, answer coverage, and the areas that still need better document support."
        aside={
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Answer coverage
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-lg font-bold text-slate-950">
                {healthScore}%
              </span>
              <TrendingUp size={14} className="text-emerald-500" />
            </div>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Documents uploaded"
          value={data.summary.totalDocuments || 0}
          icon={FileText}
          meta={`${data.summary.totalChunks || 0} sections`}
          className="transition-all hover:border-cyan-200 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
        />
        <StatCard
          label="Questions asked"
          value={data.summary.totalQuestions || 0}
          icon={MessageSquare}
          meta={`${data.summary.questionsLast7Days || 0} in 7 days`}
          className="transition-all hover:border-cyan-200 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
        />
        <StatCard
          label="Unanswered questions"
          value={data.summary.openKnowledgeGaps || 0}
          icon={Search}
          meta={<TrendingDown size={14} className="text-red-500" />}
          className="transition-all hover:border-cyan-200 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
        />
        <StatCard
          label="Answers with sources"
          value={`${healthScore}%`}
          icon={ShieldCheck}
          meta={<TrendingUp size={14} className="text-emerald-500" />}
          className="transition-all hover:border-cyan-200 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Recent feedback flags
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            {recentNegativeFeedback}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Recent responses marked as not helpful.
          </p>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Pending invites
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            {data.summary.pendingInvitations || 0}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Team members still waiting to join this workspace.
          </p>
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            No answer rate
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            {gapRate}%
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Questions that still need better document support.
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr),340px]">
        <div className="admin-shell-card p-5 sm:p-6 lg:p-7">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-950">
                <BarChart3 size={18} />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight text-slate-950">
                  Question activity
                </h2>
                <p className="text-sm text-slate-500">
                  Daily question volume over the last 14 days.
                </p>
              </div>
            </div>
          </div>

          {data.dailyQuestionCounts.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="No activity data yet"
              description="Question activity will appear here after your team starts using the workspace."
              className="border-0 bg-transparent py-8"
            />
          ) : (
            <div className="h-[220px] w-full sm:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.dailyQuestionCounts}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f172a" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }}
                    dy={8}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "18px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 10px 20px rgba(15,23,42,0.08)",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#0f172a"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorCount)"
                    activeDot={{ r: 5, fill: "#0f172a", stroke: "#fff", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="admin-shell-card p-5 sm:p-6">
            <div className="mb-5">
              <h2 className="text-lg font-bold tracking-tight text-slate-950">
                Answer summary
              </h2>
              <p className="text-sm text-slate-500">
                How often answers were supported by uploaded documents.
              </p>
            </div>

            <div className="relative h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={70}
                    paddingAngle={6}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`${entry.name}-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-slate-950">
                  {healthScore}%
                </span>
                <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Covered
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {pieData.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 px-3 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs font-semibold text-slate-700">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-slate-950">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-shell-card p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-100 bg-cyan-50 text-cyan-800">
                <Users size={18} />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight text-slate-950">
                  Team summary
                </h2>
                <p className="text-sm text-slate-500">
                  Workspace users, admins, and open invitations.
                </p>
              </div>
            </div>

            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userSummaryData}>
                  <CartesianGrid vertical={false} stroke="#eef2f7" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                  />
                  <Tooltip />
                  <Bar dataKey="value" fill="#14b8a6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <div className="admin-shell-card overflow-hidden p-5 sm:p-6 lg:p-7">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-950">
                Recent questions
              </h2>
              <p className="text-sm text-slate-500">
                A quick look at the latest questions from your team.
              </p>
            </div>
            <Link
              href="/dashboard/chat"
              className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 transition-colors hover:text-slate-950"
            >
              Open chat
              <ArrowRight size={12} />
            </Link>
          </div>

          {!hasRecentQuestions ? (
            <EmptyState
              icon={MessageSquare}
              title="No recent questions"
              description="Recent question activity will appear here."
              className="border-0 bg-transparent py-8"
            />
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="app-table w-full min-w-[680px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      <th className="pb-4 pr-4">Question</th>
                      <th className="pb-4 pr-4">Outcome</th>
                      <th className="pb-4 pr-4">Review</th>
                      <th className="pb-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.recentQuestions.map((item) => (
                      <tr
                        key={item.id}
                        className="group transition-colors hover:bg-slate-50/50"
                      >
                        <td className="py-4 pr-4">
                          <p className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900">
                            {item.question}
                          </p>
                          <p
                            className="mt-1 truncate text-[11px] text-slate-400"
                            title={item.user_email}
                          >
                            {item.user_email}
                          </p>
                        </td>
                        <td className="py-4 pr-4">
                          <span
                            className={cn(
                              "rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]",
                              item.had_sources
                                ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-slate-100 text-slate-600",
                            )}
                          >
                            {item.had_sources ? "Has sources" : "No answer found"}
                          </span>
                        </td>
                        <td className="py-4 pr-4">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em]",
                              item.knowledge_gap ? "text-red-600" : "text-slate-400",
                            )}
                          >
                            <span
                              className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                item.knowledge_gap ? "bg-red-600" : "bg-slate-300",
                              )}
                            />
                            {item.knowledge_gap ? "Needs review" : "Covered"}
                          </span>
                        </td>
                        <td className="py-4 text-[11px] font-semibold text-slate-400">
                          {new Date(item.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 md:hidden">
                {data.recentQuestions.slice(0, 6).map((item) => (
                  <div
                    key={`${item.id}-mobile`}
                    className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
                  >
                    <p className="text-sm font-semibold leading-snug text-slate-900">
                      {item.question}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">
                        {item.had_sources ? "Has sources" : "No answer found"}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-3 truncate text-[11px] text-slate-400">
                      {item.user_email}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="admin-shell-card p-5 sm:p-6 lg:p-7">
          <div className="mb-5">
            <h2 className="text-lg font-bold tracking-tight text-slate-950">
              Unanswered questions
            </h2>
            <p className="text-sm text-slate-500">
              Questions that still need better document coverage.
            </p>
          </div>

          <div className="space-y-3">
            {!hasKnowledgeGaps ? (
              <EmptyState
                icon={ShieldCheck}
                title="No unanswered questions"
                description="New knowledge gaps will appear here when questions need more document support."
                className="py-10"
              />
            ) : (
              data.recentKnowledgeGaps.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 transition-all hover:border-slate-200"
                >
                  <p className="text-sm font-semibold leading-snug text-slate-900">
                    {item.question}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-red-100 bg-red-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-red-600">
                        {item.status.replaceAll("_", " ")}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">
                        {item.occurrence_count}{" "}
                        {item.occurrence_count === 1 ? "mention" : "mentions"}
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-slate-400">
                      {new Date(item.last_asked_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-6">
            <Link
              href="/dashboard/knowledge-gaps"
              className="app-button-primary flex w-full py-3 text-xs uppercase tracking-[0.18em]"
            >
              View all unanswered questions
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
