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
    { title: 'Knowledge Base', value: summary.totalDocuments, icon: FileText, accent: 'text-slate-950' },
    { title: 'Indexed Assets', value: summary.completedDocuments, icon: CheckCircle2, accent: 'text-emerald-600' },
    { title: 'Sync Failures', value: summary.failedDocuments, icon: AlertTriangle, accent: 'text-red-600' },
    { title: 'Neural Sections', value: summary.totalChunks, icon: Layers3, accent: 'text-slate-950' },
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
      <div className="admin-shell-card overflow-hidden p-10 border border-slate-200 bg-white">
        <div className="space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Security Command Center</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 md:text-5xl">
            Welcome to {workspaceName}.
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-500 md:text-lg font-medium">
            Your enterprise knowledge graph is active. Monitor real-time intelligence, manage document lifecycles, and bridge documentation gaps.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.title}
            href="/dashboard/analytics"
            className="admin-kpi-card border border-slate-200 bg-white group transition-all hover:border-slate-950 hover:shadow-xl hover:shadow-slate-200/50"
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="rounded-xl bg-slate-50 p-3 text-slate-950 border border-slate-100 group-hover:bg-slate-950 group-hover:text-white transition-colors">
                <card.icon size={18} />
              </div>
              <ArrowUpRight size={16} className="text-slate-300 group-hover:text-slate-950 transition-colors" />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">{card.title}</p>
              <h3 className="font-mono text-3xl font-bold text-slate-950 tracking-tight">{card.value}</h3>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="admin-shell-card p-10 border border-slate-200 bg-white">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-950">Recent Intelligence</h2>
              <p className="text-xs text-slate-500 mt-1">Live question activity across your organization.</p>
            </div>
            <Link href="/dashboard/analytics" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-950 transition-colors">
              Full Analytics
            </Link>
          </div>
          {recentQuestions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-100 bg-slate-50/50 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-100 mx-auto text-slate-400">
                <MessageSquare size={20} />
              </div>
              <p className="mt-4 text-sm font-bold text-slate-950">No activity yet</p>
              <p className="mt-1 text-xs text-slate-500">Live question data will be streamed here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentQuestions.slice(0, 5).map((question) => (
                <div key={question.id} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 group hover:border-slate-200 transition-all">
                  <p className="text-sm font-bold text-slate-950 leading-snug">{question.question}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <span className="text-slate-900">{question.user_email.split('@')[0]}</span>
                    <span>{new Date(question.created_at).toLocaleDateString()}</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full",
                      question.had_sources ? "bg-emerald-50 text-emerald-600" : "bg-slate-200 text-slate-600"
                    )}>
                      {question.had_sources ? 'Grounded' : 'Fallback'}
                    </span>
                    {question.knowledge_gap && <span className="text-red-500 font-black">Coverage Gap</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="admin-shell-card p-10 border border-slate-200 bg-white">
          <h2 className="text-lg font-bold tracking-tight text-slate-950 mb-8">System Operations</h2>
          <div className="space-y-4">
            {[
              { href: '/dashboard/upload', icon: Upload, title: 'Knowledge Ingestion', copy: 'Process new documents into the neural index.' },
              { href: '/dashboard/chat', icon: MessageSquare, title: 'Secure Sandbox', copy: 'Validate assistant responses in a controlled environment.' },
              { href: '/dashboard/knowledge-gaps', icon: CircleAlert, title: 'Coverage Audit', copy: 'Identify and resolve critical documentation failures.' },
              { href: '/dashboard/analytics', icon: FolderOpen, title: 'Operational Metrics', copy: 'Review organizational engagement and feedback loops.' },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-5 rounded-2xl border border-slate-100 bg-white p-5 transition-all hover:border-slate-950 hover:shadow-lg hover:shadow-slate-100 group"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-950 border border-slate-100 group-hover:bg-slate-950 group-hover:text-white transition-colors">
                  <action.icon size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-950">{action.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500 font-medium">{action.copy}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Link
          href="/dashboard/knowledge-gaps"
          className="admin-shell-card p-10 border border-slate-200 bg-white group hover:border-red-200 transition-all"
        >
          <div className="flex items-center justify-between mb-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Critical Gaps</p>
            <AlertTriangle size={18} className="text-red-500" />
          </div>
          <div className="flex items-baseline gap-3">
            <p className="font-mono text-5xl font-bold text-slate-950 tracking-tighter">{summary.openKnowledgeGaps}</p>
            <span className="text-xs font-bold text-red-500 uppercase tracking-widest">Action Required</span>
          </div>
          <p className="mt-4 text-xs font-medium text-slate-500 leading-relaxed">
            Identified questions that currently have no supported documentation in the knowledge base.
          </p>
        </Link>

        <div className="admin-shell-card p-10 border border-slate-200 bg-white">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 mb-8">Active Failure Analysis</p>
          <div className="grid gap-4 md:grid-cols-2">
            {recentKnowledgeGaps.slice(0, 2).map((gap) => (
              <div key={gap.id} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6 flex flex-col justify-between">
                <p className="text-sm font-bold text-slate-950 leading-snug">{gap.question}</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-6 items-center rounded-full bg-white px-2 border border-slate-100 text-[9px] font-black uppercase tracking-tighter text-slate-950">
                    {gap.occurrence_count} OCCURRENCES
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{gap.status}</span>
                </div>
              </div>
            ))}
            {recentKnowledgeGaps.length === 0 && (
              <p className="col-span-full text-xs text-slate-400 italic py-4">System integrity verified. No open gaps.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
