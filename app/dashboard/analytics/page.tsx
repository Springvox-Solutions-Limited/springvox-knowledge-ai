"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  BarChart3, 
  Loader2, 
  TrendingUp, 
  TrendingDown, 
  PieChart as PieIcon,
  MessageSquare,
  FileText,
  ShieldCheck,
  Search,
  Activity,
  ArrowRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';

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
      <div className="flex h-[400px] flex-col items-center justify-center gap-4 rounded-[40px] border border-slate-200 bg-white shadow-sm">
        <Loader2 size={32} className="animate-spin text-slate-900" />
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Synchronizing Data Store...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-[32px] border border-red-100 bg-red-50/50 p-10 text-center">
        <p className="text-sm font-bold text-red-600">{error || 'Analytics unavailable.'}</p>
      </div>
    );
  }

  const totalQuestions = data.summary.totalQuestions || 0;
  const sourceBacked = data.summary.sourceBackedAnswers || 0;
  const fallback = data.summary.fallbackAnswers || 0;
  const gapRate = totalQuestions ? Math.round((fallback / totalQuestions) * 100) : 0;
  const healthScore = 100 - gapRate;

  const pieData = [
    { name: 'Grounded', value: sourceBacked, color: '#0f172a' },
    { name: 'Fallback', value: fallback, color: '#cbd5e1' },
  ];

  return (
    <div className="space-y-10">
      {/* Header Section */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">
            <Activity size={12} />
            Workspace Intelligence
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-950">
            {data.workspace?.name || 'Workspace'} Dashboard
          </h1>
          <p className="text-base text-slate-500 font-medium">
            Real-time insights into knowledge coverage and AI accuracy.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 shadow-sm">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Health Score</p>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-slate-950">{healthScore}%</span>
              <TrendingUp size={14} className="text-emerald-500" />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Ingested', value: data.summary.totalDocuments, icon: FileText, sub: `${data.summary.totalChunks} Chunks` },
          { label: 'Active Queries', value: data.summary.totalQuestions, icon: MessageSquare, sub: `${data.summary.questionsLast7Days} this week` },
          { label: 'Knowledge Gaps', value: data.summary.openKnowledgeGaps, icon: Search, sub: 'Needs Ingestion', trend: 'down' },
          { label: 'Grounded Rate', value: `${gapRate ? 100 - gapRate : 0}%`, icon: ShieldCheck, sub: 'Source-backed', trend: 'up' },
        ].map((kpi) => (
          <div key={kpi.label} className="group relative rounded-[32px] border border-slate-200 bg-white p-7 shadow-sm transition-all hover:border-slate-950 hover:shadow-2xl hover:shadow-slate-100">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-950 border border-slate-100 group-hover:bg-slate-950 group-hover:text-white transition-all">
              <kpi.icon size={20} />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{kpi.label}</p>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight text-slate-950">{kpi.value}</span>
              {kpi.trend && (
                kpi.trend === 'up' ? <TrendingUp size={14} className="text-emerald-500" /> : <TrendingDown size={14} className="text-red-500" />
              )}
            </div>
            <p className="mt-1 text-xs font-medium text-slate-500">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Main Analytics Content */}
      <div className="grid gap-10 lg:grid-cols-[1fr,400px]">
        {/* Line Chart Section */}
        <div className="rounded-[40px] border border-slate-200 bg-white p-10 shadow-sm">
          <div className="mb-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-950 border border-slate-100">
                <BarChart3 size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-950">Query Activity</h2>
                <p className="text-sm font-medium text-slate-500">Daily question volume over the last 14 days.</p>
              </div>
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.dailyQuestionCounts}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f172a" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '20px', 
                    border: '1px solid #f1f5f9', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#0f172a" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                  activeDot={{ r: 6, fill: '#0f172a', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart / Distribution Section */}
        <div className="flex flex-col gap-6">
          <div className="rounded-[40px] border border-slate-200 bg-white p-10 shadow-sm">
            <div className="mb-8">
              <h2 className="text-xl font-black tracking-tight text-slate-950">Coverage Mix</h2>
              <p className="text-sm font-medium text-slate-500">Distribution of answer types.</p>
            </div>
            
            <div className="h-[200px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-slate-950">{healthScore}%</span>
                <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Grounded</span>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-2xl border border-slate-50 bg-slate-50/50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{item.name}</span>
                  </div>
                  <span className="text-sm font-black text-slate-950">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[40px] border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-lg font-black tracking-tight text-slate-950">Member Directory</h2>
            <div className="mt-6 space-y-3">
              {[
                { label: 'Total Users', value: data.summary.totalUsers },
                { label: 'Administrators', value: data.summary.admins },
                { label: 'Pending Invitations', value: data.summary.pendingInvitations },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{row.label}</span>
                  <span className="text-sm font-black text-slate-950">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Activity Section */}
      <div className="grid gap-10 xl:grid-cols-[1.2fr,0.8fr]">
        <div className="rounded-[40px] border border-slate-200 bg-white p-10 shadow-sm overflow-hidden">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tight text-slate-950">Recent Query Flow</h2>
            <Link href="/dashboard/chat" className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-slate-950 transition-colors flex items-center gap-2">
              View All <ArrowRight size={12} />
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            {data.recentQuestions.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No activity recorded yet.</p>
            ) : (
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <th className="pb-4 pr-4">Question</th>
                    <th className="pb-4 pr-4">Outcome</th>
                    <th className="pb-4 pr-4">Status</th>
                    <th className="pb-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.recentQuestions.map((item) => (
                    <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="py-5 pr-4">
                        <p className="text-sm font-bold text-slate-900 leading-snug">{item.question}</p>
                        <p className="mt-1 text-[10px] text-slate-400 font-medium">{item.user_email}</p>
                      </td>
                      <td className="py-5 pr-4">
                        <span className={cn(
                          "rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider",
                          item.had_sources ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-slate-100 text-slate-600 border border-slate-200"
                        )}>
                          {item.had_sources ? 'Grounded' : 'Fallback'}
                        </span>
                      </td>
                      <td className="py-5 pr-4">
                        {item.knowledge_gap ? (
                          <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-red-600">
                            <div className="h-1 w-1 rounded-full bg-red-600" />
                            Gap Detected
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-300">
                            <div className="h-1 w-1 rounded-full bg-slate-300" />
                            Resolved
                          </div>
                        )}
                      </td>
                      <td className="py-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="rounded-[40px] border border-slate-200 bg-white p-10 shadow-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-black tracking-tight text-slate-950">Active Knowledge Gaps</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">Queries that failed to find source context.</p>
          </div>
          
          <div className="space-y-4">
            {data.recentKnowledgeGaps.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 p-10 text-center">
                <ShieldCheck size={32} className="mx-auto text-slate-200 mb-4" />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No Gaps Detected</p>
              </div>
            ) : (
              data.recentKnowledgeGaps.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6 transition-all hover:border-slate-300">
                  <p className="text-sm font-bold text-slate-900 leading-snug">{item.question}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                        {item.status}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        {item.occurrence_count} {item.occurrence_count === 1 ? 'hit' : 'hits'}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-300">
                      {new Date(item.last_asked_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="mt-8">
            <Link href="/dashboard/knowledge-gaps" className="flex w-full items-center justify-center rounded-2xl bg-slate-950 py-4 text-xs font-bold uppercase tracking-widest !text-white transition-all hover:bg-slate-800">
              Manage All Gaps
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
