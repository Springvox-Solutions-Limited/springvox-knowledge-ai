"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { fetchPlatformJson } from '@/src/lib/platform-client';
import { PlanBadge, StatusBadge } from '@/src/components/platform/PlatformBadges';
import { PLAN_DETAILS, WORKSPACE_PLANS, WORKSPACE_STATUSES } from '@/src/lib/workspace';
import { PlatformPageHeader } from '@/src/components/platform/PlatformPageHeader';

type CompanyDetailResponse = {
  workspace: {
    id: string;
    name: string;
    slug: string;
    status: string;
    plan: keyof typeof PLAN_DETAILS;
    created_at: string;
    industry: string | null;
    website: string | null;
    support_email: string | null;
    assistant_name: string | null;
    suspension_reason: string | null;
    internal_notes: string | null;
  };
  usage: {
    totalUsers: number;
    totalTenantAdmins: number;
    totalViewers: number;
    totalDocuments: number;
    totalQuestions: number;
    openKnowledgeGaps: number;
    feedbackCount: number;
    lastActivity: string | null;
  };
  users: Array<{
    id: string;
    email: string | null;
    full_name: string | null;
    role: string;
    created_at: string;
    updated_at: string;
  }>;
  documents: Array<{
    id: string;
    filename: string;
    status: string;
    created_at: string;
    total_sections: number;
  }>;
  questionActivity: {
    totalQuestions: number;
    openKnowledgeGaps: number;
    recentQuestionActivity: Array<{
      date: string;
      questions: number;
    }>;
  };
};

export default function PlatformCompanyDetailPage() {
  const params = useParams<{ id: string }>();
  const workspaceId = String(params.id);
  const [data, setData] = useState<CompanyDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusValue, setStatusValue] = useState<string>('active');
  const [planValue, setPlanValue] = useState<string>('pilot');
  const [suspensionReason, setSuspensionReason] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  const load = async () => {
    try {
      const result = await fetchPlatformJson<CompanyDetailResponse>(`/api/platform/companies/${workspaceId}`);
      setData(result);
      setStatusValue(result.workspace.status);
      setPlanValue(result.workspace.plan);
      setSuspensionReason(result.workspace.suspension_reason || '');
      setInternalNotes(result.workspace.internal_notes || '');
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load company details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [workspaceId]);

  const saveStatus = async () => {
    try {
      setSaving(true);
      await fetchPlatformJson(`/api/platform/companies/${workspaceId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: statusValue, suspension_reason: suspensionReason }),
      });
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to update workspace status');
    } finally {
      setSaving(false);
    }
  };

  const savePlan = async () => {
    try {
      setSaving(true);
      await fetchPlatformJson(`/api/platform/companies/${workspaceId}/plan`, {
        method: 'PATCH',
        body: JSON.stringify({ plan: planValue }),
      });
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to update workspace plan');
    } finally {
      setSaving(false);
    }
  };

  const saveNotes = async () => {
    try {
      setSaving(true);
      await fetchPlatformJson(`/api/platform/companies/${workspaceId}/notes`, {
        method: 'PATCH',
        body: JSON.stringify({ internal_notes: internalNotes }),
      });
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to update internal notes');
    } finally {
      setSaving(false);
    }
  };

  const updateUserRole = async (userId: string, role: 'tenant_admin' | 'viewer') => {
    try {
      setSaving(true);
      await fetchPlatformJson(`/api/platform/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({
          role,
          workspaceId,
          resetWorkspaceTenantAdmins: role === 'tenant_admin',
        }),
      });
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to update user role');
    } finally {
      setSaving(false);
    }
  };

  const removeUser = async (userId: string) => {
    try {
      setSaving(true);
      await fetchPlatformJson(`/api/platform/users/${userId}?workspaceId=${encodeURIComponent(workspaceId)}`, {
        method: 'DELETE',
      });
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to remove user');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="admin-shell-card p-6 text-sm text-slate-500">Loading company details...</div>;
  }

  if (!data) {
    return <div className="admin-shell-card p-6 text-sm text-slate-500">Company not found.</div>;
  }

  const planDetail = PLAN_DETAILS[data.workspace.plan];

  return (
    <div className="admin-page">
      <PlatformPageHeader
        title={data.workspace.name}
        subtitle="Workspace metadata, user roles, usage counts, and operational controls."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={data.workspace.status} />
          <PlanBadge plan={data.workspace.plan} />
          <span className="text-sm text-slate-500">{data.workspace.slug}</span>
        </div>
        <Link href="/platform/companies" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-700 hover:border-slate-300">
          Back to companies
        </Link>
      </div>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="admin-shell-card p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Company summary</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <SummaryItem label="Company name" value={data.workspace.name} />
            <SummaryItem label="Slug" value={data.workspace.slug} />
            <SummaryItem label="Created" value={formatDate(data.workspace.created_at)} />
            <SummaryItem label="Industry" value={data.workspace.industry || 'Not provided'} />
            <SummaryItem label="Website" value={data.workspace.website || 'Not provided'} />
            <SummaryItem label="Support email" value={data.workspace.support_email || 'Not provided'} />
            <SummaryItem label="Assistant name" value={data.workspace.assistant_name || 'Not provided'} />
          </div>
        </section>

        <section className="admin-shell-card p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Usage summary</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <UsageCard label="Users" value={data.usage.totalUsers} />
            <UsageCard label="Tenant admins" value={data.usage.totalTenantAdmins} />
            <UsageCard label="Viewers" value={data.usage.totalViewers} />
            <UsageCard label="Documents" value={data.usage.totalDocuments} />
            <UsageCard label="Questions" value={data.usage.totalQuestions} />
            <UsageCard label="Open unanswered" value={data.usage.openKnowledgeGaps} />
            <UsageCard label="Feedback" value={data.usage.feedbackCount} />
            <UsageCard label="Last activity" value={data.usage.lastActivity ? formatDate(data.usage.lastActivity) : 'None'} />
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="admin-shell-card p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">User list</p>
              <h2 className="mt-2 text-xl font-bold text-slate-950">Workspace users</h2>
            </div>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="border-b border-slate-200">
                <tr>
                  {['Email', 'Role', 'Created', 'Updated', 'Actions'].map((column) => (
                    <th key={column} className="px-3 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-3 py-4">
                      <p className="font-semibold text-slate-950">{user.email || 'No email'}</p>
                      <p className="mt-1 text-xs text-slate-500">{user.full_name || 'No name'}</p>
                    </td>
                    <td className="px-3 py-4 text-sm font-semibold text-slate-700">{user.role}</td>
                    <td className="px-3 py-4 text-sm text-slate-600">{formatDate(user.created_at)}</td>
                    <td className="px-3 py-4 text-sm text-slate-600">{formatDate(user.updated_at)}</td>
                    <td className="px-3 py-4">
                      <div className="flex flex-wrap gap-2">
                        {user.role !== 'platform_admin' && (
                          <>
                            <button onClick={() => updateUserRole(user.id, 'tenant_admin')} disabled={saving} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-700">
                              Make tenant_admin
                            </button>
                            <button onClick={() => updateUserRole(user.id, 'viewer')} disabled={saving} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-700">
                              Make viewer
                            </button>
                            <button onClick={() => removeUser(user.id)} disabled={saving} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-red-700">
                              Remove
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-6">
          <div className="admin-shell-card p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Workspace controls</p>
            <div className="mt-5 space-y-5">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Status</label>
                <select value={statusValue} onChange={(event) => setStatusValue(event.target.value)} className="admin-input">
                  {WORKSPACE_STATUSES.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Suspension reason</label>
                <textarea value={suspensionReason} onChange={(event) => setSuspensionReason(event.target.value)} rows={3} className="admin-input" placeholder="Optional internal suspension reason shown to platform admins" />
              </div>
              <button onClick={saveStatus} disabled={saving} className="rounded-xl bg-slate-950 px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white">
                Save status
              </button>

              <div className="border-t border-slate-200 pt-5">
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Plan</label>
                <select value={planValue} onChange={(event) => setPlanValue(event.target.value)} className="admin-input">
                  {WORKSPACE_PLANS.map((plan) => (
                    <option key={plan} value={plan}>{plan}</option>
                  ))}
                </select>
                <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-950">{planDetail.label}</p>
                  <p className="mt-1 text-sm text-slate-600">{planDetail.description}</p>
                </div>
                <button onClick={savePlan} disabled={saving} className="mt-4 rounded-xl bg-cyan-700 px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white">
                  Save plan
                </button>
              </div>

              <div className="border-t border-slate-200 pt-5">
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Internal notes</label>
                <textarea value={internalNotes} onChange={(event) => setInternalNotes(event.target.value)} rows={5} className="admin-input" placeholder="Platform admin notes only. Not visible to tenants." />
                <button onClick={saveNotes} disabled={saving} className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-700">
                  Save notes
                </button>
              </div>
            </div>
          </div>

          <div className="admin-shell-card p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Question activity summary</p>
            <div className="mt-5 space-y-3">
              {data.questionActivity.recentQuestionActivity.map((item) => (
                <div key={item.date} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                  <span className="text-sm font-medium text-slate-600">{formatDate(item.date)}</span>
                  <span className="text-lg font-bold text-slate-950">{item.questions}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Aggregate activity only. Private conversation text and answer bodies are not shown here.
            </p>
          </div>
        </section>
      </div>

      <section className="admin-shell-card p-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Documents metadata only</p>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="border-b border-slate-200">
              <tr>
                {['Filename', 'Status', 'Created', 'Total sections'].map((column) => (
                  <th key={column} className="px-3 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">{column}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.documents.length === 0 ? (
                <tr><td colSpan={4} className="px-3 py-10 text-sm text-slate-500">No documents uploaded yet.</td></tr>
              ) : (
                data.documents.map((document) => (
                  <tr key={document.id}>
                    <td className="px-3 py-4 text-sm font-semibold text-slate-950">{document.filename}</td>
                    <td className="px-3 py-4"><StatusBadge status={document.status} /></td>
                    <td className="px-3 py-4 text-sm text-slate-600">{formatDate(document.created_at)}</td>
                    <td className="px-3 py-4 text-sm text-slate-600">{document.total_sections}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-slate-500">
          This table intentionally excludes extracted text, chunk text, and document contents.
        </p>
      </section>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function UsageCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
