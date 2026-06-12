"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CircleAlert,
  FileText,
  MessageSquare,
  Upload,
  Users,
} from "lucide-react";

import { getAccessToken, getCurrentUserProfile } from "@/src/lib/auth-client";
import { cn } from "@/src/lib/utils";
import { type UserProfile } from "@/src/lib/workspace";
import { AppPageHeader } from "@/src/components/shared/AppPageHeader";
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
    { title: "Documents ready", value: summary.completedDocuments, icon: FileText },
    { title: "Questions asked", value: summary.totalQuestions, icon: MessageSquare },
    { title: "Team members", value: summary.totalUsers, icon: Users },
    {
      title: "Open gaps",
      value: summary.openKnowledgeGaps,
      icon: CircleAlert,
      alert: summary.openKnowledgeGaps > 0,
    },
  ];

  const quickActions = [
    { href: "/dashboard/upload", icon: Upload, label: "Upload documents" },
    { href: "/dashboard/chat", icon: MessageSquare, label: "Ask a question" },
    { href: "/dashboard/documents", icon: FileText, label: "Manage documents" },
    { href: "/dashboard/users", icon: Users, label: "Invite your team" },
  ];

  if (loading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-36 rounded-2xl border border-[var(--line)] bg-[var(--surface)]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <AppPageHeader
        eyebrow="Overview"
        title={`Welcome to ${workspaceName}.`}
        subtitle="Track workspace usage, document readiness, and the areas where your team still needs better answers."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.title} href="/dashboard/analytics" className="block">
            <StatCard
              label={card.title}
              value={card.value}
              icon={card.icon}
              className={cn(
                "transition-colors hover:border-[var(--accent-jade-100)]",
                card.alert && "border-red-500/30",
              )}
            />
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_0.9fr] lg:gap-6">
        {/* Recent questions */}
        <section className="admin-shell-card p-5 sm:p-6">
          <header className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[var(--ink)]">Recent questions</h2>
              <p className="mt-0.5 text-xs text-[var(--ink-muted)]">What your team has been asking.</p>
            </div>
            <Link
              href="/dashboard/analytics"
              className="shrink-0 text-xs font-semibold text-[var(--accent-jade)] transition-colors hover:text-[var(--accent-jade-hover)]"
            >
              View all
            </Link>
          </header>
          {recentQuestions.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No questions yet"
              description="Activity appears here once your team starts asking."
              className="border-0 bg-transparent py-10"
            />
          ) : (
            <ul className="divide-y divide-[var(--line)]">
              {recentQuestions.slice(0, 6).map((question) => (
                <li key={question.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium text-[var(--ink)]">
                      {question.question}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--ink-muted)]">
                      <span>{question.user_email.split("@")[0]}</span>
                      <span aria-hidden>·</span>
                      <span>{new Date(question.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      question.had_sources
                        ? "bg-emerald-500/10 text-emerald-300"
                        : "bg-[var(--surface-2)] text-[var(--ink-muted)]",
                    )}
                  >
                    {question.had_sources ? "Sourced" : "No answer"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Side rail: quick actions + top gaps */}
        <aside className="space-y-4">
          <section className="admin-shell-card p-5 sm:p-6">
            <h2 className="mb-3 text-base font-semibold text-[var(--ink)]">Quick actions</h2>
            <div className="space-y-1.5">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm font-medium text-[var(--ink-soft)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
                >
                  <action.icon size={16} className="shrink-0 text-[var(--ink-muted)] group-hover:text-[var(--accent-jade)]" />
                  <span className="min-w-0 flex-1 truncate">{action.label}</span>
                  <ArrowRight size={15} className="shrink-0 text-[var(--ink-muted)] opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          </section>

          {summary.openKnowledgeGaps > 0 && recentKnowledgeGaps.length > 0 && (
            <section className="admin-shell-card p-5 sm:p-6">
              <header className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-[var(--ink)]">Top knowledge gaps</h2>
                <Link
                  href="/dashboard/knowledge-gaps"
                  className="shrink-0 text-xs font-semibold text-[var(--accent-jade)] transition-colors hover:text-[var(--accent-jade-hover)]"
                >
                  Resolve
                </Link>
              </header>
              <ul className="space-y-2">
                {recentKnowledgeGaps.slice(0, 4).map((gap) => (
                  <li
                    key={gap.id}
                    className="flex items-start gap-2.5 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] p-3"
                  >
                    <span
                      title={`Asked ${gap.occurrence_count} times`}
                      className="mt-px inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500/10 px-1 text-[10px] font-bold text-red-300"
                    >
                      {gap.occurrence_count}
                    </span>
                    <p className="line-clamp-2 text-xs font-medium text-[var(--ink-soft)]">{gap.question}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
