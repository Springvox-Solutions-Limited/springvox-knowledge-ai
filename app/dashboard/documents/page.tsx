"use client";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { getAccessToken, getCurrentUserProfile } from "@/src/lib/auth-client";
import { supabase } from "@/src/lib/supabase";
import {
  Check,
  File,
  FileSpreadsheet,
  FileText,
  LayoutGrid,
  Presentation,
  Rows3,
  Trash2,
  Database,
  Eye,
  Loader2,
  Upload,
  MoreVertical,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FolderInput,
  Download,
  RefreshCw,
} from "lucide-react";
import { FilePreviewDrawer } from "@/src/components/file-preview/FilePreviewDrawer";
import { cn } from "@/src/lib/utils";
import { type UserProfile } from "@/src/lib/workspace";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminSearchInput } from "@/src/components/dashboard/AdminSearchInput";
import { MobileCardList } from "@/src/components/layout/MobileCardList";
import { AppPageHeader } from "@/src/components/shared/AppPageHeader";
import { AppButton } from "@/src/components/ui/app-button";
import { ConfirmDialog } from "@/src/components/ui/confirm-dialog";
import { EmptyState } from "@/src/components/ui/empty-state";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type DocumentRecord = {
  id: string;
  filename: string;
  file_type?: string | null;
  parser?: string | null;
  status: "ready" | "processing" | "failed";
  total_chunks: number | null;
  created_at: string;
  error_message?: string | null;
  document_summary?: string | null;
  document_keywords?: string[] | null;
  document_category?: string | null;
  collection_id?: string | null;
};

type Collection = {
  id: string;
  name: string;
  slug: string;
  is_default: boolean;
};

type SortColumn = "status" | "category" | "collection" | "updated";
type SortDirection = "asc" | "desc";

function getDisplayFileType(document: DocumentRecord) {
  if (document.file_type) {
    if (document.file_type.includes("/")) {
      const subtype = document.file_type.split("/").pop() || document.file_type;
      return subtype.split(".").pop()?.toUpperCase() || subtype.toUpperCase();
    }

    return document.file_type.replace(".", "").toUpperCase();
  }

  const extension = document.filename.split(".").pop();
  return extension ? extension.toUpperCase() : "File";
}

function getFileTypeMeta(document: DocumentRecord) {
  const extension = (document.filename.split(".").pop() || "").toLowerCase();
  const extensionMap: Record<string, { icon: typeof FileText; tint: string }> =
    {
      pdf: { icon: FileText, tint: "bg-red-500/10 text-red-300" },
      doc: { icon: FileText, tint: "bg-blue-500/10 text-blue-300" },
      docx: { icon: FileText, tint: "bg-blue-500/10 text-blue-300" },
      xls: {
        icon: FileSpreadsheet,
        tint: "bg-emerald-500/10 text-emerald-300",
      },
      xlsx: {
        icon: FileSpreadsheet,
        tint: "bg-emerald-500/10 text-emerald-300",
      },
      csv: {
        icon: FileSpreadsheet,
        tint: "bg-emerald-500/10 text-emerald-300",
      },
      ppt: { icon: Presentation, tint: "bg-orange-500/10 text-orange-300" },
      pptx: { icon: Presentation, tint: "bg-orange-500/10 text-orange-300" },
      txt: {
        icon: FileText,
        tint: "bg-[var(--surface-2)] text-[var(--ink-soft)]",
      },
      md: {
        icon: FileText,
        tint: "bg-[var(--surface-2)] text-[var(--ink-soft)]",
      },
    };
  return (
    extensionMap[extension] || {
      icon: File,
      tint: "bg-[var(--surface-2)] text-[var(--ink-soft)]",
    }
  );
}

function getParserStatus(document: DocumentRecord) {
  if (document.status === "processing") {
    return "Processing";
  }

  if (document.status === "failed") {
    return document.error_message || "Parsing failed";
  }

  return document.parser || "Ready";
}

function getStatusLabel(status: DocumentRecord["status"]) {
  return status === "ready"
    ? "Completed"
    : status.charAt(0).toUpperCase() + status.slice(1);
}

function getBadgeClass(kind: "status" | "category", value: string) {
  if (kind === "status") {
    return value === "ready"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
      : value === "processing"
        ? "border-amber-500/25 bg-amber-500/10 text-amber-300"
        : "border-red-500/25 bg-red-500/10 text-red-300";
  }

  return "border-[var(--line)] bg-[var(--surface-2)] text-[var(--ink-soft)]";
}

function getStatusDotClass(value: string) {
  return value === "ready"
    ? "bg-emerald-400"
    : value === "processing"
      ? "bg-amber-400"
      : "bg-red-400";
}

function formatDocumentDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function DocumentBadge({
  kind,
  value,
  title,
  className,
}: {
  kind: "status" | "category";
  value: string;
  title?: string;
  className?: string;
}) {
  const label =
    kind === "status" && value === "ready"
      ? "Completed"
      : value.charAt(0).toUpperCase() + value.slice(1);
  return (
    <span
      title={title}
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1.5 overflow-hidden rounded-md border px-1.5 py-0.5 text-[11px] font-medium",
        getBadgeClass(kind, value),
        className,
      )}
    >
      {kind === "status" ? (
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", getStatusDotClass(value))} />
      ) : null}
      <span className="min-w-0 truncate">{label}</span>
    </span>
  );
}

function SelectionCheckbox({
  checked,
  label,
  onToggle,
}: {
  checked: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onToggle}
      className={cn(
        "flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors",
        checked
          ? "border-[var(--accent-jade)] bg-[var(--accent-jade)] text-[#04110e]"
          : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--accent-jade-200)]",
      )}
    >
      {checked && <Check size={10} strokeWidth={3} />}
    </button>
  );
}

function SortableHeader({
  column,
  children,
  sortColumn,
  sortDirection,
  onToggle,
}: {
  column: SortColumn;
  children: ReactNode;
  sortColumn: SortColumn | null;
  sortDirection: SortDirection;
  onToggle: (column: SortColumn) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(column)}
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-medium transition-colors hover:text-[var(--ink)]",
        sortColumn === column ? "text-[var(--ink)]" : "text-[var(--ink-muted)]",
      )}
    >
      {children}
      {sortColumn === column ? (
        sortDirection === "asc" ? (
          <ArrowUp size={11} />
        ) : (
          <ArrowDown size={11} />
        )
      ) : (
        <ArrowUpDown size={11} className="opacity-50" />
      )}
    </button>
  );
}

export default function DocumentsPage() {
  const PAGE_SIZE = 8;
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionFilter, setCollectionFilter] = useState<string>("all");
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{
    id: string;
    filename: string;
    mimeType?: string | null;
  } | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [statusFilter, setStatusFilter] = useState<
    "all" | DocumentRecord["status"]
  >("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkWorking, setBulkWorking] = useState(false);
  const [bulkCollectionId, setBulkCollectionId] = useState("none");
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const collectionNameById = new Map(collections.map((c) => [c.id, c.name]));

  const fetchCollections = async () => {
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) return;
      const res = await fetch("/api/collections", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setCollections(data.collections || []);
    } catch {
      // Collections are optional context for this page.
    }
  };

  const assignCollection = async (documentId: string, collectionId: string) => {
    setAssigningId(documentId);
    setActionError(null);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error("Authentication session expired");
      const res = await fetch("/api/documents/collection", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          documentId,
          collectionId: collectionId === "none" ? null : collectionId,
        }),
      });
      if (!res.ok) throw new Error("Failed to update collection");
      setDocuments((current) =>
        current.map((doc) =>
          doc.id === documentId
            ? {
                ...doc,
                collection_id: collectionId === "none" ? null : collectionId,
              }
            : doc,
        ),
      );
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to update collection",
      );
    } finally {
      setAssigningId(null);
    }
  };

  const fetchDocs = async (silent = false) => {
    if (!silent) setLoading(true);
    const currentProfile = await getCurrentUserProfile();
    if (!silent) setProfile(currentProfile);

    if (!currentProfile?.workspace_id) {
      if (!silent) setLoading(false);
      return;
    }

    // On a full load, fail any documents stuck in "processing" (e.g. the worker
    // never ran) so they don't hang forever and can be re-uploaded. Best-effort.
    if (!silent) {
      try {
        const token = await getAccessToken();
        if (token) {
          await fetch("/api/documents/reconcile", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      } catch {
        // Non-blocking: listing still proceeds if reconcile fails.
      }
    }

    const { data } = await supabase
      .from("documents")
      .select("*")
      .eq("workspace_id", currentProfile.workspace_id)
      .order("created_at", { ascending: false });

    if (data) setDocuments(data as DocumentRecord[]);
    if (!silent) setLoading(false);
  };

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void fetchDocs();
      void fetchCollections();
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  // Poll while any document is processing
  useEffect(() => {
    const isProcessing = documents.some((doc) => doc.status === "processing");
    if (!isProcessing) return;

    const intervalId = setInterval(() => {
      fetchDocs(true);
    }, 3000);

    return () => clearInterval(intervalId);
  }, [documents]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setActionError(null);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error("Authentication session expired");

      const res = await fetch(
        `/api/documents/delete?id=${encodeURIComponent(id)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      if (!res.ok) throw new Error("Delete failed");
      fetchDocs();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Error deleting document");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredDocuments = documents.filter((document) => {
    const matchesSearch = document.filename
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCollection =
      collectionFilter === "all" ||
      (collectionFilter === "none"
        ? !document.collection_id
        : document.collection_id === collectionFilter);
    const matchesStatus =
      statusFilter === "all" || document.status === statusFilter;
    return matchesSearch && matchesCollection && matchesStatus;
  });
  const sortedDocuments = [...filteredDocuments].sort((left, right) => {
    if (!sortColumn) return 0;

    const leftValue =
      sortColumn === "status"
        ? getStatusLabel(left.status)
        : sortColumn === "category"
          ? left.document_category || "Other"
          : sortColumn === "collection"
            ? collectionNameById.get(left.collection_id || "") || "Unassigned"
            : left.created_at;
    const rightValue =
      sortColumn === "status"
        ? getStatusLabel(right.status)
        : sortColumn === "category"
          ? right.document_category || "Other"
          : sortColumn === "collection"
            ? collectionNameById.get(right.collection_id || "") || "Unassigned"
            : right.created_at;
    const comparison = leftValue.localeCompare(rightValue, undefined, {
      numeric: true,
    });
    return sortDirection === "asc" ? comparison : -comparison;
  });
  const totalPages = Math.max(1, Math.ceil(sortedDocuments.length / PAGE_SIZE));
  const pagedDocuments = sortedDocuments.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const hasFilters =
    Boolean(searchQuery) ||
    collectionFilter !== "all" ||
    statusFilter !== "all";

  const statusCounts = {
    all: documents.length,
    ready: documents.filter((document) => document.status === "ready").length,
    processing: documents.filter((document) => document.status === "processing")
      .length,
    failed: documents.filter((document) => document.status === "failed").length,
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAllVisible = () => {
    setSelectedIds((current) => {
      const allVisibleSelected = pagedDocuments.every((doc) =>
        current.has(doc.id),
      );
      const next = new Set(current);
      if (allVisibleSelected) {
        pagedDocuments.forEach((doc) => next.delete(doc.id));
      } else {
        pagedDocuments.forEach((doc) => next.add(doc.id));
      }
      return next;
    });
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    setActionError(null);
    try {
      for (const id of selectedIds) {
        const accessToken = await getAccessToken();
        if (!accessToken) throw new Error("Authentication session expired");
        const res = await fetch(
          `/api/documents/delete?id=${encodeURIComponent(id)}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );
        if (!res.ok) throw new Error("Delete failed");
      }
      setSelectedIds(new Set());
      fetchDocs();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Error deleting documents");
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleReprocess = async (documentId: string) => {
    setBulkWorking(true);
    setActionError(null);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error("Authentication session expired");
      const response = await fetch("/api/documents/reprocess", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ documentId }),
      });
      if (!response.ok) throw new Error("Reprocess failed");
      await fetchDocs(true);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Error reprocessing document",
      );
    } finally {
      setBulkWorking(false);
    }
  };

  const handleBulkMove = async (collectionId: string) => {
    setBulkWorking(true);
    setActionError(null);
    try {
      for (const documentId of selectedIds) {
        await assignCollection(documentId, collectionId);
      }
      setSelectedIds(new Set());
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Error moving documents",
      );
    } finally {
      setBulkWorking(false);
      setBulkCollectionId("none");
    }
  };

  const handleBulkReprocess = async () => {
    setBulkWorking(true);
    setActionError(null);
    try {
      for (const documentId of selectedIds) {
        const accessToken = await getAccessToken();
        if (!accessToken) throw new Error("Authentication session expired");
        const response = await fetch("/api/documents/reprocess", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ documentId }),
        });
        if (!response.ok) throw new Error("Reprocess failed");
      }
      setSelectedIds(new Set());
      await fetchDocs(true);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Error reprocessing documents",
      );
    } finally {
      setBulkWorking(false);
    }
  };

  const exportSelected = () => {
    const selectedDocuments = documents.filter((document) =>
      selectedIds.has(document.id),
    );
    const rows = [
      [
        "Document",
        "Status",
        "Type",
        "Category",
        "Collection",
        "Sections",
        "Updated",
      ],
      ...selectedDocuments.map((document) => [
        document.filename,
        getStatusLabel(document.status),
        getDisplayFileType(document),
        document.document_category || "Other",
        collectionNameById.get(document.collection_id || "") || "Unassigned",
        String(document.total_chunks || 0),
        formatDocumentDate(document.created_at),
      ]),
    ];
    const csv = rows
      .map((row) =>
        row.map((value) => `"${value.replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    link.download = "company-documents.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setCurrentPage(1));
    return () => window.cancelAnimationFrame(frame);
  }, [searchQuery, collectionFilter, statusFilter]);

  const toggleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
      return;
    }
    setSortColumn(column);
    setSortDirection("asc");
  };

  if (profile?.role === "viewer") {
    return null;
  }

  return (
    <div className="admin-page">
      <AppPageHeader
        title="Company library"
        subtitle="Manage uploaded documents and processing status."
        aside={
          <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--line)] px-2.5 py-1.5 text-[11px] text-[var(--ink-muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-jade)]" />
            <span className="tabular-nums">{documents.length}</span>
            {documents.length === 1 ? "document" : "documents"}
          </span>
        }
      />

      <section className="admin-shell-card min-w-0">
        {/* Sticky library toolbar */}
        <div className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--surface)]">
          <div className="flex flex-col gap-2 px-3 py-2 lg:h-14 lg:flex-row lg:items-center lg:gap-2 lg:py-0">
            <AdminSearchInput
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search documents by filename..."
              className="h-9 min-w-0 flex-1 rounded-md border-[var(--line)] bg-[var(--canvas-soft)] shadow-none focus-within:ring-2 lg:max-w-sm"
              inputClassName="text-[12px]"
            />
            <div className="flex min-w-0 items-center gap-2">
              <Select value={collectionFilter} onValueChange={setCollectionFilter}>
                <SelectTrigger className="h-9 min-w-0 flex-1 rounded-md border-[var(--line)] bg-[var(--surface)] px-2.5 text-[12px] focus-visible:border-[var(--accent-jade)] focus-visible:ring-2 focus-visible:ring-[var(--accent-jade-100)] sm:w-[168px] sm:flex-none">
                  <SelectValue placeholder="All collections" />
                </SelectTrigger>
                <SelectContent className="rounded-lg border-[var(--line)]">
                  <SelectItem value="all">All collections</SelectItem>
                  <SelectItem value="none">Uncategorized</SelectItem>
                  {collections.map((collection) => (
                    <SelectItem key={collection.id} value={collection.id}>
                      {collection.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasFilters ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setCollectionFilter("all");
                    setStatusFilter("all");
                  }}
                  className="inline-flex h-9 shrink-0 items-center rounded-md px-2 text-[11px] font-medium text-[var(--ink-muted)] transition-colors hover:bg-[var(--canvas-soft)] hover:text-[var(--ink)]"
                >
                  Clear
                </button>
              ) : null}
              <div className="ml-auto inline-flex h-9 shrink-0 items-center rounded-md border border-[var(--line)] bg-[var(--surface)] p-0.5">
                <button
                  type="button"
                  aria-label="Table view"
                  aria-pressed={viewMode === "table"}
                  onClick={() => setViewMode("table")}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-[5px] transition-colors",
                    viewMode === "table"
                      ? "bg-[var(--surface-2)] text-[var(--ink)]"
                      : "text-[var(--ink-muted)] hover:bg-[var(--canvas-soft)] hover:text-[var(--ink-soft)]",
                  )}
                >
                  <Rows3 size={14} />
                </button>
                <button
                  type="button"
                  aria-label="Grid view"
                  aria-pressed={viewMode === "grid"}
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-[5px] transition-colors",
                    viewMode === "grid"
                      ? "bg-[var(--surface-2)] text-[var(--ink)]"
                      : "text-[var(--ink-muted)] hover:bg-[var(--canvas-soft)] hover:text-[var(--ink-soft)]",
                  )}
                >
                  <LayoutGrid size={14} />
                </button>
              </div>
              <AppButton asChild className="h-9 shrink-0 px-2.5 text-[12px]">
                <Link href="/dashboard/upload">
                  <Upload size={14} />
                  Upload
                </Link>
              </AppButton>
            </div>
          </div>

          {documents.length > 0 ? (
            <div className="flex h-10 items-center gap-1 overflow-x-auto border-t border-[var(--line-soft)] px-2">
              {(["all", "ready", "processing", "failed"] as const).map(
                (status) => {
                  const count = statusCounts[status];
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setStatusFilter(status)}
                      aria-pressed={statusFilter === status}
                      className={cn(
                        "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2 text-[11px] font-medium transition-colors",
                        statusFilter === status
                          ? "bg-[var(--surface-2)] text-[var(--ink)]"
                          : "text-[var(--ink-muted)] hover:bg-[var(--canvas-soft)] hover:text-[var(--ink-soft)]",
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          status === "ready" && "bg-emerald-400",
                          status === "processing" && "bg-amber-400",
                          status === "failed" && "bg-red-400",
                          status === "all" && "bg-[var(--accent-jade)]",
                        )}
                      />
                      {status === "all"
                        ? "All"
                        : status.charAt(0).toUpperCase() + status.slice(1)}
                      <span className="tabular-nums text-[var(--ink-muted)]">
                        {count}
                      </span>
                    </button>
                  );
                },
              )}
              <span className="flex-1" />
              <p className="shrink-0 pr-1 text-[11px] tabular-nums text-[var(--ink-muted)]">
                {filteredDocuments.length} shown
              </p>
            </div>
          ) : null}
        </div>

        {selectedIds.size > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--accent-jade-100)] bg-[var(--accent-jade-50)] px-3 py-2">
            <p className="text-[12px] font-medium text-[var(--ink)]">
              <span className="tabular-nums">{selectedIds.size}</span>{" "}
              {selectedIds.size === 1 ? "document" : "documents"} selected
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              <Select
                value={bulkCollectionId}
                onValueChange={(value) => void handleBulkMove(value)}
                disabled={bulkWorking || bulkDeleting}
              >
                <SelectTrigger className="h-8 w-[156px] rounded-md border-[var(--line)] bg-[var(--surface)] text-[11px] focus-visible:border-[var(--accent-jade)] focus-visible:ring-2 focus-visible:ring-[var(--accent-jade-100)]">
                  <FolderInput size={12} />
                  <SelectValue placeholder="Move to collection" />
                </SelectTrigger>
                <SelectContent className="rounded-lg border-[var(--line)]">
                  <SelectItem value="none">Unassigned</SelectItem>
                  {collections.map((collection) => (
                    <SelectItem key={collection.id} value={collection.id}>
                      {collection.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <AppButton
                tone="secondary"
                onClick={exportSelected}
                disabled={bulkWorking || bulkDeleting}
                className="h-8 px-2.5 text-[11px]"
              >
                <Download size={12} /> Export
              </AppButton>
              <AppButton
                tone="secondary"
                onClick={() => void handleBulkReprocess()}
                disabled={bulkWorking || bulkDeleting}
                className="h-8 px-2.5 text-[11px]"
              >
                {bulkWorking ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <RefreshCw size={12} />
                )}
                Reprocess
              </AppButton>
              <AppButton
                tone="ghost"
                onClick={() => setSelectedIds(new Set())}
                disabled={bulkWorking || bulkDeleting}
                className="h-8 px-2 text-[11px]"
              >
                Cancel
              </AppButton>
              <AppButton
                tone="destructive"
                onClick={() => void handleBulkDelete()}
                disabled={bulkWorking || bulkDeleting}
                className="h-8 px-2.5 text-[11px]"
              >
                {bulkDeleting ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Trash2 size={12} />
                )}
                Delete
              </AppButton>
            </div>
          </div>
        )}

        {actionError && (
          <Alert className="mx-3 my-3 rounded-[10px] border-red-500/30 bg-red-500/10 py-2 text-red-300">
            <AlertDescription className="text-[12px]">
              {actionError}
            </AlertDescription>
          </Alert>
        )}

        {viewMode === "table" && (
          <>
            <table className="hidden w-full table-fixed border-collapse text-left lg:table">
              <thead
                className={cn(
                  "sticky z-20 [&_th]:bg-[var(--surface)]",
                  documents.length > 0 ? "top-[94px]" : "top-[54px]",
                )}
              >
                <tr className="border-b border-[var(--line)]">
                  <th className="w-9 px-3 py-2 font-normal">
                    <SelectionCheckbox
                      checked={
                        pagedDocuments.length > 0 &&
                        pagedDocuments.every((doc) => selectedIds.has(doc.id))
                      }
                      label="Select all documents on this page"
                      onToggle={toggleAllVisible}
                    />
                  </th>
                  <th className="min-w-0 px-2 py-2 text-[11px] font-medium text-[var(--ink-muted)]">
                    Document
                  </th>
                  <th className="w-[128px] px-2 py-2">
                    <SortableHeader
                      column="status"
                      sortColumn={sortColumn}
                      sortDirection={sortDirection}
                      onToggle={toggleSort}
                    >
                      Status
                    </SortableHeader>
                  </th>
                  <th className="hidden w-[56px] px-2 py-2 text-[11px] font-medium text-[var(--ink-muted)] xl:table-cell">
                    Type
                  </th>
                  <th className="w-[104px] px-2 py-2">
                    <SortableHeader
                      column="category"
                      sortColumn={sortColumn}
                      sortDirection={sortDirection}
                      onToggle={toggleSort}
                    >
                      Category
                    </SortableHeader>
                  </th>
                  <th className="w-[144px] px-2 py-2">
                    <SortableHeader
                      column="collection"
                      sortColumn={sortColumn}
                      sortDirection={sortDirection}
                      onToggle={toggleSort}
                    >
                      Collection
                    </SortableHeader>
                  </th>
                  <th className="hidden w-[64px] px-2 py-2 text-[11px] font-medium text-[var(--ink-muted)] xl:table-cell">
                    Sections
                  </th>
                  <th className="hidden w-[88px] px-2 py-2 xl:table-cell">
                    <SortableHeader
                      column="updated"
                      sortColumn={sortColumn}
                      sortDirection={sortDirection}
                      onToggle={toggleSort}
                    >
                      Updated
                    </SortableHeader>
                  </th>
                  <th className="w-[72px] px-2 py-2 text-right text-[11px] font-medium text-[var(--ink-muted)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line-soft)]">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center">
                      <div className="flex items-center justify-center gap-2 text-[12px] text-[var(--ink-soft)]">
                        <Loader2
                          size={15}
                          className="animate-spin text-[var(--ink-muted)]"
                        />
                        Loading documents...
                      </div>
                    </td>
                  </tr>
                ) : filteredDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center">
                      <EmptyState
                        icon={FileText}
                        title={
                          documents.length === 0
                            ? "No documents yet"
                            : "No matching documents"
                        }
                        description={
                          documents.length === 0
                            ? "Start by uploading your first approved document."
                            : "Try a different search term or clear filters."
                        }
                        className="border-0 bg-transparent py-0"
                      />
                    </td>
                  </tr>
                ) : (
                  pagedDocuments.map((doc) => {
                    const meta = getFileTypeMeta(doc);
                    const Icon = meta.icon;
                    return (
                      <tr
                        key={doc.id}
                        className={cn(
                          "h-10 transition-colors",
                          selectedIds.has(doc.id)
                            ? "bg-[var(--accent-jade-50)]"
                            : "hover:bg-[var(--canvas-soft)]",
                        )}
                      >
                        <td className="px-3 py-1">
                          <SelectionCheckbox
                            checked={selectedIds.has(doc.id)}
                            label={`Select ${doc.filename}`}
                            onToggle={() => toggleSelected(doc.id)}
                          />
                        </td>
                        <td className="min-w-0 px-2 py-1">
                          <div className="flex min-w-0 items-center gap-2">
                            <div
                              className={cn(
                                "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                                meta.tint,
                              )}
                            >
                              <Icon size={14} />
                            </div>
                            <div className="min-w-0">
                              <p
                                title={doc.filename}
                                className="truncate text-[12px] font-medium text-[var(--ink)]"
                              >
                                {doc.filename}
                              </p>
                              <p className="truncate text-[11px] tabular-nums text-[var(--ink-muted)] xl:hidden">
                                {getDisplayFileType(doc)} ·{" "}
                                {doc.total_chunks || 0} sections
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="min-w-0 px-2 py-1">
                          <div className="flex min-w-0 items-center gap-1.5">
                            <DocumentBadge
                              kind="status"
                              value={doc.status}
                              title={getParserStatus(doc)}
                            />
                            {doc.status === "processing" ? (
                              <Loader2
                                size={11}
                                className="shrink-0 animate-spin text-[var(--accent-jade)]"
                              />
                            ) : null}
                            {doc.status === "failed" &&
                            doc.error_message ? (
                              <span
                                title={doc.error_message}
                                className="truncate text-[11px] text-red-300/80"
                              >
                                {doc.error_message}
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="hidden px-2 py-1 xl:table-cell">
                          <span className="inline-flex rounded border border-[var(--line)] bg-[var(--surface-2)] px-1.5 py-0.5 text-[11px] text-[var(--ink-soft)]">
                            {getDisplayFileType(doc)}
                          </span>
                        </td>
                        <td className="min-w-0 px-2 py-1">
                          <DocumentBadge
                            kind="category"
                            value={doc.document_category || "Other"}
                            className="max-w-full"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <Select
                            value={doc.collection_id || "none"}
                            onValueChange={(value) =>
                              assignCollection(doc.id, value)
                            }
                            disabled={assigningId === doc.id}
                          >
                            <SelectTrigger className="h-8 w-full rounded-md border-[var(--line)] bg-[var(--surface)] px-2 text-[11px] text-[var(--ink-soft)] focus-visible:border-[var(--accent-jade)] focus-visible:ring-2 focus-visible:ring-[var(--accent-jade-100)]">
                              <SelectValue placeholder="Unassigned">
                                {doc.collection_id
                                  ? collectionNameById.get(doc.collection_id)
                                  : "Unassigned"}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="rounded-lg border-[var(--line)]">
                              <SelectItem value="none">Unassigned</SelectItem>
                              {collections.map((collection) => (
                                <SelectItem
                                  key={collection.id}
                                  value={collection.id}
                                >
                                  {collection.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="hidden px-2 py-1 text-[11px] tabular-nums text-[var(--ink-soft)] xl:table-cell">
                          {doc.total_chunks || 0}
                        </td>
                        <td className="hidden whitespace-nowrap px-2 py-1 text-[11px] tabular-nums text-[var(--ink-muted)] xl:table-cell">
                          {formatDocumentDate(doc.created_at)}
                        </td>
                        <td className="px-2 py-1">
                          <div className="flex items-center justify-end gap-0.5">
                            <button
                              aria-label={`Preview ${doc.filename}`}
                              title="Preview"
                              onClick={() =>
                                setPreviewDoc({
                                  id: doc.id,
                                  filename: doc.filename,
                                  mimeType: doc.file_type,
                                })
                              }
                              disabled={doc.status !== "ready"}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--ink-muted)] transition-colors hover:bg-[var(--canvas-soft)] hover:text-[var(--accent-jade)] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Eye size={14} />
                            </button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  aria-label={`Menu for ${doc.filename}`}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--ink-muted)] transition-colors hover:bg-[var(--canvas-soft)] hover:text-[var(--ink)]"
                                >
                                  <MoreVertical size={14} />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem
                                  onClick={() => void handleReprocess(doc.id)}
                                  disabled={doc.status === "processing"}
                                >
                                  <RefreshCw size={13} /> Reprocess
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() => setConfirmDeleteId(doc.id)}
                                >
                                  <Trash2 size={13} /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            <MobileCardList hideAbove="lg" className="gap-2.5 p-3">
              {loading ? (
                [1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className="h-24 animate-pulse rounded-[10px] bg-[var(--surface-2)]"
                  />
                ))
              ) : filteredDocuments.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title={
                    documents.length === 0
                      ? "No documents yet"
                      : "No matches found"
                  }
                  description={
                    documents.length === 0
                      ? "Upload your first document to get started."
                      : "Try adjusting your search filters."
                  }
                />
              ) : (
                pagedDocuments.map((doc) => {
                  const meta = getFileTypeMeta(doc);
                  const Icon = meta.icon;
                  return (
                    <div
                      key={doc.id}
                      className="rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-3"
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                            meta.tint,
                          )}
                        >
                          <Icon size={15} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-2">
                            <p
                              title={doc.filename}
                              className="min-w-0 flex-1 truncate text-[12px] font-medium text-[var(--ink)]"
                            >
                              {doc.filename}
                            </p>
                            <button
                              aria-label={`Delete ${doc.filename}`}
                              onClick={() => setConfirmDeleteId(doc.id)}
                              disabled={deletingId === doc.id}
                              className="-mr-1 -mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[var(--ink-muted)] transition-colors hover:bg-red-500/10 hover:text-red-300 disabled:opacity-40"
                            >
                              {deletingId === doc.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Trash2 size={14} />
                              )}
                            </button>
                          </div>
                          <p className="mt-0.5 truncate text-[11px] tabular-nums text-[var(--ink-muted)]">
                            {formatDocumentDate(doc.created_at)} ·{" "}
                            {getDisplayFileType(doc)} ·{" "}
                            {doc.total_chunks || 0} sections
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <DocumentBadge
                              kind="status"
                              value={doc.status}
                              title={getParserStatus(doc)}
                            />
                            <DocumentBadge
                              kind="category"
                              value={doc.document_category || "Other"}
                            />
                          </div>
                          {doc.document_summary ? (
                            <p className="mt-1.5 line-clamp-2 text-[11px] leading-5 text-[var(--ink-muted)]">
                              {doc.document_summary}
                            </p>
                          ) : null}
                          <p
                            title={getParserStatus(doc)}
                            className={cn(
                              "mt-1 truncate text-[11px]",
                              doc.status === "failed"
                                ? "text-red-300"
                                : "text-[var(--ink-muted)]",
                            )}
                          >
                            {getParserStatus(doc)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </MobileCardList>
          </>
        )}

        {viewMode === "grid" && (
          <div className="p-3">
            {loading ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((index) => (
                  <div
                    key={index}
                    className="h-32 animate-pulse rounded-[10px] bg-[var(--surface-2)]"
                  />
                ))}
              </div>
            ) : filteredDocuments.length === 0 ? (
              <EmptyState
                icon={FileText}
                title={
                  documents.length === 0
                    ? "No documents yet"
                    : "No matching documents"
                }
                description={
                  documents.length === 0
                    ? "Upload your first approved document to get started."
                    : "Try a different search term or clear filters."
                }
                action={
                  documents.length === 0 ? (
                    <AppButton asChild tone="primary" className="h-9 px-3 text-[12px]">
                      <Link href="/dashboard/upload">
                        <Upload size={14} />
                        Upload document
                      </Link>
                    </AppButton>
                  ) : undefined
                }
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {pagedDocuments.map((doc) => {
                  const meta = getFileTypeMeta(doc);
                  const Icon = meta.icon;
                  const isSelected = selectedIds.has(doc.id);
                  return (
                    <div
                      key={doc.id}
                      className={cn(
                        "flex flex-col rounded-[10px] border bg-[var(--surface)] p-3 transition-colors",
                        isSelected
                          ? "border-[var(--accent-jade)] ring-1 ring-[var(--accent-jade-100)]"
                          : "border-[var(--line)] hover:border-[var(--accent-jade-100)]",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                            meta.tint,
                          )}
                        >
                          <Icon size={16} />
                        </div>
                        <SelectionCheckbox
                          checked={isSelected}
                          label={`Select ${doc.filename}`}
                          onToggle={() => toggleSelected(doc.id)}
                        />
                      </div>

                      <p
                        className="mt-2 line-clamp-2 text-[12px] font-medium leading-5 text-[var(--ink)]"
                        title={doc.filename}
                      >
                        {doc.filename}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1">
                        <DocumentBadge
                          kind="status"
                          value={doc.status}
                          title={getParserStatus(doc)}
                        />
                        <DocumentBadge
                          kind="category"
                          value={doc.document_category || "Other"}
                        />
                      </div>

                      {doc.document_summary ? (
                        <p
                          className="mt-1.5 line-clamp-2 text-[11px] leading-5 text-[var(--ink-muted)]"
                          title={doc.document_summary}
                        >
                          {doc.document_summary}
                        </p>
                      ) : null}

                      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[var(--ink-muted)]">
                        <span className="inline-flex items-center gap-1 tabular-nums">
                          <Database size={11} />
                          {doc.total_chunks || 0} sections
                        </span>
                        <span aria-hidden>·</span>
                        <span className="min-w-0 truncate">
                          {collectionNameById.get(doc.collection_id || "") ||
                            "Unassigned"}
                        </span>
                        <span aria-hidden>·</span>
                        <span className="tabular-nums">
                          {formatDocumentDate(doc.created_at)}
                        </span>
                      </div>

                      <div className="mt-2.5 flex items-center gap-1 border-t border-[var(--line-soft)] pt-2">
                        <button
                          type="button"
                          aria-label={`Preview ${doc.filename}`}
                          onClick={() =>
                            setPreviewDoc({
                              id: doc.id,
                              filename: doc.filename,
                              mimeType: doc.file_type,
                            })
                          }
                          disabled={doc.status !== "ready"}
                          className="inline-flex h-7 items-center gap-1 rounded-md px-1.5 text-[11px] font-medium text-[var(--ink-muted)] transition-colors hover:bg-[var(--canvas-soft)] hover:text-[var(--accent-jade)] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Eye size={12} />
                          Preview
                        </button>
                        <span className="flex-1" />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              aria-label={`Menu for ${doc.filename}`}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--ink-muted)] transition-colors hover:bg-[var(--canvas-soft)] hover:text-[var(--ink)]"
                            >
                              <MoreVertical size={13} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem
                              onClick={() => void handleReprocess(doc.id)}
                              disabled={doc.status === "processing"}
                            >
                              <RefreshCw size={13} /> Reprocess
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setConfirmDeleteId(doc.id)}
                            >
                              <Trash2 size={13} /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {filteredDocuments.length > PAGE_SIZE ? (
          <div className="flex flex-col gap-2 border-t border-[var(--line)] px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] tabular-nums text-[var(--ink-muted)]">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}-
              {Math.min(currentPage * PAGE_SIZE, filteredDocuments.length)} of{" "}
              {filteredDocuments.length}
            </p>
            <div className="flex items-center gap-1.5">
              <AppButton
                tone="secondary"
                disabled={currentPage === 1}
                className="h-8 px-2.5 text-[11px]"
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
                className="h-8 px-2.5 text-[11px]"
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
              >
                Next
              </AppButton>
            </div>
          </div>
        ) : null}
      </section>

      <FilePreviewDrawer
        open={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        documentId={previewDoc?.id ?? null}
        filename={previewDoc?.filename ?? ""}
        mimeType={previewDoc?.mimeType ?? null}
      />

      <ConfirmDialog
        open={Boolean(confirmDeleteId)}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteId(null);
        }}
        title="Delete document?"
        description="This removes the document from your workspace. The action is reversible only by uploading the document again."
        confirmLabel="Delete document"
        loading={Boolean(deletingId)}
        onConfirm={async () => {
          if (!confirmDeleteId) return;
          await handleDelete(confirmDeleteId);
          setConfirmDeleteId(null);
        }}
      />
    </div>
  );
}
