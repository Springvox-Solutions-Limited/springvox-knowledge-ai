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
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Document Control</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">Your Knowledge Base</h1>
          <p className="text-sm text-slate-500">Review ingestion status, source chunks, and processing runs.</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <div className="relative max-w-sm w-full">
             <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="admin-input pl-12 pr-4"
                placeholder="Search documents..."
              />
          </div>
          <Link
            href="/dashboard/upload"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 py-3.5 text-sm font-bold !text-white shadow-xl shadow-slate-950/20 transition-all hover:bg-slate-800 hover:scale-[1.02] active:scale-95"
          >
            <Upload size={16} className="!text-white" />
            Upload document
          </Link>
        </div>
      </div>

      {actionError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {actionError}
        </div>
      )}

      <div className="admin-shell-card overflow-hidden border border-slate-200 bg-white">
        <table className="hidden w-full border-collapse text-left lg:table">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">File Name</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Chunks</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Date</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              [1,2,3].map(i => (
                <tr key={i}>
                  <td colSpan={5} className="px-6 py-12 text-center animate-pulse text-slate-400 text-sm italic">Synchronizing knowledge bank...</td>
                </tr>
              ))
            ) : filteredDocuments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-24 text-center text-slate-500 text-sm">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                      <FileText size={24} strokeWidth={1.5} />
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-900">
                        {documents.length === 0
                          ? 'No documents found'
                          : 'No matching documents'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {documents.length === 0
                          ? 'Start by uploading a data source to your workspace.'
                          : 'Try a different search term or clear the filter.'}
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : filteredDocuments.map((doc) => (
              <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white">
                      <FileText size={18} className="text-slate-500" />
                    </div>
                    <span title={doc.filename} className="max-w-[280px] truncate text-sm font-semibold text-slate-900">{doc.filename}</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                      doc.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 
                      doc.status === 'failed' ? 'bg-red-50 text-red-700 border border-red-200' : 
                      'bg-slate-100 text-slate-700 border border-slate-200'
                    )}>
                      {doc.status}
                    </span>
                    {doc.status === 'processing' && (
                      <Loader2 size={14} className="animate-spin text-slate-400" />
                    )}
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="text-xs font-medium text-slate-600">{doc.total_chunks || 0}</span>
                </td>
                <td className="px-6 py-5">
                  <span className="text-xs text-slate-500">
                    {new Date(doc.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </td>
                <td className="px-6 py-5 text-right">
                   <button 
                     onClick={() => handleDelete(doc.id)}
                     disabled={deletingId === doc.id}
                     className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 transition-all hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                   >
                     {deletingId === doc.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                     Delete
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="space-y-4 p-4 lg:hidden">
          {loading ? (
            [1, 2, 3].map((index) => (
              <div key={index} className="h-36 animate-pulse rounded-2xl bg-slate-100" />
            ))
          ) : filteredDocuments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <Database size={32} className="mx-auto text-slate-400" />
              <p className="mt-4 text-sm font-semibold text-slate-900">
                {documents.length === 0 ? 'No documents yet' : 'No matches found'}
              </p>
            </div>
          ) : (
            filteredDocuments.map((doc) => (
              <div key={doc.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p title={doc.filename} className="truncate text-sm font-bold text-slate-900">{doc.filename}</p>
                    <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-slate-500">
                      {new Date(doc.created_at).toLocaleDateString()} • {doc.total_chunks || 0} chunks
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    disabled={deletingId === doc.id}
                    className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    {deletingId === doc.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  </button>
                </div>
                <div className="mt-4">
                  <span className={cn(
                    "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                    doc.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 
                    doc.status === 'failed' ? 'bg-red-50 text-red-700 border border-red-200' : 
                    'bg-slate-100 text-slate-700 border border-slate-200'
                  )}>
                    {doc.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
