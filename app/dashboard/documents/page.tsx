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
import { AdminSearchInput } from "@/src/components/dashboard/AdminSearchInput";
import { AppPageHeader } from "@/src/components/shared/AppPageHeader";

type DocumentRecord = {
  id: string;
  filename: string;
  status: "completed" | "processing" | "failed";
  total_chunks: number | null;
  created_at: string;
  error_message?: string | null;
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchDocs = async () => {
    setLoading(true);
    const currentProfile = await getCurrentUserProfile();
    setProfile(currentProfile);

    if (!currentProfile?.workspace_id) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("workspace_id", currentProfile.workspace_id)
      .order("created_at", { ascending: false });

    if (data) setDocuments(data as DocumentRecord[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchDocs();
  }, []);

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 size={16} className="text-green-500" />;
      case "processing":
        return <Clock size={16} className="text-blue-500 animate-spin" />;
      case "failed":
        return <AlertCircle size={16} className="text-red-500" />;
      default:
        return null;
    }
  };

  const filteredDocuments = documents.filter((document) =>
    document.filename.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="admin-page">
      <AppPageHeader
        eyebrow="Documents"
        title="Company documents"
        subtitle="Manage uploaded documents and track which files are ready for questions."
      />

      <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center">
        <AdminSearchInput
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search documents by filename..."
          className="flex-1"
        />
        <Link
          href="/dashboard/upload"
          className="app-button-primary whitespace-nowrap px-6 py-3"
        >
          <Upload size={18} />
          Upload document
        </Link>
      </div>

      {actionError && (
        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-5 text-sm text-red-700 font-medium flex items-start gap-3">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Error deleting document</p>
            <p className="text-xs mt-1 opacity-90">{actionError}</p>
          </div>
        </div>
      )}

      <div className="admin-shell-card overflow-hidden border border-slate-200 bg-white">
        <table className="hidden w-full border-collapse text-left lg:table">
          <thead>
            <tr className="bg-slate-50/60 border-b border-slate-200">
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Document
              </th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Status
              </th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Sections
              </th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Uploaded
              </th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              [1, 2, 3].map((i) => (
                <tr key={i}>
                  <td colSpan={5} className="px-6 py-16 text-center">
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
                <td colSpan={5} className="px-6 py-24 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                      <FileText size={28} strokeWidth={1.5} />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-slate-950">
                        {documents.length === 0
                          ? "No documents yet"
                          : "No matching documents"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {documents.length === 0
                          ? "Start by uploading your first approved document."
                          : "Try a different search term or clear filters."}
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredDocuments.map((doc) => (
                <tr
                  key={doc.id}
                  className="hover:bg-slate-50/60 transition-colors"
                >
                  <td className="px-6 py-5">
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
                      <span
                        className={cn(
                          "rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider border",
                          doc.status === "completed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : doc.status === "failed"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-blue-50 text-blue-700 border-blue-200",
                        )}
                      >
                        {doc.status}
                      </span>
                      {doc.status === "processing" && (
                        <Loader2
                          size={14}
                          className="animate-spin text-blue-500"
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-semibold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg inline-block">
                      {doc.total_chunks || 0}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-medium text-slate-500">
                      {new Date(doc.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button
                      onClick={() => handleDelete(doc.id)}
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

        <div className="space-y-4 p-4 lg:hidden">
          {loading ? (
            [1, 2, 3].map((index) => (
              <div
                key={index}
                className="h-40 animate-pulse rounded-2xl bg-slate-100"
              />
            ))
          ) : filteredDocuments.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 mx-auto mb-4">
                <FileText size={28} />
              </div>
              <p className="text-sm font-bold text-slate-900">
                {documents.length === 0
                  ? "No documents yet"
                  : "No matches found"}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                {documents.length === 0
                  ? "Upload your first document to get started."
                  : "Try adjusting your search filters."}
              </p>
            </div>
          ) : (
            filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
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
                      {doc.total_chunks || 0} sections
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(doc.id)}
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
                <span
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider inline-block border",
                    doc.status === "completed"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : doc.status === "failed"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-blue-50 text-blue-700 border-blue-200",
                  )}
                >
                  {doc.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
