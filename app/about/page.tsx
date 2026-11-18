import type { Metadata } from "next";
import {
  ArrowUpRight,
  Compass,
  FileCheck2,
  Layers3,
  MapPin,
  PenLine,
  ShieldCheck,
  Users,
} from "lucide-react";

import { DocumentPage } from "@/src/components/marketing/product-visuals";
import { SiteShell } from "@/src/components/marketing/SiteShell";
import {
  ArrowLink,
  ButtonLink,
  PageHero,
  SectionLabel,
} from "@/src/components/marketing/ui";

export const metadata: Metadata = {
  title: "About",
  description:
    "Rekall-IQ is built in Nigeria for organizations that need their answers to be checkable, wherever they operate.",
  alternates: { canonical: "/about" },
};

const PRINCIPLES = [
  {
    index: "01",
    icon: FileCheck2,
    title: "Grounded",
    copy:
      "An answer that cannot be traced to a document is a guess. We would rather say the documents do not cover it.",
  },
  {
    index: "02",
    icon: ShieldCheck,
    title: "Isolated",
    copy:
      "One workspace per organisation, enforced in the query, not in a setting somebody can switch off.",
  },
  {
    index: "03",
    icon: Layers3,
    title: "Legible",
    copy:
      "Non-technical staff should never need to understand embeddings, chunks, or retrieval to trust an answer.",
  },
  {
    index: "04",
    icon: Compass,
    title: "Improvable",
    copy:
      "The questions that fail are data. They tell an organisation what to write next, and we keep them visible.",
  },
];

const WORK = [
  {
    title: "The claims stay checkable",
    copy:
      "Product decisions are recorded, and the public claims on this site are limited to what the product can actually do today.",
  },
  {
    title: "The beta is labelled",
    copy:
      "Rekall-IQ is in open beta. Planned work is marked as planned on the page where it appears, not presented as shipped.",
  },
  {
    title: "The boundary is written down",
    copy:
      "Workspace isolation, role access, and the platform-admin boundary are documented on the security page, not left to a sales call.",
  },
];

export default function AboutPage() {
  return (
    <SiteShell>
      <PageHero
        label="About"
        title="Built in Nigeria for teams everywhere"
        intro="Rekall-IQ is built by a small team in Nigeria for organisations that need their answers to be checkable, wherever they operate."
        aside={
          <div className="grid gap-px overflow-hidden rounded-[12px] border border-[var(--line)] bg-[var(--line)] sm:w-[21rem]">
            <div className="flex items-center gap-3 bg-[var(--canvas)] p-4">
              <MapPin size={15} strokeWidth={1.5} className="text-[var(--accent-jade)]" aria-hidden="true" />
              <div>
                <p className="text-[12px] font-medium text-[var(--ink)]">Nigeria</p>
                <p className="mt-0.5 font-meta text-[8px] text-[var(--ink-muted)]">
                  Working across time zones
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-[var(--canvas)] p-4">
              <Users size={15} strokeWidth={1.5} className="text-[var(--accent-jade)]" aria-hidden="true" />
              <div>
                <p className="text-[12px] font-medium text-[var(--ink)]">A small team</p>
                <p className="mt-0.5 font-meta text-[8px] text-[var(--ink-muted)]">
                  Product, engineering, security
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-[var(--canvas)] p-4">
              <PenLine size={15} strokeWidth={1.5} className="text-[var(--accent-jade)]" aria-hidden="true" />
              <div>
                <p className="text-[12px] font-medium text-[var(--ink)]">Open beta</p>
                <p className="mt-0.5 font-meta text-[8px] text-[var(--ink-muted)]">
                  Essential is free while we build
                </p>
              </div>
            </div>
          </div>
        }
      />

      <section className="border-b border-[var(--line)]">
        <div className="mk-shell grid gap-12 py-20 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:gap-20 lg:py-28">
          <div data-reveal>
            <SectionLabel>Why we started</SectionLabel>
            <h2 className="mk-h2 mt-4 max-w-[18ch] text-[var(--ink)]">
              The retrieval problem, not the model problem.
            </h2>
            <div className="mt-6 max-w-[52ch] space-y-5 text-[14px] leading-7 text-[var(--ink-soft)]">
              <p>
                Most organisations do not have a knowledge shortage. They have a
                retrieval problem. The approved policy exists, the handbook exists,
                the procedure exists. They are in different places, in different
                versions, and none of them is easy to quote under pressure.
              </p>
              <p>
                General assistants made that worse. They answer confidently from
                everything, which is the opposite of what a company needs when the
                question is about leave, retention, or a customer commitment.
              </p>
              <p>
                So we built the narrower thing: a private workspace where the
                approved documents are the boundary, each answer that uses one names
                the file, and the question that cannot be answered becomes visible
                instead of invented.
              </p>
            </div>
            <div className="mt-7">
              <ArrowLink href="/product">See the workspace</ArrowLink>
            </div>
          </div>

          <div data-reveal className="relative">
            <div
              aria-hidden="true"
              className="mk-grid-bg absolute -inset-4 -z-10 rounded-[20px] border border-[var(--line)] opacity-40"
            />
            <div className="relative rounded-[16px] border border-[var(--line)] bg-[var(--canvas)] p-4 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <span className="font-meta text-[9px] text-[var(--ink-muted)]">
                  The same question, two answers
                </span>
                <span className="rounded-full border border-[var(--line)] px-2 py-0.5 font-meta text-[8px] text-[var(--ink-muted)]">
                  Illustration
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[10px] border border-dashed border-[var(--line)] bg-[var(--surface)] p-4">
                  <p className="font-meta text-[8px] text-[var(--ink-muted)]">
                    A general assistant
                  </p>
                  <p className="mt-3 text-[11px] leading-5 text-[var(--ink-muted)]">
                    “Yes, staff can work remotely when they need to.”
                  </p>
                  <p className="mt-4 border-t border-[var(--line)] pt-2 font-meta text-[8px] leading-3.5 text-[var(--ink-muted)]">
                    No source. No version. No owner.
                  </p>
                </div>

                <div className="rounded-[10px] border border-[var(--accent-jade-100)] bg-[var(--accent-jade-50)] p-4">
                  <p className="font-meta text-[8px] text-[var(--accent-jade)]">
                    Rekall-IQ
                  </p>
                  <p className="mt-3 text-[11px] leading-5 text-[var(--ink)]">
                    “Yes, through approved systems, after security training.”
                  </p>
                  <p className="mt-2 font-meta text-[8px] leading-3.5 text-[var(--ink-muted)]">
                    Customer_Data_Policy.pdf · § 4
                  </p>
                  <p className="mt-2 border-t border-[var(--accent-jade-100)] pt-2 font-meta text-[8px] leading-3.5 text-[var(--ink-muted)]">
                    Page, section, and workspace attached.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_170px] sm:items-end">
                <div className="rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-4">
                  <p className="font-meta text-[8px] text-[var(--ink-muted)]">
                    What the difference is
                  </p>
                  <p className="mt-1.5 text-[10px] leading-4 text-[var(--ink-soft)]">
                    A citation makes the answer reviewable. The review is the
                    product.
                  </p>
                </div>
                <DocumentPage
                  compact
                  page="24"
                  section="Employee handbook · 6.3"
                  title="Remote access"
                  highlight="Approved systems and workspace credentials are required."
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="mk-shell py-20 lg:py-28">
          <div data-reveal className="max-w-[48rem]">
            <SectionLabel>What we believe</SectionLabel>
            <h2 className="mk-h2 mt-4 max-w-[22ch] text-[var(--ink)]">
              Four rules we do not trade away.
            </h2>
          </div>

          <div
            data-reveal
            className="mt-10 grid gap-px overflow-hidden rounded-[16px] border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2"
          >
            {PRINCIPLES.map((principle) => {
              const Icon = principle.icon;
              return (
                <article
                  key={principle.title}
                  className="group bg-[var(--canvas)] p-6 transition-colors hover:bg-[var(--surface)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-8 w-8 items-center justify-center rounded-[7px] border border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)] transition-colors group-hover:text-[var(--accent-jade)]">
                      <Icon size={15} strokeWidth={1.5} aria-hidden="true" />
                    </span>
                    <span className="font-meta text-[9px] text-[var(--ink-muted)] tabular-nums">
                      {principle.index}
                    </span>
                  </div>
                  <h3 className="mt-5 text-[17px] font-medium tracking-[-0.02em] text-[var(--ink)]">
                    {principle.title}
                  </h3>
                  <p className="mt-2 max-w-[42ch] text-[12px] leading-6 text-[var(--ink-soft)]">
                    {principle.copy}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--line)]">
        <div className="mk-shell grid gap-12 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:py-28">
          <div data-reveal>
            <SectionLabel>How we work</SectionLabel>
            <h2 className="mk-h2 mt-4 max-w-[16ch] text-[var(--ink)]">
              Small steps, written down.
            </h2>
            <p className="mk-lede mt-6 max-w-[40ch]">
              We are based in Nigeria and work with teams across time zones. The
              public site is part of the product, so it has to meet the same bar as
              the answers inside it.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <ArrowLink href="/security">Read the security page</ArrowLink>
              <ArrowLink href="/contact">Talk to us</ArrowLink>
            </div>
          </div>

          <ol className="border-t border-[var(--line)]">
            {WORK.map((item, index) => (
              <li
                key={item.title}
                data-reveal
                className="grid gap-2 border-b border-[var(--line)] py-6 sm:grid-cols-[48px_1fr]"
              >
                <span className="font-meta text-[10px] text-[var(--ink-muted)] tabular-nums">
                  0{index + 1}
                </span>
                <div>
                  <h3 className="text-[14px] font-medium text-[var(--ink)]">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 max-w-[54ch] text-[12px] leading-6 text-[var(--ink-soft)]">
                    {item.copy}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-b border-[var(--line)] bg-[var(--surface-2)]">
        <div className="mk-shell py-16 lg:py-20">
          <div data-reveal className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
            <div>
              <SectionLabel>What we do not claim</SectionLabel>
              <h2 className="mk-h2 mt-4 max-w-[14ch] text-[var(--ink)]">
                No borrowed credibility.
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  title: "No certification we do not hold",
                  copy: "Rekall-IQ does not claim SOC 2 or ISO 27001. If that changes, the certificate and scope will be published here.",
                },
                {
                  title: "No customer logos we cannot use",
                  copy: "Names and logos appear only when a customer has agreed and the deployment can be referenced.",
                },
                {
                  title: "No roadmap as shipped",
                  copy: "SSO and source connectors are marked planned wherever they appear, and they are not sold as available.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-[12px] border border-[var(--line)] bg-[var(--canvas)] p-4"
                >
                  <p className="text-[12px] font-medium text-[var(--ink)]">
                    {item.title}
                  </p>
                  <p className="mt-1.5 text-[11px] leading-5 text-[var(--ink-muted)]">
                    {item.copy}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--surface)]">
        <div className="mk-shell grid gap-8 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:py-20">
          <div>
            <SectionLabel>Talk to us</SectionLabel>
            <h2 className="mk-h2 mt-4 max-w-[18ch] text-[var(--ink)]">
              A rollout, a review, or a document set that stopped being trustworthy.
            </h2>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <ButtonLink
              href="/contact"
              icon={<ArrowUpRight size={15} strokeWidth={1.5} />}
            >
              Talk to us
            </ButtonLink>
            <ButtonLink href="/register" variant="secondary">
              Create a workspace
            </ButtonLink>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
