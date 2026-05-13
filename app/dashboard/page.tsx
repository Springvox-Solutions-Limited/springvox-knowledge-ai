"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
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
} from 'lucide-react';

import { getAccessToken, getCurrentUserProfile } from '@/src/lib/auth-client';
import { cn } from '@/src/lib/utils';
import { type UserProfile } from '@/src/lib/workspace';

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
  const [recentQuestions, setRecentQuestions] = useState<AnalyticsResponse['recentQuestions']>([]);
  const [recentKnowledgeGaps, setRecentKnowledgeGaps] = useState<AnalyticsResponse['recentKnowledgeGaps']>([]);
  const [workspaceName, setWorkspaceName] = useState('Your Workspace');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSummary() {
      const currentProfile = await getCurrentUserProfile();
      setProfile(currentProfile);

      if (!currentProfile || currentProfile.role === 'viewer') {
        setLoading(false);
        return;
      }

      const accessToken = await getAccessToken();
      if (!accessToken) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/analytics/summary', {
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
      setWorkspaceName(data.workspace?.name || 'Your Workspace');
      setLoading(false);
    }

    fetchSummary();
  }, []);

  if (profile?.role === 'viewer') {
    return null;
  }

  const cards = [
    { title: 'Total Documents', value: summary.totalDocuments, icon: FileText, accent: 'text-accent' },
    { title: 'Completed', value: summary.completedDocuments, icon: CheckCircle2, accent: 'text-green-400' },
    { title: 'Failed', value: summary.failedDocuments, icon: AlertTriangle, accent: 'text-red-400' },
    { title: 'Total Sections', value: summary.totalChunks, icon: Layers3, accent: 'text-blue-400' },
  ];

  if (loading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-32 rounded-3xl bg-[#15171C]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="rounded-[2rem] border border-[#2D3039] bg-[radial-gradient(circle_at_top_left,rgba(255,107,0,0.12),transparent_35%),linear-gradient(180deg,#15171C_0%,#101217_100%)] p-8 md:p-10 shadow-2xl shadow-black/30">
        <div className="space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-accent">Company Workspace</p>
          <h1 className="text-3xl font-bold tracking-tight text-[#E2E8F0] md:text-4xl">
            {workspaceName} is live in SpringVox.
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-slate-400 md:text-base">
            Review live usage, monitor knowledge gaps, and keep your approved knowledge base current.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.title}
            href="/dashboard/analytics"
            className="rounded-3xl border border-[#2D3039] bg-[#15171C] p-6 shadow-xl shadow-black/20 transition-colors hover:border-accent/20"
          >
            <div className="mb-5 flex items-center justify-between">
              <div className="rounded-2xl border border-[#2D3039] bg-[#0D0F12] p-3">
                <card.icon size={20} className={card.accent} />
              </div>
              <ArrowUpRight size={16} className="text-slate-600" />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">{card.title}</p>
              <h3 className="font-mono text-3xl font-bold text-[#E2E8F0]">{card.value}</h3>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-[#2D3039] bg-[#15171C] p-8 shadow-xl shadow-black/20">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Recent Questions</h2>
            <Link href="/dashboard/analytics" className="text-xs font-semibold text-accent">
              View analytics
            </Link>
          </div>
          {recentQuestions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#2D3039] bg-[#101217] p-8 text-center">
              <MessageSquare size={28} className="mx-auto text-slate-700" />
              <p className="mt-4 text-sm font-semibold text-[#E2E8F0]">No questions asked yet</p>
              <p className="mt-2 text-xs leading-6 text-slate-500">Workspace question activity will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentQuestions.slice(0, 5).map((question) => (
                <div key={question.id} className="rounded-2xl border border-[#2D3039] bg-[#101217] px-4 py-4">
                  <p className="text-sm font-semibold text-[#E2E8F0]">{question.question}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-[10px] uppercase tracking-[0.18em] text-slate-500">
                    <span>{question.user_email}</span>
                    <span>{new Date(question.created_at).toLocaleDateString()}</span>
                    <span>{question.had_sources ? 'Source-backed' : 'No sources'}</span>
                    {question.knowledge_gap && <span className="text-accent">Knowledge gap</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-[#2D3039] bg-[#1A1C20] p-8 shadow-xl shadow-black/20 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Quick Actions</h2>
            <div className="mt-6 space-y-3">
              {[
                { href: '/dashboard/upload', icon: Upload, title: 'Upload document', copy: 'Add a new PDF or TXT file to the knowledge base.' },
                { href: '/dashboard/chat', icon: MessageSquare, title: 'Ask a question', copy: 'Test how the assistant answers from approved documents.' },
                { href: '/dashboard/knowledge-gaps', icon: CircleAlert, title: 'Review knowledge gaps', copy: 'See which questions your current documents do not answer yet.' },
                { href: '/dashboard/analytics', icon: FolderOpen, title: 'View analytics', copy: 'Monitor usage, users, documents, and feedback from real workspace data.' },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-start gap-4 rounded-2xl border border-[#2D3039] bg-[#101217] p-4 transition-colors hover:border-accent/25"
                >
                  <div className="rounded-xl border border-[#2D3039] bg-[#0D0F12] p-3">
                    <action.icon size={18} className="text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#E2E8F0]">{action.title}</p>
                    <p className="mt-1 text-xs leading-6 text-slate-500">{action.copy}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <div className="absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-accent blur-[120px] opacity-10" />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Link
          href="/dashboard/knowledge-gaps"
          className="rounded-3xl border border-[#2D3039] bg-[#15171C] p-6 shadow-xl shadow-black/20 transition-colors hover:border-accent/20"
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Open Knowledge Gaps</p>
            <AlertTriangle size={16} className="text-accent" />
          </div>
          <p className="mt-4 font-mono text-4xl font-bold text-[#E2E8F0]">{summary.openKnowledgeGaps}</p>
          <p className="mt-2 text-sm text-slate-500">Questions the current document set does not yet support clearly.</p>
        </Link>

        <div className="rounded-3xl border border-[#2D3039] bg-[#15171C] p-6 shadow-xl shadow-black/20">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Most Recent Knowledge Gaps</p>
          <div className="mt-5 space-y-3">
            {recentKnowledgeGaps.slice(0, 3).map((gap) => (
              <div key={gap.id} className="rounded-2xl border border-[#2D3039] bg-[#101217] p-4">
                <p className="text-sm font-semibold text-[#E2E8F0]">{gap.question}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Asked {gap.occurrence_count} time{gap.occurrence_count === 1 ? '' : 's'} • {gap.status}
                </p>
              </div>
            ))}
            {recentKnowledgeGaps.length === 0 && (
              <p className="text-sm text-slate-500">No knowledge gaps recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
