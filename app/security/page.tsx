import type { Metadata } from "next";
import {
  ArrowRight,
  Check,
  Database,
  Layers3,
  LockKeyhole,
  Mail,
  Minus,
  UserRound,
} from "lucide-react";

import { SecurityDiagram, TrustFacts } from "@/src/components/marketing/product-visuals";
import { SiteShell } from "@/src/components/marketing/SiteShell";
import {
  TrustSelector,
  type TrustSelectorItem,
} from "@/src/components/marketing/TrustSelector";
import { ArrowLink, ButtonLink, PageHero, SectionLabel } from "@/src/components/marketing/ui";
import { cn } from "@/src/lib/utils";

export const metadata: Metadata = {
  title: "Security and data handling",
  description:
    "How Rekall-IQ isolates workspaces, controls access, moves data through named providers, and what it does not claim.",
  alternates: { canonical: "/security" },
};

const SUBPROCESSORS = [
  ["Supabase", "Authentication, Postgres, file storage", "Account records, workspace data, uploaded documents"],
  ["Vercel", "Application hosting", "Request logs and application runtime"],
  ["Qdrant", "Vector index", "Document chunk vectors with workspace metadata"],
  ["Google Gemini", "Answer generation", "Retrieved passages needed to answer a question"],
  ["Voyage AI", "Embeddings and reranking", "Question and passage text sent for embedding"],
  ["LlamaParse", "Optional advanced parsing", "Files an admin chooses to parse with it"],
  ["Inngest", "Background job orchestration", "Document processing events and job metadata"],
  ["Resend", "Transactional email", "Invitation and account email addresses"],
];

const AT_A_GLANCE = [
  {
    title: "RLS on every table",
    detail: "Row-level security is enabled on every table and never bypassed for convenience.",
    status: "Enforced",
  },
  {
    title: "Workspace-scoped vector search",
    detail: "Qdrant filters on workspace_id before a passage reaches the answer model.",
    status: "Enforced",
  },
  {
    title: "Server-only service role",
    detail: "The service-role key is imported only in server modules and never sent to the browser.",
    status: "Enforced",
  },
  {
    title: "Metadata-only operator view",
    detail: "Platform operators see workspace health, plans, and counts, not document text by default.",
    status: "Default",
  },
];

const TRUST_ITEMS: TrustSelectorItem[] = [
  {
    id: "isolation",
    label: "Isolation",
    summary: "Workspace-scoped queries and a Qdrant filter",
    title: "A request cannot widen its own scope",
    points: [
      "Every tenant-side query carries the authenticated profile’s workspace, and row-level security is enabled on every table.",
      "Vector search sends a workspace_id payload filter to Qdrant, so a semantically identical passage in another workspace is not a candidate.",
      "The service-role key is imported only in server modules; it is never part of a browser bundle.",
      "Document previews are served through an authenticated, workspace-scoped stream rather than a public storage URL.",
      "Suspended, expired, or deleted workspaces are blocked from write operations before the write runs.",
    ],
    artifact: (
      <div className="overflow-hidden rounded-[12px] border border-[var(--line)] bg-[var(--surface)]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] px-3 py-2">
          <p className="mk-meta">Two stores, one scope</p>
          <span className="font-meta text-[9px] text-[var(--accent-jade)]">
            workspace_id
          </span>
        </div>
        <div className="divide-y divide-[var(--line)]">
          <div className="px-3 py-2.5">
            <div className="flex items-center gap-2">
              <Database
                size={12}
                strokeWidth={1.5}
                className="shrink-0 text-[var(--ink-muted)]"
                aria-hidden="true"
              />
              <span className="text-[11px] font-medium text-[var(--ink)]">
                Postgres
              </span>
              <span className="ml-auto font-meta text-[9px] text-[var(--ink-muted)]">
                Row-level security
              </span>
            </div>
            <p className="mt-1.5 break-all rounded-[6px] bg-[var(--canvas)] px-2 py-1 font-meta text-[10px] leading-4 text-[var(--ink-soft)]">
              where workspace_id = 8f2c…
            </p>
          </div>
          <div className="px-3 py-2.5">
            <div className="flex items-center gap-2">
              <Layers3
                size={12}
                strokeWidth={1.5}
                className="shrink-0 text-[var(--ink-muted)]"
                aria-hidden="true"
              />
              <span className="text-[11px] font-medium text-[var(--ink)]">
                Qdrant
              </span>
              <span className="ml-auto font-meta text-[9px] text-[var(--ink-muted)]">
                Payload filter
              </span>
            </div>
            <p className="mt-1.5 break-all rounded-[6px] bg-[var(--canvas)] px-2 py-1 font-meta text-[10px] leading-4 text-[var(--ink-soft)]">
              payload.workspace_id = 8f2c…
            </p>
          </div>
        </div>
        <p className="border-t border-[var(--line)] px-3 py-2 text-[10px] leading-4 text-[var(--ink-muted)]">
          A retrieval cannot return a passage from a different workspace.
        </p>
      </div>
    ),
  },
  {
    id: "access",
    label: "Access",
    summary: "Roles, invitations, and the platform-admin boundary",
    title: "Two workspace roles, one operator boundary",
    points: [
      "Workspace admins upload and delete documents, invite users, review analytics, and change workspace settings.",
      "Viewers ask questions, read answers, and see their own notifications; they cannot upload, delete, invite, or change settings.",
      "Invitations expire, cannot be accepted twice, and must match the invited email address.",
      "Platform operators manage workspace health, plans, and lifecycle through a separate /platform surface.",
    ],
    artifact: (
      <div className="overflow-hidden rounded-[12px] border border-[var(--line)] bg-[var(--surface)]">
        <div className="grid sm:grid-cols-2">
          <div className="border-b border-[var(--line)] p-3 sm:border-b-0 sm:border-r">
            <p className="mk-meta">Within a workspace</p>
            <div className="mt-2 space-y-2.5">
              <div>
                <p className="flex items-center gap-1.5 text-[10px] font-medium text-[var(--ink)]">
                  <UserRound
                    size={11}
                    strokeWidth={1.5}
                    className="text-[var(--ink-muted)]"
                    aria-hidden="true"
                  />
                  Workspace admin
                </p>
                <p className="mt-0.5 text-[10px] leading-4 text-[var(--ink-muted)]">
                  Upload, delete, invite, settings
                </p>
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-[10px] font-medium text-[var(--ink)]">
                  <UserRound
                    size={11}
                    strokeWidth={1.5}
                    className="text-[var(--ink-muted)]"
                    aria-hidden="true"
                  />
                  Viewer
                </p>
                <p className="mt-0.5 text-[10px] leading-4 text-[var(--ink-muted)]">
                  Ask, read, own notifications
                </p>
              </div>
            </div>
          </div>
          <div className="p-3">
            <p className="mk-meta">Platform boundary</p>
            <div className="mt-2">
              <p className="flex items-center gap-1.5 text-[10px] font-medium text-[var(--ink)]">
                <LockKeyhole
                  size={11}
                  strokeWidth={1.5}
                  className="text-[var(--ink-muted)]"
                  aria-hidden="true"
                />
                Platform operator
              </p>
              <p className="mt-0.5 text-[10px] leading-4 text-[var(--ink-muted)]">
                Workspace health, plans, lifecycle
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-[10px] text-[var(--ink-soft)]">
                <Minus
                  size={11}
                  strokeWidth={2}
                  className="text-[var(--ink-muted)]"
                  aria-hidden="true"
                />
                No document text by default
              </p>
            </div>
          </div>
        </div>
        <p className="border-t border-[var(--line)] px-3 py-2 text-[10px] leading-4 text-[var(--ink-muted)]">
          Public signup never creates a platform administrator.
        </p>
      </div>
    ),
  },
  {
    id: "data-flow",
    label: "Data flow",
    summary: "Upload to answer, with each provider named",
    title: "The path a document and a question take",
    points: [
      "Uploads are written to Supabase Storage and queued as a background job by Inngest; parsing does not run inline in the request.",
      "The parser extracts text, tables, and page references. LlamaParse is optional and runs only on files an admin selects.",
      "Voyage AI embeds passage and question text. Vectors are written to Qdrant with workspace and document metadata.",
      "Retrieval embeds the question, filters Qdrant by workspace_id, merges keyword candidates, and reranks the result.",
      "Google Gemini receives the retrieved passages needed for an answer. The reply returns with citations to the source files.",
    ],
    artifact: (
      <div className="overflow-hidden rounded-[12px] border border-[var(--line)] bg-[var(--surface)]">
        <ol className="divide-y divide-[var(--line)]">
          {[
            ["Upload", "Admin"],
            ["Storage", "Supabase"],
            ["Parse", "Inngest"],
            ["Embed", "Voyage AI"],
            ["Retrieve", "Qdrant"],
            ["Answer", "Google Gemini"],
          ].map(([step, provider], index) => (
            <li key={step} className="flex items-center gap-2 px-3 py-2">
              <span className="w-4 shrink-0 font-meta text-[9px] tabular-nums text-[var(--ink-muted)]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-[11px] text-[var(--ink)]">{step}</span>
              <span className="ml-auto font-meta text-[9px] text-[var(--ink-muted)]">
                {provider}
              </span>
            </li>
          ))}
        </ol>
        <p className="border-t border-[var(--line)] px-3 py-2 text-[10px] leading-4 text-[var(--ink-muted)]">
          LlamaParse is optional and only runs on files an admin selects.
        </p>
      </div>
    ),
  },
  {
    id: "operator",
    label: "Operator boundary",
    summary: "Metadata only by default, with no document text",
    title: "The operator sees the system, not your library",
    points: [
      "The platform surface covers workspace health, plan state, and lifecycle events.",
      "By default an operator sees counts, statuses, timestamps, and error metadata rather than document content.",
      "Document text, chunk text, and chat messages are outside the default operator view.",
      "Platform routes are separated by role and require a platform administrator on every request.",
      "Billing, deletion, and access changes produce audit or system events.",
    ],
    artifact: (
      <div className="overflow-hidden rounded-[12px] border border-[var(--line)] bg-[var(--surface)]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] px-3 py-2">
          <p className="mk-meta">Default operator view</p>
          <span className="font-meta text-[9px] text-[var(--ink-muted)]">Metadata</span>
        </div>
        <ul className="grid grid-cols-2 gap-px bg-[var(--line)]">
          {[
            "Workspace status",
            "Plan and limits",
            "Document counts",
            "Processing failures",
          ].map((item) => (
            <li
              key={item}
              className="flex items-center gap-1.5 bg-[var(--surface)] px-3 py-2 text-[10px] leading-4 text-[var(--ink-soft)]"
            >
              <Check
                size={10}
                strokeWidth={2}
                className="shrink-0 text-emerald-300"
                aria-hidden="true"
              />
              {item}
            </li>
          ))}
        </ul>
        <div className="border-t border-[var(--line)] px-3 py-2.5">
          <p className="font-meta text-[9px] text-[var(--ink-muted)]">
            Not in the default view
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {["Document text", "Chunk text", "Chat messages"].map((item) => (
              <span
                key={item}
                className="rounded-full border border-[var(--line)] px-2 py-0.5 text-[9px] leading-4 text-[var(--ink-muted)]"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    ),
  },
];

const NOT_CLAIMED = [
  {
    title: "No SOC 2 or ISO 27001 certification",
    body: "We do not claim SOC 2 or ISO 27001. No audit report or certificate is held. If either is completed, the scope and auditor will be named here.",
  },
  {
    title: "No GDPR certification",
    body: "GDPR is a legal framework, not a certificate we can hold. The privacy policy sets out the lawful bases, rights, and contact route.",
  },
  {
    title: "No customer logos or usage statistics we cannot evidence",
    body: "Customer names, logos, and usage figures appear only when a customer has agreed and the number can be evidenced. None are used here.",
  },
  {
    title: "No penetration-test result or uptime SLA",
    body: "We do not publish penetration-test results and we do not offer an uptime SLA during beta. This page describes controls that exist, not a certification of them.",
  },
  {
    title: "No planned feature sold as available",
    body: "SSO and additional source connectors are planned, not available. Planned work is labelled planned wherever it appears, including on the pricing page.",
  },
];

const DISCLOSURE_STEPS = [
  {
    title: "Email the security contact",
    body: "Write to hello@springvoxsl.com with the subject line “Security disclosure” so the report is routed correctly.",
  },
  {
    title: "Describe the issue",
    body: "Name the affected page or endpoint, the steps to reproduce, and the impact you observed.",
  },
  {
    title: "Leave data out",
    body: "Do not include customer documents, credentials, or personal data in the report.",
  },
  {
    title: "Allow a fix window",
    body: "Give us a reasonable window to investigate and fix the issue before publishing it.",
  },
];

function SectionIntro({
  id,
  label,
  title,
  intro,
}: {
  id?: string;
  label: string;
  title: string;
  intro: string;
}) {
  return (
    <div data-reveal className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
      <div>
        <SectionLabel>{label}</SectionLabel>
        <h2 id={id} className="mk-h2 mt-4 max-w-[18ch] text-[var(--ink)]">
          {title}
        </h2>
      </div>
      <p className="mk-lede max-w-[58ch] lg:pb-1">{intro}</p>
    </div>
  );
}

function GlancePanel() {
  return (
    <div className="mk-panel w-full p-4 sm:p-5 lg:w-[22rem]">
      <div className="flex items-center justify-between gap-3">
        <p className="mk-meta">At a glance</p>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent-jade-100)] bg-[var(--accent-jade-50)] px-2 py-0.5 font-meta text-[9px] leading-4 text-[var(--accent-jade)]">
          <span
            aria-hidden="true"
            className="h-1 w-1 rounded-full bg-current"
          />
          Beta
        </span>
      </div>

      <dl className="mt-3 divide-y divide-[var(--line)] border-t border-[var(--line)]">
        {AT_A_GLANCE.map((fact) => (
          <div key={fact.title} className="py-3">
            <dt className="flex items-start justify-between gap-3">
              <span className="text-[12px] font-medium leading-5 text-[var(--ink)]">
                {fact.title}
              </span>
              <span
                className={cn(
                  "mt-0.5 inline-flex shrink-0 items-center gap-1 font-meta text-[9px] leading-4",
                  fact.status === "Enforced"
                    ? "text-emerald-300"
                    : "text-[var(--ink-muted)]",
                )}
              >
                {fact.status === "Enforced" ? (
                  <Check size={9} strokeWidth={2.5} aria-hidden="true" />
                ) : (
                  <span
                    aria-hidden="true"
                    className="h-1 w-1 rounded-full bg-current"
                  />
                )}
                {fact.status}
              </span>
            </dt>
            <dd className="mt-1 text-[11px] leading-5 text-[var(--ink-muted)]">
              {fact.detail}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-3 border-t border-[var(--line)] pt-3 font-meta text-[9px] leading-4 text-[var(--ink-muted)]">
        Properties of the running system. No certification or uptime SLA is implied.
      </p>
    </div>
  );
}

export default function SecurityPage() {
  return (
    <SiteShell>
      <PageHero
        label="Trust"
        title="Security and data handling"
        intro="How workspaces are separated, who can see what, which providers process data, and what we do not claim. Written so a security review can start here."
        actions={
          <>
            <ButtonLink
              href="/data-handling"
              icon={<ArrowRight size={15} strokeWidth={1.5} />}
            >
              Read the data handling page
            </ButtonLink>
            <ButtonLink
              href="mailto:hello@springvoxsl.com?subject=Security%20disclosure"
              variant="secondary"
              icon={<Mail size={15} strokeWidth={1.5} />}
            >
              Report a vulnerability
            </ButtonLink>
          </>
        }
        aside={<GlancePanel />}
      />

      <>
        {/* Controls ------------------------------------------------ */}
        <section
          id="controls"
          aria-labelledby="controls-title"
          className="scroll-mt-20 border-b border-[var(--line)]"
        >
          <div className="mk-shell py-16 sm:py-20 lg:py-24">
            <SectionIntro
              id="controls-title"
              label="Controls"
              title="Four boundaries you can inspect"
              intro="Isolation, access, data flow, and the operator boundary. Each row states what the system does, where the boundary sits, and what it does not cover."
            />

            <div data-reveal className="mt-10">
              <TrustSelector items={TRUST_ITEMS} />
            </div>

            <p className="mk-meta mt-4 max-w-[72ch]">
              Every row opens in place. The summaries stay visible so the page can
              be scanned before it is read.
            </p>
          </div>
        </section>

        {/* Data flow ---------------------------------------------- */}
        <section
          id="data-flow"
          aria-labelledby="data-flow-title"
          className="scroll-mt-20 border-b border-[var(--line)] bg-[var(--surface)]"
        >
          <div className="mk-shell py-16 sm:py-20 lg:py-24">
            <SectionIntro
              id="data-flow-title"
              label="Data flow"
              title="The architecture, in the order data moves"
              intro="An upload and a question take different paths through the same providers. Every hop carries a workspace identifier; the table names what each provider receives."
            />

            <figure data-reveal className="mt-10">
              <SecurityDiagram />
              <figcaption className="mk-meta mt-3 max-w-[76ch]">
                Request path for a question. The workspace filter is applied before
                retrieval reaches the answer model.
              </figcaption>
            </figure>

            <div
              data-reveal
              className="mt-10 grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-12"
            >
              <div>
                <h3 className="mk-h3 text-[var(--ink)]">Subprocessors</h3>
                <p className="mt-3 text-[13px] leading-6 text-[var(--ink-soft)]">
                  Each provider processes data only for the purpose listed. The list
                  is maintained here and on the data handling page so a review does
                  not depend on a sales conversation.
                </p>

                <ul className="mt-4 space-y-2.5 border-t border-[var(--line)] pt-4">
                  <li className="flex gap-2.5 text-[12px] leading-5 text-[var(--ink-soft)]">
                    <Check
                      size={13}
                      strokeWidth={2}
                      className="mt-0.5 shrink-0 text-[var(--accent-jade)]"
                      aria-hidden="true"
                    />
                    LlamaParse is optional and disabled by default. It runs only on
                    files an administrator explicitly selects.
                  </li>
                  <li className="flex gap-2.5 text-[12px] leading-5 text-[var(--ink-soft)]">
                    <Check
                      size={13}
                      strokeWidth={2}
                      className="mt-0.5 shrink-0 text-[var(--accent-jade)]"
                      aria-hidden="true"
                    />
                    We do not intentionally use customer documents or private chat
                    content to train the answer model.
                  </li>
                </ul>

                <div className="mt-5">
                  <ArrowLink href="/data-handling">
                    Read the full data handling page
                  </ArrowLink>
                </div>
              </div>

              <div className="min-w-0">
                <div
                  role="region"
                  aria-label="Subprocessors and the data they receive"
                  tabIndex={0}
                  className="mk-scroll-x rounded-[12px] border border-[var(--line)] bg-[var(--canvas)] focus-visible:outline-offset-[-2px]"
                >
                  <table className="w-full min-w-[640px] border-collapse text-left">
                    <caption className="sr-only">
                      Subprocessors, their purpose, and the data each receives
                    </caption>
                    <thead>
                      <tr className="bg-[var(--surface-2)]">
                        <th
                          scope="col"
                          className="px-4 py-3 text-[11px] font-medium text-[var(--ink-soft)]"
                        >
                          Provider
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-[11px] font-medium text-[var(--ink-soft)]"
                        >
                          Purpose
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-[11px] font-medium text-[var(--ink-soft)]"
                        >
                          Data
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--line)]">
                      {SUBPROCESSORS.map(([provider, purpose, data]) => (
                        <tr key={provider} className="align-top">
                          <th
                            scope="row"
                            className="px-4 py-3 text-left text-[12px] font-medium text-[var(--ink)]"
                          >
                            {provider}
                          </th>
                          <td className="px-4 py-3 text-[12px] leading-5 text-[var(--ink-soft)]">
                            {purpose}
                          </td>
                          <td className="px-4 py-3 text-[12px] leading-5 text-[var(--ink-soft)]">
                            {data}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mk-meta mt-2 sm:hidden">
                  Scroll sideways for the data column.
                </p>
              </div>
            </div>

            <div data-reveal className="mt-10 border-t border-[var(--line)] pt-8">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <p className="text-[13px] font-medium text-[var(--ink)]">
                  Product properties behind the flow
                </p>
                <p className="mk-meta">
                  Not a certification or an uptime claim
                </p>
              </div>
              <TrustFacts className="mt-4" />
            </div>
          </div>
        </section>

        {/* Retention ---------------------------------------------- */}
        <section
          id="retention"
          aria-labelledby="retention-title"
          className="scroll-mt-20 border-b border-[var(--line)]"
        >
          <div className="mk-shell py-16 sm:py-20 lg:py-24">
            <SectionIntro
              id="retention-title"
              label="Retention"
              title="Deletion is a lifecycle, not a button"
              intro="A document can be removed on its own, or a workspace can be closed. The deletion flow covers the file, the text derived from it, and the vectors."
            />

            <div data-reveal className="mt-10 grid gap-4 lg:grid-cols-3">
              <article className="mk-panel p-5 sm:p-6">
                <p className="mk-meta">01 · Document deleted</p>
                <h3 className="mt-2 text-[15px] font-medium text-[var(--ink)]">
                  Removed from the workspace
                </h3>
                <ul className="mt-3 space-y-2 text-[12px] leading-5 text-[var(--ink-soft)]">
                  <li>The stored file in Supabase Storage</li>
                  <li>The extracted text and document chunks</li>
                  <li>The vectors and document metadata in Qdrant</li>
                  <li>The document record itself</li>
                </ul>
              </article>

              <article className="mk-panel p-5 sm:p-6">
                <p className="mk-meta">02 · Workspace closed</p>
                <h3 className="mt-2 text-[15px] font-medium text-[var(--ink)]">
                  Covered by the deletion job
                </h3>
                <ul className="mt-3 space-y-2 text-[12px] leading-5 text-[var(--ink-soft)]">
                  <li>Documents, chunks, and vectors</li>
                  <li>Chat sessions and messages</li>
                  <li>Invitations and workspace member profiles</li>
                  <li>Workspace usage and evaluation records</li>
                </ul>
              </article>

              <article className="mk-panel p-5 sm:p-6">
                <p className="mk-meta">03 · Limited retention</p>
                <h3 className="mt-2 text-[15px] font-medium text-[var(--ink)]">
                  What may remain
                </h3>
                <ul className="mt-3 space-y-2 text-[12px] leading-5 text-[var(--ink-soft)]">
                  <li>The workspace record, marked as deleted</li>
                  <li>Audit entries for the deletion</li>
                  <li>Billing state</li>
                  <li>Security and system logs</li>
                </ul>
                <p className="mt-3 border-t border-[var(--line)] pt-3 text-[11px] leading-5 text-[var(--ink-muted)]">
                  These records may be kept for a limited period to meet legal,
                  accounting, and security obligations.
                </p>
              </article>
            </div>

            <div
              data-reveal
              className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3"
            >
              <ArrowLink href="/privacy">Read the privacy policy</ArrowLink>
              <p className="mk-meta">
                Retention categories are set out in section 8.
              </p>
            </div>
          </div>
        </section>

        {/* Claims ------------------------------------------------- */}
        <section
          id="claims"
          aria-labelledby="claims-title"
          className="scroll-mt-20 border-b border-[var(--line)] bg-[var(--surface-2)]"
        >
          <div className="mk-shell py-16 sm:py-20 lg:py-24">
            <div
              data-reveal
              className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-end"
            >
              <div>
                <SectionLabel>Claims</SectionLabel>
                <h2
                  id="claims-title"
                  className="mk-h2 mt-4 max-w-[12ch] text-[var(--ink)]"
                >
                  What we do not claim
                </h2>
              </div>
              <p className="mk-lede max-w-[58ch] lg:pb-1">
                If a badge, number, or logo is not on this page, we cannot evidence
                it yet. That is deliberate.
              </p>
            </div>

            <ul
              data-reveal
              className="mt-10 grid gap-px overflow-hidden rounded-[16px] border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2"
            >
              {NOT_CLAIMED.map((item) => (
                <li key={item.title} className="bg-[var(--canvas)] p-5 sm:p-6">
                  <div className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--line)] text-[var(--ink-muted)]"
                    >
                      <Minus size={11} strokeWidth={2} />
                    </span>
                    <div>
                      <h3 className="text-[14px] font-medium leading-5 text-[var(--ink)]">
                        {item.title}
                      </h3>
                      <p className="mt-1.5 text-[12px] leading-6 text-[var(--ink-soft)]">
                        {item.body}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Disclosure -------------------------------------------- */}
        <section
          id="disclosure"
          aria-labelledby="disclosure-title"
          className="scroll-mt-20 border-b border-[var(--line)]"
        >
          <div className="mk-shell py-16 sm:py-20 lg:py-24">
            <div
              data-reveal
              className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-14"
            >
              <div>
                <SectionLabel>Disclosure</SectionLabel>
                <h2
                  id="disclosure-title"
                  className="mk-h2 mt-4 max-w-[14ch] text-[var(--ink)]"
                >
                  Report a vulnerability
                </h2>
                <p className="mk-lede mt-5 max-w-[44ch]">
                  One inbox, a clear process, and no bug bounty promise.
                </p>

                <div className="mt-6 rounded-[12px] border border-[var(--line)] bg-[var(--surface)] p-4">
                  <p className="mk-meta">Security contact</p>
                  <a
                    href="mailto:hello@springvoxsl.com?subject=Security%20disclosure"
                    className="mt-1.5 inline-block break-all text-[14px] font-medium text-[var(--accent-jade)] underline decoration-[var(--line)] underline-offset-4 hover:decoration-[var(--accent-jade)]"
                  >
                    hello@springvoxsl.com
                  </a>
                  <p className="mt-2 text-[12px] leading-5 text-[var(--ink-muted)]">
                    Subject line: “Security disclosure”.
                  </p>
                </div>
              </div>

              <div className="rounded-[16px] border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
                <ol className="space-y-4">
                  {DISCLOSURE_STEPS.map((step, index) => (
                    <li
                      key={step.title}
                      className="grid grid-cols-[28px_minmax(0,1fr)] gap-3"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-[6px] border border-[var(--line)] font-meta text-[10px] tabular-nums text-[var(--ink-muted)]"
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <p className="text-[13px] font-medium text-[var(--ink)]">
                          {step.title}
                        </p>
                        <p className="mt-1 text-[12px] leading-6 text-[var(--ink-soft)]">
                          {step.body}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>

                <p className="mt-5 border-t border-[var(--line)] pt-4 text-[12px] leading-6 text-[var(--ink-soft)]">
                  We do not operate a bug bounty and do not promise payment for a
                  report. We will confirm receipt, investigate, and tell you the
                  outcome.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Closing ------------------------------------------------- */}
        <section aria-labelledby="closing-title" className="bg-[var(--surface)]">
          <div className="mk-shell py-16 sm:py-20 lg:py-24">
            <div
              data-reveal
              className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end"
            >
              <div>
                <SectionLabel>Next step</SectionLabel>
                <h2
                  id="closing-title"
                  className="mk-h2 mt-4 max-w-[18ch] text-[var(--ink)]"
                >
                  Bring a security review, not a badge
                </h2>
                <p className="mk-lede mt-5 max-w-[52ch]">
                  If your team needs the architecture, the provider list, or the
                  gaps in writing, we will walk through this page with you.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 lg:justify-end lg:pb-1">
                <ButtonLink href="/contact">Talk to us</ButtonLink>
                <ButtonLink href="/data-handling" variant="secondary">
                  Read the data handling page
                </ButtonLink>
              </div>
            </div>
          </div>
        </section>
      </>
    </SiteShell>
  );
}
