"use client";

import { useEffect, useState } from 'react';
import { Copy, Loader2, MailPlus, Search, Shield, Users, X } from 'lucide-react';
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

type Invitation = {
  id: string;
  email: string;
  role: AppRole;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  expires_at: string;
  created_at: string;
  invite_url: string;
};

const ROLE_OPTIONS: AppRole[] = ['viewer', 'content_manager', 'admin'];

export default function UsersPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | AppRole>('all');
  const [error, setError] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<{
    user: ManagedUser;
    nextRole: AppRole;
  } | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<AppRole>('viewer');
  const [createdInviteUrl, setCreatedInviteUrl] = useState<string | null>(null);

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
      const inviteResponse = await fetch('/api/invitations', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (inviteResponse.ok) {
        const inviteData = await inviteResponse.json();
        setInvitations(inviteData.invitations || []);
      }
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

  const createInvitation = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setSaving(true);
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('Authentication session expired');
      }

      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create invitation');
      }

      setCreatedInviteUrl(data.invitation.invite_url);
      setInviteEmail('');
      await loadUsers();
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : 'Failed to create invitation');
    } finally {
      setSaving(false);
    }
  };

  const revokeInvitation = async (id: string) => {
    try {
      setSaving(true);
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('Authentication session expired');
      }

      const response = await fetch('/api/invitations/revoke', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error('Failed to revoke invitation');
      }

      await loadUsers();
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : 'Failed to revoke invitation');
    } finally {
      setSaving(false);
    }
  };

  if (profile && !isAdminRole(profile.role)) {
    return null;
  }

  return (
    <div className="admin-page">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Identity & Access</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">Workspace Users</h1>
          <p className="text-sm text-slate-500">
            Control user permissions and manage roles across your secure workspace.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              setInviteOpen(true);
              setCreatedInviteUrl(null);
            }}
            className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold !text-white shadow-xl shadow-slate-950/10 transition-all hover:bg-slate-800 whitespace-nowrap"
          >
            <MailPlus size={16} className="!text-white" />
            Invite user
          </button>
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by identity..."
              className="admin-input py-3 pl-12 pr-4"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value as 'all' | AppRole)}
            className="admin-input"
          >
            <option value="all">All roles</option>
            <option value="viewer">Viewer</option>
            <option value="content_manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="admin-shell-card overflow-hidden border border-slate-200 bg-white">
        {loading ? (
          <div className="flex items-center justify-center gap-3 px-6 py-24 text-sm text-slate-400">
            <Loader2 size={18} className="animate-spin text-slate-400" />
            Synchronizing user directory...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="px-6 py-24 text-center">
             <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 mx-auto">
              <Users size={24} strokeWidth={1.5} />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-900">No users identified</p>
            <p className="mt-2 text-xs text-slate-500">Try refining your search or clearing the role filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Identity</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Role</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Workspace</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Activity</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 text-right">Permissions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold text-slate-900">{user.email || 'Anonymous'}</p>
                      {user.full_name && (
                        <p className="mt-0.5 text-xs text-slate-500 font-medium">{user.full_name}</p>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider',
                          user.role === 'admin'
                            ? 'bg-slate-900 text-white'
                            : user.role === 'content_manager'
                              ? 'bg-blue-50 text-blue-700 border border-blue-100'
                              : 'bg-slate-100 text-slate-600 border border-slate-200',
                        )}
                      >
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">{user.workspace_name}</td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Created: {new Date(user.created_at).toLocaleDateString()}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Updated: {new Date(user.updated_at).toLocaleDateString()}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-1.5">
                        {ROLE_OPTIONS.map((roleOption) => (
                          <button
                            key={roleOption}
                            type="button"
                            disabled={saving || roleOption === user.role}
                            onClick={() => updateRole(user, roleOption, false)}
                            className={cn(
                              'rounded-lg px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all',
                              roleOption === user.role
                                ? 'bg-slate-50 text-slate-400 cursor-default'
                                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-950 hover:text-slate-950 disabled:opacity-30',
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

      <div className="admin-shell-card p-8 border border-slate-200 bg-white">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-950">Active invitations</h2>
            <p className="text-xs text-slate-500 mt-1">Pending access requests and generated links.</p>
          </div>
          <div className="flex h-8 items-center rounded-full bg-slate-50 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 border border-slate-100">
            {invitations.filter((item) => item.status === 'pending').length} pending
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {invitations.length === 0 ? (
            <div className="col-span-full py-8 text-center rounded-2xl border border-dashed border-slate-100">
              <p className="text-xs text-slate-400 italic">No active invitations found.</p>
            </div>
          ) : (
            invitations.slice(0, 10).map((invitation) => (
              <div key={invitation.id} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 group hover:border-slate-200 transition-all">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{invitation.email}</p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {invitation.role.replace('_', ' ')} • {invitation.status}
                      </p>
                    </div>
                    {invitation.status === 'pending' && (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => revokeInvitation(invitation.id)}
                        className="text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(invitation.invite_url)}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-950 shadow-sm transition-all hover:border-slate-400"
                    >
                      <Copy size={12} />
                      Copy Invite URL
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 italic">
                    Expires {new Date(invitation.expires_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {confirmState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <Shield size={28} strokeWidth={1.5} />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-950">Security Warning</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                You are about to downgrade your own administrative privileges to <span className="font-bold text-slate-900 capitalize">"{confirmState.nextRole.replace('_', ' ')}"</span>.
                This action is immediate and may restrict your access to this page.
              </p>
            </div>
            <div className="mt-8 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => updateRole(confirmState.user, confirmState.nextRole, true)}
                className="w-full rounded-xl bg-red-600 py-4 text-sm font-bold text-white shadow-lg shadow-red-600/10 transition-all hover:bg-red-700"
              >
                Confirm Demotion
              </button>
              <button
                type="button"
                onClick={() => setConfirmState(null)}
                className="w-full rounded-xl bg-white py-4 text-sm font-bold text-slate-500 transition-all hover:text-slate-950"
              >
                Keep Admin Access
              </button>
            </div>
          </div>
        </div>
      )}

      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-950">Invite user</h2>
                <p className="mt-1 text-xs text-slate-500 font-medium">Create a secure entry link for this workspace.</p>
              </div>
              <button type="button" onClick={() => setInviteOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-50 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={createInvitation} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                <input
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  className="admin-input"
                  placeholder="name@company.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Workspace Role</label>
                <select
                  value={inviteRole}
                  onChange={(event) => setInviteRole(event.target.value as AppRole)}
                  className="admin-input"
                >
                  <option value="viewer">Viewer (Read Only)</option>
                  <option value="content_manager">Manager (Upload & Ingest)</option>
                  <option value="admin">Admin (Full Control)</option>
                </select>
              </div>

              {createdInviteUrl && (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 space-y-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Invitation link ready</p>
                    <p className="mt-2 break-all text-xs font-mono text-emerald-800 bg-white/50 p-3 rounded-lg border border-emerald-100">{createdInviteUrl}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(createdInviteUrl)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/10 hover:bg-emerald-700 transition-all"
                  >
                    <Copy size={14} />
                    Copy Invite Link
                  </button>
                </div>
              )}

              {!createdInviteUrl && (
                <div className="flex flex-col gap-3 pt-4">
                  <button type="submit" disabled={saving} className="w-full rounded-xl bg-slate-950 py-4 text-sm font-bold text-white shadow-lg shadow-slate-950/10 transition-all hover:bg-slate-800 disabled:opacity-30">
                    {saving ? 'Generating...' : 'Generate Invite Link'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
