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
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-700">Admin Controls</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">Workspace Users</h1>
          <p className="text-sm text-slate-500">
            Manage who can upload, manage documents, or stay in chat-only mode.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              setInviteOpen(true);
              setCreatedInviteUrl(null);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-semibold text-cyan-700"
          >
            <MailPlus size={16} />
            Invite user
          </button>
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by email..."
              className="admin-input py-3 pl-10 pr-4"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value as 'all' | AppRole)}
            className="admin-input"
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

      <div className="admin-shell-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-3 px-6 py-16 text-sm text-slate-400">
            <Loader2 size={18} className="animate-spin text-cyan-700" />
            Loading workspace users...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Users className="mx-auto text-slate-700" size={36} />
            <p className="mt-4 text-sm font-semibold text-slate-950">No users found</p>
            <p className="mt-2 text-xs text-slate-500">Try another search or role filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-left">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Email</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Role</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Workspace</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Created</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Updated</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 text-right">Change role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/80">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-900">{user.email || 'No email'}</p>
                      {user.full_name && (
                        <p className="mt-1 text-xs text-slate-500">{user.full_name}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          'rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]',
                          user.role === 'admin'
                            ? 'border-cyan-200 bg-cyan-50 text-cyan-700'
                            : user.role === 'content_manager'
                              ? 'border-sky-200 bg-sky-50 text-sky-700'
                              : 'border-slate-200 bg-slate-50 text-slate-500',
                        )}
                      >
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">{user.workspace_name}</td>
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
                                ? 'border-cyan-200 bg-cyan-50 text-cyan-700'
                                : 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900',
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

      <div className="admin-shell-card p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Pending invitations</h2>
            <p className="text-sm text-slate-500">Create an invite link and share it manually.</p>
          </div>
          <span className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500">
            {invitations.filter((item) => item.status === 'pending').length} pending
          </span>
        </div>

        <div className="space-y-3">
          {invitations.length === 0 ? (
            <p className="text-sm text-slate-500">No invitations created yet.</p>
          ) : (
            invitations.slice(0, 8).map((invitation) => (
              <div key={invitation.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{invitation.email}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {invitation.role.replace('_', ' ')} • {invitation.status} • expires{' '}
                      {new Date(invitation.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(invitation.invite_url)}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
                    >
                      <Copy size={12} />
                      Copy link
                    </button>
                    {invitation.status === 'pending' && (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => revokeInvitation(invitation.id)}
                        className="rounded-lg border border-red-500/10 px-3 py-2 text-xs text-red-300"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {confirmState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/10">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <Shield size={18} className="text-cyan-700" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-950">Confirm self-demotion</h2>
                <p className="mt-2 text-sm leading-7 text-slate-400">
                  You are about to change your own role to{' '}
                  <span className="font-semibold text-slate-950">
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
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => updateRole(confirmState.user, confirmState.nextRole, true)}
                className="rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950"
              >
                Confirm role change
              </button>
            </div>
          </div>
        </div>
      )}

      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">Invite user</h2>
                <p className="mt-2 text-sm leading-7 text-slate-400">
                  Create a manual invite link for a user to join this workspace.
                </p>
              </div>
              <button type="button" onClick={() => setInviteOpen(false)} className="rounded-xl border border-slate-200 p-2 text-slate-500">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={createInvitation} className="mt-6 space-y-5">
              <label className="block space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Email</span>
                <input
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  className="admin-input"
                  placeholder="person@company.com"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Role</span>
                <select
                  value={inviteRole}
                  onChange={(event) => setInviteRole(event.target.value as AppRole)}
                  className="admin-input"
                >
                  <option value="viewer">Viewer</option>
                  <option value="content_manager">Content manager</option>
                  <option value="admin">Admin</option>
                </select>
              </label>

              {createdInviteUrl && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Invite link</p>
                  <p className="mt-2 break-all text-sm text-slate-700">{createdInviteUrl}</p>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(createdInviteUrl)}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
                  >
                    <Copy size={12} />
                    Copy invite link
                  </button>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setInviteOpen(false)} className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                  Close
                </button>
                <button type="submit" disabled={saving} className="rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950">
                  {saving ? 'Creating...' : 'Create invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
