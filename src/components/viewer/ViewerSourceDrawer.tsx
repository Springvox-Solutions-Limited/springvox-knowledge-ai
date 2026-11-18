"use client";

import { useState } from "react";
import { Check, Copy, FileText, Loader2, X } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { ViewerViewCitation } from "./types";

export function ViewerSourceDrawer({
  open,
  onClose,
  citation,
  loading,
  error,
  sessionTitle,
  onViewDocument,
}: {
  open: boolean;
  onClose: () => void;
  citation: ViewerViewCitation | null;
  loading: boolean;
  error: string | null;
  sessionTitle: string;
  onViewDocument: (documentId: string, filename: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const excerpt = citation?.chunk_text || citation?.preview || "";

  const copyExcerpt = async () => {
    await navigator.clipboard.writeText(excerpt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full max-w-full border-l border-[var(--line)] bg-[var(--surface)] p-0 sm:max-w-xl"
      >
        <div className="flex h-full min-w-0 flex-col">
          <SheetHeader className="border-b border-[var(--line)] px-4 py-4 sm:px-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] text-[var(--ink-muted)]">Source</p>
                <SheetTitle className="mt-1 wrap-anywhere text-left text-[18px] font-medium leading-6 text-[var(--ink)]">
                  {citation?.filename || "Source details"}
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Source details and excerpt for the selected citation from {sessionTitle}.
                </SheetDescription>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close source"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] text-[var(--ink-muted)] transition-colors hover:bg-[var(--canvas-soft)] hover:text-[var(--ink)]"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-5">
            {citation?.document_id ? (
              <button
                type="button"
                onClick={() => onViewDocument(citation.document_id as string, citation.filename)}
                className="mb-5 inline-flex h-8 items-center gap-1.5 rounded-[5px] border border-[var(--line)] px-2.5 text-[11px] text-[var(--ink-soft)] transition-colors hover:border-[var(--ink-muted)] hover:text-[var(--ink)]"
              >
                <FileText size={12} strokeWidth={1.5} />
                Open full document
              </button>
            ) : null}

            {loading ? (
              <div className="flex items-center gap-2 py-4 text-[12px] text-[var(--ink-muted)]">
                <Loader2 size={12} className="animate-spin motion-reduce:animate-none" />
                Loading source…
              </div>
            ) : null}

            {error ? (
              <p className="rounded-[6px] border border-red-500/25 bg-red-500/10 px-3 py-2 text-[11px] leading-5 text-red-300">
                {error}
              </p>
            ) : null}

            <dl className="grid gap-2 border-y border-[var(--line)] py-3 text-[11px]">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[var(--ink-muted)]">Section</dt>
                <dd className="text-[var(--ink-soft)]">{(citation?.chunk_index ?? 0) + 1}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[var(--ink-muted)]">Collection</dt>
                <dd className="text-[var(--ink-soft)]">{citation?.document_category || "Not set"}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[var(--ink-muted)]">Confidence</dt>
                <dd className="text-[var(--ink-soft)]">{citation?.confidence || "Not scored"}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[var(--ink-muted)]">Uploaded</dt>
                <dd className="text-[var(--ink-soft)]">
                  {citation?.uploaded_at
                    ? new Date(citation.uploaded_at).toLocaleDateString()
                    : "Unknown"}
                </dd>
              </div>
            </dl>

            <section className="mt-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-medium text-[var(--ink-muted)]">Excerpt</p>
                <button
                  type="button"
                  onClick={copyExcerpt}
                  className="inline-flex items-center gap-1.5 rounded-[4px] px-1.5 py-1 text-[10px] text-[var(--ink-muted)] transition-colors hover:bg-[var(--canvas-soft)] hover:text-[var(--ink)]"
                >
                  {copied ? (
                    <Check size={11} className="text-emerald-300" />
                  ) : (
                    <Copy size={11} />
                  )}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="mt-2 whitespace-pre-wrap wrap-anywhere border-l-2 border-[var(--accent-jade)] bg-[var(--canvas)] px-3 py-2 text-[12px] leading-6 text-[var(--ink-soft)]">
                {excerpt || "No excerpt available."}
              </p>
            </section>

            {citation?.preview && citation.preview !== excerpt ? (
              <section className="mt-5 border-t border-[var(--line)] pt-4">
                <p className="text-[11px] font-medium text-[var(--ink-muted)]">Matched passage</p>
                <p className="mt-2 wrap-anywhere text-[12px] leading-6 text-[var(--ink-soft)]">
                  {citation.preview}
                </p>
              </section>
            ) : null}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
