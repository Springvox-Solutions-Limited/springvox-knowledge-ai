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
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent">Knowledge Coverage</p>
          <h1 className="text-3xl font-bold tracking-tight text-[#E2E8F0]">Knowledge Gaps</h1>
          <p className="text-sm text-slate-500">
            Review unanswered questions so the workspace can improve over time.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search questions..."
              className="w-full rounded-xl border border-[#2D3039] bg-[#1A1C20] py-3 pl-10 pr-4 text-sm text-[#E2E8F0] focus:border-accent/50 focus:outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'all' | KnowledgeGap['status'])}
            className="rounded-xl border border-[#2D3039] bg-[#1A1C20] px-4 py-3 text-sm text-[#E2E8F0] focus:border-accent/50 focus:outline-none"
          >
            <option value="all">All statuses</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="rounded-3xl border border-[#2D3039] bg-[#15171C] shadow-xl shadow-black/20">
        {loading ? (
          <div className="flex items-center justify-center gap-3 px-6 py-16 text-sm text-slate-400">
            <Loader2 size={18} className="animate-spin text-accent" />
            Loading knowledge gaps...
          </div>
        ) : filteredKnowledgeGaps.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <AlertTriangle className="mx-auto text-slate-700" size={36} />
            <p className="mt-4 text-sm font-semibold text-[#E2E8F0]">No knowledge gaps found</p>
            <p className="mt-2 text-xs text-slate-500">Fallback questions will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4 p-4 md:p-6">
            {filteredKnowledgeGaps.map((gap) => (
              <div key={gap.id} className="rounded-2xl border border-[#2D3039] bg-[#101217] p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={cn(
                          'rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]',
                          gap.status === 'open'
                            ? 'border-accent/20 bg-accent/10 text-accent'
                            : gap.status === 'resolved'
                              ? 'border-green-500/20 bg-green-500/10 text-green-300'
                              : gap.status === 'ignored'
                                ? 'border-[#2D3039] bg-[#15171C] text-slate-400'
                                : 'border-blue-500/20 bg-blue-500/10 text-blue-300',
                        )}
                      >
                        {gap.status}
                      </span>
                      <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500">
                        Asked {gap.occurrence_count} time{gap.occurrence_count === 1 ? '' : 's'}
                      </span>
                    </div>
                    <p className="text-base font-semibold leading-7 text-[#E2E8F0]">{gap.question}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                      <span>Created {new Date(gap.created_at).toLocaleDateString()}</span>
                      <span>Last asked {new Date(gap.last_asked_at).toLocaleString()}</span>
                    </div>
                    {gap.sample_answer && (
                      <p className="rounded-xl border border-[#2D3039] bg-[#15171C] px-4 py-3 text-xs leading-6 text-slate-400">
                        Last fallback: {truncate(gap.sample_answer, 120)}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map((status) => (
                      <button
                        key={status}
                        type="button"
                        disabled={savingId === gap.id || status === gap.status}
                        onClick={() => updateGapStatus(gap.id, status)}
                        className={cn(
                          'rounded-lg border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] transition-colors',
                          status === gap.status
                            ? 'border-accent/20 bg-accent/10 text-accent'
                            : 'border-[#2D3039] text-slate-400 hover:text-white',
                        )}
                      >
                        {savingId === gap.id && status === gap.status ? 'Saving...' : status}
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
