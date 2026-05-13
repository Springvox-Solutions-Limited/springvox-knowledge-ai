"use client";
import { useEffect, useState } from 'react';
import { getCurrentUserProfile } from '@/src/lib/auth-client';
import { supabase } from '@/src/lib/supabase';
import { 
  FileText, 
  CheckCircle2,
  AlertTriangle,
  Layers3,
  ArrowUpRight,
  Upload,
  MessageSquare,
  FolderOpen
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/src/lib/utils';
import { type UserProfile } from '@/src/lib/workspace';

export default function DashboardOverview() {
  const [stats, setStats] = useState({ docs: 0, completed: 0, failed: 0, totalChunks: 0 });
  const [recentDocuments, setRecentDocuments] = useState<any[]>([]);
  const [knowledgeGapSummary, setKnowledgeGapSummary] = useState({
    openCount: 0,
    topQuestion: '',
  });
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const currentProfile = await getCurrentUserProfile();
      setProfile(currentProfile);

      if (!currentProfile?.workspace_id) {
        setLoading(false);
        return;
      }

      const { data: docs, error } = await supabase
        .from('documents')
        .select('id, filename, status, total_chunks, created_at')
        .eq('workspace_id', currentProfile.workspace_id)
        .order('created_at', { ascending: false });

      if (error || !docs) {
        setLoading(false);
        return;
      }

      const completed = docs.filter((doc) => doc.status === 'completed').length;
      const failed = docs.filter((doc) => doc.status === 'failed').length;
      const totalChunks = docs.reduce((sum, doc) => sum + (doc.total_chunks || 0), 0);

      const { data: gaps } = await supabase
        .from('knowledge_gaps')
        .select('question, occurrence_count, status')
        .eq('workspace_id', currentProfile.workspace_id)
        .order('occurrence_count', { ascending: false })
        .limit(1);

      const { count: openGapCount } = await supabase
        .from('knowledge_gaps')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', currentProfile.workspace_id)
        .eq('status', 'open');

      setStats({
        docs: docs.length,
        completed,
        failed,
        totalChunks,
      });
      setKnowledgeGapSummary({
        openCount: openGapCount || 0,
        topQuestion: gaps?.[0]?.question || '',
      });
      setRecentDocuments(docs.slice(0, 5));
      setLoading(false);
    }
    fetchStats();
  }, []);

  if (profile?.role === 'viewer') {
    return null;
  }

  const cards = [
    { title: 'Total Documents', value: stats.docs, icon: FileText, accent: 'text-accent' },
    { title: 'Completed', value: stats.completed, icon: CheckCircle2, accent: 'text-green-400' },
    { title: 'Failed', value: stats.failed, icon: AlertTriangle, accent: 'text-red-400' },
    { title: 'Total Chunks', value: stats.totalChunks, icon: Layers3, accent: 'text-blue-400' },
  ];

  if (loading) return <div className="animate-pulse space-y-8">
     <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {[1,2,3,4].map(i => <div key={i} className="h-32 rounded-3xl bg-[#15171C]" />)}
     </div>
  </div>;

  return (
    <div className="space-y-10">
      <div className="rounded-[2rem] border border-[#2D3039] bg-[radial-gradient(circle_at_top_left,rgba(255,107,0,0.12),transparent_35%),linear-gradient(180deg,#15171C_0%,#101217_100%)] p-8 md:p-10 shadow-2xl shadow-black/30">
        <div className="space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-accent">Enterprise Knowledge Workspace</p>
          <h1 className="text-3xl font-bold tracking-tight text-[#E2E8F0] md:text-4xl">Your private context engine is live.</h1>
          <p className="max-w-2xl text-sm leading-7 text-slate-400 md:text-base">
            SpringVox is ready to ingest documents, ground answers in verified context, and keep your workspace searchable with auditable sources.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.title === 'Total Chunks' ? '/dashboard/documents' : '/dashboard/documents'}
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
                <h2 className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Recent Documents</h2>
                <Link href="/dashboard/documents" className="text-xs font-semibold text-accent">View all</Link>
            </div>
            {recentDocuments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#2D3039] bg-[#101217] p-8 text-center">
                <FileText size={28} className="mx-auto text-slate-700" />
                <p className="mt-4 text-sm font-semibold text-[#E2E8F0]">No documents uploaded yet</p>
                <p className="mt-2 text-xs leading-6 text-slate-500">Start by uploading a PDF or TXT file to build your knowledge workspace.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between rounded-2xl border border-[#2D3039] bg-[#101217] px-4 py-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#E2E8F0]">{doc.filename}</p>
                      <p className="mt-1 text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500">
                        {new Date(doc.created_at).toLocaleDateString()} • {doc.total_chunks || 0} chunks
                      </p>
                    </div>
                    <span className={cn(
                      "rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]",
                      doc.status === 'completed'
                        ? 'border-green-500/20 bg-green-500/10 text-green-400'
                        : doc.status === 'failed'
                          ? 'border-red-500/20 bg-red-500/10 text-red-400'
                          : 'border-accent/20 bg-accent/10 text-accent'
                    )}>
                      {doc.status}
                    </span>
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
                  { href: '/dashboard/upload', icon: Upload, title: 'Upload document', copy: 'Add new PDF or TXT files to your secure index.' },
                  { href: '/dashboard/chat', icon: MessageSquare, title: 'Ask a question', copy: 'Query your uploaded documents and get source-backed answers.' },
                  { href: '/dashboard/documents', icon: FolderOpen, title: 'View documents', copy: 'Review ingestion status, chunks, and failures.' },
                  { href: '/dashboard/knowledge-gaps', icon: AlertTriangle, title: 'Review knowledge gaps', copy: 'See what users are asking that your current documents do not answer yet.' },
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
          <p className="mt-4 font-mono text-4xl font-bold text-[#E2E8F0]">{knowledgeGapSummary.openCount}</p>
          <p className="mt-2 text-sm text-slate-500">Questions your uploaded documents still do not clearly support.</p>
        </Link>

        <div className="rounded-3xl border border-[#2D3039] bg-[#15171C] p-6 shadow-xl shadow-black/20">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Most Repeated Unanswered Question</p>
          <div className="mt-5 rounded-2xl border border-[#2D3039] bg-[#101217] p-5">
            <p className="text-sm font-semibold text-[#E2E8F0]">
              {knowledgeGapSummary.topQuestion || 'No unanswered questions have been recorded yet.'}
            </p>
            <p className="mt-2 text-xs leading-6 text-slate-500">
              When users hit the strict fallback answer, SpringVox records the question here so admins can improve the document set.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
