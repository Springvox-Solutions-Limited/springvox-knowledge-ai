"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fetchPlatformJson } from "@/src/lib/platform-client";
import { PlatformPageHeader } from "@/src/components/platform/PlatformPageHeader";
import { AppButton } from "@/src/components/ui/app-button";
import { AppCard } from "@/src/components/ui/app-card";
import { SearchBar } from "@/src/components/ui/search-bar";
import { OverflowGuard } from "@/src/components/layout/OverflowGuard";
import { ResponsiveToolbar } from "@/src/components/layout/ResponsiveToolbar";
import { StatusBadge } from "@/src/components/platform/PlatformBadges";
import { SkeletonTable } from "@/src/components/ui/skeleton-card";
import { cn } from "@/src/lib/utils";

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

type DialogState =
  | { type: "suspend"; workspace: WorkspaceRow }
  | { type: "force_delete"; workspace: WorkspaceRow }
  | null;

export default function PlatformWorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<WorkspaceRow[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const load = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const data = await fetchPlatformJson<{ workspaces: WorkspaceRow[] }>(
        `/api/platform/workspaces?${params.toString()}`,
      );
      setWorkspaces(data.workspaces ?? []);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const runAction = async (
    workspace: WorkspaceRow,
    endpoint: "status" | "trial" | "billing",
    body: Record<string, unknown>,
  ) => {
    try {
      setSavingId(workspace.id);
      setMessage(null);
      setError(null);
      await fetchPlatformJson(`/api/platform/workspaces/${workspace.id}/${endpoint}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      setMessage(`${workspace.name} updated.`);
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
      setError(null);
      await fetchPlatformJson(`/api/platform/workspaces/${workspace.id}/deletion`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      setMessage(`${workspace.name} deletion action saved.`);
      await load();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Workspace deletion action failed");
    } finally {
      setSavingId(null);
    }
  };

  const handleSuspendConfirm = async () => {
    if (!dialog || dialog.type !== "suspend") return;
    await runAction(dialog.workspace, "status", {
      action: "suspend",
      reason: suspendReason.trim(),
    });
    setDialog(null);
    setSuspendReason("");
  };

  const handleForceDeleteConfirm = async () => {
    if (!dialog || dialog.type !== "force_delete") return;
    if (deleteConfirmText.trim().toUpperCase() !== "DELETE WORKSPACE") return;
    await runDeletionAction(dialog.workspace, {
      action: "force",
      confirmation: deleteConfirmText.trim(),
    });
    setDialog(null);
    setDeleteConfirmText("");
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
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search workspaces or admin email"
          className="h-12 px-4"
        />
      </ResponsiveToolbar>

      {error && (
        <Alert className="rounded-2xl border-red-500/30 bg-red-500/10 text-red-300">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {message && (
        <Alert className="rounded-2xl border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <SkeletonTable rows={6} cols={7} />
      ) : (
        <OverflowGuard mode="scroll">
          <AppCard className="overflow-hidden">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--line)] bg-[var(--surface-2)]">
                  {["Workspace", "Owner", "Status", "Billing", "Trial ends", "Usage", "Actions"].map((col) => (
                    <th key={col} className="px-5 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {workspaces.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-sm text-[var(--ink-muted)]">
                      No workspaces found.
                    </td>
                  </tr>
                ) : (
                  workspaces.map((workspace) => (
                    <tr key={workspace.id} className="group transition-colors hover:bg-[var(--surface-2)]">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-[var(--ink)]">{workspace.name}</p>
                        <p className="mt-0.5 text-xs text-[var(--ink-muted)]">{workspace.slug}</p>
                      </td>
                      <td className="max-w-[13rem] truncate px-5 py-4 text-sm text-[var(--ink-soft)]" title={workspace.owner_email ?? ""}>
                        {workspace.owner_email ?? "No admin"}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={workspace.status} />
                        <p className="mt-1 text-[11px] text-[var(--ink-muted)]">
                          {formatStatusLabel(workspace.subscription_status)}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-sm text-[var(--ink-soft)]">
                        <p>{formatStatusLabel(workspace.billing_status)}</p>
                        <p className="text-[11px] text-[var(--ink-muted)]">{formatPlanLabel(workspace.subscription_plan)}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-[var(--ink-soft)]">{formatDate(workspace.trial_ends_at)}</td>
                      <td className="px-5 py-4 text-sm text-[var(--ink-soft)]">
                        <p>{workspace.users_count} users</p>
                        <p className="text-[11px] text-[var(--ink-muted)]">{workspace.documents_count} docs</p>
                      </td>
                      <td className="px-5 py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <AppButton
                              tone="secondary"
                              disabled={savingId === workspace.id}
                              className="h-9 gap-1.5 px-3 text-xs"
                            >
                              {savingId === workspace.id ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : null}
                              Actions
                              <ChevronDown size={13} />
                            </AppButton>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl border-[var(--line)] shadow-lg">
                            <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-[var(--ink-muted)]">
                              Status
                            </DropdownMenuLabel>
                            <DropdownMenuItem
                              className="cursor-pointer text-sm"
                              onClick={() => runAction(workspace, "status", { action: "activate" })}
                            >
                              Activate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer text-sm text-amber-300 focus:text-amber-300"
                              onClick={() => { setSuspendReason(""); setDialog({ type: "suspend", workspace }); }}
                            >
                              Suspend…
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer text-sm"
                              onClick={() => runAction(workspace, "status", { action: "expire" })}
                            >
                              Expire
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-[var(--ink-muted)]">
                              Trial
                            </DropdownMenuLabel>
                            <DropdownMenuItem
                              className="cursor-pointer text-sm"
                              onClick={() => runAction(workspace, "trial", { days: 7 })}
                            >
                              Extend +7 days
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer text-sm"
                              onClick={() => runAction(workspace, "trial", { days: 14 })}
                            >
                              Extend +14 days
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-[var(--ink-muted)]">
                              Billing
                            </DropdownMenuLabel>
                            <DropdownMenuItem
                              className="cursor-pointer text-sm"
                              onClick={() => runAction(workspace, "billing", { action: "paid_active" })}
                            >
                              Mark paid active
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer text-sm"
                              onClick={() => runAction(workspace, "billing", { action: "past_due" })}
                            >
                              Mark past due
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-[var(--ink-muted)]">
                              Deletion
                            </DropdownMenuLabel>
                            <DropdownMenuItem
                              className="cursor-pointer text-sm"
                              onClick={() => runDeletionAction(workspace, { action: "schedule", reason: "" })}
                            >
                              Schedule deletion
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer text-sm"
                              onClick={() => runDeletionAction(workspace, { action: "cancel" })}
                            >
                              Cancel deletion
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className={cn(
                                "cursor-pointer text-sm text-red-300 focus:text-red-300",
                                workspace.deletion_status === "deleting" && "opacity-40",
                              )}
                              disabled={workspace.deletion_status === "deleting"}
                              onClick={() => { setDeleteConfirmText(""); setDialog({ type: "force_delete", workspace }); }}
                            >
                              Force delete…
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </AppCard>
        </OverflowGuard>
      )}

      {/* Suspend dialog */}
      <Dialog
        open={dialog?.type === "suspend"}
        onOpenChange={(open) => { if (!open) setDialog(null); }}
      >
        <DialogContent className="rounded-2xl border-[var(--line)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Suspend workspace</DialogTitle>
            <DialogDescription>
              {dialog?.type === "suspend" && (
                <>Suspending <strong>{dialog.workspace.name}</strong>. This will block all access for users in this workspace.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--ink-muted)]">
                Suspension reason <span className="text-[var(--ink-muted)]">(optional, internal only)</span>
              </label>
              <Textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="e.g. Payment overdue, policy violation..."
                className="min-h-20 resize-none rounded-xl border-[var(--line)] text-sm"
              />
            </div>
            <div className="flex gap-2">
              <AppButton tone="secondary" className="flex-1" onClick={() => setDialog(null)}>
                Cancel
              </AppButton>
              <AppButton
                tone="destructive"
                className="flex-1"
                onClick={() => void handleSuspendConfirm()}
                disabled={savingId !== null}
              >
                {savingId ? <Loader2 size={14} className="animate-spin" /> : null}
                Suspend workspace
              </AppButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Force delete dialog */}
      <Dialog
        open={dialog?.type === "force_delete"}
        onOpenChange={(open) => { if (!open) { setDialog(null); setDeleteConfirmText(""); } }}
      >
        <DialogContent className="rounded-2xl border-[var(--line)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-300">Force delete workspace</DialogTitle>
            <DialogDescription>
              {dialog?.type === "force_delete" && (
                <>
                  This will permanently delete <strong>{dialog.workspace.name}</strong>, all its documents, chat history, and user data. This cannot be undone.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--ink-muted)]">
                Type <span className="font-mono text-[var(--ink)]">DELETE WORKSPACE</span> to confirm
              </label>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE WORKSPACE"
                className="rounded-xl border-red-500/30 font-mono text-sm focus-visible:border-red-400 focus-visible:ring-red-100"
              />
            </div>
            <div className="flex gap-2">
              <AppButton tone="secondary" className="flex-1" onClick={() => { setDialog(null); setDeleteConfirmText(""); }}>
                Cancel
              </AppButton>
              <AppButton
                tone="destructive"
                className="flex-1"
                onClick={() => void handleForceDeleteConfirm()}
                disabled={deleteConfirmText.trim().toUpperCase() !== "DELETE WORKSPACE" || savingId !== null}
              >
                {savingId ? <Loader2 size={14} className="animate-spin" /> : null}
                Permanently delete
              </AppButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatStatusLabel(value: string | null) {
  if (!value) return "—";
  if (value === "trialing") return "Trial";
  if (value === "past_due") return "Payment due";
  return value.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function formatPlanLabel(value: string | null) {
  if (!value) return "Trial";
  if (value === "pilot") return "Essential";
  return value.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}
