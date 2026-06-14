"use client";
import { useEffect, useState } from "react";
import { getAccessToken, getCurrentUserProfile } from "@/src/lib/auth-client";
import { supabase } from "@/src/lib/supabase";
import {
  FileText,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Database,
  Eye,
  Loader2,
  Upload,
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
import { OverflowGuard } from "@/src/components/layout/OverflowGuard";
import { ResponsiveToolbar } from "@/src/components/layout/ResponsiveToolbar";
import { AppPageHeader } from "@/src/components/shared/AppPageHeader";
import { AppButton } from "@/src/components/ui/app-button";
import { ConfirmDialog } from "@/src/components/ui/confirm-dialog";
import { EmptyState } from "@/src/components/ui/empty-state";
import { StatusBadge } from "@/src/components/ui/status-badge";

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

function getDisplayFileType(document: DocumentRecord) {
  if (document.file_type) {
    if (document.file_type.includes('/')) {
      const subtype = document.file_type.split('/').pop() || document.file_type;
      return subtype.split('.').pop()?.toUpperCase() || subtype.toUpperCase();
    }

    return document.file_type.replace('.', '').toUpperCase();
  }

  const extension = document.filename.split('.').pop();
  return extension ? extension.toUpperCase() : 'File';
}

function getParserStatus(document: DocumentRecord) {
  if (document.status === 'processing') {
    return 'Processing';
  }

  if (document.status === 'failed') {
    return document.error_message || 'Parsing failed';
  }

  return document.parser || 'Ready';
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
  const [previewDoc, setPreviewDoc] = useState<{ id: string; filename: string; mimeType?: string | null } | null>(null);

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
            ? { ...doc, collection_id: collectionId === "none" ? null : collectionId }
            : doc,
        ),
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update collection");
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

    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("workspace_id", currentProfile.workspace_id)
      .order("created_at", { ascending: false });

    if (data) setDocuments(data as DocumentRecord[]);
    if (!silent) setLoading(false);
  };

  useEffect(() => {
    fetchDocs();
    fetchCollections();
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

  if (profile?.role === "viewer") {
    return null;
  }

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
    } catch (err: any) {
      setActionError(err.message || "Error deleting document");
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
    return matchesSearch && matchesCollection;
  });
  const totalPages = Math.max(
    1,
    Math.ceil(filteredDocuments.length / PAGE_SIZE),
  );
  const pagedDocuments = filteredDocuments.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const hasFilters = Boolean(searchQuery) || collectionFilter !== "all";

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, collectionFilter]);

  return (
    <div className="admin-page">
      <AppPageHeader
        eyebrow="Documents"
        title="Company documents"
        subtitle="Manage uploaded documents and processing status."
      />

      <ResponsiveToolbar className="lg:items-center">
        <AdminSearchInput
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search documents by filename..."
          className="flex-1"
        />
        <Select value={collectionFilter} onValueChange={setCollectionFilter}>
          <SelectTrigger className="h-12 w-full rounded-xl border-[var(--line)] bg-[var(--surface)] px-4 text-sm shadow-sm focus-visible:border-teal-400 focus-visible:ring-[var(--accent-jade-100)] lg:w-56">
            <SelectValue placeholder="All collections" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-[var(--line)]">
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
          <AppButton
            tone="secondary"
            onClick={() => {
              setSearchQuery("");
              setCollectionFilter("all");
            }}
            className="w-full whitespace-nowrap sm:w-auto"
          >
            Clear filters
          </AppButton>
        ) : null}
        <AppButton asChild className="w-full whitespace-nowrap px-6 sm:w-auto">
          <Link href="/dashboard/upload">
            <Upload size={18} />
            Upload document
          </Link>
        </AppButton>
      </ResponsiveToolbar>

      {actionError && (
        <Alert className="rounded-2xl border-red-500/30 bg-red-500/10 text-red-300">
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      <div className="admin-shell-card overflow-hidden">
        <OverflowGuard mode="scroll" className="hidden lg:block">
          <table className="hidden w-full border-collapse text-left lg:table">
            <thead>
              <tr className="border-b border-[var(--line)] bg-[var(--canvas-soft)]">
                <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  Document
                </th>
                <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  Status
                </th>
                <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  Type
                </th>
                <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  Category
                </th>
                <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  Collection
                </th>
                <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  Sections
                </th>
                <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  Uploaded
                </th>
                <th className="px-6 py-3 text-right text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line-soft)]">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-6 py-16 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <Loader2
                          size={18}
                          className="animate-spin text-[var(--ink-muted)]"
                        />
                        <span className="text-sm font-medium text-[var(--ink-soft)]">
                          Loading documents...
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-24 text-center">
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
                pagedDocuments.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-[var(--canvas-soft)] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface-2)]">
                          <FileText size={18} className="text-[var(--ink-muted)]" />
                        </div>
                        <span
                          title={doc.filename}
                          className="max-w-xs truncate text-sm font-semibold text-[var(--ink)]"
                        >
                          {doc.filename}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={doc.status} />
                        {doc.status === "processing" && (
                          <Loader2
                            size={14}
                            className="animate-spin text-[var(--accent-jade)]"
                          />
                        )}
                      </div>
                      <p
                        title={getParserStatus(doc)}
                        className={cn(
                          "mt-2 max-w-xs truncate text-[11px]",
                          doc.status === "failed" ? "text-red-300" : "text-[var(--ink-muted)]",
                        )}
                      >
                        {getParserStatus(doc)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-lg bg-[var(--surface-2)] px-2.5 py-1 text-xs font-semibold text-[var(--ink-soft)]">
                        {getDisplayFileType(doc)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-lg bg-[var(--accent-jade-50)] px-2.5 py-1 text-xs font-semibold text-[var(--accent-jade)]">
                        {doc.document_category || "Other"}
                      </span>
                      {doc.document_summary ? (
                        <p className="mt-2 max-w-xs truncate text-[11px] text-[var(--ink-muted)]" title={doc.document_summary}>
                          {doc.document_summary}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-6 py-4">
                      <Select
                        value={doc.collection_id || "none"}
                        onValueChange={(value) => assignCollection(doc.id, value)}
                        disabled={assigningId === doc.id}
                      >
                        <SelectTrigger className="h-9 w-40 rounded-lg border-[var(--line)] bg-[var(--surface)] text-xs shadow-sm focus-visible:border-teal-400 focus-visible:ring-[var(--accent-jade-100)]">
                          <SelectValue placeholder="Unassigned">
                            {doc.collection_id ? collectionNameById.get(doc.collection_id) : "Unassigned"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-[var(--line)]">
                          <SelectItem value="none">Unassigned</SelectItem>
                          {collections.map((collection) => (
                            <SelectItem key={collection.id} value={collection.id}>
                              {collection.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold text-[var(--ink-soft)] bg-[var(--surface-2)] px-2.5 py-1 rounded-lg inline-block">
                        {doc.total_chunks || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-[var(--ink-muted)]">
                        {new Date(doc.created_at).toLocaleDateString(
                          undefined,
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          aria-label={`Preview ${doc.filename}`}
                          onClick={() => setPreviewDoc({ id: doc.id, filename: doc.filename, mimeType: doc.file_type })}
                          disabled={doc.status !== "ready"}
                          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-[var(--ink-muted)] transition-all hover:bg-[var(--canvas-soft)] hover:text-[var(--accent-jade)] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Eye size={14} />
                          Preview
                        </button>
                        <button
                          aria-label={`Delete ${doc.filename}`}
                          onClick={() => setConfirmDeleteId(doc.id)}
                          disabled={deletingId === doc.id}
                          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-[var(--ink-muted)] transition-all hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {deletingId === doc.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </OverflowGuard>

        <MobileCardList hideAbove="lg" className="space-y-0 p-4">
          {loading ? (
            [1, 2, 3].map((index) => (
              <div
                key={index}
                className="h-40 animate-pulse rounded-2xl bg-[var(--surface-2)]"
              />
            ))
          ) : filteredDocuments.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={
                documents.length === 0 ? "No documents yet" : "No matches found"
              }
              description={
                documents.length === 0
                  ? "Upload your first document to get started."
                  : "Try adjusting your search filters."
              }
            />
          ) : (
            pagedDocuments.map((doc) => (
              <div
                key={doc.id}
              className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0 flex-1">
                    <p
                      title={doc.filename}
                      className="truncate text-sm font-bold text-[var(--ink)]"
                    >
                      {doc.filename}
                    </p>
                    <p className="mt-2 text-xs font-medium text-[var(--ink-muted)]">
                      {new Date(doc.created_at).toLocaleDateString()} •{" "}
                      {getDisplayFileType(doc)} • {doc.total_chunks || 0} sections
                    </p>
                    <p className="mt-2 text-xs font-semibold text-[var(--accent-jade)]">
                      {doc.document_category || "Other"}
                    </p>
                    {doc.document_summary ? (
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--ink-muted)]">
                        {doc.document_summary}
                      </p>
                    ) : null}
                    <p
                      title={getParserStatus(doc)}
                      className={cn(
                        "mt-1 line-clamp-2 text-xs",
                        doc.status === "failed" ? "text-red-300" : "text-[var(--ink-muted)]",
                      )}
                    >
                      {getParserStatus(doc)}
                    </p>
                  </div>
                  <button
                    aria-label={`Delete ${doc.filename}`}
                    onClick={() => setConfirmDeleteId(doc.id)}
                    disabled={deletingId === doc.id}
                    className="rounded-lg p-2 text-[var(--ink-muted)] hover:bg-red-500/10 hover:text-red-300 transition-colors disabled:opacity-40"
                  >
                    {deletingId === doc.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
                <StatusBadge status={doc.status} />
              </div>
            ))
          )}
        </MobileCardList>
        {filteredDocuments.length > PAGE_SIZE ? (
          <div className="flex flex-col gap-3 border-t border-[var(--line)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[var(--ink-muted)]">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}-
              {Math.min(currentPage * PAGE_SIZE, filteredDocuments.length)} of{" "}
              {filteredDocuments.length}
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
