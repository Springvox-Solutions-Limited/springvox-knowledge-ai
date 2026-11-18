import { FileText } from "lucide-react";

import { CitationMark } from "./ui";
import { cn } from "@/src/lib/utils";

export type AnswerSource = {
  index: number;
  file: string;
  location: string;
};

type AnswerPanelProps = {
  question: string;
  answer: React.ReactNode;
  sources: AnswerSource[];
  meta?: string;
  workspace?: string;
  compact?: boolean;
  className?: string;
};

/**
 * The product's moment: a cited answer with a source rail. Mock data is
 * plausible and labelled as a preview by the surrounding copy.
 */
export function AnswerPanel({
  question,
  answer,
  sources,
  meta = "Answered from 2 of 148 documents",
  workspace = "Support workspace",
  compact = false,
  className,
}: AnswerPanelProps) {
  return (
    <div
      data-answer-panel
      className={cn(
        "overflow-hidden rounded-[16px] border border-[var(--line)] bg-[var(--surface)]",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-4 border-b border-[var(--line)] px-5 py-3">
        <span className="font-meta text-[11px] text-[var(--ink-muted)]">
          {workspace}
        </span>
        <span className="flex items-center gap-2 font-meta text-[11px] text-[var(--ink-soft)]">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-emerald-400"
          />
          Grounded
        </span>
      </div>

      <div className={cn("grid gap-0", compact ? "" : "md:grid-cols-[1fr_236px]")}>
        <div className="border-b border-[var(--line)] p-5 md:border-b-0 md:border-r">
          <p className="font-meta text-[11px] text-[var(--ink-muted)]">
            Question
          </p>
          <p className="mt-2 text-[15px] leading-6 text-[var(--ink)]">
            {question}
          </p>

          <p className="mt-5 font-meta text-[11px] text-[var(--ink-muted)]">
            Answer
          </p>
          <p
            data-answer-body
            className="mt-2 text-[15px] leading-7 text-[var(--ink-soft)]"
          >
            {answer}
          </p>

          {!compact ? (
            <div className="mt-6 border-t border-[var(--line)] pt-4">
              <div className="flex items-center gap-2 text-[var(--ink-muted)]">
                <span aria-hidden="true" className="h-px w-6 bg-[var(--line)]" />
                <span className="font-meta text-[11px]">{meta}</span>
              </div>
            </div>
          ) : null}
        </div>

        <div
          data-cite-rail
          className="bg-[var(--surface-2)] p-4"
          aria-label="Sources"
        >
          <p className="font-meta text-[11px] text-[var(--ink-muted)]">
            Sources
          </p>
          <ul className="mt-3 space-y-3">
            {sources.map((source) => (
              <li key={`${source.file}-${source.index}`}>
                <div className="flex items-start gap-2.5 text-[13px] leading-5 text-[var(--ink-soft)]">
                  <span className="mt-0.5 font-meta text-[11px] text-[var(--accent-jade)]">
                    {source.index}
                  </span>
                  <FileText
                    size={14}
                    strokeWidth={1.5}
                    className="mt-1 shrink-0 text-[var(--ink-muted)]"
                    aria-hidden="true"
                  />
                  <span className="min-w-0">
                    <span className="block break-words [overflow-wrap:anywhere]">{source.file}</span>
                    <span className="mt-0.5 block font-meta text-[11px] text-[var(--ink-muted)]">
                      {source.location}
                    </span>
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-[var(--line)] pt-3 font-meta text-[10px] leading-4 text-[var(--ink-muted)]">
            Preview of the workspace
          </p>
        </div>
      </div>
    </div>
  );
}

export function CitedSentence({
  children,
  sources,
}: {
  children: React.ReactNode;
  sources: number[];
}) {
  return (
    <>
      {children}
      {sources.map((n) => (
        <CitationMark key={n} n={n} />
      ))}
    </>
  );
}
