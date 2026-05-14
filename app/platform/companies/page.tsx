"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';

import { fetchPlatformJson } from '@/src/lib/platform-client';
import { PlanBadge, StatusBadge } from '@/src/components/platform/PlatformBadges';
import { WORKSPACE_PLANS, WORKSPACE_STATUSES } from '@/src/lib/workspace';
import { PlatformPageHeader } from '@/src/components/platform/PlatformPageHeader';

type CompanyRecord = {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
  tenant_admin_email: string | null;
  total_users: number;
  total_documents: number;
  total_questions: number;
  open_unanswered_questions: number;
  created_at: string;
  last_activity: string | null;
};

export default function PlatformCompaniesPage() {
  const [companies, setCompanies] = useState<CompanyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');

  useEffect(() => {
    async function load() {
      try {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (statusFilter !== 'all') params.set('status', statusFilter);
        if (planFilter !== 'all') params.set('plan', planFilter);
        const result = await fetchPlatformJson<{ companies: CompanyRecord[] }>(`/api/platform/companies?${params.toString()}`);
        setCompanies(result.companies || []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load companies');
      } finally {
        setLoading(false);
      }
    }

    setLoading(true);
    load();
  }, [search, statusFilter, planFilter]);

  const rows = useMemo(() => companies, [companies]);

  return (
    <div className="admin-page">
      <PlatformPageHeader
        title="Companies"
        subtitle="View and manage organisation workspaces."
      />

      <div className="grid gap-3 lg:grid-cols-[1.3fr_0.35fr_0.35fr]">
        <label className="relative block">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by company, slug, or tenant admin email"
            className="admin-input pl-11"
          />
        </label>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="admin-input">
          <option value="all">All statuses</option>
          {WORKSPACE_STATUSES.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
        <select value={planFilter} onChange={(event) => setPlanFilter(event.target.value)} className="admin-input">
          <option value="all">All plans</option>
          {WORKSPACE_PLANS.map((plan) => (
            <option key={plan} value={plan}>{plan}</option>
          ))}
        </select>
      </div>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>}

      <div className="admin-shell-card overflow-hidden">
        <div className="max-w-full overflow-x-auto">
          <table className="min-w-[920px] w-full table-fixed text-left">
            <colgroup>
              <col className="w-[24%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
              <col className="w-[21%]" />
              <col className="w-[8%]" />
              <col className="w-[9%]" />
              <col className="w-[9%]" />
              <col className="w-[12%]" />
              <col className="w-[9%]" />
            </colgroup>
            <thead className="border-b border-slate-200 bg-slate-50/70">
              <tr>
                {['Company', 'Status', 'Plan', 'Tenant Admin', 'Users', 'Documents', 'Questions', 'Created', 'Actions'].map((column) => (
                  <th key={column} className="px-5 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">{column}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-sm text-slate-500">Loading companies...</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-sm text-slate-500">No workspaces matched your filters.</td>
                </tr>
              ) : (
                rows.map((company) => (
                  <tr key={company.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-4">
                      <Link href={`/platform/companies/${company.id}`} className="font-semibold text-slate-950 hover:text-cyan-700">
                        {company.name}
                      </Link>
                      <p className="mt-1 text-xs text-slate-500">{company.slug}</p>
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={company.status} /></td>
                    <td className="px-5 py-4"><PlanBadge plan={company.plan} /></td>
                    <td className="px-5 py-4 text-sm text-slate-600">{company.tenant_admin_email || 'Not assigned'}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-800">{company.total_users}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-800">{company.total_documents}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-800">{company.total_questions}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{formatDate(company.created_at)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Link href={`/platform/companies/${company.id}`} className="inline-flex rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-700 hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-900">
                          View
                        </Link>
                      </div>
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
