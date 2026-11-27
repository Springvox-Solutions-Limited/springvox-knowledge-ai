"use client";

import { useState } from "react";
import { ArrowUpRight, FileText, ShieldCheck } from "lucide-react";

import { cn } from "@/src/lib/utils";
import { DocumentPage } from "./product-visuals";
import { CitationMark } from "./ui";

const SOURCES = [
  {
    index: 1,
    file: "Customer_Data_Policy.pdf",
    detail: "Section 4 · Remote access",
    score: "98%",
    page: "24",
    section: "Customer data · policy 04",
    title: "Remote access",
    highlight: "Approved systems and workspace credentials are required.",
  },
  {
    index: 2,
    file: "Remote_Work_Guide.docx",
    detail: "Page 6 · Approved systems",
    score: "94%",
    page: "6",
    section: "Remote work · access",
    title: "Approved systems",
    highlight: "Use company-managed devices and the approved access path.",
  },
];

export function ReceiptComparison({ className }: { className?: string }) {
  const [activeSource, setActiveSource] = useState(1);
  const source = SOURCES.find((item) => item.index === activeSource) ?? SOURCES[0];

  return (
    <div
      className={cn(
        "grid gap-px overflow-hidden rounded-[16px] border border-[var(--line)] bg-[var(--line)] lg:grid-cols-[0.92fr_1.08fr]",
        className,
      )}
    >
      <div className="flex flex-col bg-[var(--canvas)] p-5 sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <span className="font-meta text-[11px] text-[var(--ink-muted)]">
            A general assistant
          </span>
          <span className="rounded-full border border-[var(--line)] px-2 py-0.5 font-meta text-[10px] text-[var(--ink-muted)]">
            Uncited
          </span>
        </div>

        <div className="mt-6 space-y-4">
          <p className="text-[11px] leading-5 text-[var(--ink-muted)]">
            Can staff access the customer data policy remotely?
          </p>
          <p className="text-[15px] leading-7 text-[var(--ink-soft)]">
            Yes, staff can access it remotely when they need to.
          </p>
          <p className="text-[11px] leading-5 text-[var(--ink-muted)]">
            Nothing in the reply says which document it came from, whether that document
            is current, or who approved it.
          </p>

          <dl className="mt-2 divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {[
              ["Source document", "Not provided"],
              ["Page or section", "Not provided"],
              ["Approved by", "Not provided"],
              ["Last updated", "Not provided"],
            ].map(([term, detail]) => (
              <div key={term} className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-[11px] text-[var(--ink-muted)]">{term}</dt>
                <dd className="font-meta text-[10px] text-[var(--ink-muted)]">{detail}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-auto pt-8">
          <div className="rounded-[10px] border border-dashed border-[var(--line)] px-3 py-3">
            <p className="flex items-center gap-2 font-meta text-[10px] text-[var(--ink-muted)]">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[var(--ink-muted)]" />
              No file. No page. No way to check.
            </p>
          </div>
          <p className="mt-3 font-meta text-[10px] leading-4 text-[var(--ink-muted)]">
            A confident answer is not the same as a checkable one.
          </p>
        </div>
      </div>

      <div className="relative flex flex-col overflow-hidden bg-[var(--surface)] p-5 sm:p-7">
        <div className="relative flex items-center justify-between gap-3">
          <span className="font-meta text-[11px] text-[var(--accent-jade)]">
            With Rekall-IQ
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 font-meta text-[10px] text-emerald-300">
            <ShieldCheck size={10} strokeWidth={2} aria-hidden="true" />
            Grounded
          </span>
        </div>

        <div className="relative mt-6">
          <p className="text-[11px] leading-5 text-[var(--ink-muted)]">
            Can staff access the customer data policy remotely?
          </p>
          <p className="mt-3 text-[15px] leading-7 text-[var(--ink)]">
            Yes, through approved company systems, after security training and with
            workspace credentials.
            <CitationMark
              n={1}
              active={activeSource === 1}
              onClick={() => setActiveSource(1)}
            />
            <CitationMark
              n={2}
              active={activeSource === 2}
              onClick={() => setActiveSource(2)}
            />
          </p>
          <p className="mt-2 text-[10px] text-[var(--ink-muted)]">
            Select a citation to inspect the passage it points to.
          </p>
        </div>

        <div className="relative mt-5 grid gap-3 sm:grid-cols-[1fr_150px]">
          <div className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--canvas)]">
            <div className="flex items-center justify-between border-b border-[var(--line)] px-3 py-2">
              <span className="font-meta text-[10px] text-[var(--ink-muted)]">
                Source receipt
              </span>
              <span className="font-meta text-[10px] text-[var(--ink-muted)]">
                {activeSource} of {SOURCES.length} selected
              </span>
            </div>
            {SOURCES.map((item) => {
              const selected = activeSource === item.index;
              return (
                <button
                  key={item.file}
                  type="button"
                  onClick={() => setActiveSource(item.index)}
                  aria-pressed={selected}
                  className={cn(
                    "flex w-full items-start gap-2.5 border-b border-[var(--line-soft)] px-3 py-2.5 text-left transition-colors last:border-0",
                    selected
                      ? "bg-[var(--accent-jade-50)]"
                      : "hover:bg-[var(--canvas-soft)]",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] font-meta text-[9px]",
                      selected
                        ? "bg-[var(--accent-jade)] text-[#04100e]"
                        : "border border-[var(--line)] text-[var(--ink-muted)]",
                    )}
                  >
                    {item.index}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-meta text-[10px] text-[var(--ink-soft)]">
                      {item.file}
                    </span>
                    <span className="mt-0.5 block truncate text-[10px] text-[var(--ink-muted)]">
                      {item.detail}
                    </span>
                  </span>
                  <span className="font-meta text-[9px] text-[var(--ink-muted)]">{item.score}</span>
                </button>
              );
            })}
            <div className="flex items-center gap-1.5 px-3 py-2">
              <FileText size={9} strokeWidth={1.5} className="text-[var(--accent-jade)]" aria-hidden="true" />
              <span className="font-meta text-[9px] text-[var(--ink-muted)]">
                Every sentence maps to a page
              </span>
              <ArrowUpRight size={9} strokeWidth={1.5} className="ml-auto text-[var(--ink-muted)]" aria-hidden="true" />
            </div>
          </div>

          <div className="hidden sm:block">
            <div key={source.index} className="animate-in fade-in duration-200 motion-reduce:animate-none">
              <DocumentPage
                compact
                page={source.page}
                section={source.section}
                title={source.title}
                highlight={source.highlight}
              />
            </div>
            <p className="mt-2 font-meta text-[9px] leading-4 text-[var(--ink-muted)]" aria-live="polite">
              {source.file} · {source.detail}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
