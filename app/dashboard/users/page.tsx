"use client";

import { useEffect, useState } from 'react';
import { Loader2, Search, Shield, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { getAccessToken, getCurrentUserProfile } from '@/src/lib/auth-client';
import { cn } from '@/src/lib/utils';
import { isAdminRole, type AppRole, type UserProfile } from '@/src/lib/workspace';

type ManagedUser = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: AppRole;
  workspace_id: string | null;
  workspace_name: string;
  created_at: string;
  updated_at: string;
};

const ROLE_OPTIONS: AppRole[] = ['viewer', 'content_manager', 'admin'];

export default function UsersPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | AppRole>('all');
  const [error, setError] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<{
    user: ManagedUser;
    nextRole: AppRole;
  } | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const currentProfile = await getCurrentUserProfile();
      setProfile(currentProfile);

      if (!currentProfile || !isAdminRole(currentProfile.role)) {
        router.replace('/dashboard');
        return;
      }

      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('Authentication session expired');
      }

      const response = await fetch('/api/users', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load users');
      }

      const data = await response.json();
      setUsers(data.users || []);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      !searchQuery ||
      (user.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.full_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const updateRole = async (user: ManagedUser, nextRole: AppRole, confirmSelfDemotion = false) => {
    try {
      setSaving(true);
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('Authentication session expired');
      }

      const response = await fetch('/api/users/role', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          userId: user.id,
          role: nextRole,
          confirmSelfDemotion,
        }),
      });

      if (response.status === 409) {
        setConfirmState({ user, nextRole });
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to update role');
      }

      await loadUsers();
      setConfirmState(null);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Failed to update role');
    } finally {
      setSaving(false);
    }
  };

  if (profile && !isAdminRole(profile.role)) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent">Admin Controls</p>
          <h1 className="text-3xl font-bold tracking-tight text-[#E2E8F0]">Workspace Users</h1>
          <p className="text-sm text-slate-500">
            Manage who can upload, manage documents, or stay in chat-only mode.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by email..."
              className="w-full rounded-xl border border-[#2D3039] bg-[#1A1C20] py-3 pl-10 pr-4 text-sm text-[#E2E8F0] focus:border-accent/50 focus:outline-none"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value as 'all' | AppRole)}
            className="rounded-xl border border-[#2D3039] bg-[#1A1C20] px-4 py-3 text-sm text-[#E2E8F0] focus:border-accent/50 focus:outline-none"
          >
            <option value="all">All roles</option>
            <option value="viewer">Viewer</option>
            <option value="content_manager">Content manager</option>
            <option value="admin">Admin</option>
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
            Loading workspace users...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Users className="mx-auto text-slate-700" size={36} />
            <p className="mt-4 text-sm font-semibold text-[#E2E8F0]">No users found</p>
            <p className="mt-2 text-xs text-slate-500">Try another search or role filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-left">
              <thead>
                <tr className="bg-[#0D0F12]">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Email</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Role</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Workspace</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Created</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Updated</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 text-right">Change role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2D3039]">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-white/[0.02]">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-[#E2E8F0]">{user.email || 'No email'}</p>
                      {user.full_name && (
                        <p className="mt-1 text-xs text-slate-500">{user.full_name}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          'rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]',
                          user.role === 'admin'
                            ? 'border-accent/20 bg-accent/10 text-accent'
                            : user.role === 'content_manager'
                              ? 'border-blue-500/20 bg-blue-500/10 text-blue-300'
                              : 'border-[#2D3039] bg-[#101217] text-slate-400',
                        )}
                      >
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">{user.workspace_name}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(user.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {ROLE_OPTIONS.map((roleOption) => (
                          <button
                            key={roleOption}
                            type="button"
                            disabled={saving || roleOption === user.role}
                            onClick={() => updateRole(user, roleOption, false)}
                            className={cn(
                              'rounded-lg border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] transition-colors',
                              roleOption === user.role
                                ? 'border-accent/20 bg-accent/10 text-accent'
                                : 'border-[#2D3039] text-slate-400 hover:text-white',
                            )}
                          >
                            {roleOption === 'content_manager' ? 'Manager' : roleOption}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {confirmState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-lg rounded-3xl border border-[#2D3039] bg-[#15171C] p-6 shadow-2xl shadow-black/40">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl border border-[#2D3039] bg-[#101217] p-3">
                <Shield size={18} className="text-accent" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[#E2E8F0]">Confirm self-demotion</h2>
                <p className="mt-2 text-sm leading-7 text-slate-400">
                  You are about to change your own role to{' '}
                  <span className="font-semibold text-[#E2E8F0]">
                    {confirmState.nextRole.replace('_', ' ')}
                  </span>
                  . This can remove your current admin access.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmState(null)}
                className="rounded-xl border border-[#2D3039] px-4 py-3 text-sm text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => updateRole(confirmState.user, confirmState.nextRole, true)}
                className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-black"
              >
                Confirm role change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
