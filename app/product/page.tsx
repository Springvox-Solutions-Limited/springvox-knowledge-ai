import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  ArrowUpRight,
  Check,
  File,
  FileSpreadsheet,
  FileText,
  LockKeyhole,
  Minus,
  Presentation,
  ShieldCheck,
  Table2,
} from "lucide-react";

import { SiteShell } from "@/src/components/marketing/SiteShell";
import {
  AskWorkspace,
  CoverageChart,
  GapsWorkspace,
  LibraryWorkspace,
  ProcessingLedger,
  SecurityDiagram,
  SourcesWorkspace,
} from "@/src/components/marketing/product-visuals";
import {
  ArrowLink,
  ButtonLink,
  CitationMark,
  PageHero,
  SectionLabel,
} from "@/src/components/marketing/ui";
import { cn } from "@/src/lib/utils";

export const metadata: Metadata = {
  title: "Product — the workspace behind cited answers",
  description:
    "See how Rekall-IQ parses approved documents, retrieves with workspace-filtered hybrid search, cites the exact page, and tracks the questions it cannot answer.",
  alternates: { canonical: "/product" },
};

/* ------------------------------------------------------------------ */
/* Shared content                                                      */
/* ------------------------------------------------------------------ */

const SECTION_CLASS = "scroll-mt-24 border-b border-[var(--line)]";

const NAV_ITEMS = [
  { label: "Ingestion", href: "#ingestion" },
  { label: "Retrieval", href: "#retrieval" },
  { label: "Citations", href: "#citations" },
  { label: "Scoping", href: "#scoping" },
  { label: "Modes", href: "#modes" },
  { label: "Quality", href: "#quality" },
  { label: "Control", href: "#control" },
];

const FORMATS = [
  { ext: "PDF", label: "Policies and handbooks", icon: FileText },
  { ext: "DOCX", label: "Guides and memos", icon: FileText },
  { ext: "XLSX", label: "Finance and tables", icon: FileSpreadsheet },
  { ext: "PPTX", label: "Training decks", icon: Presentation },
  { ext: "CSV", label: "Exports and lists", icon: Table2 },
  { ext: "TXT", label: "Plain-text notes", icon: File },
];

const QUERY_STEPS = [
  {
    n: "01",
    title: "Question embedded",
    detail: "The staff question becomes a vector at request time.",
  },
  {
    n: "02",
    title: "Hybrid candidates",
    detail:
      "Vector matches plus keyword matches for exact names, codes, and phrases.",
  },
  {
    n: "03",
    title: "Workspace filter",
    detail: "workspace_id is applied before a passage is read.",
    accent: true,
  },
  {
    n: "04",
    title: "Rerank and dedupe",
    detail: "The strongest distinct passages move to the top.",
  },
  {
    n: "05",
    title: "Context compression",
    detail: "Only the passages needed for the answer are kept.",
  },
  {
    n: "06",
    title: "Cited answer",
    detail: "The reply names the files and pages behind it.",
  },
];

const COLLECTIONS = [
  { name: "People", count: 32, selected: true },
  { name: "Support", count: 41 },
  { name: "Operations", count: 27 },
  { name: "Legal", count: 11 },
  { name: "Finance", count: 18 },
  { name: "General", count: 19 },
];

const MODES: Array<{
  name: string;
  copy: string;
  length: string;
  answer: ReactNode;
}> = [
  {
    name: "Summary",
    copy: "The shortest correct version, for a quick check.",
    length: "1–2 sentences",
    answer: (
      <>
        Up to <strong className="font-medium text-[var(--ink)]">16 weeks</strong>{" "}
        of parental leave after 90 days of employment. Request it 30 days before
        leave begins.
        <CitationMark n={1} />
        <CitationMark n={2} />
      </>
    ),
  },
  {
    name: "Detailed",
    copy: "The full reasoning, with the passages that support it.",
    length: "Full answer",
    answer: (
      <>
        Eligible employees may take up to{" "}
        <strong className="font-medium text-[var(--ink)]">16 weeks</strong> of
        parental leave. The policy applies after 90 days of employment and should
        be submitted to People Operations at least 30 days before the leave
        begins.
        <CitationMark n={1} />
        <CitationMark n={2} />
      </>
    ),
  },
  {
    name: "Executive",
    copy: "Decision language for people who need the outcome.",
    length: "Outcome first",
    answer: (
      <>
        The policy grants 16 weeks of parental leave after 90 days of employment.
        People Operations handles the request with 30 days&rsquo; notice.
        <CitationMark n={1} />
        <CitationMark n={2} />
      </>
    ),
  },
  {
    name: "Technical",
    copy: "Closer to the source wording, for specialists.",
    length: "Policy wording",
    answer: (
      <>
        Policy 04, section 4 sets eligibility at 90 days of continuous
        employment, an entitlement of 16 weeks, and a 30-day notice window. The
        handbook restates the notice period at section 6.3.
        <CitationMark n={1} />
        <CitationMark n={2} />
      </>
    ),
  },
];

const ROLE_ROWS: Array<{
  action: string;
  admin: boolean;
  viewer: boolean;
  operator: boolean;
}> = [
  {
    action: "Upload and delete documents",
    admin: true,
    viewer: false,
    operator: false,
  },
  {
    action: "Invite and manage users",
    admin: true,
    viewer: false,
    operator: false,
  },
  {
    action: "Ask questions and read answers",
    admin: true,
    viewer: true,
    operator: false,
  },
  {
    action: "Review gaps and analytics",
    admin: true,
    viewer: false,
    operator: false,
  },
  {
    action: "Change workspace settings",
    admin: true,
    viewer: false,
    operator: false,
  },
  {
    action: "View workspace metadata (health, plan)",
    admin: true,
    viewer: false,
    operator: true,
  },
  {
    action: "Read document text or conversations",
    admin: true,
    viewer: true,
    operator: false,
  },
];

/* ------------------------------------------------------------------ */
/* Page pieces                                                         */
/* ------------------------------------------------------------------ */

function SectionHead({
  id,
  label,
  title,
  children,
}: {
  id: string;
  label: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div data-reveal className="grid gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:items-end">
      <div>
        <SectionLabel>{label}</SectionLabel>
        <h2 id={id} className="mk-h2 mt-4 max-w-[16ch] text-[var(--ink)]">
          {title}
        </h2>
      </div>
      <div className="max-w-[58ch] space-y-4 lg:pb-1">{children}</div>
    </div>
  );
}

function ProductSubnav() {
  return (
    <div className="sticky top-[68px] z-40 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--canvas)_90%,transparent)] backdrop-blur-xl">
      <div className="mk-shell flex h-12 items-center gap-3">
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 font-meta text-[9px] text-[var(--ink-muted)]">
          <span
            aria-hidden="true"
            className="h-1 w-1 rounded-full bg-[var(--accent-jade)]"
          />
          Preview
        </span>
        <nav
          aria-label="Product sections"
          className="mk-scroll-x min-w-0 flex-1"
        >
          <ul className="flex min-w-max items-center gap-0.5">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="inline-flex shrink-0 items-center rounded-[6px] px-2.5 py-1.5 text-[12px] font-medium text-[var(--ink-soft)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--ink)]"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}

function HeroReceipt() {
  return (
    <aside
      data-hero-visual
      aria-label="Example citation receipt"
      className="w-full max-w-[360px] lg:w-[340px]"
    >
      <div className="mk-window overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--surface)] px-4 py-2.5">
          <span className="font-meta text-[9px] text-[var(--ink-soft)]">
            Citation receipt
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] px-2 py-0.5 font-meta text-[8px] text-[var(--ink-muted)]">
            <span
              aria-hidden="true"
              className="h-1 w-1 rounded-full bg-[var(--accent-jade)]"
            />
            Preview
          </span>
        </div>

        <div className="p-4">
          <p className="font-meta text-[9px] text-[var(--ink-muted)]">
            Question
          </p>
          <p className="mt-1.5 text-[12px] leading-5 text-[var(--ink)]">
            How much parental leave is available to a new employee?
          </p>

          <div className="mt-4 rounded-[10px] border border-[var(--line)] bg-[var(--canvas)] p-3">
            <p className="text-[11px] leading-5 text-[var(--ink-soft)]">
              Eligible employees may take up to{" "}
              <strong className="font-medium text-[var(--ink)]">16 weeks</strong>{" "}
              of parental leave.
              <CitationMark n={1} />
              <CitationMark n={2} />
            </p>
          </div>

          <ol className="mt-3 space-y-2">
            {[
              {
                n: 1,
                file: "Parental_Leave_Policy.pdf",
                meta: "p. 8 · section 4 · 98% match",
              },
              {
                n: 2,
                file: "Employee_Handbook.pdf",
                meta: "§ 6.3 · p. 24 · 94% match",
              },
            ].map((source) => (
              <li
                key={source.file}
                className={cn(
                  "flex items-start gap-2.5 rounded-[8px] border p-2.5",
                  source.n === 1
                    ? "border-[var(--accent-jade-100)] bg-[var(--accent-jade-50)]"
                    : "border-[var(--line)] bg-[var(--surface)]",
                )}
              >
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] font-meta text-[8px]",
                    source.n === 1
                      ? "bg-[var(--accent-jade)] text-[#04100e]"
                      : "border border-[var(--line)] text-[var(--ink-muted)]",
                  )}
                >
                  {source.n}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-medium text-[var(--ink)]">
                    {source.file}
                  </p>
                  <p className="mt-0.5 truncate font-meta text-[8px] text-[var(--ink-muted)]">
                    {source.meta}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-3 flex items-center justify-between border-t border-[var(--line)] pt-2.5">
            <span className="font-meta text-[8px] text-[var(--ink-muted)]">
              Two pages, one answer
            </span>
            <span className="inline-flex items-center gap-1 font-meta text-[8px] text-[var(--accent-jade)]">
              <LockKeyhole size={9} strokeWidth={1.5} aria-hidden="true" />
              Workspace-scoped
            </span>
          </div>
        </div>
      </div>
      <p className="mt-2 text-center font-meta text-[8px] text-[var(--ink-muted)]">
        Preview of the workspace. Sample content only.
      </p>
    </aside>
  );
}

function QueryPath() {
  return (
    <div className="mk-panel p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="font-meta text-[9px] text-[var(--ink-muted)]">
          Query path
        </p>
        <span className="rounded-full border border-[var(--line)] px-2 py-0.5 font-meta text-[8px] text-[var(--ink-muted)]">
          Preview
        </span>
      </div>

      <ol className="relative mt-4">
        <span
          aria-hidden="true"
          className="absolute bottom-3 left-[11px] top-3 w-px bg-[var(--line)]"
        />
        {QUERY_STEPS.map((step) => (
          <li
            key={step.n}
            className="relative grid grid-cols-[24px_minmax(0,1fr)] gap-3 pb-4 last:pb-0"
          >
            <span
              className={cn(
                "relative z-10 flex h-6 w-6 items-center justify-center rounded-full border bg-[var(--canvas)] font-meta text-[8px]",
                step.accent
                  ? "border-[var(--accent-jade-100)] text-[var(--accent-jade)]"
                  : "border-[var(--line)] text-[var(--ink-muted)]",
              )}
            >
              {step.n}
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-[var(--ink)]">
                {step.title}
              </p>
              <p className="mt-0.5 text-[10px] leading-4 text-[var(--ink-muted)]">
                {step.detail}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-4 border-t border-[var(--line)] pt-3 font-meta text-[8px] leading-4 text-[var(--ink-muted)]">
        The filter is part of retrieval, not a clean-up step afterwards.
      </p>
    </div>
  );
}

function SourceReceipt() {
  const rows = [
    ["Document", "Parental_Leave_Policy.pdf"],
    ["Section", "04 · Leave and absence"],
    ["Page", "8 of 32"],
    ["Collection", "People"],
    ["Uploaded", "12 Aug 2026"],
    ["Parser", "PDF · native"],
  ];

  return (
    <div className="mk-panel flex flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
        <span className="text-[12px] font-medium text-[var(--ink)]">
          Source receipt
        </span>
        <span className="rounded-full border border-[var(--line)] px-2 py-0.5 font-meta text-[8px] text-[var(--ink-muted)]">
          Preview
        </span>
      </div>

      <div className="flex-1 p-4">
        <p className="font-meta text-[9px] text-[var(--ink-muted)]">
          Cited passage
        </p>
        <p className="mt-2 border-l-2 border-[var(--accent-jade)] bg-[var(--accent-jade-50)] px-3 py-2 text-[11px] leading-5 text-[var(--ink-soft)]">
          Eligible employees may take up to 16 weeks of parental leave.
          <CitationMark n={1} />
        </p>

        <dl className="mt-4 divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="grid grid-cols-[72px_minmax(0,1fr)] items-baseline gap-3 py-2"
            >
              <dt className="font-meta text-[8px] text-[var(--ink-muted)]">
                {label}
              </dt>
              <dd className="min-w-0 break-words text-[10px] text-[var(--ink-soft)] [overflow-wrap:anywhere]">
                {value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-4 rounded-[8px] border border-[var(--accent-jade-100)] bg-[var(--accent-jade-50)] p-3">
          <p className="flex items-center gap-1.5 font-meta text-[8px] text-[var(--accent-jade)]">
            <ShieldCheck size={10} strokeWidth={2} aria-hidden="true" />
            Authenticated preview
          </p>
          <p className="mt-1 text-[10px] leading-4 text-[var(--ink-soft)]">
            The file streams through a workspace-scoped request. A citation cannot
            be used to reach storage directly.
          </p>
        </div>
      </div>

      <div className="border-t border-[var(--line)] px-4 py-2.5">
        <p className="font-meta text-[8px] text-[var(--ink-muted)]">
          Page-level citation · source 1 of 2
        </p>
      </div>
    </div>
  );
}

function Permission({ allowed }: { allowed: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px]",
        allowed ? "text-[var(--ink-soft)]" : "text-[var(--ink-muted)]",
      )}
    >
      {allowed ? (
        <Check size={12} strokeWidth={2} aria-hidden="true" />
      ) : (
        <Minus size={12} strokeWidth={2} aria-hidden="true" />
      )}
      {allowed ? "Yes" : "No"}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function ProductPage() {
  return (
    <SiteShell>
      <>
        <PageHero
          label="Product"
          title={
            <span data-hero-line className="block">
              The workspace behind every cited answer
            </span>
          }
          intro={
            <span data-hero-line className="block">
              Rekall-IQ takes the documents a company has approved, prepares them
              for retrieval, and answers staff questions with the files attached.
              Everything below is in the workspace today.
            </span>
          }
          actions={
            <>
              <ButtonLink
                href="/register"
                icon={<ArrowUpRight size={15} strokeWidth={1.5} />}
              >
                Create a workspace
              </ButtonLink>
              <ButtonLink href="/contact" variant="secondary">
                Talk to us
              </ButtonLink>
            </>
          }
          aside={<HeroReceipt />}
        />

        <ProductSubnav />

        {/* Ingestion ------------------------------------------------ */}
        <section
          id="ingestion"
          aria-labelledby="ingestion-title"
          className={SECTION_CLASS}
        >
          <div className="mk-shell py-20 lg:py-28">
            <SectionHead
              id="ingestion-title"
              label="Ingestion"
              title="Six formats. One approved library."
            >
              <p className="mk-lede">
                Admins add PDF, DOCX, XLSX, PPTX, CSV, and TXT files to a private
                workspace library. Complex, scanned, or table-heavy files can use
                optional advanced parsing.
              </p>
              <p className="text-[13px] leading-6 text-[var(--ink-muted)]">
                Parsing, sectioning, embedding, and indexing run as background
                jobs. The library shows what is ready and what is still
                processing, and the workspace stays usable while a large batch
                runs.
              </p>
            </SectionHead>

            <div
              data-reveal
              className="mt-10 grid gap-4 xl:grid-cols-[minmax(0,1.28fr)_minmax(0,0.72fr)]"
            >
              <div className="min-w-0">
                <LibraryWorkspace />
              </div>

              <div className="grid content-start gap-4">
                <div className="mk-panel p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-meta text-[9px] text-[var(--ink-muted)]">
                      Accepted formats
                    </p>
                    <span className="font-meta text-[8px] text-[var(--ink-muted)]">
                      Page references kept
                    </span>
                  </div>
                  <ul className="mt-3 grid grid-cols-2 gap-2">
                    {FORMATS.map((format) => {
                      const Icon = format.icon;
                      return (
                        <li
                          key={format.ext}
                          className="flex min-w-0 items-center gap-2 rounded-[8px] border border-[var(--line)] bg-[var(--canvas)] px-2.5 py-2"
                        >
                          <Icon
                            size={13}
                            strokeWidth={1.5}
                            className="shrink-0 text-[var(--ink-muted)]"
                            aria-hidden="true"
                          />
                          <span className="min-w-0">
                            <span className="block font-meta text-[9px] text-[var(--ink)]">
                              {format.ext}
                            </span>
                            <span className="mt-0.5 block truncate text-[8px] text-[var(--ink-muted)]">
                              {format.label}
                            </span>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="mt-3 border-t border-[var(--line)] pt-2.5 font-meta text-[8px] leading-4 text-[var(--ink-muted)]">
                    Upload is the only manual step. The queue does the rest.
                  </p>
                </div>

                <ProcessingLedger />
              </div>
            </div>

            <ul
              data-reveal
              className="mt-4 grid gap-x-8 border-t border-[var(--line)] pt-4 sm:grid-cols-3"
            >
              {[
                "No inline processing in the request path",
                "Sections keep their page numbers",
                "Large batches keep the workspace usable",
              ].map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-2.5 py-1.5 text-[12px] leading-5 text-[var(--ink-soft)]"
                >
                  <Check
                    size={12}
                    strokeWidth={2}
                    className="mt-0.5 shrink-0 text-[var(--ink-muted)]"
                    aria-hidden="true"
                  />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Retrieval ------------------------------------------------ */}
        <section
          id="retrieval"
          aria-labelledby="retrieval-title"
          className={SECTION_CLASS}
        >
          <div className="mk-shell py-20 lg:py-28">
            <SectionHead
              id="retrieval-title"
              label="Retrieval"
              title="Answers assembled from your passages, not the internet."
            >
              <p className="mk-lede">
                A question is embedded, matched against workspace-filtered
                vectors, and combined with keyword candidates for exact names,
                codes, and phrases. The best passages are deduplicated, reranked,
                and compressed into context before the answer is generated.
              </p>
              <p className="text-[13px] leading-6 text-[var(--ink-muted)]">
                Every query carries the workspace filter, including the vector
                search. The model only sees passages from the collection the
                person asked against.
              </p>
            </SectionHead>

            <div
              data-reveal
              className="mt-10 grid gap-4 xl:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] xl:items-start"
            >
              <QueryPath />
              <div className="min-w-0">
                <AskWorkspace />
              </div>
            </div>
          </div>
        </section>

        {/* Citations ------------------------------------------------ */}
        <section
          id="citations"
          aria-labelledby="citations-title"
          className={cn(SECTION_CLASS, "bg-[var(--surface)]")}
        >
          <div className="mk-shell py-20 lg:py-28">
            <SectionHead
              id="citations-title"
              label="Citations"
              title="The reference points at a page, not a folder."
            >
              <p className="mk-lede">
                Each answer names the files it used. Open one and the original
                renders in place: PDF, image, DOCX, XLSX, CSV, Markdown, and text
                are supported.
              </p>
              <p className="text-[13px] leading-6 text-[var(--ink-muted)]">
                The preview is workspace-scoped and served through an
                authenticated stream, so citations do not become a back door to
                storage.
              </p>
            </SectionHead>

            <div
              data-reveal
              className="mt-10 grid gap-4 xl:grid-cols-[minmax(0,1.28fr)_minmax(0,0.72fr)]"
            >
              <div className="min-w-0">
                <SourcesWorkspace />
              </div>
              <SourceReceipt />
            </div>
          </div>
        </section>

        {/* Scoping -------------------------------------------------- */}
        <section
          id="scoping"
          aria-labelledby="scoping-title"
          className={SECTION_CLASS}
        >
          <div className="mk-shell py-20 lg:py-28">
            <SectionHead
              id="scoping-title"
              label="Scoping"
              title="Collections keep a question inside one department."
            >
              <p className="mk-lede">
                Group documents into People, Support, Operations, Legal, Finance,
                and General. Staff can scope a question to a single collection or
                search the entire workspace.
              </p>
              <p className="text-[13px] leading-6 text-[var(--ink-muted)]">
                A narrower scope produces a sharper answer and fewer
                plausible-but-wrong matches from another department.
              </p>
            </SectionHead>

            <div
              data-reveal
              className="mt-10 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]"
            >
              <div className="mk-panel overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3 sm:px-5">
                  <div>
                    <p className="font-meta text-[9px] text-[var(--ink-muted)]">
                      Collections
                    </p>
                    <p className="mt-0.5 text-[12px] text-[var(--ink)]">
                      148 documents across six collections
                    </p>
                  </div>
                  <span className="rounded-full border border-[var(--line)] px-2 py-0.5 font-meta text-[8px] text-[var(--ink-muted)]">
                    Preview · sample library
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-px bg-[var(--line)] sm:grid-cols-3">
                  {COLLECTIONS.map((collection) => (
                    <div
                      key={collection.name}
                      className={cn(
                        "p-4",
                        collection.selected
                          ? "bg-[var(--accent-jade-50)]"
                          : "bg-[var(--canvas)]",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[12px] font-medium text-[var(--ink)]">
                          {collection.name}
                        </p>
                        {collection.selected ? (
                          <Check
                            size={12}
                            strokeWidth={2}
                            className="text-[var(--accent-jade)]"
                            aria-hidden="true"
                          />
                        ) : null}
                      </div>
                      <p className="mt-1 font-meta text-[9px] text-[var(--ink-muted)] tabular-nums">
                        {collection.count} documents
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[var(--line)] px-4 py-2.5 sm:px-5">
                  <p className="font-meta text-[8px] leading-4 text-[var(--ink-muted)]">
                    Counts are illustrative. Your library defines its own
                    collections.
                  </p>
                </div>
              </div>

              <div className="mk-panel flex flex-col p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-meta text-[9px] text-[var(--ink-muted)]">
                    Question scope
                  </p>
                  <span className="rounded-full border border-[var(--line)] px-2 py-0.5 font-meta text-[8px] text-[var(--ink-muted)]">
                    Preview
                  </span>
                </div>

                <p className="mt-3 text-[12px] leading-5 text-[var(--ink)]">
                  How much parental leave is available to a new employee?
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="rounded-full border border-[var(--line)] px-2 py-0.5 font-meta text-[8px] text-[var(--ink-muted)]">
                    All documents · 148
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-[var(--accent-jade-100)] bg-[var(--accent-jade-50)] px-2 py-0.5 font-meta text-[8px] text-[var(--accent-jade)]">
                    <Check size={9} strokeWidth={2} aria-hidden="true" />
                    People · 32
                  </span>
                </div>

                <div className="mt-4 rounded-[10px] border border-[var(--line)] bg-[var(--canvas)] p-3">
                  <p className="text-[11px] leading-5 text-[var(--ink-soft)]">
                    Eligible employees may take up to{" "}
                    <strong className="font-medium text-[var(--ink)]">
                      16 weeks
                    </strong>{" "}
                    of parental leave.
                    <CitationMark n={1} />
                    <CitationMark n={2} />
                  </p>
                </div>

                <p className="mt-3 border-t border-[var(--line)] pt-2.5 text-[10px] leading-4 text-[var(--ink-muted)]">
                  The filter is applied to retrieval, so another department&rsquo;s
                  documents are not candidates at all.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Modes ---------------------------------------------------- */}
        <section
          id="modes"
          aria-labelledby="modes-title"
          className={cn(SECTION_CLASS, "bg-[var(--surface)]")}
        >
          <div className="mk-shell py-20 lg:py-28">
            <SectionHead
              id="modes-title"
              label="Modes"
              title="Same source, four depths."
            >
              <p className="mk-lede">
                The answer mode changes length and register, not the evidence.
                Every example below is the same parental-leave answer from the
                same two sources.
              </p>
              <p className="text-[13px] leading-6 text-[var(--ink-muted)]">
                Summary for a quick check, Detailed for the full passage,
                Executive for a decision, Technical when the exact wording
                matters.
              </p>
            </SectionHead>

            <div
              data-reveal
              className="mk-window mt-10 overflow-hidden bg-[var(--canvas)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--surface)] px-4 py-3 sm:px-5">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="rounded border border-[var(--accent-jade-100)] bg-[var(--accent-jade-50)] px-1.5 py-0.5 font-meta text-[8px] text-[var(--accent-jade)]">
                    Mode
                  </span>
                  <p className="truncate text-[12px] text-[var(--ink)]">
                    How much parental leave is available to a new employee?
                  </p>
                </div>
                <span className="font-meta text-[8px] text-[var(--ink-muted)]">
                  Preview · same sources
                </span>
              </div>

              <div className="grid gap-px bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-4">
                {MODES.map((mode) => (
                  <article
                    key={mode.name}
                    className="flex flex-col bg-[var(--canvas)] p-4 sm:p-5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-[13px] font-medium text-[var(--ink)]">
                        {mode.name}
                      </h3>
                      <span className="font-meta text-[8px] text-[var(--ink-muted)]">
                        {mode.length}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] leading-4 text-[var(--ink-muted)]">
                      {mode.copy}
                    </p>
                    <p className="mt-4 border-t border-[var(--line)] pt-3 text-[11px] leading-5 text-[var(--ink-soft)]">
                      {mode.answer}
                    </p>
                    <p className="mt-auto pt-4 font-meta text-[8px] text-[var(--ink-muted)]">
                      Same 2 sources
                    </p>
                  </article>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 sm:px-5">
                <p className="inline-flex items-center gap-1.5 font-meta text-[8px] text-[var(--ink-muted)]">
                  <Check
                    size={9}
                    strokeWidth={2}
                    className="text-[var(--ink-muted)]"
                    aria-hidden="true"
                  />
                  Citations stay fixed across modes
                </p>
                <p className="font-meta text-[8px] text-[var(--ink-muted)]">
                  Parental_Leave_Policy.pdf · p. 8 · Employee_Handbook.pdf · § 6.3
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Quality -------------------------------------------------- */}
        <section
          id="quality"
          aria-labelledby="quality-title"
          className={SECTION_CLASS}
        >
          <div className="mk-shell py-20 lg:py-28">
            <SectionHead
              id="quality-title"
              label="Quality"
              title="The answer says when it does not know."
            >
              <p className="mk-lede">
                When retrieval finds nothing good, the answer says so and the
                question is logged. Admins get a list of what to write next,
                ranked by how often it is asked.
              </p>
              <p className="text-[13px] leading-6 text-[var(--ink-muted)]">
                Evaluations run a prepared question set against the workspace and
                keep a record of coverage, so a change to the document set can be
                measured.
              </p>
            </SectionHead>

            <div
              data-reveal
              className="mt-10 grid gap-4 xl:grid-cols-[minmax(0,1.28fr)_minmax(0,0.72fr)]"
            >
              <div className="min-w-0">
                <GapsWorkspace />
              </div>

              <div className="grid content-start gap-4">
                <CoverageChart />

                <div className="mk-panel flex flex-col p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-meta text-[9px] text-[var(--ink-muted)]">
                      Evaluation set
                    </p>
                    <span className="rounded-full border border-[var(--line)] px-2 py-0.5 font-meta text-[8px] text-[var(--ink-muted)]">
                      Preview
                    </span>
                  </div>
                  <p className="mt-3 text-[22px] font-medium leading-none tracking-[-0.04em] text-[var(--ink)] tabular-nums">
                    38<span className="text-[11px] text-[var(--ink-muted)]">/42</span>
                  </p>
                  <p className="mt-1 text-[11px] text-[var(--ink-soft)]">
                    grounded on the first pass
                  </p>
                  <div className="mt-4 flex h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
                    <span className="h-full w-[90%] rounded-full bg-[var(--accent-jade)]" />
                  </div>
                  <div className="mt-4 space-y-2 border-t border-[var(--line)] pt-3">
                    {[
                      ["Grounded", "38"],
                      ["Gap recorded", "4"],
                      ["Wrong source", "0"],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="flex items-center justify-between"
                      >
                        <span className="text-[10px] text-[var(--ink-muted)]">
                          {label}
                        </span>
                        <span className="font-meta text-[9px] text-[var(--ink-soft)] tabular-nums">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-auto pt-3 font-meta text-[8px] leading-3.5 text-[var(--ink-muted)]">
                    Illustrative preview. Evaluations run against your own
                    question set.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Control -------------------------------------------------- */}
        <section
          id="control"
          aria-labelledby="control-title"
          className={cn(SECTION_CLASS, "bg-[var(--surface)]")}
        >
          <div className="mk-shell py-20 lg:py-28">
            <SectionHead
              id="control-title"
              label="Control"
              title="Admins manage the record. Staff read it."
            >
              <p className="mk-lede">
                Workspace admins upload documents, invite people, and review
                usage. Viewers ask questions and read answers without access to
                workspace configuration.
              </p>
              <p className="text-[13px] leading-6 text-[var(--ink-muted)]">
                Platform operators see workspace metadata for health and billing.
                They do not read document text or private conversations by
                default.
              </p>
            </SectionHead>

            <div
              data-reveal
              className="mt-10 grid gap-4 xl:grid-cols-[minmax(0,1.18fr)_minmax(0,0.82fr)]"
            >
              <div className="mk-window overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] bg-[var(--surface)] px-4 py-3 sm:px-5">
                  <div>
                    <p className="font-meta text-[9px] text-[var(--ink-muted)]">
                      Roles
                    </p>
                    <p className="mt-0.5 text-[12px] text-[var(--ink)]">
                      What each role can do
                    </p>
                  </div>
                  <span className="rounded-full border border-[var(--line)] px-2 py-0.5 font-meta text-[8px] text-[var(--ink-muted)]">
                    Preview · permission matrix
                  </span>
                </div>

                <table className="w-full table-fixed border-collapse bg-[var(--canvas)] text-left">
                  <caption className="sr-only">
                    Permissions for workspace admins, viewers, and platform
                    operators
                  </caption>
                  <thead>
                    <tr className="border-b border-[var(--line)] bg-[var(--surface-2)]">
                      <th
                        scope="col"
                        className="w-[43%] px-3 py-2.5 text-[10px] font-medium text-[var(--ink-soft)] sm:px-4"
                      >
                        Action
                      </th>
                      <th
                        scope="col"
                        className="w-[19%] px-2 py-2.5 text-center text-[10px] font-medium text-[var(--ink-soft)]"
                      >
                        Admin
                      </th>
                      <th
                        scope="col"
                        className="w-[19%] px-2 py-2.5 text-center text-[10px] font-medium text-[var(--ink-soft)]"
                      >
                        Viewer
                      </th>
                      <th
                        scope="col"
                        className="w-[19%] px-2 py-2.5 text-center text-[10px] font-medium text-[var(--ink-soft)]"
                      >
                        Platform operator
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line-soft)]">
                    {ROLE_ROWS.map((row) => (
                      <tr key={row.action}>
                        <th
                          scope="row"
                          className="px-3 py-3 text-left text-[11px] font-normal leading-4 text-[var(--ink)] sm:px-4"
                        >
                          {row.action}
                        </th>
                        <td className="px-2 py-3 text-center">
                          <Permission allowed={row.admin} />
                        </td>
                        <td className="px-2 py-3 text-center">
                          <Permission allowed={row.viewer} />
                        </td>
                        <td className="px-2 py-3 text-center">
                          <Permission allowed={row.operator} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="border-t border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 sm:px-5">
                  <p className="font-meta text-[8px] leading-4 text-[var(--ink-muted)]">
                    Platform operator access is metadata-only by default. Document
                    text and private conversations stay outside that view.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="mk-panel flex-1 p-5">
                  <p className="font-meta text-[9px] text-[var(--ink-muted)]">
                    Role notes
                  </p>
                  <dl className="mt-3 divide-y divide-[var(--line)]">
                    {[
                      {
                        role: "Admin",
                        copy: "Manages the library, people, settings, gaps, and evaluations.",
                      },
                      {
                        role: "Viewer",
                        copy: "Asks questions, reads cited answers, and opens sources. No upload or configuration.",
                      },
                      {
                        role: "Platform operator",
                        copy: "Manages workspace health and plans. Metadata only; no document text by default.",
                      },
                    ].map((item) => (
                      <div key={item.role} className="py-3 first:pt-0 last:pb-0">
                        <dt className="text-[11px] font-medium text-[var(--ink)]">
                          {item.role}
                        </dt>
                        <dd className="mt-1 text-[10px] leading-4 text-[var(--ink-muted)]">
                          {item.copy}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-4 border-t border-[var(--line)] pt-3">
                    <ArrowLink href="/security">
                      Read the security overview
                    </ArrowLink>
                  </div>
                </div>
              </div>
            </div>

            <div data-reveal className="mt-4">
              <SecurityDiagram />
            </div>
          </div>
        </section>

        {/* Closing band -------------------------------------------- */}
        <section
          aria-labelledby="start-title"
          className="relative isolate overflow-hidden bg-[var(--surface-2)]"
        >
          <div
            aria-hidden="true"
            className="mk-grid-bg pointer-events-none absolute inset-0 -z-10 opacity-30 [background-size:48px_48px]"
          />
          <div className="mk-shell py-20 lg:py-28">
            <div
              data-reveal
              className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end"
            >
              <div>
                <SectionLabel>Start</SectionLabel>
                <h2
                  id="start-title"
                  className="mk-h2 mt-4 max-w-[17ch] text-[var(--ink)]"
                >
                  See the citation index on your own documents
                </h2>
                <p className="mk-lede mt-6 max-w-[48ch]">
                  Upload the approved set, ask a real question, and open the page
                  behind the answer. Free during beta, no credit card.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end">
                <ButtonLink
                  href="/register"
                  className="w-full sm:w-auto"
                  icon={<ArrowUpRight size={15} strokeWidth={1.5} />}
                >
                  Create a workspace
                </ButtonLink>
                <ButtonLink
                  href="/contact"
                  variant="secondary"
                  className="w-full sm:w-auto"
                >
                  Talk to us
                </ButtonLink>
                <p className="mt-1 font-meta text-[9px] leading-4 text-[var(--ink-muted)] sm:w-full lg:mt-0 lg:text-right">
                  Free during beta · No credit card · Workspace-isolated
                </p>
              </div>
            </div>
          </div>
        </section>
      </>
    </SiteShell>
  );
}
