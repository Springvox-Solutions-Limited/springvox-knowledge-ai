import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  ClipboardCheck,
  Database,
  File,
  FileCheck2,
  FileSearch,
  FileSpreadsheet,
  FileText,
  FolderTree,
  ListChecks,
  LockKeyhole,
  Presentation,
  Quote,
  ScanLine,
  ShieldCheck,
  SlidersHorizontal,
  Table2,
  Users,
} from "lucide-react";

import { FaqList } from "./FaqList";
import { HeroVisual } from "./HeroVisual";
import { ReceiptComparison } from "./ReceiptComparison";
import { WorkspaceTour } from "./WorkspaceTour";
import {
  CoverageChart,
  DocumentPage,
  PipelineDiagram,
  ProcessingLedger,
  SecurityDiagram,
  TrustFacts,
} from "./product-visuals";
import { ArrowLink, ButtonLink, CitationMark, SectionLabel } from "./ui";

/* ------------------------------------------------------------------ */
/* Content                                                             */
/* ------------------------------------------------------------------ */

const FORMATS = [
  { ext: "PDF", label: "Policies and handbooks", icon: FileText },
  { ext: "DOCX", label: "Guides and memos", icon: FileText },
  { ext: "XLSX", label: "Finance and tables", icon: FileSpreadsheet },
  { ext: "PPTX", label: "Training decks", icon: Presentation },
  { ext: "CSV", label: "Exports and lists", icon: Table2 },
  { ext: "TXT", label: "Plain-text notes", icon: File },
];

const PROBLEMS = [
  {
    title: "Scattered sources",
    copy: "Approved documents sit across shared drives, chat threads, and email attachments. The current version is the one somebody remembers.",
  },
  {
    title: "Repeat questions",
    copy: "The same onboarding and policy questions pull senior staff out of their work, and the answer changes with who is asked.",
  },
  {
    title: "No record of gaps",
    copy: "Nobody can see which questions the documentation fails to answer, so the same gaps survive every quarter.",
  },
];

const CAPABILITIES = [
  {
    icon: FileCheck2,
    title: "Source-grounded answers",
    copy: "Replies are assembled from retrieved passages in your documents, with the files behind them named.",
  },
  {
    icon: FolderTree,
    title: "Collections by department",
    copy: "Group documents into People, Finance, Legal, Operations, and more, then scope a question to one collection.",
  },
  {
    icon: SlidersHorizontal,
    title: "Answer modes",
    copy: "Summary, Detailed, Executive, or Technical. Same source, four depths.",
  },
  {
    icon: FileSearch,
    title: "In-app preview",
    copy: "Open PDF, DOCX, XLSX, CSV, Markdown, and text beside the answer.",
  },
  {
    icon: ListChecks,
    title: "Knowledge-gap tracking",
    copy: "See which questions found no good source, so the document gets written.",
  },
  {
    icon: ClipboardCheck,
    title: "Answer evaluations",
    copy: "Run a question set against the workspace and keep a record of how answers hold up.",
  },
];

const TEAMS = [
  {
    name: "People and HR",
    question: "What does a new support hire complete in week one?",
    answer:
      "Orientation, the customer data policy, and a first-ticket review with the team lead.",
    source: "Employee_Handbook.pdf · p. 14",
    href: "/solutions#people",
  },
  {
    name: "Support",
    question: "What is the escalation path for a billing dispute?",
    answer:
      "Tier one logs the dispute, then routes to Billing Operations within one business day.",
    source: "Support_Playbook.docx · § 3.2",
    href: "/solutions#support",
  },
  {
    name: "Legal and compliance",
    question: "What is the approved wording for a data request?",
    answer:
      "Use the acknowledgement in Policy 12; do not paraphrase the response window.",
    source: "Data_Requests_Policy.pdf · § 2",
    href: "/solutions#legal",
  },
  {
    name: "Operations",
    question: "What is the sign-off for a purchase above the local limit?",
    answer:
      "Site lead approval first, then Finance for the amount above the regional threshold.",
    source: "Procurement_SOP.pdf · p. 6",
    href: "/solutions#operations",
  },
];

const PLANS = [
  {
    name: "Essential",
    price: "Free during beta",
    detail: "For one team validating cited answers in a controlled workspace.",
    limits: "20 documents · 25 users · 1,000 questions/month",
    features: [
      "Cited chat with sources",
      "Collections and document scoping",
      "In-app file preview",
      "Answer modes",
      "Basic analytics",
    ],
    href: "/register",
    action: "Create a workspace",
    featured: true,
  },
  {
    name: "Business",
    price: "Talk to us",
    detail: "For organisations rolling the workspace out across departments.",
    limits: "Capacity quoted for your workspace",
    features: [
      "Everything in Essential",
      "Advanced parsing",
      "Full analytics and usage metering",
      "Knowledge-gap tracking",
      "Answer-quality evaluations",
      "Roles and invitations",
    ],
    href: "/contact",
    action: "Talk to us",
    featured: false,
  },
  {
    name: "Enterprise",
    price: "Talk to us",
    detail: "For regulated teams that need custom limits and a security review.",
    limits: "Custom document, user, and volume limits",
    features: [
      "Everything in Business",
      "Configurable usage limits",
      "Audit logs and security review",
      "Priority support",
      "SSO and source connectors planned",
    ],
    href: "/contact",
    action: "Book a review",
    featured: false,
  },
];

const FAQS = [
  {
    q: "How is this different from a general chatbot?",
    a: "Rekall-IQ answers from the documents you upload, not the open web. Replies name the files behind them, and anything outside those files is out of scope.",
  },
  {
    q: "What file types are supported?",
    a: "PDF, DOCX, XLSX, PPTX, CSV, and TXT. Each upload gets a summary, keywords, and a category.",
  },
  {
    q: "How long does processing take?",
    a: "Most documents finish in a few minutes. Large batches run in the background and appear as processing in the dashboard.",
  },
  {
    q: "Can I control who sees what?",
    a: "Workspace admins upload documents and manage users. Viewers can ask questions and read answers; they cannot upload, delete, or change workspace settings. Nobody can cross workspace boundaries.",
  },
  {
    q: "Where is my data stored?",
    a: "Documents are stored in Supabase Storage, chunks in Postgres, and vectors in Qdrant, all keyed by workspace. The hosting and model providers are named on the data handling page.",
  },
  {
    q: "What happens when the documents do not answer the question?",
    a: "The answer says so, and the question is recorded as a knowledge gap for admins to review.",
  },
];

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function LandingPage() {
  return (
    <>
      {/* Hero ------------------------------------------------------- */}
      <section className="relative isolate overflow-hidden border-b border-[var(--line)]">
        <div
          aria-hidden="true"
          className="mk-grid-bg mk-grid-fade pointer-events-none absolute inset-0 -z-20 opacity-60 [background-size:56px_56px]"
        />
        <div
          aria-hidden="true"
          className="mk-grain pointer-events-none absolute inset-0 -z-10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-52 top-1/3 -z-10 h-[34rem] w-[34rem] rounded-full border border-[var(--line)] opacity-30"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 top-0 -z-10 h-[44rem] w-[44rem] rounded-full border border-[var(--line)] opacity-25"
        />

        <div className="mk-shell">
          <div className="grid gap-14 pb-20 pt-14 sm:pt-16 xl:grid-cols-[minmax(0,1fr)_700px] xl:items-center xl:gap-10 xl:pb-28 xl:pt-20 2xl:grid-cols-[minmax(0,1fr)_740px]">
            <div className="max-w-[35rem]">
              <p
                data-hero-line
                className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 font-meta text-[10px] text-[var(--ink-soft)]"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-jade)]" />
                Approved documents only
              </p>

              <h1
                data-hero-line
                className="mk-display mk-h1 mt-6 text-[var(--ink)]"
              >
                Every answer{" "}
                <br />
                comes with{" "}
                <br />
                <span className="text-[var(--ink)]">
                  its source<span className="text-[var(--accent-jade)]">.</span>
                </span>
              </h1>

              <p data-hero-line className="mk-lede mt-6 max-w-[44ch]">
                Rekall-IQ turns your approved company documents into cited answers
                your staff can check in one click. No open-web guessing, no
                untraceable advice.
              </p>

              <div data-hero-line className="mt-8 flex flex-wrap items-center gap-3">
                <ButtonLink
                  href="/register"
                  icon={<ArrowUpRight size={15} strokeWidth={1.5} />}
                >
                  Create a workspace
                </ButtonLink>
                <ButtonLink href="#workspace" variant="secondary">
                  Explore the workspace
                </ButtonLink>
              </div>

              <p data-hero-line className="mt-4 font-meta text-[10px] text-[var(--ink-muted)]">
                Free during beta · No credit card · Workspace-isolated
              </p>

              <dl
                data-hero-line
                className="mt-10 grid max-w-[30rem] grid-cols-3 gap-3 border-t border-[var(--line)] pt-5"
              >
                {[
                  ["6", "formats"],
                  ["0", "open-web answers"],
                  ["1", "workspace per org"],
                ].map(([value, label]) => (
                  <div key={label}>
                    <dt className="text-[17px] font-medium leading-none tracking-[-0.03em] text-[var(--ink)] tabular-nums">
                      {value}
                    </dt>
                    <dd className="mt-1.5 font-meta text-[9px] leading-3.5 text-[var(--ink-muted)]">
                      {label}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div data-hero-visual className="min-w-0 xl:-mr-6">
              <HeroVisual />
            </div>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(to_top,var(--canvas),transparent)]"
        />
      </section>

      {/* Formats ---------------------------------------------------- */}
      <section aria-label="Supported document formats" className="border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="mk-shell py-8">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <p className="text-[12px] font-medium text-[var(--ink)]">
              Built for the documents you already have
            </p>
            <p className="font-meta text-[9px] text-[var(--ink-muted)]">
              Six formats · parsed with page references
            </p>
          </div>
          <ul className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {FORMATS.map((format) => {
              const Icon = format.icon;
              return (
                <li
                  key={format.ext}
                  className="group flex items-center gap-2.5 rounded-[8px] border border-[var(--line)] bg-[var(--canvas)] px-3 py-2.5 transition-colors hover:border-[var(--accent-jade-100)]"
                >
                  <Icon
                    size={14}
                    strokeWidth={1.5}
                    className="shrink-0 text-[var(--ink-muted)] transition-colors group-hover:text-[var(--accent-jade)]"
                    aria-hidden="true"
                  />
                  <span className="min-w-0">
                    <span className="block font-meta text-[10px] text-[var(--ink)]">
                      {format.ext}
                    </span>
                    <span className="mt-0.5 block truncate text-[9px] text-[var(--ink-muted)]">
                      {format.label}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Problem ---------------------------------------------------- */}
      <section className="border-b border-[var(--line)]">
        <div className="mk-shell grid gap-12 py-20 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:py-28">
          <div data-reveal>
            <SectionLabel>The retrieval problem</SectionLabel>
            <h2 className="mk-h2 mt-4 max-w-[16ch] text-[var(--ink)]">
              The answer exists. Finding it is the work.
            </h2>
            <p className="mk-lede mt-6 max-w-[44ch]">
              Policies live in shared drives. Handbooks live in inboxes. The version
              people trust lives in someone’s memory. Staff ask the same questions,
              get different answers, and nobody can tell which one is current.
            </p>
            <div className="mt-8">
              <ArrowLink href="/product">See how retrieval works</ArrowLink>
            </div>
          </div>

          <ol className="border-t border-[var(--line)]">
            {PROBLEMS.map((item, index) => (
              <li
                key={item.title}
                data-reveal
                className="grid gap-3 border-b border-[var(--line)] py-6 sm:grid-cols-[48px_1fr]"
              >
                <span className="font-meta text-[10px] text-[var(--ink-muted)] tabular-nums">
                  0{index + 1}
                </span>
                <div>
                  <h3 className="text-[15px] font-medium text-[var(--ink)]">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 max-w-[52ch] text-[13px] leading-6 text-[var(--ink-soft)]">
                    {item.copy}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Receipt comparison ---------------------------------------- */}
      <section className="border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="mk-shell py-20 lg:py-28">
          <div data-reveal className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <SectionLabel>Evidence, not confidence</SectionLabel>
              <h2 className="mk-h2 mt-4 max-w-[14ch] text-[var(--ink)]">
                One answer. One receipt.
              </h2>
            </div>
            <p className="mk-lede max-w-[54ch] lg:pb-1">
              Any assistant can sound certain. The difference is whether the person
              reading the answer can check it without leaving the page.
            </p>
          </div>

          <div data-reveal className="mt-10">
            <ReceiptComparison />
            <p className="mt-3 font-meta text-[9px] leading-4 text-[var(--ink-muted)]">
              Preview of the citation view · sample content
            </p>
          </div>
        </div>
      </section>

      {/* Workspace tour -------------------------------------------- */}
      <section id="workspace" className="scroll-mt-20 border-b border-[var(--line)]">
        <div className="mk-shell py-20 lg:py-28">
          <div data-reveal className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <SectionLabel>A workspace built around sources</SectionLabel>
              <h2 className="mk-h2 mt-4 max-w-[13ch] text-[var(--ink)]">
                Ask once. See the evidence.
              </h2>
            </div>
            <p className="mk-lede max-w-[54ch] lg:pb-1">
              Browse the approved library, ask a question, read the answer beside its
              sources, then open the relevant passage in context. Every view below is
              a preview of the daily workflow.
            </p>
          </div>

          <div data-reveal className="mt-10">
            <WorkspaceTour />
          </div>

          <ul className="mt-14 grid gap-x-10 border-t border-[var(--line)] sm:grid-cols-2 lg:grid-cols-3">
            {CAPABILITIES.map((item) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.title}
                  data-reveal
                  className="flex gap-3 border-b border-[var(--line)] py-5"
                >
                  <Icon
                    size={16}
                    strokeWidth={1.5}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-[var(--accent-jade)]"
                  />
                  <div>
                    <h3 className="text-[13px] font-medium text-[var(--ink)]">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-[12px] leading-5 text-[var(--ink-muted)]">
                      {item.copy}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Pipeline --------------------------------------------------- */}
      <section className="border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="mk-shell py-20 lg:py-28">
          <div data-reveal className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
            <div>
              <SectionLabel>From upload to answer</SectionLabel>
              <h2 className="mk-h2 mt-4 max-w-[15ch] text-[var(--ink)]">
                The work happens before anyone asks.
              </h2>
              <p className="mk-lede mt-6 max-w-[42ch]">
                Uploading is the only manual step. Parsing, sectioning, embedding, and
                indexing run in the background, with the workspace filter carried
                through every hop.
              </p>

              <div className="mt-7 space-y-2.5">
                {[
                  "No inline document processing in the request path",
                  "Page references survive parsing",
                  "Large batches keep the workspace usable",
                ].map((point) => (
                  <p
                    key={point}
                    className="flex items-start gap-2.5 text-[12px] leading-5 text-[var(--ink-soft)]"
                  >
                    <Check
                      size={13}
                      strokeWidth={2}
                      className="mt-0.5 shrink-0 text-[var(--accent-jade)]"
                      aria-hidden="true"
                    />
                    {point}
                  </p>
                ))}
              </div>

              <div className="mt-7">
                <ArrowLink href="/product">Read the ingestion detail</ArrowLink>
              </div>
            </div>

            <div className="min-w-0">
              <PipelineDiagram />
              <div className="mt-4 grid gap-3 sm:grid-cols-[1.1fr_0.9fr]">
                <ProcessingLedger />
                <div className="rounded-[12px] border border-[var(--line)] bg-[var(--canvas)] p-4">
                  <ScanLine
                    size={16}
                    strokeWidth={1.5}
                    className="text-[var(--accent-jade)]"
                    aria-hidden="true"
                  />
                  <p className="mt-3 text-[12px] font-medium text-[var(--ink)]">
                    Tables, slides, and scans
                  </p>
                  <p className="mt-1.5 text-[11px] leading-5 text-[var(--ink-muted)]">
                    Advanced parsing is available for complex files. It is optional,
                    and only runs on the files an admin chooses.
                  </p>
                  <p className="mt-3 border-t border-[var(--line)] pt-2 font-meta text-[8px] text-[var(--ink-muted)]">
                    LlamaParse · optional
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quality / gaps -------------------------------------------- */}
      <section className="border-b border-[var(--line)]">
        <div className="mk-shell grid gap-12 py-20 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:gap-20 lg:py-28">
          <div data-reveal>
            <SectionLabel>Coverage, not confidence</SectionLabel>
            <h2 className="mk-h2 mt-4 max-w-[15ch] text-[var(--ink)]">
              The answer says when it does not know.
            </h2>
            <p className="mk-lede mt-6 max-w-[46ch]">
              When retrieval finds nothing good, Rekall-IQ says the documents do not
              cover it. The question is logged, ranked, and handed back to the people
              who can write the missing page.
            </p>

            <ul className="mt-8 space-y-4 border-t border-[var(--line)] pt-6">
              {[
                {
                  title: "A ranked gap list",
                  copy: "See what staff asked that the approved set could not answer.",
                },
                {
                  title: "Evaluations on a real question set",
                  copy: "Run the same questions after a document change and compare.",
                },
                {
                  title: "A coverage figure you can audit",
                  copy: "Grounded answers as a share of questions asked, over time.",
                },
              ].map((item) => (
                <li key={item.title} className="grid gap-1 sm:grid-cols-[20px_1fr]">
                  <Check
                    size={14}
                    strokeWidth={2}
                    className="mt-0.5 text-[var(--accent-jade)]"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-[13px] font-medium text-[var(--ink)]">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-[12px] leading-5 text-[var(--ink-muted)]">
                      {item.copy}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-7">
              <ArrowLink href="/product#quality">See gap tracking</ArrowLink>
            </div>
          </div>

          <div data-reveal className="grid gap-3 sm:grid-cols-2">
            <CoverageChart />
            <div className="flex flex-col rounded-[12px] border border-[var(--line)] bg-[var(--surface)] p-4">
              <div className="flex items-center justify-between">
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
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-[10px] text-[var(--ink-muted)]">{label}</span>
                    <span className="font-meta text-[9px] text-[var(--ink-soft)] tabular-nums">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-auto pt-3 font-meta text-[8px] leading-3.5 text-[var(--ink-muted)]">
                Illustrative preview. Evaluations run against your own question set.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security -------------------------------------------------- */}
      <section className="border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="mk-shell py-20 lg:py-28">
          <div data-reveal className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
            <div>
              <SectionLabel>Isolation and access</SectionLabel>
              <h2 className="mk-h2 mt-4 max-w-[14ch] text-[var(--ink)]">
                Isolation is architectural, not a setting.
              </h2>
            </div>
            <p className="mk-lede max-w-[54ch] lg:pb-1">
              Each organisation runs inside its own workspace. Every database read,
              vector search, and API call is filtered to that workspace before a model
              sees anything.
            </p>
          </div>

          <div data-reveal className="mt-10 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
            <SecurityDiagram />
            <div className="grid gap-3">
              {[
                {
                  icon: LockKeyhole,
                  title: "Workspace-scoped queries",
                  copy: "Every table and vector query is filtered by workspace_id.",
                },
                {
                  icon: ShieldCheck,
                  title: "Row-level security",
                  copy: "RLS is enabled on every table and never bypassed.",
                },
                {
                  icon: Database,
                  title: "Metadata-only operator view",
                  copy: "Platform operators manage health and plans without reading document text by default.",
                },
              ].map((fact) => {
                const Icon = fact.icon;
                return (
                  <div
                    key={fact.title}
                    className="flex gap-3 rounded-[12px] border border-[var(--line)] bg-[var(--canvas)] p-4"
                  >
                    <Icon
                      size={15}
                      strokeWidth={1.5}
                      className="mt-0.5 shrink-0 text-[var(--accent-jade)]"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-[12px] font-medium text-[var(--ink)]">
                        {fact.title}
                      </p>
                      <p className="mt-1 text-[11px] leading-5 text-[var(--ink-muted)]">
                        {fact.copy}
                      </p>
                    </div>
                  </div>
                );
              })}
              <ArrowLink href="/security" className="mt-1">
                Read the security overview
              </ArrowLink>
            </div>
          </div>

          <div data-reveal className="mt-10">
            <TrustFacts />
          </div>
        </div>
      </section>

      {/* Teams ----------------------------------------------------- */}
      <section className="border-b border-[var(--line)]">
        <div className="mk-shell py-20 lg:py-28">
          <div data-reveal className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <SectionLabel>Who it is for</SectionLabel>
              <h2 className="mk-h2 mt-4 max-w-[16ch] text-[var(--ink)]">
                Built for the teams that get asked.
              </h2>
            </div>
            <ArrowLink href="/solutions">See all teams</ArrowLink>
          </div>

          <div
            data-reveal
            className="mt-10 grid gap-px overflow-hidden rounded-[18px] border border-[var(--line)] bg-[var(--line)] lg:grid-cols-[0.72fr_1.28fr]"
          >
            <div className="flex flex-col justify-between bg-[var(--canvas)] p-6 sm:p-8">
              <div>
                <span className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-[var(--line)] bg-[var(--surface)]">
                  <Users size={16} strokeWidth={1.5} className="text-[var(--accent-jade)]" aria-hidden="true" />
                </span>
                <p className="mt-6 max-w-[26ch] text-[19px] font-medium leading-7 tracking-[-0.02em] text-[var(--ink)]">
                  One library.
                  <br />
                  Every team’s questions.
                </p>
                <p className="mt-3 max-w-[38ch] text-[12px] leading-5 text-[var(--ink-muted)]">
                  Collections keep a question inside one department. The permissions
                  stay the same; the answers get more specific.
                </p>
              </div>
              <div className="mt-10 border-t border-[var(--line)] pt-4">
                <p className="font-meta text-[9px] text-[var(--ink-muted)]">
                  People · Support · Legal · Operations
                </p>
              </div>
            </div>

            <div className="grid gap-px bg-[var(--line)] sm:grid-cols-2">
              {TEAMS.map((team, index) => (
                <Link
                  key={team.name}
                  href={team.href}
                  className="group flex min-h-[188px] flex-col justify-between bg-[var(--canvas)] p-5 transition-colors hover:bg-[var(--surface)] sm:p-6"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] font-medium text-[var(--ink)]">
                        {team.name}
                      </p>
                      <ArrowUpRight
                        size={13}
                        strokeWidth={1.5}
                        className="text-[var(--ink-muted)] transition-colors group-hover:text-[var(--accent-jade)]"
                        aria-hidden="true"
                      />
                    </div>
                    <p className="mt-4 flex gap-2 text-[11px] leading-5 text-[var(--ink-muted)]">
                      <Quote size={11} strokeWidth={1.5} className="mt-0.5 shrink-0" aria-hidden="true" />
                      {team.question}
                    </p>
                    <p className="mt-2 text-[12px] leading-5 text-[var(--ink-soft)]">
                      {team.answer}
                      <CitationMark n={index + 1} />
                    </p>
                  </div>
                  <p className="mt-4 truncate border-t border-[var(--line)] pt-2 font-meta text-[8px] text-[var(--ink-muted)]">
                    {team.source}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Plans ----------------------------------------------------- */}
      <section className="border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="mk-shell py-20 lg:py-28">
          <div data-reveal className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <SectionLabel>Plans</SectionLabel>
              <h2 className="mk-h2 mt-4 max-w-[20ch] text-[var(--ink)]">
                Start on the free tier. Add capacity when it earns it.
              </h2>
            </div>
            <ArrowLink href="/pricing">Compare all plan details</ArrowLink>
          </div>

          <div className="mt-10 grid gap-3 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <article
                key={plan.name}
                data-reveal
                className={`flex flex-col rounded-[16px] border p-5 sm:p-6 ${
                  plan.featured
                    ? "border-[var(--accent-jade-200)] bg-[var(--canvas)]"
                    : "border-[var(--line)] bg-[var(--canvas)]"
                }`}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-[15px] font-medium text-[var(--ink)]">
                    {plan.name}
                  </h3>
                  <span
                    className={`font-meta text-[9px] ${
                      plan.featured ? "text-[var(--accent-jade)]" : "text-[var(--ink-muted)]"
                    }`}
                  >
                    {plan.price}
                  </span>
                </div>
                <p className="mt-3 min-h-10 text-[12px] leading-5 text-[var(--ink-soft)]">
                  {plan.detail}
                </p>
                <p className="mt-4 border-y border-[var(--line)] py-2.5 font-meta text-[9px] leading-4 text-[var(--ink-muted)]">
                  {plan.limits}
                </p>
                <ul className="mt-4 flex-1 space-y-2 text-[11px] leading-5 text-[var(--ink-soft)]">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2.5">
                      <Check
                        size={12}
                        strokeWidth={2}
                        className="mt-0.5 shrink-0 text-[var(--accent-jade)]"
                        aria-hidden="true"
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`mt-6 inline-flex min-h-10 items-center justify-center rounded-[8px] px-4 py-2.5 text-[12px] font-medium transition-colors ${
                    plan.featured
                      ? "bg-[var(--accent-jade)] text-[#04100e] hover:bg-[var(--accent-jade-hover)]"
                      : "border border-[var(--line)] text-[var(--ink)] hover:border-[var(--ink-muted)] hover:bg-[var(--surface)]"
                  }`}
                >
                  {plan.action}
                </Link>
              </article>
            ))}
          </div>
          <p className="mt-4 font-meta text-[9px] leading-4 text-[var(--ink-muted)]">
            Paid plans are quoted per workspace. Prices are confirmed before a workspace
            is upgraded.
          </p>
        </div>
      </section>

      {/* FAQ ------------------------------------------------------- */}
      <section className="border-b border-[var(--line)]">
        <div className="mk-shell grid gap-12 py-20 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20 lg:py-28">
          <div data-reveal>
            <SectionLabel>Questions</SectionLabel>
            <h2 className="mk-h2 mt-4 max-w-[15ch] text-[var(--ink)]">
              What teams ask before they start.
            </h2>
            <p className="mt-4 max-w-[36ch] text-[12px] leading-5 text-[var(--ink-muted)]">
              If your question is not here, the docs cover the mechanics and the
              contact page reaches a real inbox.
            </p>
            <div className="mt-5 flex flex-wrap gap-4">
              <ArrowLink href="/docs">Read the docs</ArrowLink>
              <ArrowLink href="/contact">Talk to us</ArrowLink>
            </div>
          </div>
          <div data-reveal>
            <FaqList items={FAQS} />
          </div>
        </div>
      </section>

      {/* CTA ------------------------------------------------------- */}
      <section className="relative isolate overflow-hidden bg-[var(--surface-2)]">
        <div
          aria-hidden="true"
          className="mk-grid-bg pointer-events-none absolute inset-0 -z-10 opacity-30 [background-size:48px_48px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-56 -top-24 -z-10 h-[36rem] w-[36rem] rounded-full border border-[var(--line)] opacity-30"
        />
        <div className="mk-shell py-20 lg:py-28">
          <div data-reveal className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <SectionLabel>Start</SectionLabel>
              <h2 className="mk-display mt-4 max-w-[13ch] text-[clamp(2.5rem,6vw,5rem)] leading-[0.98] text-[var(--ink)]">
                Put your company knowledge on the record.
              </h2>
              <p className="mk-lede mt-6 max-w-[46ch]">
                Upload the approved set, invite your team, and give every answer a
                source. Free during beta, no credit card.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink
                  href="/register"
                  icon={<ArrowUpRight size={15} strokeWidth={1.5} />}
                >
                  Create a workspace
                </ButtonLink>
                <ButtonLink href="/contact" variant="secondary">
                  Talk to us
                </ButtonLink>
              </div>
            </div>

            <div className="hidden justify-self-end lg:block" aria-hidden="true">
              <div className="relative h-64 w-80">
                <div className="absolute right-8 top-3 h-48 w-40 rotate-6 rounded-[8px] border border-[var(--line)] bg-[var(--surface)]" />
                <div className="absolute right-14 top-5 h-48 w-40 rotate-2 rounded-[8px] border border-[var(--line)] bg-[var(--surface)]" />
                <div className="absolute right-20 top-0 w-44 rotate-0 rounded-[8px] border border-[var(--accent-jade-200)] bg-[var(--canvas)] p-2 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.9)]">
                  <DocumentPage compact page="8" section="People · policy 04" title="Parental leave" />
                  <p className="mt-2 border-t border-[var(--line)] pt-2 font-meta text-[8px] leading-3.5 text-[var(--ink-muted)]">
                    Every answer has a page behind it.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
