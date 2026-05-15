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
  Zap,
  FileSearch,
  Braces,
  Database
} from 'lucide-react';
import { getAccessToken } from '@/src/lib/auth-client';
import { supabase } from '@/src/lib/supabase';
import { cn } from '@/src/lib/utils';
import Link from 'next/link';
import { AppPageHeader } from '@/src/components/shared/AppPageHeader';
import { AppButton } from '@/src/components/ui/app-button';

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
      <AppPageHeader
        eyebrow="Upload Documents"
        title="Upload approved documents"
        subtitle="Add PDF or TXT files your team can ask questions from."
      />

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
         {[
           { icon: Upload, text: 'Upload file', color: 'text-slate-400' },
            { icon: FileSearch, text: 'Read document', color: 'text-slate-400' },
            { icon: Braces, text: 'Prepare sections', color: 'text-slate-400' },
           { icon: Zap, text: 'Make it searchable', color: 'text-slate-400' },
           { icon: Database, text: 'Ready for questions', color: 'text-slate-400' }
         ].map((item, i) => (
          <div key={i} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm/5">
              <item.icon size={16} className={item.color} />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">{item.text}</span>
           </div>
         ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr] xl:gap-8">
        <div className="space-y-6">
        <div 
          {...getRootProps()} 
          className={cn(
            "relative group flex min-h-[320px] cursor-pointer flex-col items-center justify-center gap-5 rounded-[2rem] border-2 border-dashed bg-white p-6 transition-all sm:min-h-[360px] sm:p-12",
            isDragActive ? "border-slate-400 bg-slate-50" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
          )}
        >
          <input {...getInputProps()} />
          <div className="absolute inset-x-4 top-4 flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400 sm:inset-x-10 sm:top-8 sm:text-[10px] sm:tracking-[0.18em]">
            <span>PDF, TXT ONLY</span>
            <span>MAX 4MB</span>
          </div>
          
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-slate-100 bg-slate-50 text-slate-400 transition-all group-hover:scale-105 group-hover:text-slate-600">
            <Upload size={32} strokeWidth={1.5} />
          </div>

          <div className="text-center space-y-2">
            <p className="text-base font-semibold text-slate-900">
              {isDragActive ? 'Release to begin upload' : 'Click or drag a document here'}
            </p>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
              We&apos;ll prepare the document so your team can ask questions from it.
            </p>
          </div>
        </div>

        {file && (
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm animate-in zoom-in-95 duration-200 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-100 bg-slate-50">
                <File size={18} className="text-slate-500" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className="truncate text-sm font-semibold text-slate-900">{file.name}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <button 
              onClick={() => setFile(null)}
              aria-label="Remove selected file"
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
            >
              <X size={18} />
            </button>
          </div>
        )}

        <AppButton
          onClick={handleUpload}
          disabled={!file || uploading}
          className="flex w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Uploading document...
            </>
          ) : (
            <>
              <Zap size={18} />
              Upload document
            </>
          )}
        </AppButton>

        {status === 'success' && (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-4">
            <CheckCircle2 className="text-emerald-600 mt-0.5" size={18} />
            <div className="space-y-1">
              <p className="text-sm font-bold text-emerald-900">Document uploaded successfully.</p>
              <p className="text-xs text-emerald-700/80 leading-relaxed">Your team can now ask questions from this document in chat.</p>
              <div className="flex flex-col gap-3 pt-3 sm:flex-row sm:gap-5">
                <Link href="/dashboard/chat" className="text-xs font-bold text-emerald-900 underline underline-offset-4 decoration-emerald-300">Open chat</Link>
                <Link href="/dashboard/documents" className="text-xs font-bold text-emerald-900 underline underline-offset-4 decoration-emerald-300">View documents</Link>
              </div>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="p-6 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-4">
            <AlertCircle className="text-red-600 mt-0.5" size={18} />
            <div className="space-y-1">
              <p className="text-sm font-bold text-red-900">Upload failed.</p>
              <p className="text-xs text-red-700/80 leading-relaxed">{error}</p>
            </div>
          </div>
        )}
        </div>

        <div className="admin-shell-card border border-slate-200 bg-white p-6 sm:p-8">
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Document preparation steps</p>
            <h2 className="text-xl font-bold tracking-tight text-slate-950">What happens after upload</h2>
            <p className="text-xs leading-6 text-slate-500">
              Each file is prepared so answers can be based on the uploaded document.
            </p>
          </div>

          <div className="mt-8 space-y-6">
            {[
              { icon: Upload, title: 'Upload file', copy: 'Your document is stored securely for your workspace.' },
              { icon: FileSearch, title: 'Read document', copy: 'The system reads the text so it can be used in answers.' },
              { icon: Braces, title: 'Prepare sections', copy: 'The document is split into smaller readable sections.' },
              { icon: Zap, title: 'Make it searchable', copy: 'The system prepares the document so matching answers can be found quickly.' },
              { icon: Database, title: 'Ready for questions', copy: 'The document becomes available in your company chat experience.' },
            ].map((step, index) => (
              <div key={step.title} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-100 bg-slate-50">
                    <step.icon size={14} className="text-slate-500" />
                  </div>
                  {index < 4 && <div className="mt-2 h-6 w-px bg-slate-100" />}
                </div>
                <div className="pt-0.5">
                  <p className="text-xs font-bold text-slate-900">{step.title}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{step.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
