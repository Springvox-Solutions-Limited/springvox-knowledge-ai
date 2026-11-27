"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, Loader2 } from "lucide-react";

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
import { SearchBar } from "@/src/components/ui/search-bar";
import { OverflowGuard } from "@/src/components/layout/OverflowGuard";
import { PlanBadge, StatusBadge } from "@/src/components/platform/PlatformBadges";
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

const dialogInputClass =
  "h-9 rounded-md border-[var(--line)] bg-[var(--canvas-soft)] text-[12px] shadow-none focus-visible:border-[var(--accent-jade)] focus-visible:ring-2 focus-visible:ring-[var(--accent-jade-100)]";

const menuLabelClass =
  "px-2 py-1 text-[10px] font-medium text-[var(--ink-muted)]";

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
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load workspaces",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setLoading(true);
      void load();
    });
    return () => window.cancelAnimationFrame(frame);
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
      await fetchPlatformJson(
        `/api/platform/workspaces/${workspace.id}/${endpoint}`,
        {
          method: "PATCH",
          body: JSON.stringify(body),
        },
      );
      setMessage(`${workspace.name} updated.`);
      await load();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Workspace update failed",
      );
    } finally {
      setSavingId(null);
    }
  };

  const runDeletionAction = async (
    workspace: WorkspaceRow,
    body: Record<string, unknown>,
  ) => {
    try {
      setSavingId(workspace.id);
      setMessage(null);
      setError(null);
      await fetchPlatformJson(
        `/api/platform/workspaces/${workspace.id}/deletion`,
        {
          method: "PATCH",
          body: JSON.stringify(body),
        },
      );
      setMessage(`${workspace.name} deletion action saved.`);
      await load();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Workspace deletion action failed",
      );
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
    <div className="admin-page" aria-busy={loading}>
      <PlatformPageHeader
        title="Workspaces"
        subtitle="Trial, billing, deletion, and operational access for every workspace."
        aside={
          <span className="text-[11px] tabular-nums text-[var(--ink-muted)]">
            {loading
              ? "Loading…"
              : `${workspaces.length} ${workspaces.length === 1 ? "workspace" : "workspaces"}`}
          </span>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchBar
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search workspaces or admin email"
          className="h-9 rounded-md px-2.5 shadow-none focus-within:border-[var(--accent-jade)] focus-within:ring-2 focus-within:ring-[var(--accent-jade-100)] sm:max-w-[420px] sm:flex-1"
          inputClassName="text-[12px]"
        />
      </div>

      {error ? (
        <div className="rounded-[10px] border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-300">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="rounded-[10px] border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-300">
          {message}
        </div>
      ) : null}

      <div className="admin-shell-card overflow-hidden">
        <OverflowGuard mode="scroll">
          <table className="w-full min-w-[940px] text-left">
            <thead>
              <tr className="border-b border-[var(--line)] text-[11px] text-[var(--ink-muted)]">
                <th className="px-4 py-2.5 font-medium sm:px-5">Workspace</th>
                <th className="px-4 py-2.5 font-medium">Owner</th>
                <th className="px-3 py-2.5 font-medium">Plan</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 font-medium">Capacity</th>
                <th className="px-3 py-2.5 font-medium">Trial ends</th>
                <th className="px-4 py-2.5 text-right font-medium sm:px-5">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line-soft)]">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-[12px] text-[var(--ink-muted)]"
                  >
                    Loading workspaces…
                  </td>
                </tr>
              ) : workspaces.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-[12px] text-[var(--ink-muted)]"
                  >
                    No workspaces found.
                  </td>
                </tr>
              ) : (
                workspaces.map((workspace) => (
                  <tr
                    key={workspace.id}
                    className="transition-colors hover:bg-[var(--canvas-soft)]"
                  >
                    <td className="max-w-[17rem] px-4 py-1.5 sm:px-5">
                      <Link
                        href={`/platform/companies/${workspace.id}`}
                        className="block truncate text-[12px] font-medium leading-4 text-[var(--ink)] hover:text-[var(--accent-jade)]"
                        title={workspace.name}
                      >
                        {workspace.name}
                      </Link>
                      <p
                        className="truncate text-[11px] leading-4 text-[var(--ink-muted)]"
                        title={workspace.slug}
                      >
                        {workspace.slug}
                      </p>
                    </td>
                    <td
                      className="max-w-[13rem] px-4 py-2.5 text-[12px] text-[var(--ink-soft)]"
                      title={workspace.owner_email ?? ""}
                    >
                      <span className="block truncate">
                        {workspace.owner_email ?? "No admin"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <PlanBadge
                          plan={workspace.subscription_plan ?? "trial"}
                        />
                        {workspace.billing_status ? (
                          <span className="text-[10px] text-[var(--ink-muted)]">
                            {formatStatusLabel(workspace.billing_status)}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <StatusBadge status={workspace.status} />
                        {workspace.subscription_status &&
                        workspace.subscription_status !==
                          workspace.status ? (
                          <span className="text-[10px] text-[var(--ink-muted)]">
                            {formatStatusLabel(workspace.subscription_status)}
                          </span>
                        ) : null}
                      </div>
                      {workspace.deletion_status ? (
                        <p
                          className={cn(
                            "mt-1 text-[10px]",
                            workspace.deletion_status === "cancelled"
                              ? "text-[var(--ink-muted)]"
                              : "text-red-300",
                          )}
                        >
                          {formatDeletionLabel(
                            workspace.deletion_status,
                            workspace.deletion_scheduled_for,
                          )}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="text-[11px] tabular-nums text-[var(--ink-soft)]">
                        {workspace.users_count} users ·{" "}
                        {workspace.documents_count} docs
                      </p>
                    </td>
                    <td className="px-3 py-2.5 text-[11px] tabular-nums text-[var(--ink-muted)]">
                      {formatDate(workspace.trial_ends_at)}
                    </td>
                    <td className="px-4 py-2.5 text-right sm:px-5">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <AppButton
                            tone="secondary"
                            disabled={savingId === workspace.id}
                            className="ml-auto h-7 gap-1 px-2 text-[11px]"
                          >
                            {savingId === workspace.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : null}
                            Actions
                            <ChevronDown size={12} />
                          </AppButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-52 rounded-md border-[var(--line)] bg-[var(--surface)] p-1 shadow-md"
                        >
                          <DropdownMenuLabel className={menuLabelClass}>
                            Status
                          </DropdownMenuLabel>
                          <DropdownMenuItem
                            className="cursor-pointer text-[12px]"
                            onClick={() =>
                              runAction(workspace, "status", {
                                action: "activate",
                              })
                            }
                          >
                            Activate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer text-[12px] text-amber-300 focus:text-amber-300"
                            onClick={() => {
                              setSuspendReason("");
                              setDialog({ type: "suspend", workspace });
                            }}
                          >
                            Suspend…
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer text-[12px]"
                            onClick={() =>
                              runAction(workspace, "status", {
                                action: "expire",
                              })
                            }
                          >
                            Expire
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className={menuLabelClass}>
                            Trial
                          </DropdownMenuLabel>
                          <DropdownMenuItem
                            className="cursor-pointer text-[12px]"
                            onClick={() =>
                              runAction(workspace, "trial", { days: 7 })
                            }
                          >
                            Extend +7 days
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer text-[12px]"
                            onClick={() =>
                              runAction(workspace, "trial", { days: 14 })
                            }
                          >
                            Extend +14 days
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className={menuLabelClass}>
                            Billing
                          </DropdownMenuLabel>
                          <DropdownMenuItem
                            className="cursor-pointer text-[12px]"
                            onClick={() =>
                              runAction(workspace, "billing", {
                                action: "paid_active",
                              })
                            }
                          >
                            Mark paid active
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer text-[12px]"
                            onClick={() =>
                              runAction(workspace, "billing", {
                                action: "past_due",
                              })
                            }
                          >
                            Mark past due
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className={menuLabelClass}>
                            Deletion
                          </DropdownMenuLabel>
                          <DropdownMenuItem
                            className="cursor-pointer text-[12px]"
                            onClick={() =>
                              runDeletionAction(workspace, {
                                action: "schedule",
                                reason: "",
                              })
                            }
                          >
                            Schedule deletion
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer text-[12px]"
                            onClick={() =>
                              runDeletionAction(workspace, { action: "cancel" })
                            }
                          >
                            Cancel deletion
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className={cn(
                              "cursor-pointer text-[12px] text-red-300 focus:text-red-300",
                              workspace.deletion_status === "deleting" &&
                                "opacity-40",
                            )}
                            disabled={workspace.deletion_status === "deleting"}
                            onClick={() => {
                              setDeleteConfirmText("");
                              setDialog({ type: "force_delete", workspace });
                            }}
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
        </OverflowGuard>
      </div>

      {/* Suspend dialog */}
      <Dialog
        open={dialog?.type === "suspend"}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
      >
        <DialogContent className="rounded-[10px] border-[var(--line)] bg-[var(--surface)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-semibold text-[var(--ink)]">
              Suspend workspace
            </DialogTitle>
            <DialogDescription className="text-[12px] leading-5 text-[var(--ink-soft)]">
              {dialog?.type === "suspend" && (
                <>
                  Suspending <strong>{dialog.workspace.name}</strong>. This will
                  block all access for users in this workspace.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[var(--ink-muted)]">
                Suspension reason{" "}
                <span className="font-normal">(optional, internal only)</span>
              </label>
              <Textarea
                value={suspendReason}
                onChange={(event) => setSuspendReason(event.target.value)}
                placeholder="e.g. Payment overdue, policy violation…"
                className="min-h-20 resize-none rounded-md border-[var(--line)] bg-[var(--canvas-soft)] text-[12px] shadow-none"
              />
            </div>
            <div className="flex gap-2">
              <AppButton
                tone="secondary"
                className="h-9 flex-1 px-3 text-[12px]"
                onClick={() => setDialog(null)}
              >
                Cancel
              </AppButton>
              <AppButton
                tone="destructive"
                className="h-9 flex-1 px-3 text-[12px]"
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
        onOpenChange={(open) => {
          if (!open) {
            setDialog(null);
            setDeleteConfirmText("");
          }
        }}
      >
        <DialogContent className="rounded-[10px] border-[var(--line)] bg-[var(--surface)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-semibold text-red-300">
              Force delete workspace
            </DialogTitle>
            <DialogDescription className="text-[12px] leading-5 text-[var(--ink-soft)]">
              {dialog?.type === "force_delete" && (
                <>
                  This will permanently delete{" "}
                  <strong>{dialog.workspace.name}</strong>, all its documents,
                  chat history, and user data. This cannot be undone.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[var(--ink-muted)]">
                Type{" "}
                <span className="font-mono text-[var(--ink)]">
                  DELETE WORKSPACE
                </span>{" "}
                to confirm
              </label>
              <Input
                value={deleteConfirmText}
                onChange={(event) => setDeleteConfirmText(event.target.value)}
                placeholder="DELETE WORKSPACE"
                className={cn(
                  dialogInputClass,
                  "border-red-500/30 font-mono focus-visible:border-red-400 focus-visible:ring-red-500/20",
                )}
              />
            </div>
            <div className="flex gap-2">
              <AppButton
                tone="secondary"
                className="h-9 flex-1 px-3 text-[12px]"
                onClick={() => {
                  setDialog(null);
                  setDeleteConfirmText("");
                }}
              >
                Cancel
              </AppButton>
              <AppButton
                tone="destructive"
                className="h-9 flex-1 px-3 text-[12px]"
                onClick={() => void handleForceDeleteConfirm()}
                disabled={
                  deleteConfirmText.trim().toUpperCase() !==
                    "DELETE WORKSPACE" || savingId !== null
                }
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
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatStatusLabel(value: string | null) {
  if (!value) return "—";
  if (value === "trialing") return "Trial";
  if (value === "past_due") return "Payment due";
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) =>
    letter.toUpperCase(),
  );
}

function formatDeletionLabel(status: string, scheduledFor: string | null) {
  if (status === "scheduled") {
    return scheduledFor
      ? `Deletion scheduled · ${formatDate(scheduledFor)}`
      : "Deletion scheduled";
  }
  if (status === "deleting") return "Deletion in progress";
  if (status === "deleted") return "Deleted";
  if (status === "cancelled") return "Deletion cancelled";
  return `Deletion ${status.replace(/_/g, " ")}`;
}
