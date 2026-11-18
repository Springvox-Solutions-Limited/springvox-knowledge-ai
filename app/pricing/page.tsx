import type { Metadata } from "next";
import Link from "next/link";
import { Fragment } from "react";
import {
  ArrowUpRight,
  Check,
  Clock,
  FileText,
  MessageSquareText,
  Minus,
  Users,
} from "lucide-react";

import { FaqList } from "@/src/components/marketing/FaqList";
import { SiteShell } from "@/src/components/marketing/SiteShell";
import { ArrowLink, ButtonLink, SectionLabel } from "@/src/components/marketing/ui";
import { cn } from "@/src/lib/utils";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Essential is free during beta: 20 documents, 25 users, and 1,000 questions a month. Business and Enterprise are quoted per workspace, and the price is confirmed before any upgrade.",
  alternates: { canonical: "/pricing" },
};

/* ------------------------------------------------------------------ */
/* Content                                                             */
/* ------------------------------------------------------------------ */

type PlanFeature = { text: string; planned?: boolean };

const PLANS: Array<{
  name: string;
  price: string;
  priceSuffix: string;
  priceNote: string;
  summary: string;
  limits: Array<[string, string]>;
  features: PlanFeature[];
  cta: { label: string; href: string };
  featured: boolean;
}> = [
  {
    name: "Essential",
    price: "Free",
    priceSuffix: "during beta",
    priceNote: "Free during beta",
    summary:
      "For one team validating cited answers in a controlled workspace, with no card and no commitment.",
    limits: [
      ["Documents", "20"],
      ["Users", "25"],
      ["Questions / month", "1,000"],
    ],
    features: [
      { text: "Cited chat with sources" },
      { text: "Collections and document scoping" },
      { text: "In-app file preview" },
      { text: "Answer modes, Summary to Technical" },
      { text: "Admin dashboard and basic analytics" },
      { text: "Workspace-isolated library" },
    ],
    cta: { label: "Create a workspace", href: "/register" },
    featured: true,
  },
  {
    name: "Business",
    price: "Quoted",
    priceSuffix: "per workspace",
    priceNote: "Quoted per workspace",
    summary:
      "For organisations rolling the workspace out across departments, with the analysis and evaluation tools that come with wider use.",
    limits: [
      ["Documents", "Quoted"],
      ["Users", "Quoted"],
      ["Questions / month", "Quoted"],
    ],
    features: [
      { text: "Everything in Essential" },
      { text: "Advanced parsing for complex files" },
      { text: "Full analytics and usage metering" },
      { text: "Knowledge-gap tracking" },
      { text: "Answer-quality evaluations" },
      { text: "Roles, users, and invitations" },
    ],
    cta: { label: "Talk to us", href: "/contact" },
    featured: false,
  },
  {
    name: "Enterprise",
    price: "Quoted",
    priceSuffix: "per workspace",
    priceNote: "Quoted per workspace",
    summary:
      "For regulated teams that need custom limits, an audit trail, and a security review before rollout.",
    limits: [
      ["Documents", "Custom"],
      ["Users", "Custom"],
      ["Questions / month", "Custom"],
    ],
    features: [
      { text: "Everything in Business" },
      { text: "Configurable usage limits" },
      { text: "Audit logs and security review" },
      { text: "Priority support" },
      { text: "SSO and source connectors", planned: true },
    ],
    cta: { label: "Book a review", href: "/contact" },
    featured: false,
  },
];

const USAGE = [
  { label: "Documents", used: "12", limit: "20", percent: 60 },
  { label: "Users", used: "8", limit: "25", percent: 32 },
  { label: "Questions this month", used: "640", limit: "1,000", percent: 64 },
];

type CellState = "yes" | "no" | "planned";

type ComparisonRow = {
  feature: string;
  essential: CellState;
  business: CellState;
  enterprise: CellState;
};

const COMPARISON: Array<{ label: string; rows: ComparisonRow[] }> = [
  {
    label: "Answering",
    rows: [
      {
        feature: "Cited chat with sources",
        essential: "yes",
        business: "yes",
        enterprise: "yes",
      },
      {
        feature: "Collections and document scoping",
        essential: "yes",
        business: "yes",
        enterprise: "yes",
      },
      {
        feature: "In-app file preview",
        essential: "yes",
        business: "yes",
        enterprise: "yes",
      },
      {
        feature: "Answer modes, Summary to Technical",
        essential: "yes",
        business: "yes",
        enterprise: "yes",
      },
    ],
  },
  {
    label: "Knowledge and limits",
    rows: [
      {
        feature: "Advanced parsing for complex files",
        essential: "no",
        business: "yes",
        enterprise: "yes",
      },
      {
        feature: "Basic analytics",
        essential: "yes",
        business: "yes",
        enterprise: "yes",
      },
      {
        feature: "Full analytics and usage metering",
        essential: "no",
        business: "yes",
        enterprise: "yes",
      },
      {
        feature: "Knowledge-gap tracking",
        essential: "no",
        business: "yes",
        enterprise: "yes",
      },
      {
        feature: "Answer-quality evaluations",
        essential: "no",
        business: "yes",
        enterprise: "yes",
      },
      {
        feature: "Configurable usage limits",
        essential: "no",
        business: "no",
        enterprise: "yes",
      },
    ],
  },
  {
    label: "Access and support",
    rows: [
      {
        feature: "Audit logs and security review",
        essential: "no",
        business: "no",
        enterprise: "yes",
      },
      {
        feature: "Priority support",
        essential: "no",
        business: "no",
        enterprise: "yes",
      },
      {
        feature: "SSO and source connectors",
        essential: "no",
        business: "planned",
        enterprise: "planned",
      },
    ],
  },
];

const COUNTS = [
  {
    icon: FileText,
    name: "Document",
    copy: "One file added to the workspace library: PDF, DOCX, XLSX, PPTX, CSV, or TXT. The document limit is the number of files held there.",
  },
  {
    icon: Users,
    name: "User",
    copy: "One person with access to the workspace, whether they manage documents, ask questions, or only read answers.",
  },
  {
    icon: MessageSquareText,
    name: "Question",
    copy: "One message sent to the assistant. The monthly allowance counts questions asked, not answers read or sources opened.",
  },
];

const FAQS = [
  {
    q: "How are paid plans priced?",
    a: "Paid plans are quoted per workspace, based on documents, users, and question volume. Ask on the contact page and we will confirm the rate and the currency for your region.",
  },
  {
    q: "Will beta pricing change?",
    a: "Essential is free during beta. Existing workspaces get notice before any change to the free tier, and a paid plan is only applied after a quote is confirmed with you.",
  },
  {
    q: "Do I need a credit card to start?",
    a: "No. Essential starts without a card. A paid plan is quoted first, and the price is confirmed before the workspace is upgraded.",
  },
  {
    q: "What counts against the limits?",
    a: "Documents in the library, members with workspace access, and questions sent to the assistant. Opening an answer or a source file does not use the question allowance.",
  },
  {
    q: "What happens when I hit a limit?",
    a: "New questions or uploads pause until the next cycle or until the workspace limit is raised. Existing documents and history stay available.",
  },
  {
    q: "Can I move between plans?",
    a: "Yes. Contact us and we will adjust the workspace limits; your documents, collections, and history stay in place.",
  },
];

const CELL_LABEL: Record<CellState, string> = {
  yes: "Yes",
  no: "No",
  planned: "Planned",
};

function CompareCell({ state }: { state: CellState }) {
  return (
    <span className="inline-flex items-center gap-2">
      {state === "yes" ? (
        <Check
          size={13}
          strokeWidth={2}
          aria-hidden="true"
          className="shrink-0 text-[var(--ink-soft)]"
        />
      ) : state === "no" ? (
        <Minus
          size={13}
          strokeWidth={1.5}
          aria-hidden="true"
          className="shrink-0 text-[var(--ink-muted)]"
        />
      ) : (
        <Clock
          size={13}
          strokeWidth={1.5}
          aria-hidden="true"
          className="shrink-0 text-[var(--ink-muted)]"
        />
      )}
      <span
        className={cn(
          "font-meta text-[10px] leading-4",
          state === "yes" ? "text-[var(--ink-soft)]" : "text-[var(--ink-muted)]",
        )}
      >
        {CELL_LABEL[state]}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function PricingPage() {
  return (
    <SiteShell>
      <>
        {/* Hero ------------------------------------------------------- */}
        <header className="relative isolate overflow-hidden border-b border-[var(--line)]">
          <div
            aria-hidden="true"
            className="mk-grid-bg mk-grid-fade pointer-events-none absolute inset-0 -z-10 opacity-40"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-40 -top-40 -z-10 h-[30rem] w-[30rem] rounded-full border border-[var(--line)] opacity-40"
          />
          <div className="mk-shell grid gap-12 py-16 sm:py-20 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center lg:gap-16 lg:py-24">
            <div data-reveal className="min-w-0 max-w-[46rem]">
              <SectionLabel>Plans</SectionLabel>
              <h1 className="mk-h1 mt-5 max-w-[14ch] text-[var(--ink)]">
                Start free, then add capacity
              </h1>
              <p className="mk-lede mt-6 max-w-[52ch]">
                Essential is free for the beta: 20 documents, 25 users, and 1,000
                questions a month. Business and Enterprise are quoted for the workspace
                you actually run, so capacity follows the rollout instead of a fixed
                price list.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-jade-100)] bg-[var(--accent-jade-50)] px-3 py-1.5 font-meta text-[10px] leading-4 text-[var(--accent-jade)]">
                  <span
                    aria-hidden="true"
                    className="h-1 w-1 rounded-full bg-[var(--accent-jade)]"
                  />
                  Free during beta
                </span>
                <span className="font-meta text-[10px] leading-4 text-[var(--ink-muted)]">
                  No credit card · Prices confirmed before upgrade
                </span>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <ButtonLink
                  href="/register"
                  icon={<ArrowUpRight size={15} strokeWidth={1.5} aria-hidden="true" />}
                >
                  Create a workspace
                </ButtonLink>
                <ButtonLink href="#compare" variant="secondary">
                  Compare plans
                </ButtonLink>
              </div>
            </div>

            <div data-reveal className="min-w-0 lg:pb-1">
              <div className="mk-panel p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-meta text-[9px] leading-4 text-[var(--ink-muted)]">
                    Essential · beta workspace
                  </p>
                  <span className="rounded-full border border-[var(--line)] px-2 py-0.5 font-meta text-[8px] leading-3.5 text-[var(--ink-muted)]">
                    Preview
                  </span>
                </div>
                <p className="mt-4 text-[13px] font-medium text-[var(--ink)]">
                  Usage this cycle
                </p>
                <dl className="mt-4 space-y-4">
                  {USAGE.map((meter) => (
                    <div key={meter.label}>
                      <div className="flex items-baseline justify-between gap-3">
                        <dt className="text-[11px] leading-4 text-[var(--ink-soft)]">
                          {meter.label}
                        </dt>
                        <dd className="font-meta text-[9px] leading-4 text-[var(--ink-muted)] tabular-nums">
                          {meter.used} / {meter.limit}
                        </dd>
                      </div>
                      <div
                        aria-hidden="true"
                        className="mt-2 h-1 overflow-hidden rounded-full bg-[var(--surface-2)]"
                      >
                        <span
                          className="block h-full rounded-full bg-[var(--accent-jade)]"
                          style={{ width: `${meter.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </dl>
                <p className="mt-5 border-t border-[var(--line)] pt-3 font-meta text-[8px] leading-3.5 text-[var(--ink-muted)]">
                  Illustrative preview. Live counts appear in the workspace dashboard.
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Plans ----------------------------------------------------- */}
        <section
          id="plans"
          aria-label="Plans"
          className="scroll-mt-20 border-b border-[var(--line)] bg-[var(--surface)]"
        >
          <div className="mk-shell py-16 lg:py-20">
            <div
              data-reveal
              className="flex flex-wrap items-end justify-between gap-4"
            >
              <p className="max-w-[56ch] text-[13px] leading-6 text-[var(--ink-muted)]">
                Essential is the only plan with a published price: free during beta.
                Business and Enterprise are quoted per workspace, and nothing is charged
                before a quote is confirmed.
              </p>
              <ArrowLink href="#compare">Compare every feature</ArrowLink>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {PLANS.map((plan) => (
                <article
                  key={plan.name}
                  data-reveal
                  className={cn(
                    "flex min-w-0 flex-col rounded-[16px] border bg-[var(--canvas)] p-5 sm:p-6",
                    plan.featured
                      ? "border-[var(--accent-jade-200)]"
                      : "border-[var(--line)]",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-[16px] font-medium leading-6 text-[var(--ink)]">
                      {plan.name}
                    </h2>
                    {plan.featured ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent-jade-100)] bg-[var(--accent-jade-50)] px-2.5 py-1 font-meta text-[9px] leading-3.5 text-[var(--accent-jade)]">
                        <span
                          aria-hidden="true"
                          className="h-1 w-1 rounded-full bg-[var(--accent-jade)]"
                        />
                        Free during beta
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-5 border-b border-[var(--line)] pb-5">
                    <p className="flex flex-wrap items-baseline gap-x-2">
                      <span
                        className={cn(
                          "font-medium leading-none tracking-[-0.04em] text-[var(--ink)]",
                          plan.featured ? "text-[38px]" : "text-[26px]",
                        )}
                      >
                        {plan.price}
                      </span>
                      <span className="text-[13px] leading-5 text-[var(--ink-muted)]">
                        {plan.priceSuffix}
                      </span>
                    </p>
                    <p className="mt-3 text-[13px] leading-6 text-[var(--ink-soft)]">
                      {plan.summary}
                    </p>
                  </div>

                  <dl className="mt-5 space-y-1.5 rounded-[10px] border border-[var(--line)] bg-[var(--surface-2)] px-3.5 py-3">
                    {plan.limits.map(([label, value]) => (
                      <div
                        key={label}
                        className="flex items-baseline justify-between gap-3"
                      >
                        <dt className="font-meta text-[10px] leading-4 text-[var(--ink-muted)]">
                          {label}
                        </dt>
                        <dd className="font-meta text-[10px] leading-4 text-[var(--ink)] tabular-nums">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  <p className="mt-5 font-meta text-[9px] leading-4 text-[var(--ink-muted)]">
                    Includes
                  </p>
                  <ul className="mt-2.5 flex-1 space-y-2.5">
                    {plan.features.map((feature) => (
                      <li
                        key={feature.text}
                        className="flex gap-2.5 text-[13px] leading-5 text-[var(--ink-soft)]"
                      >
                        {feature.planned ? (
                          <Clock
                            size={13}
                            strokeWidth={1.5}
                            aria-hidden="true"
                            className="mt-0.5 shrink-0 text-[var(--ink-muted)]"
                          />
                        ) : (
                          <Check
                            size={13}
                            strokeWidth={2}
                            aria-hidden="true"
                            className="mt-0.5 shrink-0 text-[var(--accent-jade)]"
                          />
                        )}
                        <span>
                          {feature.planned ? "Planned: " : null}
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 border-t border-[var(--line)] pt-5">
                    <ButtonLink
                      href={plan.cta.href}
                      variant={plan.featured ? "primary" : "secondary"}
                      className="w-full"
                    >
                      {plan.cta.label}
                    </ButtonLink>
                    <p className="mt-3 text-[11px] leading-4 text-[var(--ink-muted)]">
                      <Link
                        href="#billing-faq"
                        className="underline decoration-[var(--line)] underline-offset-2 hover:text-[var(--ink-soft)] hover:decoration-[var(--ink-muted)]"
                      >
                        What happens at the limit?
                      </Link>
                    </p>
                  </div>
                </article>
              ))}
            </div>

            <p className="mt-4 font-meta text-[9px] leading-4 text-[var(--ink-muted)]">
              Paid plans are quoted per workspace. Prices are confirmed before a
              workspace is upgraded.
            </p>
          </div>
        </section>

        {/* Comparison ------------------------------------------------- */}
        <section
          id="compare"
          aria-labelledby="compare-heading"
          className="scroll-mt-20 border-b border-[var(--line)]"
        >
          <div className="mk-shell py-20 lg:py-28">
            <div
              data-reveal
              className="flex flex-wrap items-end justify-between gap-6"
            >
              <div className="max-w-[46rem]">
                <SectionLabel>Compare</SectionLabel>
                <h2
                  id="compare-heading"
                  className="mk-h2 mt-4 max-w-[18ch] text-[var(--ink)]"
                >
                  What each plan includes
                </h2>
                <p className="mk-lede mt-5 max-w-[52ch]">
                  Essential covers the daily workflow. Business adds the analysis, gap
                  tracking, and evaluation tools. Enterprise adds configurable limits,
                  audit, and support.
                </p>
              </div>
              <ul
                aria-label="Table legend"
                className="flex flex-wrap items-center gap-x-5 gap-y-2 font-meta text-[10px] leading-4 text-[var(--ink-muted)]"
              >
                <li className="flex items-center gap-1.5">
                  <Check
                    size={13}
                    strokeWidth={2}
                    aria-hidden="true"
                    className="text-[var(--ink-soft)]"
                  />
                  Included
                </li>
                <li className="flex items-center gap-1.5">
                  <Minus
                    size={13}
                    strokeWidth={1.5}
                    aria-hidden="true"
                    className="text-[var(--ink-muted)]"
                  />
                  Not included
                </li>
                <li className="flex items-center gap-1.5">
                  <Clock
                    size={13}
                    strokeWidth={1.5}
                    aria-hidden="true"
                    className="text-[var(--ink-muted)]"
                  />
                  Planned
                </li>
              </ul>
            </div>

            <div
              role="region"
              aria-label="Plan comparison table"
              tabIndex={0}
              className="mk-scroll-x mt-8 rounded-[12px] border border-[var(--line)] bg-[var(--canvas)]"
            >
              <table className="w-full min-w-[720px] border-collapse text-left">
                <caption className="sr-only">
                  Feature comparison across Essential, Business, and Enterprise plans
                </caption>
                <thead>
                  <tr className="border-y border-[var(--line)]">
                    <th
                      scope="col"
                      className="w-[40%] bg-[var(--canvas)] px-4 py-4 text-left align-bottom md:sticky md:left-0 md:z-10 md:border-r md:border-[var(--line)]"
                    >
                      <span className="font-meta text-[10px] font-normal leading-4 text-[var(--ink-muted)]">
                        Feature
                      </span>
                    </th>
                    {PLANS.map((plan) => (
                      <th
                        key={plan.name}
                        scope="col"
                        className="w-[20%] px-4 py-4 text-left align-bottom"
                      >
                        <span className="block text-[13px] font-medium leading-5 text-[var(--ink)]">
                          {plan.name}
                        </span>
                        <span className="mt-1 block font-meta text-[9px] font-normal leading-4 text-[var(--ink-muted)]">
                          {plan.priceNote}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((group) => (
                    <Fragment key={group.label}>
                      <tr className="border-b border-[var(--line)] bg-[var(--surface-2)]">
                        <th
                          scope="colgroup"
                          colSpan={4}
                          className="px-4 py-2.5 text-left font-meta text-[10px] font-normal leading-4 text-[var(--ink-soft)]"
                        >
                          {group.label}
                        </th>
                      </tr>
                      {group.rows.map((row) => (
                        <tr
                          key={row.feature}
                          className="border-b border-[var(--line)] last:border-b-0"
                        >
                          <th
                            scope="row"
                            className="bg-[var(--canvas)] px-4 py-3 text-left text-[13px] font-normal leading-5 text-[var(--ink)] md:sticky md:left-0 md:z-10 md:border-r md:border-[var(--line)]"
                          >
                            {row.feature}
                          </th>
                          <td className="px-4 py-3">
                            <CompareCell state={row.essential} />
                          </td>
                          <td className="px-4 py-3">
                            <CompareCell state={row.business} />
                          </td>
                          <td className="px-4 py-3">
                            <CompareCell state={row.enterprise} />
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 font-meta text-[9px] leading-4 text-[var(--ink-muted)] md:hidden">
              Swipe the table to compare all three plans.
            </p>
          </div>
        </section>

        {/* What counts ----------------------------------------------- */}
        <section
          id="what-counts"
          aria-labelledby="what-counts-heading"
          className="scroll-mt-20 border-b border-[var(--line)] bg-[var(--surface)]"
        >
          <div className="mk-shell grid gap-12 py-20 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20 lg:py-28">
            <div data-reveal>
              <SectionLabel>What counts</SectionLabel>
              <h2
                id="what-counts-heading"
                className="mk-h2 mt-4 max-w-[13ch] text-[var(--ink)]"
              >
                Three counters, nothing hidden
              </h2>
              <p className="mk-lede mt-6 max-w-[42ch]">
                Limits only make sense if you can see what moves them. Documents,
                users, and questions are the only things counted against a plan.
              </p>
              <div className="mt-7">
                <ArrowLink href="/docs">Read how metering works</ArrowLink>
              </div>
            </div>

            <div data-reveal className="min-w-0">
              <ol className="border-t border-[var(--line)]">
                {COUNTS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li
                      key={item.name}
                      className="grid gap-4 border-b border-[var(--line)] py-6 sm:grid-cols-[32px_1fr]"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[var(--line)] bg-[var(--canvas)]">
                        <Icon
                          size={15}
                          strokeWidth={1.5}
                          aria-hidden="true"
                          className="text-[var(--accent-jade)]"
                        />
                      </span>
                      <div>
                        <h3 className="text-[15px] font-medium leading-6 text-[var(--ink)]">
                          {item.name}
                        </h3>
                        <p className="mt-1.5 max-w-[52ch] text-[13px] leading-6 text-[var(--ink-soft)]">
                          {item.copy}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
              <p className="mt-5 max-w-[58ch] text-[12px] leading-5 text-[var(--ink-muted)]">
                When a limit is reached, new uploads or questions pause until the cycle
                resets or the limit is raised. Documents already in the library and the
                answer history stay available.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ -------------------------------------------------------- */}
        <section
          id="billing-faq"
          aria-labelledby="billing-faq-heading"
          className="scroll-mt-20 border-b border-[var(--line)]"
        >
          <div className="mk-shell grid gap-12 py-20 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20 lg:py-28">
            <div data-reveal>
              <SectionLabel>Billing questions</SectionLabel>
              <h2
                id="billing-faq-heading"
                className="mk-h2 mt-4 max-w-[15ch] text-[var(--ink)]"
              >
                Before you choose
              </h2>
              <p className="mt-4 max-w-[36ch] text-[12px] leading-5 text-[var(--ink-muted)]">
                Price, limits, and the beta. Product mechanics live in the docs, and the
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

        {/* CTA -------------------------------------------------------- */}
        <section
          aria-labelledby="cta-heading"
          className="relative isolate overflow-hidden bg-[var(--surface-2)]"
        >
          <div
            aria-hidden="true"
            className="mk-grid-bg pointer-events-none absolute inset-0 -z-10 opacity-30 [background-size:48px_48px]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-56 -top-24 -z-10 h-[36rem] w-[36rem] rounded-full border border-[var(--line)] opacity-30"
          />
          <div className="mk-shell py-20 lg:py-28">
            <div
              data-reveal
              className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end"
            >
              <div>
                <SectionLabel>Start</SectionLabel>
                <h2
                  id="cta-heading"
                  className="mk-display mt-4 max-w-[13ch] text-[clamp(2.5rem,6vw,5rem)] leading-[0.98] text-[var(--ink)]"
                >
                  Start with the documents you already have.
                </h2>
                <p className="mk-lede mt-6 max-w-[46ch]">
                  Create an Essential workspace, upload the approved set, and invite your
                  team. It stays free through the beta, and paid capacity is quoted
                  before anything changes.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <ButtonLink
                    href="/register"
                    icon={
                      <ArrowUpRight size={15} strokeWidth={1.5} aria-hidden="true" />
                    }
                  >
                    Create a workspace
                  </ButtonLink>
                  <ButtonLink href="/contact" variant="secondary">
                    Talk to us
                  </ButtonLink>
                </div>
              </div>

              <ul className="grid gap-3 border-t border-[var(--line)] pt-6 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
                {[
                  "Free during beta, with 20 documents and 25 users",
                  "No credit card to create a workspace",
                  "Prices confirmed before any upgrade",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-[12px] leading-5 text-[var(--ink-soft)]"
                  >
                    <Check
                      size={13}
                      strokeWidth={2}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 text-[var(--accent-jade)]"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </>
    </SiteShell>
  );
}
