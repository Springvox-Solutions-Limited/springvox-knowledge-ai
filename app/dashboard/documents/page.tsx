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
  Loader2,
  Upload,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { type UserProfile } from "@/src/lib/workspace";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

  const fetchDocs = async (silent = false) => {
    if (!silent) setLoading(true);
    const currentProfile = await getCurrentUserProfile();
    if (!silent) setProfile(currentProfile);

    if (!currentProfile?.workspace_id) {
      if (!silent) setLoading(false);
      return;
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

  const filteredDocuments = documents.filter((document) =>
    document.filename.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredDocuments.length / PAGE_SIZE),
  );
  const pagedDocuments = filteredDocuments.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const hasFilters = Boolean(searchQuery);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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
        {hasFilters ? (
          <AppButton
            tone="secondary"
            onClick={() => setSearchQuery("")}
            className="w-full whitespace-nowrap sm:w-auto"
          >
            Clear search
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
        <Alert className="rounded-2xl border-red-200 bg-red-50/50 text-red-700">
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      <div className="admin-shell-card border border-slate-200 bg-white">
        <OverflowGuard mode="scroll" className="hidden lg:block">
          <table className="hidden w-full border-collapse text-left lg:table">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-200">
                <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-600">
                  Document
                </th>
                <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-600">
                  Status
                </th>
                <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-600">
                  Type
                </th>
                <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-600">
                  Category
                </th>
                <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-600">
                  Sections
                </th>
                <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-600">
                  Uploaded
                </th>
                <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-600 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <Loader2
                          size={18}
                          className="animate-spin text-slate-400"
                        />
                        <span className="text-sm font-medium text-slate-600">
                          Loading documents...
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-24 text-center">
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
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
                          <FileText size={18} className="text-slate-500" />
                        </div>
                        <span
                          title={doc.filename}
                          className="max-w-xs truncate text-sm font-semibold text-slate-900"
                        >
                          {doc.filename}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={doc.status} />
                        {doc.status === "processing" && (
                          <Loader2
                            size={14}
                            className="animate-spin text-blue-500"
                          />
                        )}
                      </div>
                      <p
                        title={getParserStatus(doc)}
                        className={cn(
                          "mt-2 max-w-xs truncate text-[11px]",
                          doc.status === "failed" ? "text-red-600" : "text-slate-500",
                        )}
                      >
                        {getParserStatus(doc)}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        {getDisplayFileType(doc)}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex rounded-lg bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700">
                        {doc.document_category || "Other"}
                      </span>
                      {doc.document_summary ? (
                        <p className="mt-2 max-w-xs truncate text-[11px] text-slate-500" title={doc.document_summary}>
                          {doc.document_summary}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-semibold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg inline-block">
                        {doc.total_chunks || 0}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-medium text-slate-500">
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
                    <td className="px-6 py-5 text-right">
                      <button
                        aria-label={`Delete ${doc.filename}`}
                        onClick={() => setConfirmDeleteId(doc.id)}
                        disabled={deletingId === doc.id}
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 transition-all hover:bg-red-50 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {deletingId === doc.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                        Delete
                      </button>
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
                className="h-40 animate-pulse rounded-2xl bg-slate-100"
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
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0 flex-1">
                    <p
                      title={doc.filename}
                      className="truncate text-sm font-bold text-slate-900"
                    >
                      {doc.filename}
                    </p>
                    <p className="mt-2 text-xs font-medium text-slate-500">
                      {new Date(doc.created_at).toLocaleDateString()} •{" "}
                      {getDisplayFileType(doc)} • {doc.total_chunks || 0} sections
                    </p>
                    <p className="mt-2 text-xs font-semibold text-cyan-700">
                      {doc.document_category || "Other"}
                    </p>
                    {doc.document_summary ? (
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                        {doc.document_summary}
                      </p>
                    ) : null}
                    <p
                      title={getParserStatus(doc)}
                      className={cn(
                        "mt-1 line-clamp-2 text-xs",
                        doc.status === "failed" ? "text-red-600" : "text-slate-500",
                      )}
                    >
                      {getParserStatus(doc)}
                    </p>
                  </div>
                  <button
                    aria-label={`Delete ${doc.filename}`}
                    onClick={() => setConfirmDeleteId(doc.id)}
                    disabled={deletingId === doc.id}
                    className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40"
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
          <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
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
