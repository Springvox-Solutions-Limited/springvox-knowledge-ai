"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useDropzone } from "react-dropzone";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  File,
  Loader2,
  RotateCcw,
  Trash2,
  Upload,
  X,
  Zap,
} from "lucide-react";

import { getAccessToken } from "@/src/lib/auth-client";
import { supabase } from "@/src/lib/supabase";
import { cn } from "@/src/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppPageHeader } from "@/src/components/shared/AppPageHeader";
import { AppButton } from "@/src/components/ui/app-button";

type UploadCollection = { id: string; name: string };

const MAX_UPLOAD_MB = Number.parseInt(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB || "20", 10) || 20;
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;
const SUPPORTED_EXTENSIONS = [".pdf", ".txt", ".docx", ".csv", ".xlsx", ".pptx"];
const SUPPORTED_UPLOAD_COPY = `PDF, TXT, DOCX, CSV, XLSX, PPTX up to ${MAX_UPLOAD_MB}MB`;
const UPLOAD_CONCURRENCY = 3;
const PROCESSING_POLL_INTERVAL_MS = 3000;
const PROCESSING_POLL_TIMEOUT_MS = 10 * 60 * 1000;

const UPLOAD_RULES = [
  { label: "Formats", value: "PDF, TXT, DOCX, CSV, XLSX, PPTX" },
  { label: "Maximum size", value: `${MAX_UPLOAD_MB}MB per file` },
  { label: "Parallel uploads", value: `${UPLOAD_CONCURRENCY} files at a time` },
  { label: "Processing", value: "Runs in the background after upload." },
  { label: "Retries", value: "Failed files can be retried individually." },
  { label: "Duplicates", value: "Same-name files are allowed and flagged." },
];

const QUEUE_STATUS_KEY = [
  { label: "Waiting", copy: "Queued, not started." },
  { label: "Uploading", copy: "File is being sent." },
  { label: "Processing", copy: "Text is being prepared for search." },
  { label: "Completed", copy: "Ready for questions." },
  { label: "Failed", copy: "Retry it from the queue." },
];

type QueueStatus = "queued" | "uploading" | "processing" | "completed" | "failed";

type UploadQueueItem = {
  id: string;
  file: File;
  status: QueueStatus;
  message?: string;
  documentId?: string;
};

type DocumentStatusResponse = {
  status: "ready" | "processing" | "failed";
  error_message?: string | null;
};

const statusConfig: Record<
  QueueStatus,
  {
    label: string;
    className: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }
> = {
  queued: {
    label: "Waiting",
    className: "border-[var(--line)] bg-[var(--surface-2)] text-[var(--ink-soft)]",
    icon: Clock,
  },
  uploading: {
    label: "Uploading",
    className: "border-[var(--accent-jade-100)] bg-[var(--accent-jade-50)] text-[var(--accent-jade)]",
    icon: Loader2,
  },
  processing: {
    label: "Processing",
    className: "border-amber-500/25 bg-amber-500/10 text-amber-300",
    icon: Loader2,
  },
  completed: {
    label: "Completed",
    className: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
    icon: CheckCircle2,
  },
  failed: {
    label: "Failed",
    className: "border-red-500/25 bg-red-500/10 text-red-300",
    icon: AlertCircle,
  },
};

function getFileExtension(filename: string) {
  const normalized = filename.toLowerCase();
  const dotIndex = normalized.lastIndexOf(".");
  return dotIndex >= 0 ? normalized.slice(dotIndex) : "";
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function validateFile(file: File) {
  const extension = getFileExtension(file.name);

  if (!SUPPORTED_EXTENSIONS.includes(extension)) {
    return "Unsupported file type. Supported formats are PDF, TXT, DOCX, CSV, XLSX, and PPTX.";
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return `This file is too large. Please upload a supported document up to ${MAX_UPLOAD_MB}MB.`;
  }

  return null;
}

function getDuplicateNames(files: File[]) {
  const counts = new Map<string, number>();

  files.forEach((file) => {
    const name = file.name.trim().toLowerCase();
    counts.set(name, (counts.get(name) || 0) + 1);
  });

  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([name]) => name);
}

export default function UploadPage() {
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [queueMessage, setQueueMessage] = useState<string | null>(null);
  const [isUploadingQueue, setIsUploadingQueue] = useState(false);
  const [collections, setCollections] = useState<UploadCollection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("none");
  const selectedCollectionRef = useRef<string>("none");

  useEffect(() => {
    selectedCollectionRef.current = selectedCollectionId;
  }, [selectedCollectionId]);

  useEffect(() => {
    (async () => {
      try {
        const accessToken = await getAccessToken();
        if (!accessToken) return;
        const res = await fetch("/api/collections", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setCollections(
          (data.collections || []).map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })),
        );
      } catch {
        // Collections are optional at upload time.
      }
    })();
  }, []);

  const queuedCount = queue.filter((item) => item.status === "queued").length;
  const activeCount = queue.filter((item) => item.status === "uploading" || item.status === "processing").length;
  const completedCount = queue.filter((item) => item.status === "completed").length;
  const failedCount = queue.filter((item) => item.status === "failed").length;

  const updateQueueItem = useCallback((id: string, update: Partial<UploadQueueItem>) => {
    setQueue((current) =>
      current.map((item) => (item.id === id ? { ...item, ...update } : item)),
    );
  }, []);

  const addFilesToQueue = useCallback((files: File[]) => {
    if (files.length === 0) return;

    const duplicateNames = getDuplicateNames(files);
    setDuplicateWarning(
      duplicateNames.length > 0
        ? "Some selected files have the same filename. They can still upload, but you may want to rename them for easier tracking."
        : null,
    );

    const items = files.map((file) => {
      const validationError = validateFile(file);

      return {
        id: crypto.randomUUID(),
        file,
        status: validationError ? "failed" : "queued",
        message: validationError || "Ready to upload.",
      } satisfies UploadQueueItem;
    });

    setQueue((current) => [...items, ...current]);
    setQueueMessage(null);
  }, []);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      addFilesToQueue(acceptedFiles);
    },
    [addFilesToQueue],
  );

  const onDropRejected = useCallback(() => {
    setQueueMessage(`Some files could not be added. Please choose ${SUPPORTED_UPLOAD_COPY}.`);
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    onDropRejected,
    multiple: true,
    noClick: true,
  });

  const pollDocumentUntilFinished = useCallback(
    async (queueItemId: string, documentId: string) => {
      const startedAt = Date.now();

      while (Date.now() - startedAt < PROCESSING_POLL_TIMEOUT_MS) {
        const { data, error } = await supabase
          .from("documents")
          .select("status,error_message")
          .eq("id", documentId)
          .single<DocumentStatusResponse>();

        if (error) {
          throw new Error("Upload succeeded, but the processing status could not be checked.");
        }

        if (data.status === "ready") {
          updateQueueItem(queueItemId, {
            status: "completed",
            message: "Ready for questions.",
          });
          return;
        }

        if (data.status === "failed") {
          updateQueueItem(queueItemId, {
            status: "failed",
            message: data.error_message || "Processing failed. Please try another copy of this document.",
          });
          return;
        }

        await sleep(PROCESSING_POLL_INTERVAL_MS);
      }

      updateQueueItem(queueItemId, {
        status: "processing",
        message: "Still processing. You can check the documents page for the latest status.",
      });
    },
    [updateQueueItem],
  );

  const uploadQueueItem = useCallback(
    async (item: UploadQueueItem) => {
      const validationError = validateFile(item.file);

      if (validationError) {
        updateQueueItem(item.id, { status: "failed", message: validationError });
        return;
      }

      updateQueueItem(item.id, { status: "uploading", message: "Uploading file..." });

      try {
        const accessToken = await getAccessToken();
        if (!accessToken) throw new Error("Authentication session expired. Please sign in again.");

        const formData = new FormData();
        formData.append("file", item.file);
        if (selectedCollectionRef.current && selectedCollectionRef.current !== "none") {
          formData.append("collectionId", selectedCollectionRef.current);
        }

        const response = await fetch("/api/documents/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
        });

        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.error || "Upload failed. Please try again.");
        }

        const documentId = payload?.documentId as string | undefined;
        if (!documentId) throw new Error("Upload succeeded, but processing could not be tracked.");

        updateQueueItem(item.id, {
          documentId,
          status: "processing",
          message: "Uploaded. Preparing document for questions...",
        });

        await pollDocumentUntilFinished(item.id, documentId);
      } catch (error) {
        updateQueueItem(item.id, {
          status: "failed",
          message: error instanceof Error ? error.message : "Upload failed. Please try again.",
        });
      }
    },
    [pollDocumentUntilFinished, updateQueueItem],
  );

  const runQueue = useCallback(
    async (items: UploadQueueItem[]) => {
      if (items.length === 0) return;

      setIsUploadingQueue(true);
      setQueueMessage(null);

      try {
        let nextIndex = 0;
        const workerCount = Math.min(UPLOAD_CONCURRENCY, items.length);

        await Promise.all(
          Array.from({ length: workerCount }, async () => {
            while (nextIndex < items.length) {
              const item = items[nextIndex];
              nextIndex += 1;
              await uploadQueueItem(item);
            }
          }),
        );
      } finally {
        setIsUploadingQueue(false);
      }
    },
    [uploadQueueItem],
  );

  const startUpload = useCallback(async () => {
    const items = queue.filter((item) => item.status === "queued");
    await runQueue(items);
  }, [queue, runQueue]);

  const retryUpload = useCallback(
    async (item: UploadQueueItem) => {
      updateQueueItem(item.id, { status: "queued", message: "Waiting to retry..." });
      await runQueue([{ ...item, status: "queued", message: "Waiting to retry..." }]);
    },
    [runQueue, updateQueueItem],
  );

  const removeItem = useCallback((id: string) => {
    setQueue((current) => current.filter((item) => item.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    setQueue((current) => current.filter((item) => item.status !== "completed"));
  }, []);

  return (
    <div className="admin-page">
      <AppPageHeader
        title="Upload approved documents"
        subtitle={`Add approved documents your team can ask questions from. ${SUPPORTED_UPLOAD_COPY}.`}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          <section className="admin-shell-card p-3 sm:p-4">
            <div
              {...getRootProps()}
              className={cn(
                "flex flex-col items-center justify-center gap-2.5 rounded-lg border border-dashed px-4 py-6 text-center transition-colors",
                isDragActive
                  ? "border-[var(--accent-jade-100)] bg-[var(--accent-jade-50)]"
                  : "border-[var(--line)] bg-[var(--canvas-soft)] hover:bg-[var(--surface-2)]",
              )}
            >
              <input {...getInputProps()} aria-label="Select documents to upload" />
              <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)]">
                <Upload size={16} strokeWidth={1.5} />
              </div>
              <div className="space-y-0.5">
                <p className="text-[13px] font-medium text-[var(--ink)]">
                  {isDragActive ? "Release to add files" : "Drag files here to add them to the queue"}
                </p>
                <p className="text-[11px] text-[var(--ink-muted)]">
                  Up to {MAX_UPLOAD_MB}MB per file. Each file uploads and processes independently.
                </p>
              </div>
              <AppButton
                type="button"
                tone="secondary"
                onClick={open}
                className="mt-1 h-9 px-3 text-[12px]"
              >
                <Upload size={14} />
                Choose files
              </AppButton>
            </div>

            {collections.length > 0 ? (
              <div className="mt-3 flex flex-col gap-2 border-t border-[var(--line-soft)] pt-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[12px] font-medium text-[var(--ink)]">Collection</p>
                  <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">
                    New files in this batch are added to the selected collection.
                  </p>
                </div>
                <Select value={selectedCollectionId} onValueChange={setSelectedCollectionId}>
                  <SelectTrigger className="h-9 w-full rounded-md border-[var(--line)] bg-[var(--surface)] px-2.5 text-[12px] focus-visible:border-[var(--accent-jade)] focus-visible:ring-2 focus-visible:ring-[var(--accent-jade-100)] sm:w-[220px]">
                    <SelectValue placeholder="Unassigned" />
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
              </div>
            ) : null}
          </section>

          {duplicateWarning ? (
            <div className="flex items-start gap-2 rounded-[10px] border border-amber-500/25 bg-amber-500/[0.07] px-3 py-2 text-[12px] leading-5 text-amber-300">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <p>{duplicateWarning}</p>
            </div>
          ) : null}

          {queueMessage ? (
            <div className="flex items-start gap-2 rounded-[10px] border border-red-500/25 bg-red-500/[0.07] px-3 py-2 text-[12px] leading-5 text-red-300">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <p>{queueMessage}</p>
            </div>
          ) : null}

          {queue.length > 0 ? (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-[10px] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[11px]">
              <span className="text-[var(--ink-muted)]">This batch</span>
              <span className="inline-flex items-center gap-1.5 text-[var(--ink-soft)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--ink-muted)]" />
                {queuedCount} waiting
              </span>
              <span className="inline-flex items-center gap-1.5 text-[var(--ink-soft)]">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                {activeCount} active
              </span>
              <span className="inline-flex items-center gap-1.5 text-[var(--ink-soft)]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {completedCount} ready
              </span>
              <span className="inline-flex items-center gap-1.5 text-[var(--ink-soft)]">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                {failedCount} failed
              </span>
            </div>
          ) : null}

          <section className="admin-shell-card min-w-0 overflow-hidden">
            <div className="flex flex-col gap-2 border-b border-[var(--line)] px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-baseline gap-2">
                <h2 className="text-[14px] font-semibold text-[var(--ink)]">Upload queue</h2>
                <span className="text-[11px] tabular-nums text-[var(--ink-muted)]">
                  {queue.length} {queue.length === 1 ? "file" : "files"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {completedCount > 0 ? (
                  <AppButton
                    type="button"
                    tone="secondary"
                    onClick={clearCompleted}
                    className="h-9 px-2.5 text-[11px]"
                  >
                    Clear completed
                  </AppButton>
                ) : null}
                <AppButton
                  type="button"
                  onClick={startUpload}
                  disabled={queuedCount === 0 || isUploadingQueue}
                  className="h-9 px-3 text-[12px]"
                >
                  {isUploadingQueue ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                  Upload queue
                </AppButton>
              </div>
            </div>

            {queue.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-md border border-[var(--line)] bg-[var(--surface-2)]">
                  <File size={16} className="text-[var(--ink-muted)]" />
                </div>
                <p className="mt-2 text-[12px] font-medium text-[var(--ink)]">No files selected</p>
                <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">
                  Choose or drag files to build an upload queue.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-[var(--line-soft)]">
                {queue.map((item) => (
                  <QueueRow
                    key={item.id}
                    item={item}
                    onRemove={() => removeItem(item.id)}
                    onRetry={() => retryUpload(item)}
                    disableActions={item.status === "uploading" || item.status === "processing"}
                  />
                ))}
              </ul>
            )}
          </section>

          {completedCount > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] border border-emerald-500/25 bg-emerald-500/[0.07] px-3 py-2">
              <p className="flex items-center gap-2 text-[12px] text-emerald-300">
                <CheckCircle2 size={14} className="shrink-0" />
                <span>
                  {completedCount} {completedCount === 1 ? "document is" : "documents are"} ready. Your team can ask questions from these sources.
                </span>
              </p>
              <div className="flex items-center gap-3 text-[11px]">
                <Link
                  href="/dashboard/chat"
                  className="font-medium text-[var(--accent-jade)] hover:text-[var(--accent-jade-hover)]"
                >
                  Open chat
                </Link>
                <Link
                  href="/dashboard/documents"
                  className="font-medium text-[var(--ink-muted)] hover:text-[var(--ink)]"
                >
                  View documents
                </Link>
              </div>
            </div>
          ) : null}
        </div>

        <aside className="admin-shell-card h-fit p-4">
          <header>
            <h2 className="text-[14px] font-semibold text-[var(--ink)]">Upload rules</h2>
            <p className="mt-0.5 text-[11px] leading-5 text-[var(--ink-muted)]">
              What this workspace accepts and how files are handled.
            </p>
          </header>

          <dl className="mt-3 divide-y divide-[var(--line-soft)]">
            {UPLOAD_RULES.map((rule) => (
              <div key={rule.label} className="flex items-start justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                <dt className="shrink-0 text-[11px] text-[var(--ink-muted)]">{rule.label}</dt>
                <dd className="min-w-0 text-right text-[12px] leading-5 text-[var(--ink-soft)]">
                  {rule.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-3 border-t border-[var(--line-soft)] pt-3">
            <p className="text-[12px] font-medium text-[var(--ink)]">Queue status</p>
            <ul className="mt-1.5 space-y-1 text-[11px] leading-5 text-[var(--ink-muted)]">
              {QUEUE_STATUS_KEY.map((status) => (
                <li key={status.label}>
                  <span className="font-medium text-[var(--ink-soft)]">{status.label}</span> — {status.copy}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function QueueRow({
  item,
  onRemove,
  onRetry,
  disableActions,
}: {
  item: UploadQueueItem;
  onRemove: () => void;
  onRetry: () => void;
  disableActions: boolean;
}) {
  const config = statusConfig[item.status];
  const StatusIcon = config.icon;
  const canRetry = item.status === "failed";
  const canRemove = item.status === "queued" || item.status === "failed" || item.status === "completed";

  return (
    <li className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-4">
      <div className="flex min-w-0 items-start gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[var(--line)] bg-[var(--surface-2)]">
          <File size={14} className="text-[var(--ink-muted)]" />
        </div>
        <div className="min-w-0">
          <p title={item.file.name} className="truncate text-[12px] font-medium text-[var(--ink)]">
            {item.file.name}
          </p>
          <p className="text-[11px] tabular-nums text-[var(--ink-muted)]">
            {formatFileSize(item.file.size)} · {getFileExtension(item.file.name).replace(".", "").toUpperCase() || "FILE"}
          </p>
          {item.message ? (
            <p
              title={item.message}
              className={cn(
                "mt-0.5 line-clamp-1 text-[11px] leading-5",
                item.status === "failed" ? "text-red-300" : "text-[var(--ink-muted)]",
              )}
            >
              {item.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-1 sm:justify-end">
        <span className={cn("inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium", config.className)}>
          <StatusIcon
            size={11}
            className={item.status === "uploading" || item.status === "processing" ? "animate-spin" : undefined}
          />
          {config.label}
        </span>

        {canRetry ? (
          <button
            type="button"
            onClick={onRetry}
            disabled={disableActions}
            aria-label={`Retry upload for ${item.file.name}`}
            title="Retry upload"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--ink-muted)] transition-colors hover:bg-[var(--accent-jade-50)] hover:text-[var(--accent-jade)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw size={13} />
          </button>
        ) : null}

        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          aria-label={`Remove ${item.file.name} from upload queue`}
          title="Remove from queue"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--ink-muted)] transition-colors hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-30"
        >
          {canRemove ? <X size={14} /> : <Trash2 size={13} />}
        </button>
      </div>
    </li>
  );
}
