import { ArrowUpRight, FileText, ShieldCheck } from "lucide-react";

import { cn } from "@/src/lib/utils";
import { DocumentPage } from "./product-visuals";
import { CitationMark } from "./ui";

export function ReceiptComparison({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "grid gap-px overflow-hidden rounded-[18px] border border-[var(--line)] bg-[var(--line)] lg:grid-cols-[0.92fr_1.08fr]",
        className,
      )}
    >
      <div className="flex flex-col bg-[var(--canvas)] p-5 sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <span className="font-meta text-[10px] text-[var(--ink-muted)]">
            A general assistant
          </span>
          <span className="rounded-full border border-[var(--line)] px-2 py-0.5 font-meta text-[9px] text-[var(--ink-muted)]">
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
                <dt className="text-[10px] text-[var(--ink-muted)]">{term}</dt>
                <dd className="font-meta text-[9px] text-[var(--ink-muted)]">{detail}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-auto pt-8">
          <div className="rounded-[10px] border border-dashed border-[var(--line)] px-3 py-3">
            <p className="flex items-center gap-2 font-meta text-[9px] text-[var(--ink-muted)]">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[var(--ink-muted)]" />
              No file. No page. No way to check.
            </p>
          </div>
          <p className="mt-3 font-meta text-[9px] leading-4 text-[var(--ink-muted)]">
            A confident answer is not the same as a checkable one.
          </p>
        </div>
      </div>

      <div className="relative flex flex-col overflow-hidden bg-[var(--surface)] p-5 sm:p-7">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,var(--line-soft)_1px,transparent_1px),linear-gradient(to_bottom,var(--line-soft)_1px,transparent_1px)] [background-size:32px_32px] [mask-image:linear-gradient(to_bottom,transparent,black_30%)]"
        />
        <div className="relative flex items-center justify-between gap-3">
          <span className="font-meta text-[10px] text-[var(--accent-jade)]">
            With Rekall-IQ
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 font-meta text-[9px] text-emerald-300">
            <ShieldCheck size={9} strokeWidth={2} aria-hidden="true" />
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
            <CitationMark n={1} />
            <CitationMark n={2} />
          </p>
        </div>

        <div className="relative mt-5 grid gap-3 sm:grid-cols-[1fr_150px]">
          <div className="overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--canvas)]">
            <div className="flex items-center justify-between border-b border-[var(--line)] px-3 py-2">
              <span className="font-meta text-[9px] text-[var(--ink-muted)]">
                Source receipt
              </span>
              <span className="font-meta text-[8px] text-[var(--ink-muted)]">
                2 of 148 searched
              </span>
            </div>
            {[
              ["1", "Customer_Data_Policy.pdf", "Section 4 · Remote access", "98%"],
              ["2", "Remote_Work_Guide.docx", "Page 6 · Approved systems", "94%"],
            ].map(([index, file, detail, score]) => (
              <div
                key={file}
                className="flex items-start gap-2.5 border-b border-[var(--line-soft)] px-3 py-2.5 last:border-0"
              >
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] bg-[var(--accent-jade-50)] font-meta text-[8px] text-[var(--accent-jade)]">
                  {index}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-meta text-[9px] text-[var(--ink-soft)]">
                    {file}
                  </p>
                  <p className="mt-0.5 text-[9px] text-[var(--ink-muted)]">{detail}</p>
                </div>
                <span className="font-meta text-[8px] text-[var(--ink-muted)]">{score}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5 px-3 py-2">
              <FileText size={9} strokeWidth={1.5} className="text-[var(--accent-jade)]" aria-hidden="true" />
              <span className="font-meta text-[8px] text-[var(--ink-muted)]">
                Every sentence maps to a page
              </span>
              <ArrowUpRight size={9} strokeWidth={1.5} className="ml-auto text-[var(--ink-muted)]" aria-hidden="true" />
            </div>
          </div>

          <div className="hidden sm:block">
            <DocumentPage compact page="24" section="Employee handbook · 6.3" title="Remote access" highlight="Approved systems and workspace credentials are required." />
            <p className="mt-2 font-meta text-[8px] leading-3.5 text-[var(--ink-muted)]">
              The original passage opens beside the answer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
