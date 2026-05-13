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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_25%),linear-gradient(180deg,#e9f6fb_0%,#f3f7fb_100%)] px-4 py-16 text-slate-900">
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-900/10">
        {loading ? (
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <Loader2 size={18} className="animate-spin text-cyan-700" />
            Loading invitation...
          </div>
        ) : details ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-700">Workspace Invitation</p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950">
                Join {details.workspace_name}
              </h1>
              <p className="text-sm leading-7 text-slate-600">
                {details.assistant_name} is ready for invited users in this workspace.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Invited email</p>
                <p className="mt-2 text-sm text-slate-900">{details.email}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Role</p>
                <p className="mt-2 text-sm text-slate-900">{details.role.replace('_', ' ')}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-cyan-700" />
                <span>Sign in with the invited email to accept this workspace invitation.</span>
              </div>
              {userEmail ? (
                <p className="mt-3 text-slate-600">
                  Signed in as <span className="font-semibold text-slate-950">{userEmail}</span>
                </p>
              ) : (
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link href="/login" className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                    Login
                  </Link>
                  <Link href="/register" className="rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950">
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
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-40"
                >
                  {accepting ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                  Accept invitation
                </button>
                <Link href="/dashboard" className="rounded-xl border border-slate-200 px-5 py-3 text-sm text-slate-700">
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
