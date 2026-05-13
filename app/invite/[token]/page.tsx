"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Mail, ShieldCheck } from 'lucide-react';

import { getAccessToken } from '@/src/lib/auth-client';
import { supabase } from '@/src/lib/supabase';

type InviteDetails = {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  accepted_at: string | null;
  workspace_name: string;
  assistant_name: string;
};

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState('');
  const [details, setDetails] = useState<InviteDetails | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ token: resolvedToken }) => {
      setToken(resolvedToken);
      loadInvitation(resolvedToken);
    });
  }, [params]);

  const loadInvitation = async (resolvedToken: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/invitations/${resolvedToken}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invitation not found');
      }

      setDetails(data.invitation);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserEmail(user?.email || null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Invitation not found');
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async () => {
    try {
      setAccepting(true);
      setError(null);
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('Please log in with the invited email before accepting.');
      }

      const response = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ token }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to accept invitation');
      }

      setMessage('Invitation accepted. You can now continue to your dashboard.');
    } catch (acceptError) {
      setError(acceptError instanceof Error ? acceptError.message : 'Unable to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0C0E] px-4 py-16 text-[#E2E8F0]">
      <div className="mx-auto max-w-2xl rounded-3xl border border-[#2D3039] bg-[#15171C] p-8 shadow-2xl shadow-black/30">
        {loading ? (
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <Loader2 size={18} className="animate-spin text-accent" />
            Loading invitation...
          </div>
        ) : details ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent">Workspace Invitation</p>
              <h1 className="text-3xl font-bold tracking-tight text-[#E2E8F0]">
                Join {details.workspace_name}
              </h1>
              <p className="text-sm leading-7 text-slate-400">
                {details.assistant_name} is ready for invited users in this workspace.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#2D3039] bg-[#101217] p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Invited email</p>
                <p className="mt-2 text-sm text-[#E2E8F0]">{details.email}</p>
              </div>
              <div className="rounded-2xl border border-[#2D3039] bg-[#101217] p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Role</p>
                <p className="mt-2 text-sm text-[#E2E8F0]">{details.role.replace('_', ' ')}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#2D3039] bg-[#101217] p-4 text-sm leading-7 text-slate-300">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-accent" />
                <span>Sign in with the invited email to accept this workspace invitation.</span>
              </div>
              {userEmail ? (
                <p className="mt-3 text-slate-400">
                  Signed in as <span className="font-semibold text-[#E2E8F0]">{userEmail}</span>
                </p>
              ) : (
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link href="/login" className="rounded-xl border border-[#2D3039] px-4 py-3 text-sm text-slate-300">
                    Login
                  </Link>
                  <Link href="/register" className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-black">
                    Create account
                  </Link>
                </div>
              )}
            </div>

            {(message || error) && (
              <div className={`rounded-2xl border p-4 text-sm ${error ? 'border-red-500/20 bg-red-500/5 text-red-300' : 'border-green-500/20 bg-green-500/5 text-green-300'}`}>
                {error || message}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs text-slate-500">
                Expires {new Date(details.expires_at).toLocaleString()}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={acceptInvitation}
                  disabled={!userEmail || accepting}
                  className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-black disabled:opacity-40"
                >
                  {accepting ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                  Accept invitation
                </button>
                <Link href="/dashboard" className="rounded-xl border border-[#2D3039] px-5 py-3 text-sm text-slate-300">
                  Go to dashboard
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-red-300">{error || 'Invitation unavailable.'}</div>
        )}
      </div>
    </div>
  );
}
