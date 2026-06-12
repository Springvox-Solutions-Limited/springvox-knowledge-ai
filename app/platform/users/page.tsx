"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { ResponsiveToolbar } from "@/src/components/layout/ResponsiveToolbar";
import { AppButton } from "@/src/components/ui/app-button";
import { AppCard } from "@/src/components/ui/app-card";
import { SearchBar } from "@/src/components/ui/search-bar";
import {
  AppTable,
  AppTableBody,
  AppTableCell,
  AppTableHead,
  AppTableHeader,
  AppTableRow,
} from "@/src/components/ui/app-table";
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

function UserStatusBadge({ status }: { status: string }) {
  const className =
    status === "active"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : status === "suspended" || status === "disabled"
        ? "border-red-500/30 bg-red-500/10 text-red-300"
        : "border-amber-500/30 bg-amber-500/10 text-amber-300";

  return (
    <span
      className={`inline-flex max-w-full truncate rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${className}`}
    >
      {status || "active"}
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
    setCurrentPage(1);
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
    <div className="admin-page">
      <PlatformPageHeader
        title="Users"
        subtitle="Manage platform users and workspace roles."
        privacyNote="Workspace role changes are available here. Platform Admin access is managed separately."
      />

      <ResponsiveToolbar className="xl:grid xl:grid-cols-4">
        <SearchBar
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by email or company"
          className="h-12 px-4"
        />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="h-12 w-full rounded-xl border-[var(--line)] bg-[var(--surface)] px-4 text-sm shadow-sm focus-visible:border-teal-400 focus-visible:ring-[var(--accent-jade-100)]">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-[var(--line)]">
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="platform_admin">Platform Admin</SelectItem>
            <SelectItem value="tenant_admin">Workspace Admin</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>
        <Select value={workspaceFilter} onValueChange={setWorkspaceFilter}>
          <SelectTrigger className="h-12 w-full rounded-xl border-[var(--line)] bg-[var(--surface)] px-4 text-sm shadow-sm focus-visible:border-teal-400 focus-visible:ring-[var(--accent-jade-100)]">
            <SelectValue placeholder="All workspaces" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-[var(--line)]">
            <SelectItem value="all">All workspaces</SelectItem>
            {workspaceOptions.map((workspace) => (
              <SelectItem key={workspace.id} value={workspace.id}>
                {workspace.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-12 w-full rounded-xl border-[var(--line)] bg-[var(--surface)] px-4 text-sm shadow-sm focus-visible:border-teal-400 focus-visible:ring-[var(--accent-jade-100)]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-[var(--line)]">
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active users</SelectItem>
            <SelectItem value="suspended">Suspended users</SelectItem>
            <SelectItem value="disabled">Disabled users</SelectItem>
          </SelectContent>
        </Select>
      </ResponsiveToolbar>
      {hasFilters ? (
        <div className="flex justify-stretch sm:justify-end">
          <AppButton
            tone="secondary"
            className="h-10 w-full px-4 text-xs sm:w-auto"
            onClick={() => {
              setSearch("");
              setRoleFilter("all");
              setWorkspaceFilter("all");
              setStatusFilter("all");
            }}
          >
            Clear filters
          </AppButton>
        </div>
      ) : null}

      {error && (
        <Alert className="rounded-2xl border-red-500/30 bg-red-500/10 text-red-300">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <OverflowGuard className="hidden md:block" mode="scroll">
        <AppCard className="overflow-hidden">
          <AppTable className="min-w-[860px]">
            <AppTableHeader>
              <AppTableRow>
                {[
                  "User",
                  "Role",
                  "Workspace",
                  "Status",
                  "Created",
                  "Last sign-in",
                  "Actions",
                ].map((column) => (
                  <AppTableHead key={column}>{column}</AppTableHead>
                ))}
              </AppTableRow>
            </AppTableHeader>
            <AppTableBody>
              {loading ? (
                <AppTableRow>
                  <AppTableCell
                    colSpan={7}
                    className="py-12 text-center text-sm text-[var(--ink-muted)]"
                  >
                    Loading users...
                  </AppTableCell>
                </AppTableRow>
              ) : users.length === 0 ? (
                <AppTableRow>
                  <AppTableCell
                    colSpan={7}
                    className="py-12 text-center text-sm text-[var(--ink-muted)]"
                  >
                    No users found.
                  </AppTableCell>
                </AppTableRow>
              ) : (
                pagedUsers.map((user) => (
                  <AppTableRow key={user.id}>
                    <AppTableCell className="max-w-[18rem]">
                      <p
                        className="truncate font-semibold text-[var(--ink)]"
                        title={user.email || ""}
                      >
                        {user.email || "No email"}
                      </p>
                      <p
                        className="mt-1 truncate text-xs text-[var(--ink-muted)]"
                        title={user.workspace_name}
                      >
                        {user.workspace_name}
                      </p>
                    </AppTableCell>
                    <AppTableCell className="text-sm font-semibold text-[var(--ink-soft)]">
                      {getRoleLabel(user.role as any)}
                    </AppTableCell>
                    <AppTableCell
                      className="max-w-[14rem] text-sm text-[var(--ink-soft)]"
                      title={user.workspace_name}
                    >
                      {user.workspace_name}
                    </AppTableCell>
                    <AppTableCell>
                      <UserStatusBadge status={user.status} />
                    </AppTableCell>
                  <AppTableCell className="text-sm text-[var(--ink-soft)]">
                    {formatDate(user.created_at)}
                  </AppTableCell>
                  <AppTableCell className="text-sm text-[var(--ink-soft)]">
                    {user.last_sign_in_at ? formatDate(user.last_sign_in_at) : "Not seen yet"}
                  </AppTableCell>
                  <AppTableCell>
                    {user.role === "platform_admin" ? (
                      <span className="text-xs font-semibold text-[var(--ink-muted)]">
                        Managed separately
                      </span>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <AppButton
                            tone="secondary"
                            disabled={savingId === user.id}
                            className="h-9 gap-1.5 px-3 text-xs"
                          >
                            {savingId === user.id ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : null}
                            Actions
                            <ChevronDown size={13} />
                          </AppButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 rounded-xl border-[var(--line)] shadow-lg">
                          <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-[var(--ink-muted)]">
                            Role
                          </DropdownMenuLabel>
                          <DropdownMenuItem
                            className="cursor-pointer text-sm"
                            onClick={() => updateRole(user, "tenant_admin")}
                          >
                            Make Workspace Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer text-sm"
                            onClick={() => updateRole(user, "viewer")}
                          >
                            Make Viewer
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-[var(--ink-muted)]">
                            Status
                          </DropdownMenuLabel>
                          {user.status === "active" ? (
                            <>
                              <DropdownMenuItem
                                className="cursor-pointer text-sm text-amber-300 focus:text-amber-300"
                                onClick={() => updateUserStatus(user, "suspended")}
                              >
                                Suspend
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer text-sm text-red-300 focus:text-red-300"
                                onClick={() => updateUserStatus(user, "disabled")}
                              >
                                Disable
                              </DropdownMenuItem>
                            </>
                          ) : (
                            <DropdownMenuItem
                              className="cursor-pointer text-sm"
                              onClick={() => updateUserStatus(user, "active")}
                            >
                              Activate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </AppTableCell>
                  </AppTableRow>
                ))
              )}
            </AppTableBody>
          </AppTable>
        </AppCard>
      </OverflowGuard>

      {!loading && users.length > 0 ? (
        <MobileCardList>
          {pagedUsers.map((user) => (
            <AppCard key={`${user.id}-mobile`} className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p
                      className="truncate font-semibold text-[var(--ink)]"
                      title={user.email || ""}
                    >
                      {user.email || "No email"}
                    </p>
                    <p
                      className="mt-1 truncate text-xs text-[var(--ink-muted)]"
                      title={user.workspace_name}
                    >
                      {user.workspace_name}
                    </p>
                  </div>
                  <UserStatusBadge status={user.status} />
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--ink-muted)]">
                  <span>{getRoleLabel(user.role as any)}</span>
                  <span>•</span>
                  <span>Created {formatDate(user.created_at)}</span>
                  <span>•</span>
                  <span>
                    Last sign-in {user.last_sign_in_at ? formatDate(user.last_sign_in_at) : "not seen yet"}
                  </span>
                </div>
                {user.role === "platform_admin" ? (
                  <p className="text-xs text-[var(--ink-muted)]">Managed separately</p>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <AppButton tone="secondary" disabled={savingId === user.id} className="h-10 w-full gap-1.5 px-3 text-xs">
                        {savingId === user.id ? <Loader2 size={13} className="animate-spin" /> : null}
                        Actions
                        <ChevronDown size={13} />
                      </AppButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 rounded-xl border-[var(--line)] shadow-lg">
                      <DropdownMenuItem className="cursor-pointer text-sm" onClick={() => updateRole(user, "tenant_admin")}>Make Workspace Admin</DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer text-sm" onClick={() => updateRole(user, "viewer")}>Make Viewer</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {user.status === "active" ? (
                        <>
                          <DropdownMenuItem className="cursor-pointer text-sm text-amber-300 focus:text-amber-300" onClick={() => updateUserStatus(user, "suspended")}>Suspend</DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer text-sm text-red-300 focus:text-red-300" onClick={() => updateUserStatus(user, "disabled")}>Disable</DropdownMenuItem>
                        </>
                      ) : (
                        <DropdownMenuItem className="cursor-pointer text-sm" onClick={() => updateUserStatus(user, "active")}>Activate</DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </AppCard>
          ))}
        </MobileCardList>
      ) : null}
      {users.length > PAGE_SIZE ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[var(--ink-muted)]">
            Showing {(currentPage - 1) * PAGE_SIZE + 1}-
            {Math.min(currentPage * PAGE_SIZE, users.length)} of {users.length}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <AppButton
              tone="secondary"
              disabled={currentPage === 1}
              className="h-10 px-3 text-xs"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              Previous
            </AppButton>
            <AppButton
              tone="secondary"
              disabled={currentPage === totalPages}
              className="h-10 px-3 text-xs"
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
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
