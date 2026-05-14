"use client";

import { useEffect, useMemo, useState } from 'react';

import { fetchPlatformJson } from '@/src/lib/platform-client';
import { StatusBadge } from '@/src/components/platform/PlatformBadges';
import { PlatformPageHeader } from '@/src/components/platform/PlatformPageHeader';

type PlatformUser = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  workspace_id: string | null;
  workspace_name: string;
  workspace_status: string | null;
  created_at: string;
  updated_at: string;
};

type WorkspaceOption = {
  id: string;
  name: string;
};

export default function PlatformUsersPage() {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [workspaceFilter, setWorkspaceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (roleFilter !== 'all') params.set('role', roleFilter);
      if (workspaceFilter !== 'all') params.set('workspaceId', workspaceFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const result = await fetchPlatformJson<{ users: PlatformUser[] }>(`/api/platform/users?${params.toString()}`);
      setUsers(result.users || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadUsers();
  }, [search, roleFilter, workspaceFilter, statusFilter]);

  const workspaceOptions = useMemo<WorkspaceOption[]>(() => {
    const map = new Map<string, string>();
    for (const user of users) {
      if (user.workspace_id && !map.has(user.workspace_id)) {
        map.set(user.workspace_id, user.workspace_name);
      }
    }

    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [users]);

  const updateRole = async (user: PlatformUser, role: 'tenant_admin' | 'viewer') => {
    try {
      setSavingId(user.id);
      await fetchPlatformJson(`/api/platform/users/${user.id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({
          role,
          workspaceId: user.workspace_id,
          resetWorkspaceTenantAdmins: role === 'tenant_admin',
        }),
      });
      await loadUsers();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Failed to update role');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="admin-page">
      <PlatformPageHeader
        title="Users"
        subtitle="View platform users across all company workspaces."
        privacyNote="Tenant role changes are available here. Platform admin assignment remains SQL-only in this phase."
      />

      <div className="grid gap-3 xl:grid-cols-4">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by email or company" className="admin-input" />
        <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="admin-input">
          <option value="all">All roles</option>
          <option value="platform_admin">platform_admin</option>
          <option value="tenant_admin">tenant_admin</option>
          <option value="viewer">viewer</option>
        </select>
        <select value={workspaceFilter} onChange={(event) => setWorkspaceFilter(event.target.value)} className="admin-input">
          <option value="all">All workspaces</option>
          {workspaceOptions.map((workspace) => (
            <option key={workspace.id} value={workspace.id}>{workspace.name}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="admin-input">
          <option value="all">All statuses</option>
          <option value="active">active</option>
          <option value="trial">trial</option>
          <option value="suspended">suspended</option>
          <option value="inactive">inactive</option>
        </select>
      </div>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="admin-shell-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="border-b border-slate-200 bg-slate-50/70">
              <tr>
                {['Email', 'Role', 'Workspace', 'Status', 'Created', 'Updated', 'Actions'].map((column) => (
                  <th key={column} className="px-5 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">{column}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-500">Loading users...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-500">No users found.</td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-950">{user.email || 'No email'}</p>
                      <p className="mt-1 text-xs text-slate-500">{user.full_name || 'No name'}</p>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-700">{user.role}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{user.workspace_name}</td>
                    <td className="px-5 py-4"><StatusBadge status={user.workspace_status} /></td>
                    <td className="px-5 py-4 text-sm text-slate-600">{formatDate(user.created_at)}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{formatDate(user.updated_at)}</td>
                    <td className="px-5 py-4">
                      {user.role === 'platform_admin' ? (
                        <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">SQL-only</span>
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={() => updateRole(user, 'tenant_admin')} disabled={savingId === user.id} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-700 hover:border-slate-300">
                            Make tenant_admin
                          </button>
                          <button onClick={() => updateRole(user, 'viewer')} disabled={savingId === user.id} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-700 hover:border-slate-300">
                            Make viewer
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
