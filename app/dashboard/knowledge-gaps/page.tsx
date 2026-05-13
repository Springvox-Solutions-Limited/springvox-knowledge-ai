"use client";

import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { getAccessToken, getCurrentUserProfile } from '@/src/lib/auth-client';
import { cn, truncate } from '@/src/lib/utils';
import { isManagerRole, type UserProfile } from '@/src/lib/workspace';

type KnowledgeGap = {
  id: string;
  question: string;
  status: 'open' | 'reviewed' | 'resolved' | 'ignored';
  occurrence_count: number;
  last_asked_at: string;
  created_at: string;
  sample_answer?: string | null;
};

const STATUS_OPTIONS: KnowledgeGap['status'][] = ['open', 'reviewed', 'resolved', 'ignored'];

export default function KnowledgeGapsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [knowledgeGaps, setKnowledgeGaps] = useState<KnowledgeGap[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | KnowledgeGap['status']>('all');
  const [error, setError] = useState<string | null>(null);

  const loadKnowledgeGaps = async () => {
    try {
      setLoading(true);
      const currentProfile = await getCurrentUserProfile();
      setProfile(currentProfile);

      if (!currentProfile || !isManagerRole(currentProfile.role)) {
        router.replace('/dashboard/chat');
        return;
      }

      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('Authentication session expired');
      }

      const response = await fetch('/api/knowledge-gaps', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load knowledge gaps');
      }

      const data = await response.json();
      setKnowledgeGaps(data.knowledgeGaps || []);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load knowledge gaps');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKnowledgeGaps();
  }, []);

  const updateGapStatus = async (id: string, status: KnowledgeGap['status']) => {
    try {
      setSavingId(id);
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('Authentication session expired');
      }

      const response = await fetch('/api/knowledge-gaps', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ id, status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update knowledge gap');
      }

      await loadKnowledgeGaps();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Failed to update knowledge gap');
    } finally {
      setSavingId(null);
    }
  };

  const filteredKnowledgeGaps = knowledgeGaps.filter((gap) => {
    const matchesSearch = !searchQuery || gap.question.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || gap.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (profile && !isManagerRole(profile.role)) {
    return null;
  }

  return (
    <div className="admin-page">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Knowledge Coverage</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">Knowledge Gaps</h1>
          <p className="text-sm text-slate-500">
            Review unanswered questions to identify areas where your documentation needs improvement.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search questions..."
              className="admin-input py-3 pl-12 pr-4"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'all' | KnowledgeGap['status'])}
            className="admin-input"
          >
            <option value="all">All statuses</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="admin-shell-card border border-slate-200 bg-white">
        {loading ? (
          <div className="flex items-center justify-center gap-3 px-6 py-24 text-sm text-slate-400">
            <Loader2 size={18} className="animate-spin text-slate-400" />
            Analyzing coverage gaps...
          </div>
        ) : filteredKnowledgeGaps.length === 0 ? (
          <div className="px-6 py-24 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 mx-auto">
              <AlertTriangle size={24} strokeWidth={1.5} />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-900">No coverage gaps identified</p>
            <p className="mt-2 text-xs text-slate-500">All recent questions have been answered using your knowledge base.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredKnowledgeGaps.map((gap) => (
              <div key={gap.id} className="p-6 transition-colors hover:bg-slate-50/50">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-4 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider',
                          gap.status === 'open'
                            ? 'bg-red-50 text-red-700 border border-red-100'
                            : gap.status === 'resolved'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : gap.status === 'ignored'
                                ? 'bg-slate-100 text-slate-600 border border-slate-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-100',
                        )}
                      >
                        {gap.status}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        {gap.occurrence_count} {gap.occurrence_count === 1 ? 'ASK' : 'ASKS'}
                      </span>
                    </div>
                    <p className="text-lg font-semibold tracking-tight text-slate-900 leading-snug">{gap.question}</p>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-[11px] font-medium text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <span className="text-slate-300">Added:</span> {new Date(gap.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="text-slate-300">Last seen:</span> {new Date(gap.last_asked_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    {gap.sample_answer && (
                      <div className="rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Fallback response</p>
                        <p className="text-xs leading-relaxed text-slate-600 italic">
                          "{truncate(gap.sample_answer, 140)}"
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 lg:flex-nowrap">
                    {STATUS_OPTIONS.map((status) => (
                      <button
                        key={status}
                        type="button"
                        disabled={savingId === gap.id || status === gap.status}
                        onClick={() => updateGapStatus(gap.id, status)}
                        className={cn(
                          'rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-all',
                          status === gap.status
                            ? 'bg-slate-950 text-white shadow-sm'
                            : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-900 disabled:opacity-30',
                        )}
                      >
                        {savingId === gap.id && status === gap.status ? '...' : status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
