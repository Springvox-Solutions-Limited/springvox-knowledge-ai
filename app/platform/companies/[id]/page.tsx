"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { fetchPlatformJson } from "@/src/lib/platform-client";
import { OverflowGuard } from "@/src/components/layout/OverflowGuard";
import { AppButton } from "@/src/components/ui/app-button";
import { ConfirmDialog } from "@/src/components/ui/confirm-dialog";
import { PlanBadge, StatusBadge } from "@/src/components/platform/PlatformBadges";
import { PlatformPageHeader } from "@/src/components/platform/PlatformPageHeader";
import {
  getRoleLabel,
  PLAN_DETAILS,
  WORKSPACE_PLANS,
  WORKSPACE_STATUSES,
} from "@/src/lib/workspace";

type WorkspaceLimits = {
  monthly_question_limit: number | null;
  daily_upload_limit: number | null;
  storage_byte_limit: number | null;
  monthly_llm_token_limit: number | null;
};

const EMPTY_LIMITS: WorkspaceLimits = {
  monthly_question_limit: null,
  daily_upload_limit: null,
  storage_byte_limit: null,
  monthly_llm_token_limit: null,
};

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

const selectTriggerClass =
  "h-9 w-full rounded-md border-[var(--line)] bg-[var(--surface)] px-2.5 text-[12px] text-[var(--ink)] shadow-none focus:border-[var(--accent-jade)] focus:ring-2 focus:ring-[var(--accent-jade-100)]";

const textareaClass =
  "min-h-[68px] w-full rounded-md border border-[var(--line)] bg-[var(--canvas-soft)] px-2.5 py-2 text-[12px] leading-5 text-[var(--ink)] shadow-none placeholder:text-[var(--ink-muted)] focus:border-[var(--accent-jade)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-jade-100)]";

export default function PlatformCompanyDetailPage() {
  const params = useParams<{ id: string }>();
  const workspaceId = String(params.id);
  const [data, setData] = useState<CompanyDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusValue, setStatusValue] = useState<string>("active");
  const [planValue, setPlanValue] = useState<string>("pilot");
  const [suspensionReason, setSuspensionReason] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [removeUserId, setRemoveUserId] = useState<string | null>(null);
  const [limits, setLimits] = useState<WorkspaceLimits>(EMPTY_LIMITS);
  const [savingLimits, setSavingLimits] = useState(false);

  const load = async () => {
    try {
      const result = await fetchPlatformJson<CompanyDetailResponse>(
        `/api/platform/companies/${workspaceId}`,
      );
      setData(result);
      setStatusValue(result.workspace.status);
      setPlanValue(result.workspace.plan);
      setSuspensionReason(result.workspace.suspension_reason || "");
      setInternalNotes(result.workspace.internal_notes || "");
      setError(null);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load company details",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadLimits = async () => {
    try {
      const result = await fetchPlatformJson<{ limits: WorkspaceLimits }>(
        `/api/platform/workspaces/${workspaceId}/limits`,
      );
      setLimits({
        monthly_question_limit: result.limits.monthly_question_limit ?? null,
        daily_upload_limit: result.limits.daily_upload_limit ?? null,
        storage_byte_limit: result.limits.storage_byte_limit ?? null,
        monthly_llm_token_limit: result.limits.monthly_llm_token_limit ?? null,
      });
    } catch {
      // Limits are optional; leave defaults if the fetch fails.
    }
  };

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      load();
      loadLimits();
    });
    return () => window.cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  const saveStatus = async () => {
    try {
      setSaving(true);
      await fetchPlatformJson(`/api/platform/companies/${workspaceId}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: statusValue,
          suspension_reason: suspensionReason,
        }),
      });
      await load();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to update workspace status",
      );
    } finally {
      setSaving(false);
    }
  };

  const savePlan = async () => {
    try {
      setSaving(true);
      await fetchPlatformJson(`/api/platform/companies/${workspaceId}/plan`, {
        method: "PATCH",
        body: JSON.stringify({ plan: planValue }),
      });
      await load();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to update workspace plan",
      );
    } finally {
      setSaving(false);
    }
  };

  const saveNotes = async () => {
    try {
      setSaving(true);
      await fetchPlatformJson(`/api/platform/companies/${workspaceId}/notes`, {
        method: "PATCH",
        body: JSON.stringify({ internal_notes: internalNotes }),
      });
      await load();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to update internal notes",
      );
    } finally {
      setSaving(false);
    }
  };

  const saveLimits = async () => {
    try {
      setSavingLimits(true);
      await fetchPlatformJson(`/api/platform/workspaces/${workspaceId}/limits`, {
        method: "PATCH",
        body: JSON.stringify(limits),
      });
      await loadLimits();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to update workspace limits",
      );
    } finally {
      setSavingLimits(false);
    }
  };

  const updateUserRole = async (
    userId: string,
    role: "tenant_admin" | "viewer",
  ) => {
    try {
      setSaving(true);
      await fetchPlatformJson(`/api/platform/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({
          role,
          workspaceId,
          resetWorkspaceTenantAdmins: role === "tenant_admin",
        }),
      });
      await load();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to update user role",
      );
    } finally {
      setSaving(false);
    }
  };

  const removeUser = async (userId: string) => {
    try {
      setSaving(true);
      await fetchPlatformJson(
        `/api/platform/users/${userId}?workspaceId=${encodeURIComponent(workspaceId)}`,
        {
          method: "DELETE",
        },
      );
      await load();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to remove user",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-shell-card p-6 text-[12px] text-[var(--ink-muted)]">
          Loading company details…
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="admin-page">
        <div className="admin-shell-card p-6 text-[12px] text-[var(--ink-muted)]">
          Company not found.
        </div>
      </div>
    );
  }

  const planDetail =
    PLAN_DETAILS[planValue as keyof typeof PLAN_DETAILS] ??
    PLAN_DETAILS[data.workspace.plan];

  return (
    <div className="admin-page">
      <PlatformPageHeader
        title={data.workspace.name}
        subtitle={`${data.workspace.slug} · Created ${formatDate(data.workspace.created_at)}`}
        aside={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={data.workspace.status} />
            <PlanBadge plan={data.workspace.plan} />
            <AppButton
              asChild
              tone="ghost"
              className="h-7 gap-1 px-2 text-[11px]"
            >
              <Link href="/platform/companies">
                <ArrowLeft size={13} aria-hidden="true" />
                All companies
              </Link>
            </AppButton>
          </div>
        }
      />

      {error ? (
        <div className="rounded-[10px] border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-300">
          {error}
        </div>
      ) : null}

      <section className="admin-shell-card overflow-hidden" aria-label="Workspace summary">
        <div className="grid grid-cols-2 gap-px bg-[var(--line)] sm:grid-cols-3 xl:grid-cols-6">
          <Kpi
            label="Users"
            value={data.usage.totalUsers}
            meta={`${data.usage.totalTenantAdmins} admins · ${data.usage.totalViewers} viewers`}
          />
          <Kpi label="Documents" value={data.usage.totalDocuments} />
          <Kpi label="Questions" value={data.usage.totalQuestions} />
          <Kpi
            label="Open gaps"
            value={data.usage.openKnowledgeGaps}
            meta="unanswered"
          />
          <Kpi label="Feedback" value={data.usage.feedbackCount} />
          <Kpi
            label="Last activity"
            value={
              data.usage.lastActivity
                ? formatDate(data.usage.lastActivity)
                : "None"
            }
            valueClassName="text-[13px]"
          />
        </div>
      </section>

      <nav
        aria-label="Company sections"
        className="sticky top-0 z-10 -mx-1 flex items-center gap-0.5 overflow-x-auto border-b border-[var(--line)] bg-[var(--canvas)] px-1 py-1"
      >
        {[
          { id: "overview", label: "Overview" },
          { id: "users", label: "Users", count: data.users.length },
          { id: "usage", label: "Usage" },
          { id: "documents", label: "Documents", count: data.documents.length },
          { id: "controls", label: "Controls" },
        ].map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2 text-[12px] text-[var(--ink-soft)] transition-colors hover:bg-[var(--canvas-soft)] hover:text-[var(--ink)]"
          >
            {item.label}
            {item.count !== undefined ? (
              <span className="text-[10px] tabular-nums text-[var(--ink-muted)]">
                {item.count}
              </span>
            ) : null}
          </a>
        ))}
      </nav>

      <section id="overview" className="scroll-mt-12">
        <div className="grid gap-3 xl:grid-cols-2">
          <div className="admin-shell-card p-4">
            <h2 className="text-[14px] font-semibold text-[var(--ink)]">
              Company details
            </h2>
            <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <Detail label="Company name" value={data.workspace.name} />
              <Detail label="Slug" value={data.workspace.slug} />
              <Detail
                label="Created"
                value={formatDate(data.workspace.created_at)}
              />
              <Detail
                label="Industry"
                value={data.workspace.industry || "Not provided"}
              />
              <Detail
                label="Website"
                value={data.workspace.website || "Not provided"}
                breakAll
              />
              <Detail
                label="Support email"
                value={data.workspace.support_email || "Not provided"}
              />
              <Detail
                label="Assistant name"
                value={data.workspace.assistant_name || "Not provided"}
              />
            </dl>
          </div>

          <div className="admin-shell-card p-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-[14px] font-semibold text-[var(--ink)]">
                Question activity
              </h2>
              <span className="text-[10px] text-[var(--ink-muted)]">
                Last 7 days
              </span>
            </div>
            {data.questionActivity.recentQuestionActivity.length === 0 ? (
              <p className="mt-6 text-[12px] text-[var(--ink-muted)]">
                No question activity recorded.
              </p>
            ) : (
              <div className="mt-3 divide-y divide-[var(--line-soft)]">
                {data.questionActivity.recentQuestionActivity.map((item) => (
                  <div
                    key={item.date}
                    className="flex items-center justify-between gap-3 py-1.5 text-[12px]"
                  >
                    <span className="text-[var(--ink-soft)]">
                      {formatDate(item.date)}
                    </span>
                    <span className="font-medium tabular-nums text-[var(--ink)]">
                      {item.questions}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-3 text-[11px] leading-4 text-[var(--ink-muted)]">
              Aggregate activity only. Private conversation text and answer
              bodies are not shown here.
            </p>
          </div>
        </div>
      </section>

      <section id="users" className="scroll-mt-12 space-y-2">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-[14px] font-semibold text-[var(--ink)]">Users</h2>
            <p className="mt-0.5 text-[12px] text-[var(--ink-muted)]">
              Roles and membership for this workspace.
            </p>
          </div>
          <span className="text-[11px] tabular-nums text-[var(--ink-muted)]">
            {data.users.length} {data.users.length === 1 ? "member" : "members"}
          </span>
        </div>
        <div className="admin-shell-card overflow-hidden">
          <OverflowGuard mode="scroll">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-[var(--line)] text-[11px] text-[var(--ink-muted)]">
                  <th className="px-4 py-2.5 font-medium sm:px-5">User</th>
                  <th className="px-3 py-2.5 font-medium">Role</th>
                  <th className="px-3 py-2.5 font-medium">Joined</th>
                  <th className="px-3 py-2.5 font-medium">Updated</th>
                  <th className="px-4 py-2.5 text-right font-medium sm:px-5">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line-soft)]">
                {data.users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-10 text-center text-[12px] text-[var(--ink-muted)]"
                    >
                      No users in this workspace.
                    </td>
                  </tr>
                ) : (
                  data.users.map((user) => (
                    <tr
                      key={user.id}
                      className="transition-colors hover:bg-[var(--canvas-soft)]"
                    >
                      <td className="max-w-[260px] px-4 py-1.5 sm:px-5">
                        <p
                          className="truncate text-[12px] font-medium leading-4 text-[var(--ink)]"
                          title={user.email || ""}
                        >
                          {user.email || "No email"}
                        </p>
                        <p className="truncate text-[11px] leading-4 text-[var(--ink-muted)]">
                          {user.full_name || "No name"}
                        </p>
                      </td>
                      <td className="px-3 py-2.5 text-[12px] text-[var(--ink-soft)]">
                        {getRoleLabel(user.role)}
                      </td>
                      <td className="px-3 py-2.5 text-[11px] tabular-nums text-[var(--ink-muted)]">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-3 py-2.5 text-[11px] tabular-nums text-[var(--ink-muted)]">
                        {formatDate(user.updated_at)}
                      </td>
                      <td className="px-4 py-2.5 sm:px-5">
                        {user.role === "platform_admin" ? (
                          <p className="text-right text-[11px] text-[var(--ink-muted)]">
                            Managed separately
                          </p>
                        ) : (
                          <div className="flex flex-wrap justify-end gap-1.5">
                            <AppButton
                              onClick={() =>
                                updateUserRole(user.id, "tenant_admin")
                              }
                              disabled={saving}
                              tone="secondary"
                              className="h-7 px-2 text-[11px]"
                            >
                              Make workspace admin
                            </AppButton>
                            <AppButton
                              onClick={() => updateUserRole(user.id, "viewer")}
                              disabled={saving}
                              tone="secondary"
                              className="h-7 px-2 text-[11px]"
                            >
                              Make viewer
                            </AppButton>
                            <AppButton
                              onClick={() => setRemoveUserId(user.id)}
                              disabled={saving}
                              tone="destructive"
                              className="h-7 px-2 text-[11px]"
                            >
                              Remove
                            </AppButton>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </OverflowGuard>
        </div>
      </section>

      <section id="usage" className="scroll-mt-12 space-y-2">
        <div>
          <h2 className="text-[14px] font-semibold text-[var(--ink)]">
            Usage limits
          </h2>
          <p className="mt-0.5 text-[12px] text-[var(--ink-muted)]">
            Leave a field blank to use the system default. Limits never lock out
            existing data.
          </p>
        </div>
        <div className="admin-shell-card p-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <LimitField
              label="Monthly questions"
              value={limits.monthly_question_limit}
              onChange={(value) =>
                setLimits((current) => ({
                  ...current,
                  monthly_question_limit: value,
                }))
              }
            />
            <LimitField
              label="Daily uploads"
              value={limits.daily_upload_limit}
              onChange={(value) =>
                setLimits((current) => ({
                  ...current,
                  daily_upload_limit: value,
                }))
              }
            />
            <LimitField
              label="Storage (bytes)"
              value={limits.storage_byte_limit}
              onChange={(value) =>
                setLimits((current) => ({
                  ...current,
                  storage_byte_limit: value,
                }))
              }
            />
            <LimitField
              label="Monthly LLM tokens"
              value={limits.monthly_llm_token_limit}
              onChange={(value) =>
                setLimits((current) => ({
                  ...current,
                  monthly_llm_token_limit: value,
                }))
              }
            />
          </div>
          <div className="mt-3 flex justify-end border-t border-[var(--line)] pt-3">
            <AppButton
              onClick={saveLimits}
              disabled={savingLimits}
              tone="secondary"
              className="h-8 px-3 text-[12px]"
            >
              {savingLimits ? "Saving…" : "Save limits"}
            </AppButton>
          </div>
        </div>
      </section>

      <section id="documents" className="scroll-mt-12 space-y-2">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-[14px] font-semibold text-[var(--ink)]">
              Documents
            </h2>
            <p className="mt-0.5 text-[12px] text-[var(--ink-muted)]">
              Metadata for every document in this workspace.
            </p>
          </div>
          <span className="text-[11px] tabular-nums text-[var(--ink-muted)]">
            {data.documents.length}{" "}
            {data.documents.length === 1 ? "document" : "documents"}
          </span>
        </div>
        <div className="admin-shell-card overflow-hidden">
          <OverflowGuard mode="scroll">
            <table className="w-full min-w-[620px] text-left">
              <thead>
                <tr className="border-b border-[var(--line)] text-[11px] text-[var(--ink-muted)]">
                  <th className="px-4 py-2.5 font-medium sm:px-5">Document</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 font-medium">Created</th>
                  <th className="px-4 py-2.5 text-right font-medium sm:px-5">
                    Sections
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line-soft)]">
                {data.documents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-10 text-center text-[12px] text-[var(--ink-muted)]"
                    >
                      No documents uploaded yet.
                    </td>
                  </tr>
                ) : (
                  data.documents.map((document) => (
                    <tr
                      key={document.id}
                      className="transition-colors hover:bg-[var(--canvas-soft)]"
                    >
                      <td className="max-w-[320px] px-4 py-2.5 sm:px-5">
                        <p
                          className="truncate text-[12px] font-medium text-[var(--ink)]"
                          title={document.filename}
                        >
                          {document.filename}
                        </p>
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusBadge status={document.status} />
                      </td>
                      <td className="px-3 py-2.5 text-[11px] tabular-nums text-[var(--ink-muted)]">
                        {formatDate(document.created_at)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-[12px] tabular-nums text-[var(--ink-soft)] sm:px-5">
                        {document.total_sections}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </OverflowGuard>
          <p className="border-t border-[var(--line)] px-4 py-2 text-[11px] text-[var(--ink-muted)] sm:px-5">
            This table intentionally excludes document text, section text, and
            private document contents.
          </p>
        </div>
      </section>

      <section id="controls" className="scroll-mt-12 space-y-2">
        <div>
          <h2 className="text-[14px] font-semibold text-[var(--ink)]">
            Workspace controls
          </h2>
          <p className="mt-0.5 text-[12px] text-[var(--ink-muted)]">
            Status, plan, and internal notes.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <div className="admin-shell-card p-4">
            <h3 className="text-[13px] font-semibold text-[var(--ink)]">
              Status
            </h3>
            <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">
              Suspend or restore access to this workspace.
            </p>
            <label className="mt-3 block text-[11px] font-medium text-[var(--ink-muted)]">
              Status
            </label>
            <div className="mt-1">
              <Select value={statusValue} onValueChange={setStatusValue}>
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-md border-[var(--line)]">
                  {WORKSPACE_STATUSES.map((status) => (
                    <SelectItem key={status} value={status} className="text-[12px]">
                      {formatStatusLabel(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <label className="mt-3 block text-[11px] font-medium text-[var(--ink-muted)]">
              Suspension reason
            </label>
            <Textarea
              value={suspensionReason}
              onChange={(event) => setSuspensionReason(event.target.value)}
              rows={3}
              className={`mt-1 ${textareaClass}`}
              placeholder="Optional internal reason, shown to platform admins only"
            />
            <AppButton
              onClick={saveStatus}
              disabled={saving}
              className="mt-3 h-8 px-3 text-[12px]"
            >
              Save status
            </AppButton>
          </div>

          <div className="admin-shell-card p-4">
            <h3 className="text-[13px] font-semibold text-[var(--ink)]">Plan</h3>
            <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">
              Capacity guidance for the assigned plan.
            </p>
            <label className="mt-3 block text-[11px] font-medium text-[var(--ink-muted)]">
              Plan
            </label>
            <div className="mt-1">
              <Select value={planValue} onValueChange={setPlanValue}>
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-md border-[var(--line)]">
                  {WORKSPACE_PLANS.map((plan) => (
                    <SelectItem key={plan} value={plan} className="text-[12px]">
                      {PLAN_DETAILS[plan].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="mt-2 rounded-md border border-[var(--line)] bg-[var(--canvas-soft)] px-3 py-2">
              <p className="text-[12px] font-medium text-[var(--ink)]">
                {planDetail.label}
              </p>
              <p className="mt-0.5 text-[11px] leading-4 text-[var(--ink-soft)]">
                {planDetail.description}
              </p>
            </div>
            <AppButton
              onClick={savePlan}
              disabled={saving}
              tone="subtle"
              className="mt-3 h-8 px-3 text-[12px]"
            >
              Save plan
            </AppButton>
          </div>

          <div className="admin-shell-card p-4 md:col-span-2 xl:col-span-1">
            <h3 className="text-[13px] font-semibold text-[var(--ink)]">
              Internal notes
            </h3>
            <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">
              Visible to platform admins only.
            </p>
            <Textarea
              value={internalNotes}
              onChange={(event) => setInternalNotes(event.target.value)}
              rows={5}
              className={`mt-3 ${textareaClass}`}
              placeholder="Platform admin notes. Not visible to tenants."
            />
            <AppButton
              onClick={saveNotes}
              disabled={saving}
              tone="secondary"
              className="mt-3 h-8 px-3 text-[12px]"
            >
              Save notes
            </AppButton>
          </div>
        </div>
      </section>

      <ConfirmDialog
        open={Boolean(removeUserId)}
        onOpenChange={(open) => {
          if (!open) setRemoveUserId(null);
        }}
        title="Remove user from workspace"
        description="This removes the selected user from the company workspace. Platform admin access is still managed separately."
        confirmLabel="Remove user"
        cancelLabel="Keep user"
        confirmTone="destructive"
        loading={saving}
        onConfirm={async () => {
          if (!removeUserId) return;
          await removeUser(removeUserId);
          setRemoveUserId(null);
        }}
      />
    </div>
  );
}

function Kpi({
  label,
  value,
  meta,
  valueClassName,
}: {
  label: string;
  value: number | string;
  meta?: string;
  valueClassName?: string;
}) {
  return (
    <div className="bg-[var(--surface)] px-4 py-3">
      <p className="text-[11px] text-[var(--ink-muted)]">{label}</p>
      <p
        className={`mt-1 font-semibold tabular-nums tracking-tight text-[var(--ink)] ${
          valueClassName ?? "text-[18px]"
        }`}
      >
        {value}
      </p>
      {meta ? (
        <p className="mt-0.5 truncate text-[10px] text-[var(--ink-muted)]">
          {meta}
        </p>
      ) : null}
    </div>
  );
}

function Detail({
  label,
  value,
  breakAll = false,
}: {
  label: string;
  value: string;
  breakAll?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] text-[var(--ink-muted)]">{label}</dt>
      <dd
        className={`mt-0.5 text-[12px] font-medium text-[var(--ink)] ${
          breakAll ? "break-all" : "break-words"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function LimitField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-[var(--ink-muted)]">
        {label}
      </label>
      <input
        type="number"
        min={0}
        inputMode="numeric"
        value={value ?? ""}
        onChange={(event) => {
          const raw = event.target.value.trim();
          if (raw === "") return onChange(null);
          const parsed = Number(raw);
          onChange(
            Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : null,
          );
        }}
        placeholder="Default"
        className="h-8 w-full rounded-md border border-[var(--line)] bg-[var(--canvas-soft)] px-2.5 text-[12px] tabular-nums text-[var(--ink)] shadow-none outline-none placeholder:text-[var(--ink-muted)] focus:border-[var(--accent-jade)] focus:ring-2 focus:ring-[var(--accent-jade-100)]"
      />
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatStatusLabel(value: string) {
  if (value === "past_due") return "Past due";
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, " ");
}
