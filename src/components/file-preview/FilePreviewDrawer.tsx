"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getAccessToken } from "@/src/lib/auth-client";
import { FilePreviewRenderer, type PreviewFile } from "./FilePreviewRenderer";

interface FilePreviewDrawerProps {
  open: boolean;
  onClose: () => void;
  documentId: string | null;
  filename: string;
  mimeType?: string | null;
}

export function FilePreviewDrawer({
  open,
  onClose,
  documentId,
  filename,
  mimeType,
}: FilePreviewDrawerProps) {
  const [file, setFile] = useState<PreviewFile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !documentId) return;

    let objectUrl: string | null = null;
    let active = true;

    (async () => {
      setLoading(true);
      setError(null);
      setFile(null);
      try {
        const token = await getAccessToken();
        if (!token) throw new Error("Your session has expired. Please sign in again.");

        const res = await fetch(`/api/documents/${documentId}/stream`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "This file could not be loaded.");
        }

        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);
        if (!active) return;
        setFile({
          blob,
          blobUrl: objectUrl,
          filename,
          mimeType: mimeType || blob.type || "application/octet-stream",
        });
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "This file could not be loaded.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [open, documentId, filename, mimeType]);

  return (
    <Sheet open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="flex w-full max-w-full flex-col border-l border-[var(--line)] bg-[var(--canvas)] p-0 sm:max-w-3xl"
      >
        <SheetHeader className="border-b border-[var(--line)] bg-[var(--surface)] px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--ink-muted)]">Document</p>
              <SheetTitle className="mt-1 truncate text-left text-base font-semibold text-[var(--ink)]">
                {filename || "Document preview"}
              </SheetTitle>
              <SheetDescription className="sr-only">Full document preview for the selected source.</SheetDescription>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {file ? (
                <a
                  href={file.blobUrl}
                  download={filename}
                  aria-label="Download document"
                  className="rounded-lg border border-[var(--line)] p-2 text-[var(--ink-muted)] transition hover:bg-[var(--canvas-soft)] hover:text-[var(--ink)]"
                >
                  <Download size={16} />
                </a>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close preview"
                className="rounded-lg border border-[var(--line)] p-2 text-[var(--ink-muted)] transition hover:bg-[var(--canvas-soft)] hover:text-[var(--ink)]"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-hidden p-4">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-[var(--ink-muted)]">
              Loading document…
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm text-red-300">
              {error}
            </div>
          ) : file ? (
            <FilePreviewRenderer file={file} />
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
