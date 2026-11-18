"use client";

import ReactMarkdown from "react-markdown";
import {
  Check,
  Copy,
  FileText,
  Loader2,
  Pencil,
  RefreshCw,
  Square,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";

import { cn } from "@/src/lib/utils";
import type { FeedbackRating } from "@/src/lib/workspace";
import { AiMark } from "./AiMark";
import type { ViewerViewCitation, ViewerMessage as ViewerMessageType } from "./types";

function statusText(message: ViewerMessageType, active: boolean) {
  const status = (message.statusMessage || "").toLowerCase();
  if (status.includes("no supported answer")) {
    return "No supported answer in the approved documents.";
  }
  if (message.error) {
    return message.statusMessage || "The answer could not be completed.";
  }
  if (active) {
    const value = message.statusMessage || "";
    if (/thinking|preparing|searching|matching|verifying|attaching/i.test(value)) {
      return "Reading approved documents…";
    }
    return value || "Reading approved documents…";
  }
  return "Answered from the approved documents.";
}

export function ViewerMessage({
  message,
  active,
  loading,
  copied,
  elapsedSeconds,
  retryQuestion,
  feedbackLoading,
  onCopy,
  onEdit,
  onRegenerate,
  onRetry,
  onStop,
  onOpenSource,
  onFollowUp,
  onFeedback,
}: {
  message: ViewerMessageType;
  active: boolean;
  loading: boolean;
  copied: boolean;
  elapsedSeconds: number;
  retryQuestion: string | null;
  feedbackLoading: boolean;
  onCopy: (content: string, id: string) => void;
  onEdit: (content: string) => void;
  onRegenerate: (id: string) => void;
  onRetry: (event: React.FormEvent, question: string) => void;
  onStop: () => void;
  onOpenSource: (citation: ViewerViewCitation) => void;
  onFollowUp: (question: string) => void;
  onFeedback: (messageId: string, rating: FeedbackRating) => void;
}) {
  if (message.role === "user") {
    return (
      <div className="group/user flex flex-col items-end">
        <div className="max-w-[86%] rounded-[18px] bg-[var(--surface-2)] px-4 py-2.5 text-[15px] leading-7 text-[var(--ink)] whitespace-pre-wrap sm:max-w-[75%]">
          {message.content}
        </div>
        {!loading ? (
          <button
            type="button"
            onClick={() => onEdit(message.content)}
            className="mt-1 inline-flex h-6 items-center gap-1 rounded-[5px] px-1.5 text-[10px] text-[var(--ink-muted)] opacity-100 transition-opacity hover:bg-[var(--surface)] hover:text-[var(--ink)] sm:opacity-0 sm:group-hover/user:opacity-100 sm:focus-visible:opacity-100"
            aria-label="Edit and resend this question"
          >
            <Pencil size={11} />
            Edit
          </button>
        ) : null}
      </div>
    );
  }

  const hasContent = Boolean(message.content);

  return (
    <article className="group/answer min-w-0">
      <div className="flex items-center gap-2">
        <AiMark size={16} className="h-4 w-4" />
        {active || message.error ? (
          <span className="truncate text-[10px] text-[var(--ink-muted)]">
            {statusText(message, active)}
          </span>
        ) : null}
        {active ? (
          <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] tabular-nums text-[var(--ink-muted)]">
            <Loader2
              size={11}
              className="animate-spin text-[var(--accent-jade)] motion-reduce:animate-none"
              aria-hidden="true"
            />
            {elapsedSeconds.toFixed(1)}s
          </span>
        ) : null}
      </div>

      {active && !hasContent ? (
        <div className="mt-3 flex items-center gap-2 text-[13px] text-[var(--ink-muted)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-jade)]" />
          Searching the approved documents…
        </div>
      ) : null}

      {hasContent ? (
        <div className={cn("markdown-container mt-3 min-w-0 text-[15px] leading-8 text-[var(--ink)]")}>
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
      ) : null}

      {!hasContent && message.statusMessage && !active ? (
        <p className="mt-3 text-[13px] leading-6 text-[var(--ink-muted)]">
          {statusText(message, false)}
        </p>
      ) : null}

      <div
        className={cn(
          "mt-2 flex flex-wrap items-center gap-0.5 transition-opacity",
          active
            ? "opacity-100"
            : "opacity-100 sm:opacity-0 sm:focus-within:opacity-100 sm:group-hover/answer:opacity-100",
        )}
      >
        {hasContent ? (
          <button
            type="button"
            onClick={() => onCopy(message.content, message.id)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-[5px] text-[var(--ink-muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--ink)]"
            aria-label={copied ? "Copied" : "Copy answer"}
            title={copied ? "Copied" : "Copy"}
          >
            {copied ? <Check size={12} className="text-emerald-300" /> : <Copy size={12} />}
          </button>
        ) : null}

        {message.citations?.length ? (
          <button
            type="button"
            onClick={() => onOpenSource(message.citations![0])}
            aria-label="Open source"
            title="Open source"
            className="inline-flex h-7 w-7 items-center justify-center rounded-[5px] text-[var(--ink-muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--ink)]"
          >
            <FileText size={12} />
          </button>
        ) : null}

        {message.error && retryQuestion ? (
          <button
            type="button"
            onClick={(event) => onRetry(event, retryQuestion)}
            disabled={loading}
            aria-label="Retry"
            title="Retry"
            className="inline-flex h-7 w-7 items-center justify-center rounded-[5px] text-[var(--ink-muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--ink)]"
          >
            <RefreshCw size={12} />
          </button>
        ) : hasContent && !loading ? (
          <button
            type="button"
            onClick={() => onRegenerate(message.id)}
            aria-label="Regenerate answer"
            title="Regenerate"
            className="inline-flex h-7 w-7 items-center justify-center rounded-[5px] text-[var(--ink-muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--ink)]"
          >
            <RefreshCw size={12} />
          </button>
        ) : null}

        {active ? (
          <button
            type="button"
            onClick={onStop}
            aria-label="Stop generating"
            title="Stop"
            className="inline-flex h-7 w-7 items-center justify-center rounded-[5px] text-[var(--ink-muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--ink)]"
          >
            <Square size={9} className="fill-current" />
          </button>
        ) : null}

        {message.chatMessageId && !message.feedbackSubmitted ? (
          <>
            <button
              type="button"
              disabled={feedbackLoading}
              onClick={() => onFeedback(message.id, "helpful")}
              aria-label="Helpful"
              title="Helpful"
              className="inline-flex h-7 w-7 items-center justify-center rounded-[5px] text-[var(--ink-muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--ink)]"
            >
              <ThumbsUp size={12} />
            </button>
            <button
              type="button"
              disabled={feedbackLoading}
              onClick={() => onFeedback(message.id, "not_helpful")}
              aria-label="Not helpful"
              title="Not helpful"
              className="inline-flex h-7 w-7 items-center justify-center rounded-[5px] text-[var(--ink-muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--ink)]"
            >
              <ThumbsDown size={12} />
            </button>
            {feedbackLoading ? (
              <Loader2 size={11} className="animate-spin text-[var(--ink-muted)] motion-reduce:animate-none" />
            ) : null}
          </>
        ) : null}
      </div>

      {message.followUps && message.followUps.length > 0 ? (
        <div className="mt-5 border-t border-[var(--line)] pt-3">
          <p className="text-[10px] font-medium text-[var(--ink-muted)]">
            Continue
          </p>
          <div className="mt-1.5">
            {message.followUps.slice(0, 4).map((followUp) => (
              <button
                key={followUp}
                type="button"
                disabled={loading}
                onClick={() => onFollowUp(followUp)}
                className="group/follow flex w-full items-start gap-2 border-b border-[var(--line-soft)] py-2 text-left text-[12px] leading-5 text-[var(--ink-soft)] last:border-0 hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="mt-0.5 text-[var(--ink-muted)] group-hover/follow:text-[var(--accent-jade)]">
                  +
                </span>
                {followUp}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}
