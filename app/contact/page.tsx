import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  UserRound,
  FileText,
  Mail,
  ShieldCheck,
} from "lucide-react";

import { ContactForm } from "@/src/components/marketing/ContactForm";
import { SiteShell } from "@/src/components/marketing/SiteShell";
import {
  ArrowLink,
  ButtonLink,
  PageHero,
  SectionLabel,
} from "@/src/components/marketing/ui";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Talk to the team about evaluating Rekall-IQ, pricing, a security review, or support.",
  alternates: { canonical: "/contact" },
};

const NEXT = [
  {
    icon: Mail,
    title: "A real reply",
    copy: "Your message reaches hello@springvoxsl.com. We reply from the same address, not a ticket robot.",
  },
  {
    icon: FileText,
    title: "A useful first answer",
    copy: "Tell us which documents cause the most repeat questions. That is the fastest way to scope a trial.",
  },
  {
    icon: ShieldCheck,
    title: "A security path",
    copy: "If you need a review, say so in the message. The security page already lists providers and boundaries.",
  },
];

export default function ContactPage() {
  return (
    <SiteShell>
      <PageHero
        label="Contact"
        title="Talk to us"
        intro="Tell us what your team needs to find, and we will reply from a real inbox. No sequence, no qualification form after the form."
        aside={
          <div className="grid gap-px overflow-hidden rounded-[12px] border border-[var(--line)] bg-[var(--line)] sm:w-[21rem]">
            <a
              href="mailto:hello@springvoxsl.com"
              className="group flex items-center gap-3 bg-[var(--canvas)] p-4 transition-colors hover:bg-[var(--surface)]"
            >
              <Mail size={15} strokeWidth={1.5} className="text-[var(--accent-jade)]" aria-hidden="true" />
              <div className="min-w-0">
                <p className="truncate text-[12px] font-medium text-[var(--ink)]">
                  hello@springvoxsl.com
                </p>
                <p className="mt-0.5 font-meta text-[8px] text-[var(--ink-muted)]">
                  Sales, pricing, and general questions
                </p>
              </div>
              <ArrowUpRight
                size={12}
                strokeWidth={1.5}
                className="ml-auto text-[var(--ink-muted)] transition-colors group-hover:text-[var(--accent-jade)]"
                aria-hidden="true"
              />
            </a>
            <div className="flex items-center gap-3 bg-[var(--canvas)] p-4">
              <UserRound size={15} strokeWidth={1.5} className="text-[var(--accent-jade)]" aria-hidden="true" />
              <div>
                <p className="text-[12px] font-medium text-[var(--ink)]">
                  A person reads it
                </p>
                <p className="mt-0.5 font-meta text-[8px] text-[var(--ink-muted)]">
                  No sequence, no ticket queue
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-[var(--canvas)] p-4">
              <Building2 size={15} strokeWidth={1.5} className="text-[var(--accent-jade)]" aria-hidden="true" />
              <div>
                <p className="text-[12px] font-medium text-[var(--ink)]">
                  Built in Nigeria
                </p>
                <p className="mt-0.5 font-meta text-[8px] text-[var(--ink-muted)]">
                  Working across time zones
                </p>
              </div>
            </div>
          </div>
        }
      />

      <section className="border-b border-[var(--line)]">
        <div className="mk-shell grid gap-10 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:py-24">
          <div data-reveal className="rounded-[16px] border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-5">
              <div>
                <SectionLabel>Send a message</SectionLabel>
                <p className="mt-2 text-[15px] font-medium text-[var(--ink)]">
                  Tell us what you are trying to make findable.
                </p>
              </div>
              <span className="rounded-full border border-[var(--line)] px-2.5 py-1 font-meta text-[8px] text-[var(--ink-muted)]">
                No credit card
              </span>
            </div>
            <div className="pt-6">
              <ContactForm />
            </div>
          </div>

          <aside data-reveal className="space-y-3">
            {NEXT.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-[12px] border border-[var(--line)] bg-[var(--canvas)] p-4"
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      size={14}
                      strokeWidth={1.5}
                      className="text-[var(--accent-jade)]"
                      aria-hidden="true"
                    />
                    <p className="text-[12px] font-medium text-[var(--ink)]">
                      {item.title}
                    </p>
                  </div>
                  <p className="mt-2 text-[11px] leading-5 text-[var(--ink-muted)]">
                    {item.copy}
                  </p>
                </div>
              );
            })}

            <div className="rounded-[12px] border border-[var(--line)] bg-[var(--canvas)] p-4">
              <p className="text-[12px] font-medium text-[var(--ink)]">
                Existing workspace
              </p>
              <p className="mt-1.5 text-[11px] leading-5 text-[var(--ink-muted)]">
                The documentation covers setup, uploads, invitations, citations, and
                chat.
              </p>
              <div className="mt-3 flex flex-col gap-2 border-t border-[var(--line)] pt-3">
                <Link
                  href="/docs/using/asking-questions"
                  className="group inline-flex items-center gap-1.5 text-[11px] text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)]"
                >
                  User documentation
                  <ArrowUpRight
                    size={11}
                    strokeWidth={1.5}
                    className="text-[var(--ink-muted)] transition-colors group-hover:text-[var(--accent-jade)]"
                    aria-hidden="true"
                  />
                </Link>
                <Link
                  href="/docs/admin/documents-and-uploads"
                  className="group inline-flex items-center gap-1.5 text-[11px] text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)]"
                >
                  Admin documentation
                  <ArrowUpRight
                    size={11}
                    strokeWidth={1.5}
                    className="text-[var(--ink-muted)] transition-colors group-hover:text-[var(--accent-jade)]"
                    aria-hidden="true"
                  />
                </Link>
                <Link
                  href="/security"
                  className="group inline-flex items-center gap-1.5 text-[11px] text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)]"
                >
                  Security and data handling
                  <ArrowUpRight
                    size={11}
                    strokeWidth={1.5}
                    className="text-[var(--ink-muted)] transition-colors group-hover:text-[var(--accent-jade)]"
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="bg-[var(--surface-2)]">
        <div className="mk-shell grid gap-8 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:py-20">
          <div data-reveal>
            <SectionLabel>Security disclosure</SectionLabel>
            <h2 className="mk-h2 mt-4 max-w-[18ch] text-[var(--ink)]">
              Found a vulnerability? Tell us before you publish it.
            </h2>
            <p className="mk-lede mt-4 max-w-[52ch]">
              Report it to the same address with the subject “Security disclosure”.
              Include the steps to reproduce and the workspace or page affected. Do
              not include customer documents.
            </p>
          </div>
          <div data-reveal className="flex flex-wrap gap-3 lg:justify-end">
            <ButtonLink
              href="mailto:hello@springvoxsl.com?subject=Security%20disclosure"
              icon={<ArrowUpRight size={15} strokeWidth={1.5} />}
            >
              Security disclosure email
            </ButtonLink>
            <ArrowLink href="/security" className="self-center px-2">
              Read the security page
            </ArrowLink>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
