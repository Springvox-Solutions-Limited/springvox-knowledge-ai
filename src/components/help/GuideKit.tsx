import React from 'react';
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Info,
  Lightbulb,
  Mic,
  Paperclip,
  Send,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Structure                                                           */
/* ------------------------------------------------------------------ */

export function GuideSection({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 border-t border-[var(--line)] py-8 first:border-t-0 first:pt-0">
      {eyebrow ? (
        <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent-jade)]">{eyebrow}</p>
      ) : null}
      <h2 className="text-xl font-bold tracking-tight text-[var(--ink)] sm:text-2xl">{title}</h2>
      <div className="mt-4 space-y-4 text-[15px] leading-7 text-[var(--ink-soft)]">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Numbered steps                                                      */
/* ------------------------------------------------------------------ */

export function GuideSteps({ children }: { children: React.ReactNode }) {
  const steps = React.Children.toArray(children);
  return (
    <ol className="space-y-4">
      {steps.map((step, index) => (
        <li key={index} className="flex gap-4">
          <div className="flex flex-col items-center">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent-jade)] text-sm font-bold text-[#04110e]">
              {index + 1}
            </span>
            {index < steps.length - 1 ? <span className="mt-1 w-px flex-1 bg-[var(--line)]" /> : null}
          </div>
          <div className="min-w-0 flex-1 pb-1">{step}</div>
        </li>
      ))}
    </ol>
  );
}

export function GuideStep({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div>
      <p className="font-semibold text-[var(--ink)]">{title}</p>
      {children ? <div className="mt-1 text-sm leading-6 text-[var(--ink-soft)]">{children}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Callouts                                                            */
/* ------------------------------------------------------------------ */

const CALLOUT = {
  tip: { icon: Lightbulb, ring: 'border-[var(--accent-jade-100)]', bg: 'bg-[var(--accent-jade-50)]', fg: 'text-[var(--accent-jade)]', label: 'Tip' },
  note: { icon: Info, ring: 'border-[var(--line)]', bg: 'bg-[var(--surface-2)]', fg: 'text-[var(--ink-soft)]', label: 'Note' },
  warning: { icon: TriangleAlert, ring: 'border-amber-500/30', bg: 'bg-amber-500/10', fg: 'text-amber-300', label: 'Important' },
  success: { icon: CheckCircle2, ring: 'border-emerald-500/30', bg: 'bg-emerald-500/10', fg: 'text-emerald-300', label: 'Good to know' },
} as const;

export function GuideCallout({
  tone = 'tip',
  title,
  children,
}: {
  tone?: keyof typeof CALLOUT;
  title?: string;
  children: React.ReactNode;
}) {
  const c = CALLOUT[tone];
  const Icon = c.icon;
  return (
    <div className={`flex gap-3 rounded-2xl border ${c.ring} ${c.bg} p-4`}>
      <Icon size={18} className={`mt-0.5 shrink-0 ${c.fg}`} />
      <div className="min-w-0 text-sm leading-6 text-[var(--ink-soft)]">
        <p className={`font-semibold ${c.fg}`}>{title ?? c.label}</p>
        <div className="mt-1">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Figure frame — wraps a mock so it reads like an annotated screenshot */
/* ------------------------------------------------------------------ */

export function GuideFigure({ caption, children }: { caption?: string; children: React.ReactNode }) {
  return (
    <figure className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--canvas)] shadow-[var(--brand-shadow)]">
      <div className="flex items-center gap-1.5 border-b border-[var(--line)] bg-[var(--surface-2)] px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/60" />
      </div>
      <div className="p-4 sm:p-5">{children}</div>
      {caption ? (
        <figcaption className="border-t border-[var(--line)] px-4 py-2.5 text-xs text-[var(--ink-muted)]">{caption}</figcaption>
      ) : null}
    </figure>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded-md border border-[var(--line)] bg-[var(--surface-2)] px-1.5 py-0.5 font-mono text-[11px] font-semibold text-[var(--ink)]">
      {children}
    </kbd>
  );
}

/* ------------------------------------------------------------------ */
/* Mock UI illustrations (stand-ins for screenshots)                   */
/* ------------------------------------------------------------------ */

export function ChatComposerMock() {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-[11px]">
        <span className="font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">Answer mode</span>
        {['Summary', 'Detailed', 'Executive', 'Technical'].map((m) => (
          <span
            key={m}
            className={
              m === 'Detailed'
                ? 'rounded-full border border-[var(--accent-jade-200)] bg-[var(--accent-jade-50)] px-2.5 py-1 font-semibold text-[var(--accent-jade-hover)]'
                : 'rounded-full border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 text-[var(--ink-muted)]'
            }
          >
            {m}
          </span>
        ))}
        <span className="ml-auto flex items-center gap-2 text-[var(--ink-muted)]">
          Scope
          <span className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 text-[var(--ink-soft)]">All documents ▾</span>
        </span>
      </div>
      <div className="flex items-center gap-2 rounded-2xl border border-[var(--accent-jade)]/50 bg-[var(--surface)] px-3 py-3 shadow-sm ring-4 ring-[var(--accent-jade-100)]">
        <Mic size={16} className="text-[var(--ink-muted)]" />
        <span className="flex-1 text-sm text-[var(--ink-muted)]">Ask anything from your approved documents…</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-jade)] text-[#04110e]">
          <Send size={15} />
        </span>
      </div>
    </div>
  );
}

export function AnswerWithSourcesMock() {
  return (
    <div className="space-y-3">
      <div className="ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-md bg-[var(--surface-2)] px-4 py-2.5 text-sm text-[var(--ink)]">
        What is our remote-work policy?
      </div>
      <div className="flex items-center gap-2 text-xs text-[var(--ink-soft)]">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#0b1413] ring-1 ring-inset ring-[var(--accent-jade)]/25">
          <ShieldCheck size={12} className="text-[var(--accent-jade)]" />
        </span>
        Rekall-IQ
      </div>
      <p className="text-sm leading-6 text-[var(--ink-soft)]">
        Employees may work remotely up to 3 days per week with manager approval. Equipment is provided after 90 days…
      </p>
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-2.5 py-1 text-xs text-[var(--ink-soft)]">
          <FileText size={12} className="text-[var(--accent-jade)]" /> HR-Handbook.pdf · p.12
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-2.5 py-1 text-xs text-[var(--ink-soft)]">
          <FileText size={12} className="text-[var(--accent-jade)]" /> Remote-Policy-2026.docx
        </span>
      </div>
    </div>
  );
}

export function UploadMock() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 text-xs text-[var(--ink-muted)]">
        <span>Upload to collection</span>
        <span className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 text-[var(--ink-soft)]">HR ▾</span>
      </div>
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--accent-jade-200)] bg-[var(--accent-jade-50)] px-4 py-8 text-center">
        <Paperclip size={20} className="text-[var(--accent-jade)]" />
        <p className="text-sm font-semibold text-[var(--ink)]">Drag &amp; drop files, or click to browse</p>
        <p className="text-xs text-[var(--ink-muted)]">PDF, DOCX, XLSX, PPTX, CSV, TXT — up to 20MB each</p>
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5">
        <FileText size={16} className="text-[var(--accent-jade)]" />
        <span className="flex-1 truncate text-sm text-[var(--ink)]">Q1-Finance-Report.xlsx</span>
        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">Ready</span>
      </div>
    </div>
  );
}

export function FileTypesTable() {
  const rows = [
    ['PDF', 'Reports, manuals, scanned policies'],
    ['DOCX', 'Word documents, handbooks'],
    ['XLSX', 'Spreadsheets, finance & data tables'],
    ['PPTX', 'Slide decks, training material'],
    ['CSV', 'Exports, structured data'],
    ['TXT', 'Plain-text notes'],
  ];
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--line)]">
      <table className="w-full text-left text-sm">
        <thead className="bg-[var(--surface-2)] text-[var(--ink-muted)]">
          <tr>
            <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em]">Format</th>
            <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em]">Best for</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--line)]">
          {rows.map(([fmt, use]) => (
            <tr key={fmt}>
              <td className="px-4 py-2.5 font-semibold text-[var(--ink)]">{fmt}</td>
              <td className="px-4 py-2.5 text-[var(--ink-soft)]">{use}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function GuideFaq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <details key={item.q} className="group rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-[var(--ink)]">
            {item.q}
            <ArrowRight size={15} className="shrink-0 text-[var(--ink-muted)] transition-transform group-open:rotate-90" />
          </summary>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
