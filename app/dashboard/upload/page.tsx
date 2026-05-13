"use client";
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  File, 
  X, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck,
  Zap,
  FileSearch,
  Braces,
  Database
} from 'lucide-react';
import { getAccessToken } from '@/src/lib/auth-client';
import { supabase } from '@/src/lib/supabase';
import { cn } from '@/src/lib/utils';
import Link from 'next/link';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setStatus('idle');
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    maxSize: 4 * 1024 * 1024 // 4MB
  });

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setStatus('idle');
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error('Authentication session expired');

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      setStatus('success');
      setFile(null);
    } catch (err: any) {
      setStatus('error');
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-shell-card p-8 md:p-10">
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-cyan-700">Document Upload</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">Upload approved documents into your workspace.</h1>
          <p className="max-w-2xl text-sm leading-7 text-slate-400">
            Use this admin workspace to add PDF and TXT files that should power your team assistant.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
         {[
           { icon: Upload, text: 'Upload', color: 'text-accent' },
           { icon: FileSearch, text: 'Extract', color: 'text-blue-400' },
           { icon: Braces, text: 'Chunk', color: 'text-cyan-400' },
           { icon: Zap, text: 'Embed', color: 'text-amber-400' },
           { icon: Database, text: 'Index', color: 'text-green-400' }
         ].map((item, i) => (
           <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center gap-3 shadow-sm">
              <item.icon size={18} className={item.color} />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-900">{item.text}</span>
           </div>
         ))}
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
        <div 
          {...getRootProps()} 
          className={cn(
            "relative group flex min-h-[360px] cursor-pointer flex-col items-center justify-center gap-5 rounded-[2rem] border-2 border-dashed bg-white p-12 shadow-sm transition-all",
            isDragActive ? "border-cyan-400 bg-cyan-50" : "border-slate-200 hover:border-cyan-300"
          )}
        >
          <input {...getInputProps()} />
          <div className="absolute inset-x-10 top-8 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.18em] text-slate-600">
            <span>Supported: PDF, TXT</span>
            <span>Max: 4MB</span>
          </div>
          
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 text-slate-500 transition-all group-hover:scale-110 group-hover:text-cyan-700">
            <Upload size={32} strokeWidth={1.5} />
          </div>

          <div className="text-center space-y-2">
              <p className="text-base font-semibold text-slate-950">
              {isDragActive ? 'Drop your file to begin ingestion' : 'Click to upload or drag a document here'}
            </p>
            <p className="text-[11px] text-slate-500 leading-6 max-w-sm">
              SpringVox will securely extract text, generate embeddings, and index the document for grounded answers.
            </p>
          </div>
        </div>

        {file && (
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
                <File size={20} className="text-cyan-700" />
              </div>
              <div className="space-y-1">
                <p className="max-w-[200px] truncate text-sm font-medium text-slate-900">{file.name}</p>
                <p className="text-[10px] text-slate-600 font-mono uppercase">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <button 
              onClick={() => setFile(null)}
              className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 py-4 font-bold text-slate-950 shadow-sm transition-all hover:from-teal-400 hover:to-cyan-400 disabled:grayscale disabled:opacity-30"
        >
          {uploading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Processing Upload Pipeline...
            </>
          ) : (
            <>
              <Zap size={20} />
              Process Knowledge Source
            </>
          )}
        </button>

        {status === 'success' && (
          <div className="p-6 bg-green-500/5 border border-green-500/20 rounded-2xl flex items-start gap-4">
            <CheckCircle2 className="text-green-500 mt-1" size={20} />
            <div className="space-y-1">
              <p className="text-sm font-bold tracking-tight text-slate-950">Ingestion Complete!</p>
              <p className="text-xs text-slate-500 leading-relaxed">Your document has been parsed, chunked, and stored in the vector database. You can now chat with it.</p>
              <div className="pt-2 flex gap-4">
                <Link href="/dashboard/chat" className="text-xs font-bold text-accent underline underline-offset-4">Start Chatting</Link>
                <Link href="/dashboard/documents" className="text-xs font-bold text-accent underline underline-offset-4">Manage Documents</Link>
              </div>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-start gap-4">
            <AlertCircle className="text-red-500 mt-1" size={20} />
            <div className="space-y-1">
              <p className="text-sm font-bold tracking-tight text-slate-950">Ingestion Failed</p>
              <p className="text-xs text-slate-500 leading-relaxed">{error}</p>
            </div>
          </div>
        )}
        </div>

        <div className="admin-shell-card p-8">
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Ingestion Pipeline</p>
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">From file to grounded answers.</h2>
            <p className="text-sm leading-7 text-slate-400">
              Every uploaded document follows the same secure processing flow before it becomes available in chat.
            </p>
          </div>

          <div className="mt-8 space-y-4">
            {[
              { icon: Upload, title: 'Upload', copy: 'Receive a PDF or TXT file inside the user workspace.' },
              { icon: FileSearch, title: 'Extract', copy: 'Read the text content from the uploaded document.' },
              { icon: Braces, title: 'Chunk', copy: 'Split the document into retrieval-friendly segments.' },
              { icon: Zap, title: 'Embed', copy: 'Generate vectors for semantic search.' },
              { icon: Database, title: 'Index', copy: 'Store chunks and vectors for grounded chat retrieval.' },
            ].map((step, index) => (
              <div key={step.title} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
                    <step.icon size={16} className="text-cyan-700" />
                  </div>
                  {index < 4 && <div className="mt-2 h-8 w-px bg-slate-200" />}
                </div>
                <div className="pt-1">
                  <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                  <p className="mt-1 text-xs leading-6 text-slate-500">{step.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
