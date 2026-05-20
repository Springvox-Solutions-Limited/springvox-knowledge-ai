"use client";

import { useEffect, useMemo, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
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
import {
  AppTable,
  AppTableBody,
  AppTableCell,
  AppTableHead,
  AppTableHeader,
  AppTableRow,
} from "@/src/components/ui/app-table";
import { StatusBadge } from "@/src/components/platform/PlatformBadges";
import { PlatformPageHeader } from "@/src/components/platform/PlatformPageHeader";
import { getRoleLabel } from "@/src/lib/workspace";

type PlatformUser = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  workspace_id: string | null;
  workspace_name: string;
  workspace_status: string | null;
  created_at: string;
  updated_at: string;
};

type WorkspaceOption = {
  id: string;
  name: string;
};

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

  return (
    <div className="admin-page">
      <PlatformPageHeader
        title="Users"
        subtitle="Manage platform users and workspace roles."
        privacyNote="Workspace role changes are available here. Platform Admin access is managed separately."
      />

      <ResponsiveToolbar className="xl:grid xl:grid-cols-4">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by email or company"
          className="h-12 rounded-xl border-slate-200 bg-white text-sm shadow-sm focus-visible:border-cyan-400 focus-visible:ring-cyan-100"
        />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="h-12 w-full rounded-xl border-slate-200 bg-white px-4 text-sm shadow-sm focus-visible:border-cyan-400 focus-visible:ring-cyan-100">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-200">
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="platform_admin">Platform Admin</SelectItem>
            <SelectItem value="tenant_admin">Workspace Admin</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>
        <Select value={workspaceFilter} onValueChange={setWorkspaceFilter}>
          <SelectTrigger className="h-12 w-full rounded-xl border-slate-200 bg-white px-4 text-sm shadow-sm focus-visible:border-cyan-400 focus-visible:ring-cyan-100">
            <SelectValue placeholder="All workspaces" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-200">
            <SelectItem value="all">All workspaces</SelectItem>
            {workspaceOptions.map((workspace) => (
              <SelectItem key={workspace.id} value={workspace.id}>
                {workspace.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-12 w-full rounded-xl border-slate-200 bg-white px-4 text-sm shadow-sm focus-visible:border-cyan-400 focus-visible:ring-cyan-100">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-200">
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">active</SelectItem>
            <SelectItem value="trial">trial</SelectItem>
            <SelectItem value="suspended">suspended</SelectItem>
            <SelectItem value="inactive">inactive</SelectItem>
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
        <Alert className="rounded-2xl border-red-200 bg-red-50 text-red-700">
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
                    colSpan={6}
                    className="py-12 text-center text-sm text-slate-500"
                  >
                    Loading users...
                  </AppTableCell>
                </AppTableRow>
              ) : users.length === 0 ? (
                <AppTableRow>
                  <AppTableCell
                    colSpan={6}
                    className="py-12 text-center text-sm text-slate-500"
                  >
                    No users found.
                  </AppTableCell>
                </AppTableRow>
              ) : (
                pagedUsers.map((user) => (
                  <AppTableRow key={user.id}>
                    <AppTableCell className="max-w-[18rem]">
                      <p
                        className="truncate font-semibold text-slate-950"
                        title={user.email || ""}
                      >
                        {user.email || "No email"}
                      </p>
                      <p
                        className="mt-1 truncate text-xs text-slate-500"
                        title={user.workspace_name}
                      >
                        {user.workspace_name}
                      </p>
                    </AppTableCell>
                    <AppTableCell className="text-sm font-semibold text-slate-700">
                      {getRoleLabel(user.role as any)}
                    </AppTableCell>
                    <AppTableCell
                      className="max-w-[14rem] text-sm text-slate-600"
                      title={user.workspace_name}
                    >
                      {user.workspace_name}
                    </AppTableCell>
                    <AppTableCell>
                      <StatusBadge status={user.workspace_status} />
                    </AppTableCell>
                    <AppTableCell className="text-sm text-slate-600">
                      {formatDate(user.created_at)}
                    </AppTableCell>
                    <AppTableCell>
                      {user.role === "platform_admin" ? (
                        <span className="text-xs font-semibold text-slate-400">
                          Managed separately
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          <AppButton
                            onClick={() => updateRole(user, "tenant_admin")}
                            disabled={savingId === user.id}
                            tone="secondary"
                            className="h-9 rounded-lg px-3 text-xs"
                          >
                            Make Workspace Admin
                          </AppButton>
                          <AppButton
                            onClick={() => updateRole(user, "viewer")}
                            disabled={savingId === user.id}
                            tone="secondary"
                            className="h-9 rounded-lg px-3 text-xs"
                          >
                            Make Viewer
                          </AppButton>
                        </div>
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
                      className="truncate font-semibold text-slate-950"
                      title={user.email || ""}
                    >
                      {user.email || "No email"}
                    </p>
                    <p
                      className="mt-1 truncate text-xs text-slate-500"
                      title={user.workspace_name}
                    >
                      {user.workspace_name}
                    </p>
                  </div>
                  <StatusBadge status={user.workspace_status} />
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>{getRoleLabel(user.role as any)}</span>
                  <span>•</span>
                  <span>Created {formatDate(user.created_at)}</span>
                </div>
                {user.role === "platform_admin" ? (
                  <p className="text-xs text-slate-400">Managed separately</p>
                ) : (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <AppButton
                      onClick={() => updateRole(user, "tenant_admin")}
                      disabled={savingId === user.id}
                      tone="secondary"
                      className="h-10 px-3 text-xs"
                    >
                      Make Workspace Admin
                    </AppButton>
                    <AppButton
                      onClick={() => updateRole(user, "viewer")}
                      disabled={savingId === user.id}
                      tone="secondary"
                      className="h-10 px-3 text-xs"
                    >
                      Make Viewer
                    </AppButton>
                  </div>
                )}
              </div>
            </AppCard>
          ))}
        </MobileCardList>
      ) : null}
      {users.length > PAGE_SIZE ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
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
