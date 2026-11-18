import {
  BarChart3,
  Check,
  ChevronDown,
  CircleAlert,
  Clock3,
  FileSearch,
  FileText,
  Folder,
  Layers3,
  ListChecks,
  MessageSquare,
  Mic,
  Paperclip,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";

import { BrandLogo } from "@/src/components/brand/BrandLogo";
import { cn } from "@/src/lib/utils";
import { CitationMark } from "./ui";

/* ------------------------------------------------------------------ */
/* Window chrome                                                       */
/* ------------------------------------------------------------------ */

export function AppWindow({
  children,
  className,
  workspace = "Northstar workspace",
  path = "people / ask",
  status = "Preview · sample data",
}: {
  children: React.ReactNode;
  className?: string;
  workspace?: string;
  path?: string;
  status?: string;
}) {
  return (
    <div
      className={cn(
        "mk-window overflow-hidden bg-[var(--canvas)] text-left",
        className,
      )}
    >
      <div className="flex h-10 items-center gap-3 border-b border-[var(--line)] bg-[var(--surface)] px-3 sm:px-4">
        <div aria-hidden="true" className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[var(--line)]" />
          <span className="h-2 w-2 rounded-full bg-[var(--line)]" />
          <span className="h-2 w-2 rounded-full bg-[var(--accent-jade-200)]" />
        </div>
        <div className="ml-1 flex min-w-0 items-center gap-2">
          <span className="truncate text-[11px] font-medium text-[var(--ink-soft)]">
            {workspace}
          </span>
          <span aria-hidden="true" className="text-[10px] text-[var(--ink-muted)]">
            /
          </span>
          <span className="hidden truncate font-meta text-[10px] text-[var(--ink-muted)] sm:inline">
            {path}
          </span>
        </div>
        <span className="ml-auto shrink-0 font-meta text-[9px] text-[var(--ink-muted)] sm:hidden">
          Preview
        </span>
        <span className="ml-auto hidden shrink-0 font-meta text-[9px] text-[var(--ink-muted)] sm:inline">
          {status}
        </span>
      </div>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sidebar                                                             */
/* ------------------------------------------------------------------ */

const NAV = [
  { label: "Ask", icon: MessageSquare, count: null, active: true },
  { label: "Library", icon: Folder, count: "148" },
  { label: "Gaps", icon: ListChecks, count: "7" },
  { label: "Analytics", icon: BarChart3, count: null },
];

const COLLECTIONS = [
  ["People", "32"],
  ["Support", "41"],
  ["Operations", "27"],
  ["Legal", "11"],
  ["Finance", "18"],
];

export function WorkspaceSidebar({
  active = "Ask",
  className,
}: {
  active?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "hidden min-w-0 flex-col border-r border-[var(--line)] bg-[var(--brand-sidebar)] p-3 md:flex",
        className,
      )}
    >
      <div className="flex items-center gap-2 px-1 py-1">
        <BrandLogo imageClassName="h-6" className="[&>span]:text-[14px]" />
        <ChevronDown
          size={12}
          strokeWidth={1.5}
          className="ml-auto text-[var(--ink-muted)]"
          aria-hidden="true"
        />
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-[8px] border border-[var(--line)] bg-[var(--canvas)] px-2.5 py-2 text-[10px] text-[var(--ink-muted)]">
        <Search size={12} strokeWidth={1.5} aria-hidden="true" />
        Search
        <span className="ml-auto rounded border border-[var(--line)] px-1 font-meta text-[8px]">
          ⌘K
        </span>
      </div>

      <p className="mt-5 px-2 font-meta text-[9px] text-[var(--ink-muted)]">
        Workspace
      </p>
      <ul className="mt-2 space-y-0.5">
        {NAV.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.label;
          return (
            <li key={item.label}>
              <div
                className={cn(
                  "flex items-center gap-2 rounded-[6px] px-2 py-1.5 text-[11px]",
                  isActive
                    ? "border border-[var(--accent-jade-100)] bg-[var(--accent-jade-50)] text-[var(--ink)]"
                    : "border border-transparent text-[var(--ink-soft)]",
                )}
              >
                <Icon
                  size={12}
                  strokeWidth={1.5}
                  aria-hidden="true"
                  className={isActive ? "text-[var(--accent-jade)]" : ""}
                />
                <span className="truncate">{item.label}</span>
                {item.count ? (
                  <span className="ml-auto font-meta text-[9px] text-[var(--ink-muted)]">
                    {item.count}
                  </span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-5 px-2 font-meta text-[9px] text-[var(--ink-muted)]">
        Collections
      </p>
      <ul className="mt-2 space-y-0.5">
        {COLLECTIONS.map(([label, count]) => (
          <li
            key={label}
            className="flex items-center gap-2 rounded-[6px] px-2 py-1.5 text-[11px] text-[var(--ink-soft)]"
          >
            <span aria-hidden="true" className="h-1 w-1 rounded-full bg-[var(--line)]" />
            <span className="truncate">{label}</span>
            <span className="ml-auto font-meta text-[9px] text-[var(--ink-muted)]">
              {count}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-5">
        <div className="rounded-[8px] border border-[var(--line)] bg-[var(--canvas)] p-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-[var(--ink-soft)]">
              Beta workspace
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </div>
          <p className="mt-1 font-meta text-[8px] leading-3.5 text-[var(--ink-muted)]">
            Documents stay inside this workspace
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Source rail                                                         */
/* ------------------------------------------------------------------ */

export const HERO_SOURCES = [
  {
    index: 1,
    file: "Parental_Leave_Policy.pdf",
    location: "p. 8 · section 4",
    collection: "People",
    match: "98",
  },
  {
    index: 2,
    file: "Employee_Handbook.pdf",
    location: "§ 6.3 · p. 24",
    collection: "People",
    match: "94",
  },
];

export function SourceRail({
  active = 1,
  className,
  sources = HERO_SOURCES,
}: {
  active?: number;
  className?: string;
  sources?: typeof HERO_SOURCES;
}) {
  return (
    <div
      className={cn(
        "hidden min-w-0 flex-col border-l border-[var(--line)] bg-[var(--surface)] p-3 lg:flex",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-meta text-[9px] text-[var(--ink-muted)]">
          Sources · {sources.length}
        </span>
        <ShieldCheck
          size={12}
          strokeWidth={1.5}
          className="text-[var(--accent-jade)]"
          aria-hidden="true"
        />
      </div>

      <div className="mt-3 space-y-2">
        {sources.map((source) => {
          const isActive = source.index === active;
          return (
            <div
              key={source.file}
              className={cn(
                "rounded-[8px] border p-2.5",
                isActive
                  ? "border-[var(--accent-jade-100)] bg-[var(--accent-jade-50)]"
                  : "border-[var(--line)] bg-[var(--canvas)]",
              )}
            >
              <div className="flex items-start gap-2">
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] font-meta text-[9px]",
                    isActive
                      ? "bg-[var(--accent-jade)] text-[#04100e]"
                      : "border border-[var(--line)] text-[var(--ink-muted)]",
                  )}
                >
                  {source.index}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-medium text-[var(--ink)]">
                    {source.file}
                  </p>
                  <p className="mt-0.5 truncate font-meta text-[9px] text-[var(--ink-soft)]">
                    {source.location}
                  </p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-[var(--line)] pt-1.5">
                <span className="font-meta text-[9px] text-[var(--ink-soft)]">
                  {source.collection} · {source.match}% match
                </span>
                <span className="font-meta text-[8px] text-[var(--accent-jade)]">
                  Open
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 rounded-[8px] border border-[var(--line)] bg-[var(--canvas)] p-2.5">
        <p className="font-meta text-[8px] text-[var(--ink-muted)]">
          Every claim, mapped
        </p>
        <p className="mt-1 text-[9px] leading-4 text-[var(--ink-soft)]">
          Superscripts open the exact page the sentence came from.
        </p>
      </div>

      <div className="mt-auto pt-3">
        <p className="font-meta text-[8px] leading-3.5 text-[var(--ink-muted)]">
          Preview of the workspace. Sample content only.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Composer                                                            */
/* ------------------------------------------------------------------ */

export function AnswerComposer({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-2.5", className)}>
      <div className="flex items-center gap-2 text-[10px] text-[var(--ink-muted)]">
        <span className="rounded border border-[var(--accent-jade-100)] bg-[var(--accent-jade-50)] px-1.5 py-0.5 font-meta text-[8px] text-[var(--accent-jade)]">
          Detailed
        </span>
        <span className="rounded border border-[var(--line)] px-1.5 py-0.5 font-meta text-[8px]">
          All documents
        </span>
        <span className="ml-auto hidden font-meta text-[8px] sm:inline">
          ↵ to send
        </span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Paperclip size={12} strokeWidth={1.5} className="text-[var(--ink-muted)]" aria-hidden="true" />
        <span className="flex-1 truncate text-[10px] text-[var(--ink-muted)]">
          Ask a question about your documents
        </span>
        <Mic size={12} strokeWidth={1.5} className="text-[var(--ink-muted)]" aria-hidden="true" />
        <span className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-[var(--accent-jade)] text-[#04100e]">
          <span className="text-[11px] leading-none">↑</span>
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Document page (paper material inside the dark console)               */
/* ------------------------------------------------------------------ */

export function DocumentPage({
  title = "Parental leave",
  section = "People operations · policy 04",
  className,
  highlight = "Eligible employees may take up to 16 weeks of parental leave.",
  page = "8",
  compact = false,
}: {
  title?: string;
  section?: string;
  className?: string;
  highlight?: string;
  page?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[6px] border border-black/10 bg-[#e9e9e2] text-[#20241f] shadow-[0_14px_34px_rgba(0,0,0,0.45)]",
        className,
      )}
    >
      <div className="mk-grain pointer-events-none absolute inset-0 opacity-[0.05]" aria-hidden="true" />
      <div className={cn("relative", compact ? "p-3.5" : "p-5")}>
        <div className="flex items-center justify-between border-b border-black/10 pb-2">
          <span className="font-meta text-[8px] text-black/55">
            {section}
          </span>
          <span className="font-meta text-[7px] text-black/40">{page} / 32</span>
        </div>
        <p
          className={cn(
            "mt-3 font-medium tracking-[-0.01em] text-[#1a1f1a]",
            compact ? "text-[11px]" : "text-[14px]",
          )}
        >
          {title}
        </p>
        <div className="mt-2.5 space-y-1.5" aria-hidden="true">
          <span className="block h-[3px] w-full rounded-full bg-black/10" />
          <span className="block h-[3px] w-[91%] rounded-full bg-black/10" />
          <span className="block h-[3px] w-[78%] rounded-full bg-black/10" />
        </div>
        <p
          className={cn(
            "mt-3 border-l-2 border-[#0f8f7f] bg-[#14b8a6]/15 px-2.5 py-2 leading-4 text-[#1b2620]",
            compact ? "text-[8px]" : "text-[9px]",
          )}
        >
          {highlight}
        </p>
        <div className="mt-2.5 space-y-1.5" aria-hidden="true">
          <span className="block h-[3px] w-[95%] rounded-full bg-black/10" />
          <span className="block h-[3px] w-[86%] rounded-full bg-black/10" />
          <span className="block h-[3px] w-[64%] rounded-full bg-black/10" />
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-black/10 pt-2">
          <span className="font-meta text-[7px] text-black/40">Approved · v4.2</span>
          <span className="font-meta text-[7px] text-black/40">p. {page}</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Full ask workspace                                                  */
/* ------------------------------------------------------------------ */

export function AskWorkspace({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <AppWindow className={className} status={compact ? "Preview" : "Preview · sample data"}>
      <div className="grid min-h-[340px] grid-cols-1 md:grid-cols-[148px_minmax(0,1fr)] lg:grid-cols-[148px_minmax(0,1fr)_208px]">
        <WorkspaceSidebar active="Ask" />

        <div className="min-w-0 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-meta text-[9px] text-[var(--ink-muted)]">
              <span>People operations</span>
              <span aria-hidden="true">/</span>
              <span>Ask</span>
            </div>
            <span className="flex items-center gap-1.5 font-meta text-[8px] text-[var(--ink-muted)]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Indexed
            </span>
          </div>

          <div className="mt-4 flex justify-end">
            <p className="max-w-[85%] rounded-[10px] rounded-br-[3px] border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-[11px] leading-5 text-[var(--ink)]">
              How much parental leave is available to a new employee?
            </p>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-[5px] border border-[var(--accent-jade-100)] bg-[var(--accent-jade-50)]">
              <Sparkles size={10} strokeWidth={1.5} className="text-[var(--accent-jade)]" aria-hidden="true" />
            </span>
            <span className="text-[10px] font-medium text-[var(--ink)]">Rekall-IQ</span>
            <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-0.5 font-meta text-[7px] text-emerald-300">
              Grounded
            </span>
            <span className="ml-auto font-meta text-[8px] text-[var(--ink-muted)]">
              1.8s
            </span>
          </div>

          <p className="mt-2 text-[11px] leading-5 text-[var(--ink-soft)]">
            Eligible employees may take up to{" "}
            <strong className="font-medium text-[var(--ink)]">16 weeks</strong> of
            parental leave. The policy applies after 90 days of employment and should be
            submitted to People Operations at least 30 days before the leave begins.
            <CitationMark n={1} />
            <CitationMark n={2} />
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-[5px] border border-[var(--line)] bg-[var(--surface)] px-2 py-1 font-meta text-[8px] text-[var(--ink-soft)]">
              <FileText size={9} strokeWidth={1.5} className="text-[var(--accent-jade)]" aria-hidden="true" />
              Parental_Leave_Policy.pdf · p.8
            </span>
            <span className="inline-flex items-center gap-1 rounded-[5px] border border-[var(--line)] bg-[var(--surface)] px-2 py-1 font-meta text-[8px] text-[var(--ink-soft)]">
              <FileText size={9} strokeWidth={1.5} className="text-[var(--accent-jade)]" aria-hidden="true" />
              Employee_Handbook.pdf · §6.3
            </span>
          </div>

          <div className="mt-3 border-t border-[var(--line)] pt-2">
            <p className="font-meta text-[8px] text-[var(--ink-muted)]">
              Related questions
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {["Who approves leave?", "Does it apply to contractors?"].map((q) => (
                <span
                  key={q}
                  className="rounded-full border border-[var(--line)] px-2 py-0.5 text-[8px] text-[var(--ink-soft)]"
                >
                  {q}
                </span>
              ))}
            </div>
          </div>

          <AnswerComposer className="mt-3" />
        </div>

        <SourceRail active={1} sources={HERO_SOURCES} />
      </div>
    </AppWindow>
  );
}

/* ------------------------------------------------------------------ */
/* Sources workspace                                                   */
/* ------------------------------------------------------------------ */

export function SourcesWorkspace({ className }: { className?: string }) {
  return (
    <AppWindow className={className} path="people / sources">
      <div className="grid min-h-[380px] grid-cols-1 md:grid-cols-[148px_minmax(0,1fr)] lg:grid-cols-[148px_minmax(0,1fr)_208px]">
        <WorkspaceSidebar active="Ask" />

        <div className="min-w-0 p-4 sm:p-5">
          <div className="flex items-center gap-2 font-meta text-[9px] text-[var(--ink-muted)]">
            <span>Source preview</span>
            <span aria-hidden="true">/</span>
            <span>Parental_Leave_Policy.pdf</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[13px] font-medium text-[var(--ink)]">
              Parental leave, page 8
            </p>
            <span className="font-meta text-[8px] text-[var(--ink-muted)]">
              Matched paragraph · 98%
            </span>
          </div>

          <div className="mt-3 rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-2.5">
            <DocumentPage />
          </div>
        </div>

        <div className="hidden flex-col border-l border-[var(--line)] bg-[var(--surface)] p-3 lg:flex">
          <p className="font-meta text-[9px] text-[var(--ink-muted)]">
            Citation detail
          </p>
          <div className="mt-3 space-y-2.5">
            {[
              ["Document", "Parental_Leave_Policy.pdf"],
              ["Section", "04 · Leave and absence"],
              ["Page", "8 of 32"],
              ["Collection", "People"],
              ["Uploaded", "12 Aug 2026"],
              ["Parser", "PDF · native"],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="font-meta text-[8px] text-[var(--ink-muted)]">{label}</p>
                <p className="mt-0.5 truncate text-[10px] text-[var(--ink-soft)]">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-[8px] border border-[var(--accent-jade-100)] bg-[var(--accent-jade-50)] p-2.5">
            <p className="flex items-center gap-1.5 font-meta text-[8px] text-[var(--accent-jade)]">
              <Check size={10} strokeWidth={2} aria-hidden="true" />
              Workspace filter applied
            </p>
            <p className="mt-1 text-[9px] leading-4 text-[var(--ink-soft)]">
              This preview is served through an authenticated, workspace-scoped stream.
            </p>
          </div>
          <p className="mt-auto font-meta text-[8px] leading-4 text-[var(--ink-muted)]">
            The original stays beside the answer.
          </p>
        </div>
      </div>
    </AppWindow>
  );
}

/* ------------------------------------------------------------------ */
/* Library workspace                                                   */
/* ------------------------------------------------------------------ */

const LIBRARY_ROWS = [
  ["Employee_Handbook.pdf", "People", "Ready", "24 MB", "2h ago"],
  ["Support_Onboarding.docx", "Support", "Ready", "1.8 MB", "4h ago"],
  ["Pricing_Model.xlsx", "Finance", "Ready", "840 KB", "1d ago"],
  ["Compliance_Training.pptx", "Legal", "Processing", "18 MB", "1d ago"],
  ["Vendors.csv", "Operations", "Ready", "220 KB", "2d ago"],
  ["Office_Map.txt", "General", "Ready", "12 KB", "3d ago"],
];

export function LibraryWorkspace({ className }: { className?: string }) {
  return (
    <AppWindow className={className} path="library / documents">
      <div className="grid min-h-[380px] grid-cols-1 md:grid-cols-[148px_minmax(0,1fr)]">
        <WorkspaceSidebar active="Library" />

        <div className="min-w-0 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-meta text-[9px] text-[var(--ink-muted)]">Library</p>
              <p className="mt-1 text-[13px] font-medium text-[var(--ink)]">
                148 documents across six collections
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-[6px] bg-[var(--accent-jade)] px-2.5 py-1.5 text-[9px] font-medium text-[#04100e]">
              <Upload size={10} strokeWidth={1.5} aria-hidden="true" />
              Upload
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            {["All documents", "People", "Support", "Operations", "Legal"].map(
              (collection, index) => (
                <span
                  key={collection}
                  className={cn(
                    "rounded-full border px-2 py-0.5 font-meta text-[8px]",
                    index === 0
                      ? "border-[var(--accent-jade-100)] bg-[var(--accent-jade-50)] text-[var(--accent-jade)]"
                      : "border-[var(--line)] text-[var(--ink-muted)]",
                  )}
                >
                  {collection}
                </span>
              ),
            )}
            <span className="ml-auto inline-flex items-center gap-1 font-meta text-[8px] text-[var(--ink-muted)]">
              <Search size={9} strokeWidth={1.5} aria-hidden="true" />
              Filter
            </span>
          </div>

          <div className="mt-3 overflow-hidden rounded-[8px] border border-[var(--line)]">
            <div className="grid grid-cols-[minmax(0,1fr)_64px_58px] gap-2 border-b border-[var(--line)] bg-[var(--surface-2)] px-2.5 py-1.5 font-meta text-[8px] text-[var(--ink-muted)] sm:grid-cols-[minmax(0,1fr)_70px_64px_64px]">
              <span>Document</span>
              <span className="hidden sm:inline">Collection</span>
              <span>Status</span>
              <span className="text-right">Size</span>
            </div>
            {LIBRARY_ROWS.map(([file, collection, status, size]) => (
              <div
                key={file}
                className="grid grid-cols-[minmax(0,1fr)_64px_58px] items-center gap-2 border-b border-[var(--line-soft)] px-2.5 py-2 last:border-0 sm:grid-cols-[minmax(0,1fr)_70px_64px_64px]"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <FileText
                    size={11}
                    strokeWidth={1.5}
                    className="shrink-0 text-[var(--ink-muted)]"
                    aria-hidden="true"
                  />
                  <span className="truncate text-[9px] text-[var(--ink)]">{file}</span>
                </div>
                <span className="hidden truncate font-meta text-[8px] text-[var(--ink-muted)] sm:inline">
                  {collection}
                </span>
                <span
                  className={cn(
                    "inline-flex w-fit items-center gap-1 rounded-full border px-1.5 py-0.5 font-meta text-[7px]",
                    status === "Ready"
                      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                      : "border-amber-500/25 bg-amber-500/10 text-amber-300",
                  )}
                >
                  {status}
                </span>
                <span className="text-right font-meta text-[8px] text-[var(--ink-muted)]">
                  {size}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-[8px] border border-dashed border-[var(--line)] px-3 py-2">
            <Upload size={11} strokeWidth={1.5} className="text-[var(--accent-jade)]" aria-hidden="true" />
            <span className="text-[9px] text-[var(--ink-muted)]">
              Drop files to add them to this collection
            </span>
            <span className="ml-auto font-meta text-[8px] text-[var(--ink-muted)]">
              PDF · DOCX · XLSX · PPTX · CSV · TXT
            </span>
          </div>
        </div>
      </div>
    </AppWindow>
  );
}

/* ------------------------------------------------------------------ */
/* Gaps workspace                                                      */
/* ------------------------------------------------------------------ */

export function GapsWorkspace({ className }: { className?: string }) {
  const gaps = [
    ["Parental leave for contractors", "4 asks", "No approved section"],
    ["Expense approval above 2m NGN", "3 asks", "Outdated limit"],
    ["Data retention for closed accounts", "2 asks", "Missing policy"],
    ["Equipment return for remote staff", "2 asks", "No owner"],
  ];

  return (
    <AppWindow className={className} path="insights / gaps">
      <div className="grid min-h-[380px] grid-cols-1 md:grid-cols-[148px_minmax(0,1fr)]">
        <WorkspaceSidebar active="Gaps" />

        <div className="min-w-0 p-4 sm:p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-meta text-[9px] text-[var(--ink-muted)]">Knowledge gaps</p>
              <p className="mt-1 text-[13px] font-medium text-[var(--ink)]">
                What the documents did not answer
              </p>
            </div>
            <span className="rounded-full border border-[var(--line)] px-2 py-0.5 font-meta text-[8px] text-[var(--ink-muted)]">
              Last 30 days
            </span>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {[
              ["11", "unanswered questions"],
              ["4", "documents to write"],
              ["82%", "coverage this month"],
            ].map(([value, label]) => (
              <div
                key={label}
                className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] p-2.5"
              >
                <p className="text-[17px] font-medium leading-none tracking-[-0.03em] text-[var(--ink)] tabular-nums">
                  {value}
                </p>
                <p className="mt-1 font-meta text-[8px] leading-4 text-[var(--ink-muted)]">
                  {label}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-3 overflow-hidden rounded-[8px] border border-[var(--line)]">
            {gaps.map(([question, count, reason], index) => (
              <div
                key={question}
                className="flex items-start gap-2.5 border-b border-[var(--line-soft)] px-3 py-2.5 last:border-0"
              >
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-amber-500/25 bg-amber-500/10 font-meta text-[8px] text-amber-300">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10px] text-[var(--ink)]">{question}</p>
                  <p className="mt-0.5 font-meta text-[8px] text-[var(--ink-muted)]">
                    {reason} · {count}
                  </p>
                </div>
                <span className="hidden shrink-0 font-meta text-[8px] text-[var(--ink-muted)] sm:inline">
                  Review
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-start gap-2 rounded-[8px] border border-[var(--accent-jade-100)] bg-[var(--accent-jade-50)] px-3 py-2">
            <CircleAlert
              size={11}
              strokeWidth={1.5}
              className="mt-0.5 shrink-0 text-[var(--accent-jade)]"
              aria-hidden="true"
            />
            <p className="text-[9px] leading-4 text-[var(--ink-soft)]">
              The answer says the documents do not cover it, and the question is logged
              for an admin. It is not sent to the open web.
            </p>
          </div>
        </div>
      </div>
    </AppWindow>
  );
}

/* ------------------------------------------------------------------ */
/* Pipeline                                                            */
/* ------------------------------------------------------------------ */

const STAGES = [
  {
    title: "Upload the approved set",
    detail: "PDF, DOCX, XLSX, PPTX, CSV, TXT.",
    icon: Upload,
    meta: "Admin",
  },
  {
    title: "Parse and section",
    detail: "Text, tables, and page references are kept.",
    icon: Layers3,
    meta: "Background job",
  },
  {
    title: "Embed and index",
    detail: "Workspace-filtered vectors, plus keyword candidates.",
    icon: FileSearch,
    meta: "Qdrant",
  },
  {
    title: "Answer with sources",
    detail: "The reply names the files and opens the cited page.",
    icon: MessageSquare,
    meta: "Staff",
  },
];

export function PipelineDiagram({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <div
        aria-hidden="true"
        className="absolute left-0 right-0 top-[27px] hidden h-px bg-[var(--line)] lg:block"
      />
      <ol className="grid gap-3 lg:grid-cols-4 lg:gap-4">
        {STAGES.map((stage, index) => {
          const Icon = stage.icon;
          return (
            <li
              key={stage.title}
              className="relative flex gap-3 rounded-[12px] border border-[var(--line)] bg-[var(--canvas)] p-4 lg:block"
            >
              <div className="flex items-center gap-2">
                <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border border-[var(--line)] bg-[var(--surface)] text-[var(--accent-jade)]">
                  <Icon size={14} strokeWidth={1.5} aria-hidden="true" />
                </span>
                <span className="font-meta text-[9px] text-[var(--ink-muted)] lg:ml-2">
                  0{index + 1} · {stage.meta}
                </span>
              </div>
              <div className="min-w-0 lg:mt-4">
                <h3 className="text-[12px] font-medium text-[var(--ink)]">
                  {stage.title}
                </h3>
                <p className="mt-1 text-[10px] leading-4 text-[var(--ink-muted)]">
                  {stage.detail}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Security diagram                                                    */
/* ------------------------------------------------------------------ */

export function SecurityDiagram({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[16px] border border-[var(--line)] bg-[var(--canvas)] p-4 sm:p-6",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="mk-grid-bg absolute inset-0 opacity-40 [background-size:32px_32px]"
      />
      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-meta text-[9px] text-[var(--ink-muted)]">
            Request path · every hop carries workspace_id
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 font-meta text-[8px] text-emerald-300">
            <ShieldCheck size={9} strokeWidth={2} aria-hidden="true" />
            Isolated
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
          <div className="rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-3">
            <p className="font-meta text-[8px] text-[var(--ink-muted)]">Your workspace</p>
            <div className="mt-2 space-y-1.5">
              {["Documents", "Chunks", "Chat history"].map((item) => (
                <div key={item} className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-[var(--accent-jade)]" />
                  <span className="text-[9px] text-[var(--ink-soft)]">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <span
            aria-hidden="true"
            className="hidden h-px w-6 bg-[var(--line)] sm:block"
          />

          <div className="rounded-[10px] border border-[var(--accent-jade-100)] bg-[var(--accent-jade-50)] p-3">
            <p className="font-meta text-[8px] text-[var(--accent-jade)]">
              Retrieval
            </p>
            <div className="mt-2 space-y-1.5">
              <p className="text-[9px] text-[var(--ink-soft)]">Vector filter</p>
              <p className="font-meta text-[8px] text-[var(--ink)]">
                workspace_id = 8f2…
              </p>
              <p className="text-[8px] leading-3.5 text-[var(--ink-muted)]">
                Applied before the model sees a passage
              </p>
            </div>
          </div>

          <span
            aria-hidden="true"
            className="hidden h-px w-6 bg-[var(--line)] sm:block"
          />

          <div className="rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-3">
            <p className="font-meta text-[8px] text-[var(--ink-muted)]">Answer model</p>
            <div className="mt-2 space-y-1.5">
              {["Retrieved passages", "Citations", "No training on customer data"].map(
                (item) => (
                  <p key={item} className="text-[9px] leading-4 text-[var(--ink-soft)]">
                    {item}
                  </p>
                ),
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[var(--line)] pt-3">
          {[
            "RLS on every table",
            "Server-only service role",
            "Metadata-only operator view",
          ].map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1.5 font-meta text-[8px] text-[var(--ink-muted)]"
            >
              <Check size={9} strokeWidth={2} className="text-[var(--accent-jade)]" aria-hidden="true" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Small artifacts                                                     */
/* ------------------------------------------------------------------ */

export function CoverageChart({ className }: { className?: string }) {
  const bars = [42, 57, 51, 68, 63, 79, 84];
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <div className={cn("rounded-[12px] border border-[var(--line)] bg-[var(--surface)] p-4", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="font-meta text-[9px] text-[var(--ink-muted)]">Coverage</p>
          <p className="mt-1 text-[20px] font-medium leading-none tracking-[-0.03em] text-[var(--ink)] tabular-nums">
            84<span className="text-[10px] text-[var(--ink-muted)]">%</span>
          </p>
        </div>
        <p className="font-meta text-[8px] text-[var(--ink-muted)]">This week</p>
      </div>
      <div className="mt-4 flex h-16 items-end gap-1.5" role="img" aria-label="Coverage rose from 42 percent on Monday to 84 percent on Sunday">
        {bars.map((value, index) => (
          <div key={labels[index]} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
            <span
              className={cn(
                "w-full rounded-[2px]",
                index === bars.length - 1 ? "bg-[var(--accent-jade)]" : "bg-[var(--surface-2)]",
              )}
              style={{ height: `${value}%` }}
            >
              <span className="sr-only">{value}%</span>
            </span>
            <span className="font-meta text-[7px] text-[var(--ink-muted)]">
              {labels[index].slice(0, 1)}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 border-t border-[var(--line)] pt-2 font-meta text-[8px] leading-4 text-[var(--ink-muted)]">
        Questions answered from an approved source. Illustrative preview.
      </p>
    </div>
  );
}

export function ProcessingLedger({ className }: { className?: string }) {
  const rows = [
    ["Employee_Handbook.pdf", "Parsed", "62 pages", "Ready"],
    ["Support_Onboarding.docx", "Parsed", "18 pages", "Ready"],
    ["Pricing_Model.xlsx", "Parsed", "4 sheets", "Ready"],
    ["Compliance_Training.pptx", "Embedding", "42 slides", "Running"],
  ];
  return (
    <div className={cn("overflow-hidden rounded-[12px] border border-[var(--line)] bg-[var(--surface)]", className)}>
      <div className="flex items-center justify-between border-b border-[var(--line)] px-3 py-2">
        <span className="font-meta text-[9px] text-[var(--ink-soft)]">
          Processing queue
        </span>
        <span className="font-meta text-[8px] text-[var(--ink-muted)]">
          Background
        </span>
      </div>
      {rows.map(([file, step, size, status]) => (
        <div
          key={file}
          className="flex items-center gap-2 border-b border-[var(--line-soft)] px-3 py-2 last:border-0"
        >
          <FileText size={10} strokeWidth={1.5} className="shrink-0 text-[var(--ink-muted)]" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate text-[9px] text-[var(--ink)]">{file}</span>
          <span className="hidden font-meta text-[8px] text-[var(--ink-muted)] sm:inline">
            {step}
          </span>
          <span className="hidden font-meta text-[8px] text-[var(--ink-muted)] sm:inline">
            {size}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 font-meta text-[7px]",
              status === "Ready"
                ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                : "border-amber-500/25 bg-amber-500/10 text-amber-300",
            )}
          >
            {status}
          </span>
        </div>
      ))}
      <div className="flex items-center gap-2 border-t border-[var(--line)] px-3 py-2">
        <Clock3 size={9} strokeWidth={1.5} className="text-[var(--ink-muted)]" aria-hidden="true" />
        <span className="font-meta text-[8px] text-[var(--ink-muted)]">
          Large batches keep the workspace usable
        </span>
      </div>
    </div>
  );
}

export function TrustFacts({ className }: { className?: string }) {
  const facts = [
    { value: "6", label: "document formats", detail: "Parsed with page references" },
    { value: "1", label: "workspace per organisation", detail: "Enforced at query time" },
    { value: "Cited", label: "when a source is used", detail: "Nothing outside the library" },
    { value: "0", label: "customer documents used for training", detail: "By default" },
  ];
  return (
    <dl
      className={cn(
        "grid grid-cols-2 gap-px overflow-hidden rounded-[12px] border border-[var(--line)] bg-[var(--line)] lg:grid-cols-4",
        className,
      )}
    >
      {facts.map((fact) => (
        <div key={fact.label} className="bg-[var(--canvas)] p-4 sm:p-5">
          <dt className="text-[24px] font-medium leading-none tracking-[-0.04em] text-[var(--ink)] tabular-nums">
            {fact.value}
          </dt>
          <dd className="mt-2 text-[11px] leading-4 text-[var(--ink-soft)]">{fact.label}</dd>
          <dd className="mt-1 font-meta text-[8px] leading-3.5 text-[var(--ink-muted)]">
            {fact.detail}
          </dd>
        </div>
      ))}
    </dl>
  );
}
