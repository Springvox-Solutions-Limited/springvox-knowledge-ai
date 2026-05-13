"use client";
import { useEffect, useState } from 'react';
import { getAccessToken, getCurrentUserProfile } from '@/src/lib/auth-client';
import { supabase } from '@/src/lib/supabase';
import { 
  FileText, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  Search,
  Database,
  Loader2,
  Upload
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { type UserProfile } from '@/src/lib/workspace';
import Link from 'next/link';

type DocumentRecord = {
  id: string;
  filename: string;
  status: 'completed' | 'processing' | 'failed';
  total_chunks: number | null;
  created_at: string;
  error_message?: string | null;
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
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
      .from('documents')
      .select('*')
      .eq('workspace_id', currentProfile.workspace_id)
      .order('created_at', { ascending: false });

    if (data) setDocuments(data as DocumentRecord[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  if (profile?.role === 'viewer') {
    return null;
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setActionError(null);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error('Authentication session expired');

      const res = await fetch(`/api/documents/delete?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) throw new Error('Delete failed');
      fetchDocs();
    } catch (err: any) {
      setActionError(err.message || 'Error deleting document');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 size={16} className="text-green-500" />;
      case 'processing': return <Clock size={16} className="text-blue-500 animate-spin" />;
      case 'failed': return <AlertCircle size={16} className="text-red-500" />;
      default: return null;
    }
  };

  const filteredDocuments = documents.filter((document) =>
    document.filename.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="admin-page">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-700">Document Control</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">Your Knowledge Base</h1>
          <p className="text-sm text-slate-500">Review ingestion status, source chunks, and any failed processing runs.</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <div className="relative max-w-sm w-full">
             <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
             <input 
               value={searchQuery}
               onChange={(event) => setSearchQuery(event.target.value)}
               className="admin-input pl-10 pr-4"
               placeholder="Search documents..."
             />
          </div>
          <Link
            href="/dashboard/upload"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-sm"
          >
            <Upload size={16} />
            Upload document
          </Link>
        </div>
      </div>

      {actionError && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
          {actionError}
        </div>
      )}

      <div className="admin-shell-card overflow-hidden">
        <table className="hidden w-full border-collapse text-left lg:table">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">File Name</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Chunks</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Date</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              [1,2,3].map(i => (
                <tr key={i}>
                  <td colSpan={5} className="px-6 py-12 text-center animate-pulse text-slate-600 text-sm italic">Synchronizing knowledge bank...</td>
                </tr>
              ))
            ) : filteredDocuments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-24 text-center text-slate-600 text-sm">
                  <div className="flex flex-col items-center gap-2">
                    <FileText size={48} strokeWidth={1} className="text-slate-800" />
                    <p>
                      {documents.length === 0
                        ? 'No documents found. Start by uploading a data source.'
                        : 'No documents match your current search.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : filteredDocuments.map((doc) => (
              <tr key={doc.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
                      <FileText size={18} className="text-cyan-700" />
                    </div>
                    <span title={doc.filename} className="max-w-[280px] truncate text-sm font-medium text-slate-800">{doc.filename}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getStatusIcon(doc.status)}
                    <span className={cn(
                      "rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]",
                      doc.status === 'completed' ? 'border-green-500/20 bg-green-500/10 text-green-400' : 
                      doc.status === 'failed' ? 'border-red-200 bg-red-50 text-red-600' : 'border-cyan-200 bg-cyan-50 text-cyan-700'
                    )}>
                      {doc.status}
                    </span>
                    {doc.status === 'processing' && (
                    <span className="text-xs text-slate-500">Still indexing. You can delete it if needed.</span>
                    )}
                    {doc.status === 'failed' && doc.error_message && (
                      <span className="max-w-[260px] truncate text-xs text-red-300">{doc.error_message}</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs font-mono text-slate-500">{doc.total_chunks || 0}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[10px] text-slate-600 font-mono italic">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                     <button 
                       onClick={() => handleDelete(doc.id)}
                       disabled={deletingId === doc.id}
                     className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                     >
                       {deletingId === doc.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                       Delete
                     </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="space-y-4 p-4 lg:hidden">
          {loading ? (
            [1, 2, 3].map((index) => (
              <div key={index} className="h-36 animate-pulse rounded-2xl bg-slate-200" />
            ))
          ) : filteredDocuments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <Database size={32} className="mx-auto text-slate-700" />
              <p className="mt-4 text-sm font-semibold text-slate-950">
                {documents.length === 0 ? 'No documents uploaded yet' : 'No matching documents found'}
              </p>
              <p className="mt-2 text-xs leading-6 text-slate-500">
                {documents.length === 0 ? 'Upload a PDF or TXT file to start grounding answers in your documents.' : 'Try a different filename or clear the search.'}
              </p>
            </div>
          ) : (
            filteredDocuments.map((doc) => (
              <div key={doc.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p title={doc.filename} className="truncate text-sm font-semibold text-slate-900">{doc.filename}</p>
                    <p className="mt-1 text-[10px] font-mono uppercase tracking-[0.16em] text-slate-500">
                      {new Date(doc.created_at).toLocaleDateString()} • {doc.total_chunks || 0} chunks
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    disabled={deletingId === doc.id}
                    className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                  >
                    {deletingId === doc.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  </button>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  {getStatusIcon(doc.status)}
                  <span className={cn(
                    "rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]",
                    doc.status === 'completed' ? 'border-green-500/20 bg-green-500/10 text-green-400' : 
                    doc.status === 'failed' ? 'border-red-200 bg-red-50 text-red-600' : 'border-cyan-200 bg-cyan-50 text-cyan-700'
                  )}>
                    {doc.status}
                  </span>
                </div>
                {doc.status === 'processing' && (
                  <p className="mt-3 text-xs leading-6 text-slate-500">This document is still processing. You can delete it if you need to restart the upload.</p>
                )}
                {doc.status === 'failed' && doc.error_message && (
                  <p className="mt-3 text-xs leading-6 text-red-300">{doc.error_message}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
