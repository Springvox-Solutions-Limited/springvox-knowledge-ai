import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  CircleHelp,
  FolderTree,
  KeyRound,
  MessageSquare,
  Quote,
  Rocket,
  ShieldCheck,
  SlidersHorizontal,
  Upload,
  type LucideIcon,
} from 'lucide-react';

import { DocsSearch } from '@/src/components/docs/DocsSearch';
import {
  DOCS_BY_GROUP,
  DOCS_LAST_REVIEWED,
  getDocsHref,
} from '@/src/lib/docs';

export const metadata: Metadata = {
  title: 'Documentation',
  description:
    'Answers, sources, and the workspace explained. Guides for setup, asking questions, citations, collections, answer modes, admin, security, and troubleshooting.',
  alternates: { canonical: '/docs' },
  openGraph: {
    title: 'Documentation — Rekall-IQ',
    description:
      'Answers, sources, and the workspace explained. Setup, citations, collections, admin, and security guides.',
    url: '/docs',
  },
};

const QUICK_START: {
  step: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}[] = [
  {
    step: '01',
    title: 'Create your workspace',
    description:
      'Start a workspace or join one with an invitation. The first account becomes the workspace admin.',
    href: '/docs/getting-started/quickstart#create-workspace',
    icon: KeyRound,
  },
  {
    step: '02',
    title: 'Upload the approved set',
    description:
      'Add the current policies, handbooks, and guides. Every member can ask from what you upload.',
    href: '/docs/admin/documents-and-uploads#upload-files',
    icon: Upload,
  },
  {
    step: '03',
    title: 'Ask your first question',
    description:
      'Choose a mode and optional collection, then ask in plain English. Answers stream in with sources.',
    href: '/docs/using/asking-questions#write-question',
    icon: MessageSquare,
  },
  {
    step: '04',
    title: 'Read a citation',
    description:
      'Open the source behind an answer, read the excerpt, and check the original before you act.',
    href: '/docs/using/sources-and-citations#open-a-source',
    icon: Quote,
  },
];

const BROWSE: {
  title: string;
  description: string;
  href: string;
  meta: string;
  icon: LucideIcon;
}[] = [
  {
    title: 'Getting started',
    description:
      'From an empty account to a workspace with ready documents and a cited answer.',
    href: '/docs/getting-started/quickstart',
    meta: '1 guide',
    icon: Rocket,
  },
  {
    title: 'Asking questions',
    description:
      'Write a question that retrieves the right passages, then refine it with follow-ups.',
    href: '/docs/using/asking-questions',
    meta: '1 guide',
    icon: MessageSquare,
  },
  {
    title: 'Sources and citations',
    description:
      'Open the document behind an answer, read the excerpt, and verify the original.',
    href: '/docs/using/sources-and-citations',
    meta: '1 guide',
    icon: Quote,
  },
  {
    title: 'Collections and scope',
    description:
      'Group documents by department and narrow a question without changing access.',
    href: '/docs/using/collections',
    meta: '1 guide',
    icon: FolderTree,
  },
  {
    title: 'Answer modes',
    description:
      'Summary, detailed, executive, and technical output — and when each one helps.',
    href: '/docs/using/answer-modes',
    meta: '1 guide',
    icon: SlidersHorizontal,
  },
  {
    title: 'Admin',
    description:
      'Uploads and processing, people and roles, analytics, gaps, and evaluations.',
    href: '/docs/admin/documents-and-uploads',
    meta: '3 guides',
    icon: Upload,
  },
  {
    title: 'Security and data',
    description:
      'Workspace isolation, providers, retention, deletion, and what is not claimed.',
    href: '/docs/security/data-handling',
    meta: '1 guide',
    icon: ShieldCheck,
  },
  {
    title: 'Troubleshooting',
    description:
      'Short answers for access, uploads, citations, privacy, and beta limits.',
    href: '/docs/troubleshooting/faq',
    meta: '1 guide',
    icon: CircleHelp,
  },
];

export default function DocsHomePage() {
  return (
    <>
      <header className="border-b border-[var(--line)]">
        <div className="mx-auto max-w-[1200px] px-6 pb-12 pt-12 sm:px-8 sm:pb-16 sm:pt-16">
          <div className="max-w-[820px]">
            <p className="font-mono text-[11px] text-[var(--ink-muted)]">
              Rekall-IQ docs
            </p>
            <h1 className="mt-4 text-[40px] font-semibold leading-[1.04] tracking-[-0.035em] text-[var(--ink)] sm:text-[56px]">
              Documentation
            </h1>
            <p className="mt-4 max-w-[62ch] text-[17px] leading-8 text-[var(--ink-soft)] sm:text-[18px]">
              Answers, sources, and the workspace — explained.
            </p>

            <div className="mt-8 max-w-[620px]">
              <DocsSearch
                variant="hero"
                enableShortcut
                placeholder="Search guides and sections"
              />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-[var(--ink-muted)]">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent-jade-100)] bg-[var(--accent-jade-50)] px-2.5 py-1 text-[var(--accent-jade-hover)]">
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full bg-[var(--accent-jade)]"
                />
                Beta
              </span>
              <span>Reviewed {DOCS_LAST_REVIEWED}</span>
              <span aria-hidden="true">·</span>
              <Link
                href="/contact"
                className="inline-flex items-center gap-1 text-[var(--ink-soft)] underline decoration-[var(--line)] underline-offset-4 transition-colors hover:text-[var(--ink)] hover:decoration-[var(--accent-jade)]"
              >
                Talk to us
                <ArrowUpRight size={12} strokeWidth={1.5} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1200px] px-6 py-12 sm:px-8 sm:py-16">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[11px] text-[var(--ink-muted)]">
              Quickstart
            </p>
            <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.02em] text-[var(--ink)] sm:text-[28px]">
              Four steps to a cited answer
            </h2>
          </div>
          <Link
            href="/docs/getting-started/quickstart"
            className="inline-flex items-center gap-1.5 text-[12px] text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)]"
          >
            Read the full quickstart
            <ArrowRight size={13} strokeWidth={1.5} aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {QUICK_START.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.step}
                href={item.href}
                className="group flex min-w-0 flex-col rounded-[14px] border border-[var(--line)] bg-[var(--surface)] p-5 transition-colors hover:border-[var(--accent-jade-100)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[11px] tabular-nums text-[var(--ink-muted)]">
                    {item.step}
                  </span>
                  <Icon
                    size={17}
                    strokeWidth={1.5}
                    aria-hidden="true"
                    className="text-[var(--ink-muted)] transition-colors group-hover:text-[var(--accent-jade)]"
                  />
                </div>
                <p className="mt-4 text-[15px] font-medium leading-6 text-[var(--ink)]">
                  {item.title}
                </p>
                <p className="mt-1.5 text-[12px] leading-5 text-[var(--ink-muted)]">
                  {item.description}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="border-y border-[var(--line)] bg-[var(--canvas-soft)]">
        <div className="mx-auto max-w-[1200px] px-6 py-12 sm:px-8 sm:py-16">
          <div className="max-w-[640px]">
            <p className="font-mono text-[11px] text-[var(--ink-muted)]">
              Browse
            </p>
            <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.02em] text-[var(--ink)] sm:text-[28px]">
              Browse by section
            </h2>
            <p className="mt-2 text-[14px] leading-6 text-[var(--ink-soft)]">
              Start with the job you need to do. Each page states what you need
              first, what to expect, and what to try when it does not work.
            </p>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {BROWSE.map((section) => {
              const Icon = section.icon;
              return (
                <Link
                  key={section.href}
                  href={section.href}
                  className="group flex min-w-0 flex-col rounded-[14px] border border-[var(--line)] bg-[var(--surface)] p-5 transition-colors hover:border-[var(--accent-jade-100)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <Icon
                      size={18}
                      strokeWidth={1.5}
                      aria-hidden="true"
                      className="text-[var(--ink-soft)] transition-colors group-hover:text-[var(--accent-jade)]"
                    />
                    <span className="font-mono text-[10px] text-[var(--ink-muted)]">
                      {section.meta}
                    </span>
                  </div>
                  <h3 className="mt-4 text-[15px] font-medium text-[var(--ink)]">
                    {section.title}
                  </h3>
                  <p className="mt-1.5 text-[12px] leading-5 text-[var(--ink-muted)]">
                    {section.description}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-[11px] text-[var(--ink-muted)] transition-colors group-hover:text-[var(--accent-jade)]">
                    Open
                    <ArrowRight size={12} strokeWidth={1.5} aria-hidden="true" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-6 py-12 sm:px-8 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-14">
          <div>
            <p className="font-mono text-[11px] text-[var(--ink-muted)]">
              Every guide
            </p>
            <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.02em] text-[var(--ink)] sm:text-[28px]">
              All guides
            </h2>
            <div className="mt-6 grid gap-x-10 gap-y-7 sm:grid-cols-2">
              {DOCS_BY_GROUP.map(({ group, docs }) => (
                <div key={group.id}>
                  <h3 className="text-[12px] font-medium text-[var(--ink)]">
                    {group.title}
                  </h3>
                  <ul className="mt-2.5 space-y-2">
                    {docs.map((doc) => (
                      <li key={doc.slug}>
                        <Link
                          href={getDocsHref(doc)}
                          className="text-[13px] text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)]"
                        >
                          {doc.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <aside className="h-fit rounded-[14px] border border-[var(--line)] bg-[var(--surface)] p-6">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent-jade-100)] bg-[var(--accent-jade-50)] px-2.5 py-1 text-[11px] text-[var(--accent-jade-hover)]">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-[var(--accent-jade)]"
              />
              Beta
            </span>
            <h2 className="mt-4 text-[20px] font-semibold tracking-[-0.015em] text-[var(--ink)]">
              Talk to us
            </h2>
            <p className="mt-2 text-[13px] leading-6 text-[var(--ink-soft)]">
              Tell us what you were trying to do and which page you checked. We
              reply from a real inbox, and a docs correction is a useful report.
            </p>
            <Link
              href="/contact"
              className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-[var(--accent-jade)] px-4 text-[13px] font-medium text-[#04100e] transition-colors hover:bg-[var(--accent-jade-hover)]"
            >
              Talk to us
              <ArrowUpRight size={14} strokeWidth={1.5} aria-hidden="true" />
            </Link>
            <a
              href="mailto:hello@springvoxsl.com"
              className="mt-3 block text-[12px] text-[var(--ink-muted)] underline decoration-[var(--line)] underline-offset-4 hover:text-[var(--ink)]"
            >
              hello@springvoxsl.com
            </a>
            <p className="mt-5 border-t border-[var(--line)] pt-4 text-[11px] leading-5 text-[var(--ink-muted)]">
              Documentation covers the current beta build. Planned work is
              marked as planned, not sold as available.
            </p>
          </aside>
        </div>
      </section>
    </>
  );
}
