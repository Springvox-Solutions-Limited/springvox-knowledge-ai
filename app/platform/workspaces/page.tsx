"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { fetchPlatformJson } from "@/src/lib/platform-client";
import { PlatformPageHeader } from "@/src/components/platform/PlatformPageHeader";
import { AppButton } from "@/src/components/ui/app-button";
import { AppCard } from "@/src/components/ui/app-card";
import { SearchBar } from "@/src/components/ui/search-bar";
import { OverflowGuard } from "@/src/components/layout/OverflowGuard";
import { ResponsiveToolbar } from "@/src/components/layout/ResponsiveToolbar";
import {
  AppTable,
  AppTableBody,
  AppTableCell,
  AppTableHead,
  AppTableHeader,
  AppTableRow,
} from "@/src/components/ui/app-table";
import { StatusBadge } from "@/src/components/platform/PlatformBadges";

type WorkspaceRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  subscription_status: string | null;
  billing_status: string | null;
  subscription_plan: string | null;
  trial_ends_at: string | null;
  owner_email: string | null;
  users_count: number;
  documents_count: number;
  created_at: string;
  last_activity: string | null;
  deletion_status: string | null;
  deletion_scheduled_for: string | null;
};

export default function PlatformWorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<WorkspaceRow[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [reasonById, setReasonById] = useState<Record<string, string>>({});

  const load = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const data = await fetchPlatformJson<{ workspaces: WorkspaceRow[] }>(
        `/api/platform/workspaces?${params.toString()}`,
      );
      setWorkspaces(data.workspaces || []);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load workspaces");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    void load();
  }, [search]);

  const runAction = async (
    workspace: WorkspaceRow,
    endpoint: "status" | "trial" | "billing",
    body: Record<string, unknown>,
  ) => {
    try {
      setSavingId(workspace.id);
      setMessage(null);
      await fetchPlatformJson(`/api/platform/workspaces/${workspace.id}/${endpoint}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      setMessage("Workspace updated.");
      await load();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Workspace update failed");
    } finally {
      setSavingId(null);
    }
  };

  const runDeletionAction = async (workspace: WorkspaceRow, body: Record<string, unknown>) => {
    try {
      setSavingId(workspace.id);
      setMessage(null);
      await fetchPlatformJson(`/api/platform/workspaces/${workspace.id}/deletion`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      setMessage("Workspace deletion action saved.");
      await load();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Workspace deletion action failed");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="admin-page">
      <PlatformPageHeader
        title="Workspaces"
        subtitle="Manage trial, billing, and operational access for every workspace."
      />

      <ResponsiveToolbar>
        <SearchBar
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search workspaces or admin email"
          className="h-12 px-4"
        />
      </ResponsiveToolbar>

      {error ? <Alert className="border-red-200 bg-red-50 text-red-700"><AlertDescription>{error}</AlertDescription></Alert> : null}
      {message ? <Alert className="border-emerald-200 bg-emerald-50 text-emerald-700"><AlertDescription>{message}</AlertDescription></Alert> : null}

      <OverflowGuard mode="scroll">
        <AppCard className="overflow-hidden">
          <AppTable className="min-w-[1280px]">
            <AppTableHeader>
              <AppTableRow>
                {["Workspace", "Owner", "Status", "Billing", "Trial ends", "Usage", "Deletion", "Created", "Actions"].map((column) => (
                  <AppTableHead key={column}>{column}</AppTableHead>
                ))}
              </AppTableRow>
            </AppTableHeader>
            <AppTableBody>
              {loading ? (
                <AppTableRow><AppTableCell colSpan={9} className="py-12 text-center text-sm text-slate-500">Loading workspaces...</AppTableCell></AppTableRow>
              ) : workspaces.length === 0 ? (
                <AppTableRow><AppTableCell colSpan={9} className="py-12 text-center text-sm text-slate-500">No workspaces found.</AppTableCell></AppTableRow>
              ) : (
                workspaces.map((workspace) => (
                  <AppTableRow key={workspace.id}>
                    <AppTableCell>
                      <p className="font-semibold text-slate-950">{workspace.name}</p>
                      <p className="text-xs text-slate-500">{workspace.slug}</p>
                    </AppTableCell>
                    <AppTableCell className="max-w-[14rem] truncate text-sm text-slate-600" title={workspace.owner_email || ""}>
                      {workspace.owner_email || "No admin"}
                    </AppTableCell>
                    <AppTableCell>
                      <div className="space-y-1">
                        <StatusBadge status={workspace.status} />
                        <p className="text-xs text-slate-500">{workspace.subscription_status || "unknown"}</p>
                      </div>
                    </AppTableCell>
                    <AppTableCell className="text-sm text-slate-600">
                      <p>{workspace.billing_status || "unknown"}</p>
                      <p className="text-xs text-slate-500">{workspace.subscription_plan || "trial"}</p>
                    </AppTableCell>
                    <AppTableCell className="text-sm text-slate-600">{formatDate(workspace.trial_ends_at)}</AppTableCell>
                    <AppTableCell className="text-sm text-slate-600">
                      {workspace.users_count} users · {workspace.documents_count} docs
                    </AppTableCell>
                    <AppTableCell className="text-sm text-slate-600">
                      <p>{workspace.deletion_status || "none"}</p>
                      <p className="text-xs text-slate-500">{formatDate(workspace.deletion_scheduled_for)}</p>
                    </AppTableCell>
                    <AppTableCell className="text-sm text-slate-600">
                      <p>{formatDate(workspace.created_at)}</p>
                      <p className="text-xs text-slate-500">Last {formatDate(workspace.last_activity)}</p>
                    </AppTableCell>
                    <AppTableCell>
                      <div className="grid min-w-[22rem] gap-2">
                        <Textarea
                          value={reasonById[workspace.id] || ""}
                          onChange={(event) => setReasonById((current) => ({ ...current, [workspace.id]: event.target.value }))}
                          placeholder="Suspension reason"
                          className="min-h-16 rounded-xl border-slate-200 text-xs"
                        />
                        <div className="flex flex-wrap gap-2">
                          <AppButton disabled={savingId === workspace.id} className="h-8 px-3 text-xs" onClick={() => runAction(workspace, "status", { action: "activate" })}>Activate</AppButton>
                          <AppButton disabled={savingId === workspace.id} tone="destructive" className="h-8 px-3 text-xs" onClick={() => runAction(workspace, "status", { action: "suspend", reason: reasonById[workspace.id] || "" })}>Suspend</AppButton>
                          <AppButton disabled={savingId === workspace.id} tone="secondary" className="h-8 px-3 text-xs" onClick={() => runAction(workspace, "status", { action: "expire" })}>Expire</AppButton>
                          <AppButton disabled={savingId === workspace.id} tone="secondary" className="h-8 px-3 text-xs" onClick={() => runAction(workspace, "trial", { days: 7 })}>+7 days</AppButton>
                          <AppButton disabled={savingId === workspace.id} tone="secondary" className="h-8 px-3 text-xs" onClick={() => runAction(workspace, "trial", { days: 14 })}>+14 days</AppButton>
                          <AppButton disabled={savingId === workspace.id} tone="secondary" className="h-8 px-3 text-xs" onClick={() => runAction(workspace, "billing", { action: "paid_active" })}>Paid active</AppButton>
                          <AppButton disabled={savingId === workspace.id} tone="secondary" className="h-8 px-3 text-xs" onClick={() => runAction(workspace, "billing", { action: "past_due" })}>Past due</AppButton>
                          <AppButton disabled={savingId === workspace.id} tone="secondary" className="h-8 px-3 text-xs" onClick={() => runDeletionAction(workspace, { action: "schedule", reason: reasonById[workspace.id] || "" })}>Schedule deletion</AppButton>
                          <AppButton disabled={savingId === workspace.id} tone="secondary" className="h-8 px-3 text-xs" onClick={() => runDeletionAction(workspace, { action: "cancel" })}>Cancel deletion</AppButton>
                          <AppButton disabled={savingId === workspace.id} tone="destructive" className="h-8 px-3 text-xs" onClick={() => {
                            const confirmation = window.prompt("Type DELETE WORKSPACE to force delete this workspace.");
                            if (confirmation) void runDeletionAction(workspace, { action: "force", confirmation });
                          }}>Force delete</AppButton>
                        </div>
                      </div>
                    </AppTableCell>
                  </AppTableRow>
                ))
              )}
            </AppTableBody>
          </AppTable>
        </AppCard>
      </OverflowGuard>
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
