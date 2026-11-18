"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Copy,
  Eye,
  Loader2,
  MailPlus,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAccessToken, getCurrentUserProfile } from "@/src/lib/auth-client";
import { cn } from "@/src/lib/utils";
import { AppButton } from "@/src/components/ui/app-button";
import { EmptyState } from "@/src/components/ui/empty-state";
import { AdminSearchInput } from "@/src/components/dashboard/AdminSearchInput";
import {
  type AnyAppRole,
  getRoleLabel,
  isWorkspaceAdminRole,
  type AppRole,
  type UserProfile,
} from "@/src/lib/workspace";
import { AppPageHeader } from "@/src/components/shared/AppPageHeader";
import { ConfirmDialog } from "@/src/components/ui/confirm-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type ManagedUser = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: AnyAppRole;
  status: "active" | "suspended" | "invited" | "disabled";
  workspace_id: string | null;
  workspace_name: string;
  created_at: string;
  updated_at: string;
};

type Invitation = {
  id: string;
  email: string;
  role: AppRole;
  status: "pending" | "accepted" | "revoked" | "expired";
  expires_at: string;
  created_at: string;
  invite_url: string;
};

const ROLE_OPTIONS: AppRole[] = ["viewer", "tenant_admin"];
const PAGE_SIZE = 10;

const STATUS_LABEL: Record<ManagedUser["status"], string> = {
  active: "Active",
  suspended: "Suspended",
  invited: "Invited",
  disabled: "Disabled",
};

const STATUS_DOT: Record<ManagedUser["status"], string> = {
  active: "bg-emerald-400",
  suspended: "bg-red-400",
  invited: "bg-amber-400",
  disabled: "bg-red-400",
};

function UserStatus({ status }: { status: ManagedUser["status"] }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--ink-soft)]">
      <span
        aria-hidden="true"
        className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[status])}
      />
      {STATUS_LABEL[status]}
    </span>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function UsersPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | AnyAppRole>("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | ManagedUser["status"]
  >("all");
  const [error, setError] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<{
    user: ManagedUser;
    nextRole: AppRole;
  } | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AppRole>("viewer");
  const [createdInviteUrl, setCreatedInviteUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewUser, setViewUser] = useState<ManagedUser | null>(null);
  const [tab, setTab] = useState<"members" | "invites">("members");

  const loadUsers = async () => {
    try {
      setLoading(true);
      const currentProfile = await getCurrentUserProfile();
      setProfile(currentProfile);

      if (!currentProfile || !isWorkspaceAdminRole(currentProfile.role)) {
        router.replace("/dashboard");
        return;
      }

      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error("Authentication session expired");
      }

      const response = await fetch("/api/users", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load users");
      }

      const data = await response.json();
      setUsers(data.users || []);
      const inviteResponse = await fetch("/api/invitations", {
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
      setError(
        loadError instanceof Error ? loadError.message : "Failed to load users",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      loadUsers();
    });
    return () => window.cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      !searchQuery ||
      (user.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.full_name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const pagedUsers = filteredUsers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const hasFilters =
    Boolean(searchQuery) || roleFilter !== "all" || statusFilter !== "all";
  const pendingInvitations = invitations.filter(
    (invitation) => invitation.status === "pending",
  );

  const summaryMetrics = [
    { label: "Members", value: users.length },
    {
      label: "Admins",
      value: users.filter((user) => user.role === "tenant_admin").length,
    },
    {
      label: "Viewers",
      value: users.filter((user) => user.role === "viewer").length,
    },
    { label: "Pending invites", value: pendingInvitations.length },
  ];

  const getDisplayUserName = (user: ManagedUser) => {
    const trimmedName = user.full_name?.trim();

    if (
      trimmedName &&
      trimmedName.toLowerCase() !== user.workspace_name.toLowerCase()
    ) {
      return trimmedName;
    }

    if (user.email) {
      return user.email.split("@")[0];
    }

    return "Anonymous";
  };

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setCurrentPage(1));
    return () => window.cancelAnimationFrame(frame);
  }, [searchQuery, roleFilter, statusFilter]);

  const updateRole = async (
    user: ManagedUser,
    nextRole: AppRole,
    confirmSelfDemotion = false,
  ) => {
    try {
      setSaving(true);
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error("Authentication session expired");
      }

      const response = await fetch("/api/users/role", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
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
        throw new Error("Failed to update role");
      }

      await loadUsers();
      setConfirmState(null);
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Failed to update role",
      );
    } finally {
      setSaving(false);
    }
  };

  const createInvitation = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setSaving(true);
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error("Authentication session expired");
      }

      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create invitation");
      }

      setCreatedInviteUrl(data.invitation.invite_url);
      setInviteEmail("");
      await loadUsers();
    } catch (inviteError) {
      setError(
        inviteError instanceof Error
          ? inviteError.message
          : "Failed to create invitation",
      );
    } finally {
      setSaving(false);
    }
  };

  const updateUserStatus = async (
    targetUser: ManagedUser,
    status: "active" | "suspended",
  ) => {
    try {
      setSaving(true);
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error("Authentication session expired");
      }

      const response = await fetch("/api/users/status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          userId: targetUser.id,
          status,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update user status");
      }

      await loadUsers();
    } catch (statusError) {
      setError(
        statusError instanceof Error
          ? statusError.message
          : "Failed to update user status",
      );
    } finally {
      setSaving(false);
    }
  };

  const revokeInvitation = async (id: string) => {
    try {
      setSaving(true);
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error("Authentication session expired");
      }

      const response = await fetch("/api/invitations/revoke", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error("Failed to revoke invitation");
      }

      await loadUsers();
    } catch (inviteError) {
      setError(
        inviteError instanceof Error
          ? inviteError.message
          : "Failed to revoke invitation",
      );
    } finally {
      setSaving(false);
    }
  };

  if (profile && !isWorkspaceAdminRole(profile.role)) {
    return null;
  }

  return (
    <div className="admin-page">
      <AppPageHeader
        title="Workspace users"
        subtitle="Manage team roles and invitations."
        aside={
          <AppButton
            type="button"
            onClick={() => {
              setInviteOpen(true);
              setCreatedInviteUrl(null);
            }}
            className="h-9 shrink-0 rounded-md px-3 text-[13px]"
          >
            <MailPlus size={15} />
            Invite user
          </AppButton>
        }
      />

      <div className="grid grid-cols-2 overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--surface)] sm:grid-cols-4">
        {summaryMetrics.map((metric, index) => (
          <div
            key={metric.label}
            className={cn(
              "px-4 py-2.5",
              index > 0 && "sm:border-l sm:border-[var(--line-soft)]",
              (index === 1 || index === 3) &&
                "border-l border-[var(--line-soft)]",
              index >= 2 && "border-t border-[var(--line-soft)] sm:border-t-0",
            )}
          >
            <p className="text-[11px] text-[var(--ink-muted)]">{metric.label}</p>
            <p className="mt-0.5 text-[14px] font-medium tabular-nums text-[var(--ink)]">
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-5 border-b border-[var(--line)]">
        {(
          [
            { id: "members", label: "Members", count: users.length },
            {
              id: "invites",
              label: "Invitations",
              count: pendingInvitations.length,
            },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={tab === item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              "-mb-px inline-flex items-center gap-1.5 border-b-2 pb-2 text-[13px] font-medium transition-colors",
              tab === item.id
                ? "border-[var(--accent-jade)] text-[var(--ink)]"
                : "border-transparent text-[var(--ink-muted)] hover:text-[var(--ink)]",
            )}
          >
            {item.label}
            <span className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 text-[11px] tabular-nums text-[var(--ink-muted)]">
              {item.count}
            </span>
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-[10px] border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-[12px] text-red-300">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <p className="min-w-0 wrap-anywhere">{error}</p>
        </div>
      )}

      {tab === "members" ? (
        <div className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--surface)]">
          <div className="flex flex-wrap items-center gap-2 border-b border-[var(--line)] px-2.5 py-2">
            <AdminSearchInput
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by name or email..."
              className="h-9 min-w-[10rem] flex-1 rounded-md bg-[var(--canvas-soft)] px-2.5 shadow-none sm:max-w-xs"
              inputClassName="text-[13px]"
            />
            <Select
              value={roleFilter}
              onValueChange={(value) =>
                setRoleFilter(value as "all" | AnyAppRole)
              }
            >
              <SelectTrigger className="h-9 w-[9.5rem] rounded-md border-[var(--line)] bg-[var(--surface)] text-[13px] shadow-none">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="platform_admin">Platform Admin</SelectItem>
                <SelectItem value="tenant_admin">Workspace Admin</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as "all" | ManagedUser["status"])
              }
            >
              <SelectTrigger className="h-9 w-[9rem] rounded-md border-[var(--line)] bg-[var(--surface)] text-[13px] shadow-none">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
            {hasFilters ? (
              <AppButton
                tone="ghost"
                className="h-9 px-2.5 text-[12px]"
                onClick={() => {
                  setSearchQuery("");
                  setRoleFilter("all");
                  setStatusFilter("all");
                }}
              >
                Clear filters
              </AppButton>
            ) : null}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left">
              <thead>
                <tr className="border-b border-[var(--line)] bg-[var(--canvas-soft)]">
                  <th className="px-3 py-2 text-[11px] font-medium text-[var(--ink-muted)]">
                    User
                  </th>
                  <th className="px-3 py-2 text-[11px] font-medium text-[var(--ink-muted)]">
                    Role
                  </th>
                  <th className="px-3 py-2 text-[11px] font-medium text-[var(--ink-muted)]">
                    Status
                  </th>
                  <th className="hidden px-3 py-2 text-[11px] font-medium text-[var(--ink-muted)] md:table-cell">
                    Added
                  </th>
                  <th className="px-3 py-2 text-right text-[11px] font-medium text-[var(--ink-muted)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-16 text-center text-[12px] text-[var(--ink-muted)]"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin" />
                        Loading users...
                      </span>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8">
                      <EmptyState
                        icon={Users}
                        title="No users found"
                        description="Adjust your search filters or invite new users to get started."
                        className="border-0 bg-transparent py-0"
                      />
                    </td>
                  </tr>
                ) : (
                  pagedUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-[var(--line-soft)] last:border-b-0 hover:bg-[var(--canvas-soft)]"
                    >
                      <td className="max-w-[20rem] px-3 py-2.5">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span
                            aria-hidden="true"
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-[var(--line)] bg-[var(--surface-2)] text-[11px] font-medium text-[var(--ink-soft)]"
                          >
                            {(getDisplayUserName(user) || "U")
                              .slice(0, 1)
                              .toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p
                              className="truncate text-[13px] font-medium text-[var(--ink)]"
                              title={user.full_name || user.email || ""}
                            >
                              {getDisplayUserName(user)}
                            </p>
                            <p
                              className="truncate text-[11px] text-[var(--ink-muted)]"
                              title={user.email || ""}
                            >
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-[12px] text-[var(--ink-soft)]">
                        {getRoleLabel(user.role)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <UserStatus status={user.status} />
                      </td>
                      <td className="hidden whitespace-nowrap px-3 py-2.5 text-[11px] tabular-nums text-[var(--ink-muted)] md:table-cell">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          <AppButton
                            type="button"
                            tone="ghost"
                            onClick={() => setViewUser(user)}
                            className="h-7 rounded-md px-2 text-[11px]"
                          >
                            <Eye size={12} />
                            View
                          </AppButton>
                          {user.status === "active" ? (
                            <AppButton
                              type="button"
                              disabled={saving}
                              onClick={() =>
                                updateUserStatus(user, "suspended")
                              }
                              tone="ghost"
                              className="h-7 rounded-md px-2 text-[11px] text-red-300 hover:bg-red-500/10 hover:text-red-200"
                            >
                              Suspend
                            </AppButton>
                          ) : (
                            <AppButton
                              type="button"
                              disabled={saving}
                              onClick={() => updateUserStatus(user, "active")}
                              tone="ghost"
                              className="h-7 rounded-md px-2 text-[11px]"
                            >
                              Activate
                            </AppButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredUsers.length > PAGE_SIZE ? (
            <div className="flex flex-col gap-2 border-t border-[var(--line)] px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] tabular-nums text-[var(--ink-muted)]">
                {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, filteredUsers.length)} of{" "}
                {filteredUsers.length}
              </p>
              <div className="flex items-center gap-1">
                <AppButton
                  tone="secondary"
                  className="h-7 rounded-md px-2 text-[11px]"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                >
                  Previous
                </AppButton>
                <AppButton
                  tone="secondary"
                  className="h-7 rounded-md px-2 text-[11px]"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                >
                  Next
                </AppButton>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--surface)]">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-[14px] font-medium text-[var(--ink)]">
                Pending invitations
              </p>
              <p className="text-[11px] text-[var(--ink-muted)]">
                Manage pending access requests and generated invite links.
              </p>
            </div>
            <span className="shrink-0 text-[11px] tabular-nums text-[var(--ink-muted)]">
              {pendingInvitations.length} pending
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 px-3 py-12 text-[12px] text-[var(--ink-muted)]">
              <Loader2 size={14} className="animate-spin" />
              Loading invitations...
            </div>
          ) : pendingInvitations.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-[12px] font-medium text-[var(--ink)]">
                No active invitations
              </p>
              <p className="mt-1 text-[11px] text-[var(--ink-muted)]">
                Send an invite to add new users to your workspace.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[34rem] text-left">
                <thead>
                  <tr className="border-b border-[var(--line)] bg-[var(--canvas-soft)]">
                    <th className="px-3 py-2 text-[11px] font-medium text-[var(--ink-muted)]">
                      Email
                    </th>
                    <th className="px-3 py-2 text-[11px] font-medium text-[var(--ink-muted)]">
                      Role
                    </th>
                    <th className="hidden px-3 py-2 text-[11px] font-medium text-[var(--ink-muted)] sm:table-cell">
                      Expires
                    </th>
                    <th className="px-3 py-2 text-right text-[11px] font-medium text-[var(--ink-muted)]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pendingInvitations.map((invitation) => (
                    <tr
                      key={invitation.id}
                      className="border-b border-[var(--line-soft)] last:border-b-0 hover:bg-[var(--canvas-soft)]"
                    >
                      <td
                        className="max-w-[16rem] truncate px-3 py-2.5 text-[13px] text-[var(--ink)]"
                        title={invitation.email}
                      >
                        {invitation.email}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-[12px] text-[var(--ink-soft)]">
                        {getRoleLabel(invitation.role)}
                      </td>
                      <td className="hidden whitespace-nowrap px-3 py-2.5 text-[11px] tabular-nums text-[var(--ink-muted)] sm:table-cell">
                        {formatDate(invitation.expires_at)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          <AppButton
                            type="button"
                            onClick={() =>
                              navigator.clipboard.writeText(
                                invitation.invite_url,
                              )
                            }
                            tone="ghost"
                            className="h-7 rounded-md px-2 text-[11px]"
                          >
                            <Copy size={12} />
                            Copy link
                          </AppButton>
                          <AppButton
                            type="button"
                            disabled={saving}
                            onClick={() => revokeInvitation(invitation.id)}
                            tone="ghost"
                            className="h-7 rounded-md px-2 text-[11px] text-red-300 hover:bg-red-500/10 hover:text-red-200"
                          >
                            Revoke
                          </AppButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirmState)}
        onOpenChange={(open) => {
          if (!open) setConfirmState(null);
        }}
        title="Confirm role change"
        description={
          confirmState
            ? `You are about to change your own role to ${getRoleLabel(confirmState.nextRole)}. This may limit your access to this page.`
            : ""
        }
        confirmLabel="Confirm role change"
        cancelLabel="Keep current access"
        confirmTone="destructive"
        loading={saving}
        onConfirm={async () => {
          if (!confirmState) return;
          await updateRole(confirmState.user, confirmState.nextRole, true);
        }}
      />

      <Sheet
        open={Boolean(viewUser)}
        onOpenChange={(open) => {
          if (!open) setViewUser(null);
        }}
      >
        <SheetContent
          side="right"
          className="w-[min(100vw-1rem,26rem)] border-[var(--line)] bg-[var(--surface)] p-0"
        >
          <SheetHeader className="border-b border-[var(--line)] p-4">
            <SheetTitle className="text-[14px] font-semibold text-[var(--ink)]">
              User details
            </SheetTitle>
          </SheetHeader>
          {viewUser ? (
            <div className="flex-1 space-y-5 overflow-y-auto p-4">
              <div className="flex items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[var(--line)] bg-[var(--surface-2)] text-[13px] font-medium text-[var(--ink)]"
                >
                  {(viewUser.full_name || viewUser.email || "U")
                    .slice(0, 1)
                    .toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-[var(--ink)]">
                    {viewUser.full_name ||
                      (viewUser.email
                        ? viewUser.email.split("@")[0]
                        : "Anonymous")}
                  </p>
                  <p className="truncate text-[11px] text-[var(--ink-muted)]">
                    {viewUser.email}
                  </p>
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-2">
                <div className="rounded-md border border-[var(--line)] bg-[var(--canvas-soft)] p-2.5">
                  <dt className="text-[11px] text-[var(--ink-muted)]">Role</dt>
                  <dd className="mt-1 text-[12px] text-[var(--ink)]">
                    {getRoleLabel(viewUser.role)}
                  </dd>
                </div>
                <div className="rounded-md border border-[var(--line)] bg-[var(--canvas-soft)] p-2.5">
                  <dt className="text-[11px] text-[var(--ink-muted)]">
                    Status
                  </dt>
                  <dd className="mt-1">
                    <UserStatus status={viewUser.status} />
                  </dd>
                </div>
                <div className="rounded-md border border-[var(--line)] bg-[var(--canvas-soft)] p-2.5">
                  <dt className="text-[11px] text-[var(--ink-muted)]">Added</dt>
                  <dd className="mt-1 text-[12px] tabular-nums text-[var(--ink)]">
                    {formatDate(viewUser.created_at)}
                  </dd>
                </div>
                <div className="rounded-md border border-[var(--line)] bg-[var(--canvas-soft)] p-2.5">
                  <dt className="text-[11px] text-[var(--ink-muted)]">
                    Updated
                  </dt>
                  <dd className="mt-1 text-[12px] tabular-nums text-[var(--ink)]">
                    {formatDate(viewUser.updated_at)}
                  </dd>
                </div>
              </dl>

              <div className="border-t border-[var(--line)] pt-4">
                <p className="mb-2 text-[13px] font-medium text-[var(--ink)]">
                  Change role
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {ROLE_OPTIONS.map((roleOption) => (
                    <AppButton
                      key={roleOption}
                      type="button"
                      disabled={saving || roleOption === viewUser.role}
                      tone={roleOption === viewUser.role ? "ghost" : "secondary"}
                      onClick={async () => {
                        await updateRole(viewUser, roleOption, false);
                        setViewUser(null);
                      }}
                      className="h-8 rounded-md px-2.5 text-[11px]"
                    >
                      {roleOption === viewUser.role
                        ? "Current"
                        : roleOption === "tenant_admin"
                          ? "Make admin"
                          : "Make viewer"}
                    </AppButton>
                  ))}
                </div>
              </div>

              <div className="border-t border-[var(--line)] pt-4">
                <p className="mb-2 text-[13px] font-medium text-[var(--ink)]">
                  Account status
                </p>
                {viewUser.status === "active" ? (
                  <AppButton
                    type="button"
                    disabled={saving}
                    tone="destructive"
                    onClick={async () => {
                      await updateUserStatus(viewUser, "suspended");
                      setViewUser(null);
                    }}
                    className="h-8 rounded-md px-2.5 text-[11px]"
                  >
                    Suspend user
                  </AppButton>
                ) : (
                  <AppButton
                    type="button"
                    disabled={saving}
                    tone="secondary"
                    onClick={async () => {
                      await updateUserStatus(viewUser, "active");
                      setViewUser(null);
                    }}
                    className="h-8 rounded-md px-2.5 text-[11px]"
                  >
                    Activate user
                  </AppButton>
                )}
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <Dialog
        open={inviteOpen}
        onOpenChange={(open) => {
          if (!saving) {
            setInviteOpen(open);
          }
        }}
      >
        <DialogContent
          showCloseButton={!saving}
          onEscapeKeyDown={(event) => {
            if (saving) {
              event.preventDefault();
            }
          }}
          onInteractOutside={(event) => {
            if (saving) {
              event.preventDefault();
            }
          }}
          className="rounded-[10px] border-[var(--line)] bg-[var(--surface)] p-0 sm:max-w-md"
        >
          <div className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-5">
            <DialogHeader className="mb-5">
              <DialogTitle className="text-[15px] font-semibold text-[var(--ink)]">
                Invite user
              </DialogTitle>
              <DialogDescription className="text-[12px] text-[var(--ink-muted)]">
                Create a secure entry link for this workspace.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={createInvitation} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="invite-email"
                  className="text-[11px] font-medium text-[var(--ink-muted)]"
                >
                  Email address
                </label>
                <Input
                  id="invite-email"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  className="h-9 rounded-md border-[var(--line)] bg-[var(--canvas-soft)] px-2.5 text-[13px] shadow-none"
                  placeholder="name@company.com"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[var(--ink-muted)]">
                  Workspace role
                </label>
                <Select
                  value={inviteRole}
                  onValueChange={(value) => setInviteRole(value as AppRole)}
                >
                  <SelectTrigger className="h-9 w-full rounded-md border-[var(--line)] bg-[var(--canvas-soft)] text-[13px] shadow-none">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="tenant_admin">Workspace Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {createdInviteUrl && (
                <div className="space-y-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3">
                  <div>
                    <p className="text-[11px] font-medium text-emerald-300">
                      Invitation link ready
                    </p>
                    <p className="mt-1.5 rounded border border-emerald-500/30 bg-[var(--surface)] p-2 font-mono text-[11px] text-emerald-300 wrap-anywhere">
                      {createdInviteUrl}
                    </p>
                  </div>
                  <AppButton
                    type="button"
                    onClick={() =>
                      navigator.clipboard.writeText(createdInviteUrl)
                    }
                    tone="subtle"
                    className="h-8 w-full rounded-md px-2.5 text-[12px]"
                  >
                    <Copy size={13} />
                    Copy invite link
                  </AppButton>
                </div>
              )}

              {!createdInviteUrl && (
                <div className="pt-1">
                  <AppButton
                    type="submit"
                    disabled={saving}
                    className="h-9 w-full rounded-md text-[13px]"
                  >
                    {saving ? "Creating invite..." : "Create invite link"}
                  </AppButton>
                </div>
              )}
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
