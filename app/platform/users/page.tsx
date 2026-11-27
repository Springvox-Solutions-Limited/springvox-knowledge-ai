"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchPlatformJson } from "@/src/lib/platform-client";
import { MobileCardList } from "@/src/components/layout/MobileCardList";
import { OverflowGuard } from "@/src/components/layout/OverflowGuard";
import { AppButton } from "@/src/components/ui/app-button";
import { AppCard } from "@/src/components/ui/app-card";
import { SearchBar } from "@/src/components/ui/search-bar";
import { PlatformPageHeader } from "@/src/components/platform/PlatformPageHeader";
import { getRoleLabel } from "@/src/lib/workspace";

type PlatformUser = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  status: string;
  workspace_id: string | null;
  workspace_name: string;
  workspace_status: string | null;
  created_at: string;
  updated_at: string;
  last_sign_in_at: string | null;
};

type WorkspaceOption = {
  id: string;
  name: string;
};

const selectTriggerClass =
  "h-9 w-full rounded-md border-[var(--line)] bg-[var(--surface)] px-2.5 text-[12px] text-[var(--ink)] shadow-none focus:border-[var(--accent-jade)] focus:ring-2 focus:ring-[var(--accent-jade-100)]";

const menuLabelClass =
  "px-2 py-1 text-[10px] font-medium text-[var(--ink-muted)]";

function UserStatusBadge({ status }: { status: string }) {
  const value = status || "active";
  const label = value.replace(/_/g, " ");
  const className =
    value === "active"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : value === "suspended" || value === "disabled"
        ? "border-red-500/30 bg-red-500/10 text-red-300"
        : "border-amber-500/30 bg-amber-500/10 text-amber-300";

  return (
    <span
      className={`inline-flex max-w-full items-center truncate rounded-full border px-1.5 py-0.5 text-[11px] font-medium ${className}`}
    >
      {label.charAt(0).toUpperCase() + label.slice(1)}
    </span>
  );
}

export default function PlatformUsersPage() {
  const PAGE_SIZE = 8;
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [workspaceFilter, setWorkspaceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const loadUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (workspaceFilter !== "all") params.set("workspaceId", workspaceFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const result = await fetchPlatformJson<{ users: PlatformUser[] }>(
        `/api/platform/users?${params.toString()}`,
      );
      setUsers(result.users || []);
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
      setLoading(true);
      loadUsers();
    });
    return () => window.cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const summary = useMemo(
    () => ({
      total: users.length,
      active: users.filter((user) => user.status === "active").length,
      suspended: users.filter((user) => user.status === "suspended").length,
      disabled: users.filter((user) => user.status === "disabled").length,
    }),
    [users],
  );

  const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
  const pagedUsers = users.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const hasFilters =
    Boolean(search) ||
    roleFilter !== "all" ||
    workspaceFilter !== "all" ||
    statusFilter !== "all";

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setCurrentPage(1));
    return () => window.cancelAnimationFrame(frame);
  }, [search, roleFilter, workspaceFilter, statusFilter]);

  const updateRole = async (
    user: PlatformUser,
    role: "tenant_admin" | "viewer",
  ) => {
    try {
      setSavingId(user.id);
      await fetchPlatformJson(`/api/platform/users/${user.id}/role`, {
        method: "PATCH",
        body: JSON.stringify({
          role,
          workspaceId: user.workspace_id,
          resetWorkspaceTenantAdmins: role === "tenant_admin",
        }),
      });
      await loadUsers();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Failed to update role",
      );
    } finally {
      setSavingId(null);
    }
  };

  const updateUserStatus = async (
    user: PlatformUser,
    status: "active" | "suspended" | "disabled",
  ) => {
    try {
      setSavingId(user.id);
      await fetchPlatformJson(`/api/platform/users/${user.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status,
          workspaceId: user.workspace_id,
        }),
      });
      await loadUsers();
    } catch (statusError) {
      setError(
        statusError instanceof Error
          ? statusError.message
          : "Failed to update user status",
      );
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="admin-page" aria-busy={loading}>
      <PlatformPageHeader
        title="Users"
        subtitle="People across every workspace, with role and access status."
        privacyNote="Workspace role changes are available here. Platform admin access is managed separately."
        aside={
          <span className="text-[11px] tabular-nums text-[var(--ink-muted)]">
            {loading
              ? "Loading…"
              : `${users.length} ${users.length === 1 ? "user" : "users"}`}
          </span>
        }
      />

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <SearchBar
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by email or company"
            className="h-9 min-w-[220px] flex-1 rounded-md px-2.5 shadow-none focus-within:border-[var(--accent-jade)] focus-within:ring-2 focus-within:ring-[var(--accent-jade-100)]"
            inputClassName="text-[12px]"
          />
          <div className="w-[calc(50%-0.25rem)] sm:w-[150px]">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className={selectTriggerClass}>
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent className="rounded-md border-[var(--line)]">
                <SelectItem value="all" className="text-[12px]">
                  All roles
                </SelectItem>
                <SelectItem value="platform_admin" className="text-[12px]">
                  Platform admin
                </SelectItem>
                <SelectItem value="tenant_admin" className="text-[12px]">
                  Workspace admin
                </SelectItem>
                <SelectItem value="viewer" className="text-[12px]">
                  Viewer
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-[calc(50%-0.25rem)] sm:w-[170px]">
            <Select value={workspaceFilter} onValueChange={setWorkspaceFilter}>
              <SelectTrigger className={selectTriggerClass}>
                <SelectValue placeholder="All workspaces" />
              </SelectTrigger>
              <SelectContent className="rounded-md border-[var(--line)]">
                <SelectItem value="all" className="text-[12px]">
                  All workspaces
                </SelectItem>
                {workspaceOptions.map((workspace) => (
                  <SelectItem
                    key={workspace.id}
                    value={workspace.id}
                    className="text-[12px]"
                  >
                    {workspace.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-[calc(50%-0.25rem)] sm:w-[140px]">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className={selectTriggerClass}>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent className="rounded-md border-[var(--line)]">
                <SelectItem value="all" className="text-[12px]">
                  All statuses
                </SelectItem>
                <SelectItem value="active" className="text-[12px]">
                  Active
                </SelectItem>
                <SelectItem value="suspended" className="text-[12px]">
                  Suspended
                </SelectItem>
                <SelectItem value="disabled" className="text-[12px]">
                  Disabled
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          {hasFilters ? (
            <AppButton
              tone="ghost"
              className="h-9 shrink-0 px-2 text-[11px]"
              onClick={() => {
                setSearch("");
                setRoleFilter("all");
                setWorkspaceFilter("all");
                setStatusFilter("all");
              }}
            >
              Clear
            </AppButton>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="rounded-[10px] border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-300">
          {error}
        </div>
      ) : null}

      <section className="admin-shell-card overflow-hidden" aria-label="User summary">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-2 sm:px-5">
          <p className="text-[11px] font-medium text-[var(--ink-muted)]">
            User summary
          </p>
          <p className="text-[10px] text-[var(--ink-muted)]">
            {hasFilters ? "Current view" : "All users"}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-px bg-[var(--line)] sm:grid-cols-4">
          <SummaryCell label="Users" value={loading ? "—" : summary.total} />
          <SummaryCell label="Active" value={loading ? "—" : summary.active} />
          <SummaryCell
            label="Suspended"
            value={loading ? "—" : summary.suspended}
          />
          <SummaryCell
            label="Disabled"
            value={loading ? "—" : summary.disabled}
          />
        </div>
      </section>

      <div className="admin-shell-card overflow-hidden">
        <OverflowGuard className="hidden md:block" mode="scroll">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-[var(--line)] text-[11px] text-[var(--ink-muted)]">
                <th className="px-4 py-2.5 font-medium sm:px-5">User</th>
                <th className="px-3 py-2.5 font-medium">Role</th>
                <th className="px-3 py-2.5 font-medium">Workspace</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 font-medium">Last sign-in</th>
                <th className="px-4 py-2.5 text-right font-medium sm:px-5">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line-soft)]">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-[12px] text-[var(--ink-muted)]"
                  >
                    Loading users…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-[12px] text-[var(--ink-muted)]"
                  >
                    No users found.
                  </td>
                </tr>
              ) : (
                pagedUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="transition-colors hover:bg-[var(--canvas-soft)]"
                  >
                    <td className="max-w-[280px] px-4 py-1.5 sm:px-5">
                      <p
                        className="truncate text-[12px] font-medium leading-4 text-[var(--ink)]"
                        title={user.email || ""}
                      >
                        {user.email || "No email"}
                      </p>
                      <p
                        className="truncate text-[11px] leading-4 text-[var(--ink-muted)]"
                        title={user.full_name || ""}
                      >
                        {user.full_name || "No name"} · Joined{" "}
                        {formatDate(user.created_at)}
                      </p>
                    </td>
                    <td className="px-3 py-2.5 text-[12px] text-[var(--ink-soft)]">
                      {getRoleLabel(user.role)}
                    </td>
                    <td className="max-w-[180px] px-3 py-2.5">
                      <p
                        className="truncate text-[12px] text-[var(--ink-soft)]"
                        title={user.workspace_name}
                      >
                        {user.workspace_name}
                      </p>
                      {user.workspace_status ? (
                        <p className="mt-0.5 text-[10px] text-[var(--ink-muted)]">
                          {formatWorkspaceStatus(user.workspace_status)}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5">
                      <UserStatusBadge status={user.status} />
                    </td>
                    <td className="px-3 py-2.5 text-[11px] tabular-nums text-[var(--ink-muted)]">
                      {user.last_sign_in_at
                        ? formatDate(user.last_sign_in_at)
                        : "Not seen yet"}
                    </td>
                    <td className="px-4 py-2.5 text-right sm:px-5">
                      {user.role === "platform_admin" ? (
                        <p className="text-right text-[11px] text-[var(--ink-muted)]">
                          Managed separately
                        </p>
                      ) : (
                        <UserActions
                          user={user}
                          saving={savingId === user.id}
                          onRole={updateRole}
                          onStatus={updateUserStatus}
                        />
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </OverflowGuard>

        <div className="md:hidden">
          {loading ? (
            <p className="px-4 py-10 text-center text-[12px] text-[var(--ink-muted)]">
              Loading users…
            </p>
          ) : users.length === 0 ? (
            <p className="px-4 py-10 text-center text-[12px] text-[var(--ink-muted)]">
              No users found.
            </p>
          ) : (
            <MobileCardList className="gap-2.5 p-3">
              {pagedUsers.map((user) => (
                <AppCard
                  key={`${user.id}-mobile`}
                  className="rounded-[10px] p-3.5"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p
                          className="truncate text-[13px] font-medium text-[var(--ink)]"
                          title={user.email || ""}
                        >
                          {user.email || "No email"}
                        </p>
                        <p
                          className="mt-0.5 truncate text-[11px] text-[var(--ink-muted)]"
                          title={user.workspace_name}
                        >
                          {user.workspace_name}
                        </p>
                      </div>
                      <UserStatusBadge status={user.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--ink-muted)]">
                      <span>{getRoleLabel(user.role)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">
                        Joined {formatDate(user.created_at)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">
                        Sign-in{" "}
                        {user.last_sign_in_at
                          ? formatDate(user.last_sign_in_at)
                          : "not seen"}
                      </span>
                    </div>
                    {user.role === "platform_admin" ? (
                      <p className="text-[11px] text-[var(--ink-muted)]">
                        Managed separately
                      </p>
                    ) : (
                      <UserActions
                        user={user}
                        saving={savingId === user.id}
                        onRole={updateRole}
                        onStatus={updateUserStatus}
                        fullWidth
                      />
                    )}
                  </div>
                </AppCard>
              ))}
            </MobileCardList>
          )}
        </div>

        {users.length > PAGE_SIZE ? (
          <div className="flex items-center justify-between gap-3 border-t border-[var(--line)] px-4 py-2 sm:px-5">
            <p className="text-[11px] tabular-nums text-[var(--ink-muted)]">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, users.length)} of {users.length}
            </p>
            <div className="flex items-center gap-1.5">
              <AppButton
                tone="secondary"
                disabled={currentPage === 1}
                className="h-7 px-2 text-[11px]"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              >
                Previous
              </AppButton>
              <span className="px-1 text-[11px] tabular-nums text-[var(--ink-muted)]">
                {currentPage} / {totalPages}
              </span>
              <AppButton
                tone="secondary"
                disabled={currentPage === totalPages}
                className="h-7 px-2 text-[11px]"
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
    </div>
  );
}

function SummaryCell({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-[var(--surface)] px-4 py-2.5">
      <p className="text-[11px] text-[var(--ink-muted)]">{label}</p>
      <p className="mt-0.5 text-[18px] font-semibold tabular-nums tracking-tight text-[var(--ink)]">
        {value}
      </p>
    </div>
  );
}

function UserActions({
  user,
  saving,
  onRole,
  onStatus,
  fullWidth = false,
}: {
  user: PlatformUser;
  saving: boolean;
  onRole: (user: PlatformUser, role: "tenant_admin" | "viewer") => void;
  onStatus: (
    user: PlatformUser,
    status: "active" | "suspended" | "disabled",
  ) => void;
  fullWidth?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <AppButton
          tone="secondary"
          disabled={saving}
          className={`h-7 gap-1 px-2 text-[11px] ${
            fullWidth ? "w-full" : "ml-auto"
          }`}
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : null}
          Actions
          <ChevronDown size={12} />
        </AppButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48 rounded-md border-[var(--line)] bg-[var(--surface)] p-1 shadow-md"
      >
        <DropdownMenuLabel className={menuLabelClass}>Role</DropdownMenuLabel>
        <DropdownMenuItem
          className="cursor-pointer text-[12px]"
          onClick={() => onRole(user, "tenant_admin")}
        >
          Make workspace admin
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer text-[12px]"
          onClick={() => onRole(user, "viewer")}
        >
          Make viewer
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className={menuLabelClass}>Status</DropdownMenuLabel>
        {user.status === "active" ? (
          <>
            <DropdownMenuItem
              className="cursor-pointer text-[12px] text-amber-300 focus:text-amber-300"
              onClick={() => onStatus(user, "suspended")}
            >
              Suspend
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer text-[12px] text-red-300 focus:text-red-300"
              onClick={() => onStatus(user, "disabled")}
            >
              Disable
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem
            className="cursor-pointer text-[12px]"
            onClick={() => onStatus(user, "active")}
          >
            Activate
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatWorkspaceStatus(value: string) {
  if (value === "past_due") return "Past due";
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, " ");
}
