"use client";

import { useEffect, useState } from 'react';
import { BarChart3, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { getAccessToken, getCurrentUserProfile } from '@/src/lib/auth-client';
import { cn } from '@/src/lib/utils';
import { isManagerRole, type UserProfile } from '@/src/lib/workspace';

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
    recentNegativeFeedback: Array<{ id: string; rating: string; created_at: string; chat_message_id: string | null }>;
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

      if (!currentProfile || !isManagerRole(currentProfile.role)) {
        router.replace('/dashboard/chat');
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
        setError('Failed to load analytics');
        setLoading(false);
        return;
      }

      setData(await response.json());
      setLoading(false);
    }

    loadAnalytics();
  }, []);

  if (profile && !isManagerRole(profile.role)) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-3xl border border-[#2D3039] bg-[#15171C] px-6 py-8 text-sm text-slate-400">
        <Loader2 size={18} className="animate-spin text-accent" />
        Loading analytics...
      </div>
    );
  }

  if (!data) {
    return <div className="text-sm text-red-300">{error || 'Analytics unavailable.'}</div>;
  }

  const metricCards = [
    ['Total documents', data.summary.totalDocuments],
    ['Completed documents', data.summary.completedDocuments],
    ['Failed documents', data.summary.failedDocuments],
    ['Total sections', data.summary.totalChunks],
    ['Total questions', data.summary.totalQuestions],
    ['Questions in 7 days', data.summary.questionsLast7Days],
    ['Source-backed', data.summary.sourceBackedAnswers],
    ['Fallback answers', data.summary.fallbackAnswers],
    ['Open knowledge gaps', data.summary.openKnowledgeGaps],
    ['Total users', data.summary.totalUsers],
    ['Viewers', data.summary.viewers],
    ['Content managers', data.summary.contentManagers],
    ['Admins', data.summary.admins],
    ['Pending invites', data.summary.pendingInvitations],
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent">Analytics</p>
        <h1 className="text-3xl font-bold tracking-tight text-[#E2E8F0]">
          {data.workspace?.name || 'Workspace'} analytics
        </h1>
        <p className="text-sm text-slate-500">
          Real metrics from documents, chats, knowledge gaps, invites, users, and feedback.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map(([label, value]) => (
          <div key={label} className="rounded-3xl border border-[#2D3039] bg-[#15171C] p-5 shadow-xl shadow-black/20">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">{label}</p>
            <p className="mt-4 font-mono text-3xl font-bold text-[#E2E8F0]">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
        <div className="rounded-3xl border border-[#2D3039] bg-[#15171C] p-6 shadow-xl shadow-black/20">
          <div className="mb-5 flex items-center gap-3">
            <BarChart3 size={18} className="text-accent" />
            <h2 className="text-lg font-semibold text-[#E2E8F0]">Question activity</h2>
          </div>
          <div className="space-y-3">
            {data.dailyQuestionCounts.map((item) => (
              <div key={item.date}>
                <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                  <span>{item.date}</span>
                  <span>{item.count} questions</span>
                </div>
                <div className="h-2 rounded-full bg-[#101217]">
                  <div
                    className="h-2 rounded-full bg-accent"
                    style={{
                      width: `${Math.max(8, (item.count / Math.max(...data.dailyQuestionCounts.map((entry) => entry.count), 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-[#2D3039] bg-[#15171C] p-6 shadow-xl shadow-black/20">
          <h2 className="text-lg font-semibold text-[#E2E8F0]">Feedback summary</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {[
              ['Total feedback', data.summary.totalFeedback],
              ['Helpful', data.summary.helpfulFeedback],
              ['Negative', data.summary.negativeFeedback],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-[#2D3039] bg-[#101217] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p>
                <p className="mt-3 font-mono text-2xl font-bold text-[#E2E8F0]">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-3">
            {data.feedbackSummary.recentNegativeFeedback.length === 0 ? (
              <p className="text-sm text-slate-500">No recent negative feedback yet.</p>
            ) : (
              data.feedbackSummary.recentNegativeFeedback.map((item) => (
                <div key={item.id} className="rounded-2xl border border-[#2D3039] bg-[#101217] p-4">
                  <p className={cn('text-sm font-semibold', item.rating === 'wrong' ? 'text-red-300' : 'text-slate-300')}>
                    {item.rating.replaceAll('_', ' ')}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <div className="rounded-3xl border border-[#2D3039] bg-[#15171C] p-6 shadow-xl shadow-black/20">
          <h2 className="text-lg font-semibold text-[#E2E8F0]">Recent questions</h2>
          <div className="mt-5 overflow-x-auto">
            {data.recentQuestions.length === 0 ? (
              <p className="text-sm text-slate-500">No workspace questions yet.</p>
            ) : (
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#2D3039] text-[10px] uppercase tracking-[0.18em] text-slate-500">
                    <th className="pb-3 pr-4">Question</th>
                    <th className="pb-3 pr-4">User</th>
                    <th className="pb-3 pr-4">Support</th>
                    <th className="pb-3 pr-4">Knowledge gap</th>
                    <th className="pb-3">Asked</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2D3039]">
                  {data.recentQuestions.map((item) => (
                    <tr key={item.id}>
                      <td className="py-4 pr-4 text-sm font-semibold text-[#E2E8F0]">{item.question}</td>
                      <td className="py-4 pr-4 text-xs text-slate-400">{item.user_email}</td>
                      <td className="py-4 pr-4 text-xs text-slate-400">
                        {item.had_sources ? 'Source-backed' : 'Fallback'}
                      </td>
                      <td className="py-4 pr-4 text-xs">
                        {item.knowledge_gap ? (
                          <span className="text-accent">Yes</span>
                        ) : (
                          <span className="text-slate-500">No</span>
                        )}
                      </td>
                      <td className="py-4 text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-[#2D3039] bg-[#15171C] p-6 shadow-xl shadow-black/20">
          <h2 className="text-lg font-semibold text-[#E2E8F0]">Recent knowledge gaps</h2>
          <div className="mt-5 space-y-3">
            {data.recentKnowledgeGaps.length === 0 ? (
              <p className="text-sm text-slate-500">No knowledge gaps recorded yet.</p>
            ) : (
              data.recentKnowledgeGaps.map((item) => (
                <div key={item.id} className="rounded-2xl border border-[#2D3039] bg-[#101217] p-4">
                  <p className="text-sm font-semibold text-[#E2E8F0]">{item.question}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>{item.status}</span>
                    <span>{item.occurrence_count} asks</span>
                    <span>{new Date(item.last_asked_at).toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
