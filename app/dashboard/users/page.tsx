"use client";

import { useEffect, useState } from "react";
import { Copy, Loader2, MailPlus, Users, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { MobileCardList } from "@/src/components/layout/MobileCardList";
import { OverflowGuard } from "@/src/components/layout/OverflowGuard";
import { ResponsiveToolbar } from "@/src/components/layout/ResponsiveToolbar";
import { AdminSearchInput } from "@/src/components/dashboard/AdminSearchInput";
import {
  type AnyAppRole,
  getRoleLabel,
  isWorkspaceAdminRole,
  type AppRole,
  type UserProfile,
} from "@/src/lib/workspace";
import { AppPageHeader } from "@/src/components/shared/AppPageHeader";
import {
  AppTable,
  AppTableBody,
  AppTableCell,
  AppTableHead,
  AppTableHeader,
  AppTableRow,
} from "@/src/components/ui/app-table";
import { ConfirmDialog } from "@/src/components/ui/confirm-dialog";

type ManagedUser = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: AnyAppRole;
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
const PAGE_SIZE = 8;

function getRoleTone(role: AnyAppRole) {
  switch (role) {
    case "tenant_admin":
    case "admin":
      return "border-cyan-200 bg-cyan-50 text-cyan-800";
    case "platform_admin":
      return "border-violet-200 bg-violet-50 text-violet-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
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
    loadUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      !searchQuery ||
      (user.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.full_name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const pagedUsers = filteredUsers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const hasFilters = Boolean(searchQuery) || roleFilter !== "all";

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter]);

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

  const createInvitation = async (event: React.FormEvent) => {
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
        eyebrow="Access Control"
        title="Workspace users"
        subtitle="Manage team roles and invitations."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Workspace users
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            {users.length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Workspace admins
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            {users.filter((user) => user.role === "tenant_admin").length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Viewers
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            {users.filter((user) => user.role === "viewer").length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Pending invites
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            {invitations.filter((item) => item.status === "pending").length}
          </p>
        </div>
      </div>

      <ResponsiveToolbar className="lg:items-center">
        <AppButton
          type="button"
          onClick={() => {
            setInviteOpen(true);
            setCreatedInviteUrl(null);
          }}
          className="w-full whitespace-nowrap px-6 sm:w-auto"
        >
          <MailPlus size={18} />
          Invite user
        </AppButton>
        <AdminSearchInput
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search by name or email..."
          className="flex-1 lg:min-w-[20rem]"
        />
        <Select
          value={roleFilter}
          onValueChange={(value) => setRoleFilter(value as "all" | AnyAppRole)}
        >
          <SelectTrigger className="h-12 w-full rounded-xl border-slate-200 bg-white px-4 text-sm shadow-sm lg:w-[14rem]">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-200">
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="platform_admin">Platform Admin</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
            <SelectItem value="tenant_admin">Workspace Admin</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters ? (
          <AppButton
            tone="secondary"
            className="h-11 w-full px-4 text-xs sm:w-auto"
            onClick={() => {
              setSearchQuery("");
              setRoleFilter("all");
            }}
          >
            Clear filters
          </AppButton>
        ) : null}
      </ResponsiveToolbar>

      {error && (
        <Alert className="rounded-2xl border-red-200 bg-red-50/50 text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <OverflowGuard
        className="hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:block"
        mode="scroll"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 px-6 py-24">
            <div className="relative w-12 h-12">
              <Loader2 size={24} className="animate-spin text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600">
              Loading users...
            </p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="px-6 py-24 text-center">
            <EmptyState
              icon={Users}
              title="No users found"
              description="Adjust your search filters or invite new users to get started."
              className="border-0 bg-transparent py-0"
            />
          </div>
        ) : (
          <AppTable className="min-w-[740px]">
            <AppTableHeader>
              <AppTableRow>
                <AppTableHead className="w-[32%]">User</AppTableHead>
                <AppTableHead className="w-[16%]">Role</AppTableHead>
                <AppTableHead className="w-[16%]">Added</AppTableHead>
                <AppTableHead className="w-[16%]">Updated</AppTableHead>
                <AppTableHead className="w-[20%] text-right">
                  Actions
                </AppTableHead>
              </AppTableRow>
            </AppTableHeader>
            <AppTableBody>
              {pagedUsers.map((user) => (
                <AppTableRow key={user.id}>
                  <AppTableCell className="max-w-[18rem]">
                    <p
                      className="truncate text-sm font-bold text-slate-900"
                      title={user.email || ""}
                    >
                      {user.email || "Anonymous"}
                    </p>
                    {user.full_name && (
                      <p
                        className="mt-1 truncate text-xs font-medium text-slate-500"
                        title={user.full_name}
                      >
                        {user.full_name}
                      </p>
                    )}
                    <p
                      className="mt-2 truncate text-[11px] font-medium text-slate-400"
                      title={user.workspace_name}
                    >
                      {user.workspace_name}
                    </p>
                  </AppTableCell>
                  <AppTableCell>
                    <span
                      className={cn(
                        "inline-flex max-w-full truncate rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]",
                        getRoleTone(user.role),
                      )}
                    >
                      {getRoleLabel(user.role)}
                    </span>
                  </AppTableCell>
                  <AppTableCell className="text-xs text-slate-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </AppTableCell>
                  <AppTableCell className="text-xs text-slate-500">
                    {new Date(user.updated_at).toLocaleDateString()}
                  </AppTableCell>
                  <AppTableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {ROLE_OPTIONS.map((roleOption) => (
                        <AppButton
                          key={roleOption}
                          type="button"
                          disabled={saving || roleOption === user.role}
                          onClick={() => updateRole(user, roleOption, false)}
                          tone={
                            roleOption === user.role ? "ghost" : "secondary"
                          }
                          className={cn(
                            "h-8 rounded-lg px-2.5 text-[11px]",
                            roleOption === user.role
                              ? "cursor-default border-slate-200 bg-slate-100 text-slate-400"
                              : "",
                          )}
                        >
                          {roleOption === "tenant_admin"
                            ? "Make admin"
                            : "Make viewer"}
                        </AppButton>
                      ))}
                    </div>
                  </AppTableCell>
                </AppTableRow>
              ))}
            </AppTableBody>
          </AppTable>
        )}
      </OverflowGuard>

      {!loading && filteredUsers.length > 0 ? (
        <MobileCardList>
          {pagedUsers.map((user) => (
            <div
              key={`${user.id}-mobile`}
              className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_14px_28px_rgba(15,23,42,0.05)]"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p
                      className="truncate text-sm font-bold text-slate-950"
                      title={user.email || ""}
                    >
                      {user.email || "Anonymous"}
                    </p>
                    {user.full_name ? (
                      <p
                        className="mt-1 truncate text-xs text-slate-500"
                        title={user.full_name}
                      >
                        {user.full_name}
                      </p>
                    ) : null}
                    <p
                      className="mt-2 truncate text-[11px] font-medium text-slate-400"
                      title={user.workspace_name}
                    >
                      {user.workspace_name}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "max-w-[8rem] truncate rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em]",
                      getRoleTone(user.role),
                    )}
                  >
                    {getRoleLabel(user.role)}
                  </span>
                </div>
                <div className="grid gap-2 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 text-xs text-slate-500">
                  <p>Added: {new Date(user.created_at).toLocaleDateString()}</p>
                  <p>
                    Updated: {new Date(user.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {ROLE_OPTIONS.map((roleOption) => (
                    <AppButton
                      key={`${user.id}-${roleOption}`}
                      type="button"
                      disabled={saving || roleOption === user.role}
                      onClick={() => updateRole(user, roleOption, false)}
                      tone={roleOption === user.role ? "ghost" : "secondary"}
                      className={cn(
                        "h-9 px-3 text-xs",
                        roleOption === user.role
                          ? "cursor-default border-slate-200 bg-slate-100 text-slate-400"
                          : "",
                      )}
                    >
                      {roleOption === "tenant_admin"
                        ? "Make Admin"
                        : "Make Viewer"}
                    </AppButton>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </MobileCardList>
      ) : null}

      {filteredUsers.length > PAGE_SIZE ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            Showing {(currentPage - 1) * PAGE_SIZE + 1}-
            {Math.min(currentPage * PAGE_SIZE, filteredUsers.length)} of{" "}
            {filteredUsers.length}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <AppButton
              tone="secondary"
              className="h-9 px-3 text-xs"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              Previous
            </AppButton>
            <AppButton
              tone="secondary"
              className="h-9 px-3 text-xs"
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

      <div className="admin-shell-card border border-slate-200 bg-white p-5 sm:p-6 lg:p-7">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-950">
              Active Invitations
            </h2>
            <p className="text-sm text-slate-500 mt-2 font-medium">
              Manage pending access requests and generated invite links.
            </p>
          </div>
          <div className="flex h-10 items-center rounded-xl bg-slate-100 px-4 text-sm font-bold text-slate-700 border border-slate-200">
            {invitations.filter((item) => item.status === "pending").length}{" "}
            pending
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {invitations.length === 0 ? (
            <div className="col-span-full py-12 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-300 mx-auto mb-3">
                <MailPlus size={24} />
              </div>
              <p className="text-sm font-medium text-slate-600">
                No active invitations
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Send an invite to add new users to your workspace.
              </p>
            </div>
          ) : (
            invitations.slice(0, 12).map((invitation) => (
              <div
                key={invitation.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md group"
              >
                <div className="flex flex-col gap-4 h-full">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-sm font-bold text-slate-900 truncate"
                        title={invitation.email}
                      >
                        {invitation.email}
                      </p>
                      <p className="mt-2 text-xs font-medium text-slate-500 flex items-center gap-2">
                        <span
                          className={cn(
                            "rounded-full w-2 h-2 block",
                            invitation.status === "pending"
                              ? "bg-blue-500"
                              : invitation.status === "accepted"
                                ? "bg-emerald-500"
                                : "bg-slate-400",
                          )}
                        />
                        <span className="capitalize">
                          {getRoleLabel(invitation.role)}
                        </span>{" "}
                        • {invitation.status}
                      </p>
                    </div>
                    {invitation.status === "pending" && (
                      <AppButton
                        type="button"
                        disabled={saving}
                        onClick={() => revokeInvitation(invitation.id)}
                        tone="destructive"
                        className="h-8 shrink-0 px-3 text-[11px]"
                      >
                        Revoke
                      </AppButton>
                    )}
                  </div>
                  <AppButton
                    type="button"
                    onClick={() =>
                      navigator.clipboard.writeText(invitation.invite_url)
                    }
                    tone="secondary"
                    className="h-10 w-full text-xs"
                  >
                    <Copy size={14} />
                    Copy Link
                  </AppButton>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Expires{" "}
                    {new Date(invitation.expires_at).toLocaleDateString(
                      undefined,
                      { month: "short", day: "numeric" },
                    )}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

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
          className="rounded-[28px] border-slate-200 bg-white p-0 sm:max-w-lg"
        >
          <div className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-5 sm:p-8">
            <DialogHeader className="mb-8">
              <DialogTitle className="text-xl font-bold tracking-tight text-slate-950">
                Invite user
              </DialogTitle>
              <DialogDescription className="mt-1 text-xs font-medium text-slate-500">
                Create a secure entry link for this workspace.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={createInvitation} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">
                  Email Address
                </label>
                <Input
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  className="admin-input"
                  placeholder="name@company.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">
                  Workspace Role
                </label>
                <Select
                  value={inviteRole}
                  onValueChange={(value) => setInviteRole(value as AppRole)}
                >
                  <SelectTrigger className="admin-input h-12 rounded-xl border-slate-200 bg-white px-4 text-sm shadow-sm">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200">
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="tenant_admin">
                      Workspace Admin
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {createdInviteUrl && (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 space-y-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                      Invitation link ready
                    </p>
                    <p className="mt-2 rounded-lg border border-emerald-100 bg-white/50 p-3 font-mono text-xs text-emerald-800 [overflow-wrap:anywhere]">
                      {createdInviteUrl}
                    </p>
                  </div>
                  <AppButton
                    type="button"
                    onClick={() =>
                      navigator.clipboard.writeText(createdInviteUrl)
                    }
                    tone="subtle"
                    className="w-full"
                  >
                    <Copy size={14} />
                    Copy Invite Link
                  </AppButton>
                </div>
              )}

              {!createdInviteUrl && (
                <div className="flex flex-col gap-3 pt-4">
                  <AppButton type="submit" disabled={saving} className="w-full">
                    {saving ? "Creating invite..." : "Create Invite Link"}
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
