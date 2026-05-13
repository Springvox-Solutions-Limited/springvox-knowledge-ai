"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  FileText,
  FolderOpen,
  Layers3,
  MessageSquare,
  Upload,
  CircleAlert,
} from "lucide-react";

import { getAccessToken, getCurrentUserProfile } from "@/src/lib/auth-client";
import { cn } from "@/src/lib/utils";
import { type UserProfile } from "@/src/lib/workspace";

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
  contentManagers: number;
  admins: number;
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
  contentManagers: 0,
  admins: 0,
  pendingInvitations: 0,
  totalFeedback: 0,
  helpfulFeedback: 0,
  negativeFeedback: 0,
};

export default function DashboardOverview() {
  const [summary, setSummary] = useState<AnalyticsSummary>(EMPTY_SUMMARY);
  const [recentQuestions, setRecentQuestions] = useState<
    AnalyticsResponse["recentQuestions"]
  >([]);
  const [recentKnowledgeGaps, setRecentKnowledgeGaps] = useState<
    AnalyticsResponse["recentKnowledgeGaps"]
  >([]);
  const [workspaceName, setWorkspaceName] = useState("Your Workspace");
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
      setWorkspaceName(data.workspace?.name || "Your Workspace");
      setLoading(false);
    }

    fetchSummary();
  }, []);

  if (profile?.role === "viewer") {
    return null;
  }

  const cards = [
    {
      title: "Knowledge Base",
      value: summary.totalDocuments,
      icon: FileText,
      accent: "text-slate-950",
    },
    {
      title: "Indexed Assets",
      value: summary.completedDocuments,
      icon: CheckCircle2,
      accent: "text-emerald-600",
    },
    {
      title: "Sync Failures",
      value: summary.failedDocuments,
      icon: AlertTriangle,
      accent: "text-red-600",
    },
    {
      title: "Neural Sections",
      value: summary.totalChunks,
      icon: Layers3,
      accent: "text-slate-950",
    },
  ];

  if (loading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-40 rounded-3xl bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-hero-card bg-gradient-to-br from-white via-white to-slate-50">
        <div className="space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400">
            Intelligence Hub
          </p>
          <h1 className="admin-hero-title">
            Welcome to {workspaceName}.
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-600 font-medium sm:text-base lg:text-lg">
            Your enterprise knowledge graph is active. Monitor question
            patterns, identify documentation gaps, and optimize assistant
            performance.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.title}
            href="/dashboard/analytics"
            className="admin-kpi-card border border-slate-200 bg-white group transition-all hover:border-slate-950 hover:shadow-2xl hover:shadow-slate-950/10"
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="rounded-xl bg-slate-50 p-3.5 text-slate-950 border border-slate-100 group-hover:bg-slate-950 group-hover:text-white transition-all duration-300">
                <card.icon size={20} strokeWidth={1.5} />
              </div>
              <ArrowUpRight
                size={18}
                className="text-slate-300 group-hover:text-slate-950 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
              />
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400 group-hover:text-slate-500 transition-colors">
                {card.title}
              </p>
              <h3 className="font-mono text-3xl font-bold tracking-tight text-slate-950 tabular-nums sm:text-4xl">
                {card.value}
              </h3>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr] xl:gap-8">
        <div className="admin-shell-card overflow-hidden border border-slate-200 bg-white p-6 sm:p-8 lg:p-10">
          <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-2">
                Live Intelligence
              </p>
              <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                Real-time Activity
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Questions from your organization in the last 24 hours.
              </p>
            </div>
            <Link
              href="/dashboard/analytics"
              className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-950 transition-colors whitespace-nowrap"
            >
              View All →
            </Link>
          </div>
          {recentQuestions.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-200 mx-auto text-slate-400 mb-4">
                <MessageSquare size={24} />
              </div>
              <p className="mt-2 text-sm font-bold text-slate-950">
                No recent activity
              </p>
              <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto">
                Live question activity will appear here once your assistant goes
                live.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentQuestions.slice(0, 5).map((question, idx) => (
                <div
                  key={question.id}
                  className="rounded-xl border border-slate-100 bg-gradient-to-r from-slate-50 to-white p-4 hover:border-slate-200 hover:shadow-md transition-all group"
                >
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 font-bold text-xs">
                      {idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2">
                        {question.question}
                      </p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <span className="text-slate-600">
                          {question.user_email.split("@")[0]}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span>
                          {new Date(question.created_at).toLocaleDateString()}
                        </span>
                        <span
                          className={cn(
                            "px-2.5 py-1 rounded-full font-bold",
                            question.had_sources
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200",
                          )}
                        >
                          {question.had_sources ? "✓ Grounded" : "Fallback"}
                        </span>
                        {question.knowledge_gap && (
                          <span className="ml-auto px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200 font-black text-[9px]">
                            GAP
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="admin-shell-card border border-slate-200 bg-white p-6 sm:p-8 lg:p-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-8">
            System Health
          </p>
          <div className="space-y-4">
            {[
              {
                href: "/dashboard/knowledge-gaps",
                icon: CircleAlert,
                title: "Coverage Audit",
                stat: summary.openKnowledgeGaps,
                color: "text-red-600",
                bg: "bg-red-50",
              },
              {
                href: "/dashboard/documents",
                icon: FileText,
                title: "Knowledge Base",
                stat: summary.completedDocuments,
                color: "text-blue-600",
                bg: "bg-blue-50",
              },
              {
                href: "/dashboard/analytics",
                icon: MessageSquare,
                title: "Questions Today",
                stat: summary.questionsLast7Days,
                color: "text-slate-600",
                bg: "bg-slate-50",
              },
            ].map((metric) => (
              <Link
                key={metric.href}
                href={metric.href}
                className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-4 hover:border-slate-200 hover:bg-slate-50/50 transition-all group"
              >
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-slate-200",
                    metric.bg,
                  )}
                >
                  <metric.icon size={20} className={metric.color} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {metric.title}
                  </p>
                  <p className="text-2xl font-bold text-slate-950 mt-0.5">
                    {metric.stat}
                  </p>
                </div>
                <ArrowUpRight
                  size={16}
                  className="text-slate-300 group-hover:text-slate-950 transition-colors shrink-0"
                />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        <Link
          href="/dashboard/knowledge-gaps"
          className="admin-shell-card border border-slate-200 bg-gradient-to-br from-red-50 to-white p-6 transition-all group hover:border-red-200 hover:shadow-lg sm:p-8 lg:p-10"
        >
          <div className="flex items-center justify-between mb-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-red-600">
              Coverage Status
            </p>
            <AlertTriangle size={20} className="text-red-500" />
          </div>
          <div className="flex items-baseline gap-3 mb-4">
            <p className="font-mono text-4xl font-bold tracking-tighter text-slate-950 sm:text-5xl">
              {summary.openKnowledgeGaps}
            </p>
            <span className="text-xs font-bold text-red-600 uppercase tracking-widest">
              Gaps Identified
            </span>
          </div>
          <p className="text-sm font-medium text-slate-600 leading-relaxed">
            These are questions your users couldn't answer. Documenting these
            topics will improve coverage.
          </p>
          <div className="mt-6 pt-6 border-t border-red-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Review & resolve
            </span>
            <ArrowUpRight
              size={16}
              className="text-red-500 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
            />
          </div>
        </Link>

        <div className="admin-shell-card border border-slate-200 bg-white p-6 sm:p-8 lg:p-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-8">
            Common Gaps Analysis
          </p>
          {recentKnowledgeGaps.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-12 px-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mx-auto mb-3">
                <CheckCircle2 size={24} />
              </div>
              <p className="text-sm font-bold text-slate-950">
                Perfect coverage!
              </p>
              <p className="text-xs text-slate-500 mt-1">
                No common unanswered questions detected.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {recentKnowledgeGaps.slice(0, 4).map((gap) => (
                <div
                  key={gap.id}
                  className="rounded-xl border border-slate-100 bg-slate-50/60 hover:border-slate-200 hover:bg-slate-50 transition-all p-5"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-600">
                      {gap.occurrence_count}
                    </div>
                    <p className="text-sm font-semibold text-slate-900 leading-snug flex-1 line-clamp-2">
                      {gap.question}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Occurrences:
                    </span>
                    <span className="text-xs font-black text-slate-900">
                      {gap.occurrence_count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
