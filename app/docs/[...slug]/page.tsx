import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

import { DocsContent } from '@/src/components/docs/DocsContent';
import { DocsCopyLink } from '@/src/components/docs/DocsCopyLink';
import { DocsFeedback } from '@/src/components/docs/DocsFeedback';
import { DocsJsonLd } from '@/src/components/docs/DocsJsonLd';
import { DocsMobileDisclosure, DocsSidebar } from '@/src/components/docs/DocsSidebar';
import { DocsPager } from '@/src/components/docs/DocsPager';
import { DocsSearch } from '@/src/components/docs/DocsSearch';
import { DocsToc } from '@/src/components/docs/DocsToc';
import {
  DOCS,
  DOCS_LAST_REVIEWED,
  DOCS_LAST_REVIEWED_ISO,
  getAdjacentDocs,
  getDocsGroup,
  getDocsPage,
} from '@/src/lib/docs';

type DocsGuidePageProps = {
  params: Promise<{ slug: string[] }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return DOCS.map((doc) => ({ slug: doc.slug.split('/') }));
}

export async function generateMetadata({
  params,
}: DocsGuidePageProps): Promise<Metadata> {
  const { slug: parts } = await params;
  const doc = getDocsPage(parts.join('/'));

  if (!doc) {
    return {};
  }

  return {
    title: doc.title,
    description: doc.description,
    alternates: { canonical: `/docs/${doc.slug}` },
    openGraph: {
      title: `${doc.title} — Rekall-IQ`,
      description: doc.description,
      url: `/docs/${doc.slug}`,
      type: 'article',
    },
    twitter: {
      card: 'summary',
      title: `${doc.title} — Rekall-IQ`,
      description: doc.description,
    },
  };
}

export default async function DocsGuidePage({ params }: DocsGuidePageProps) {
  const { slug: parts } = await params;
  const slug = parts.join('/');
  const doc = getDocsPage(slug);

  if (!doc) {
    notFound();
  }

  const group = getDocsGroup(doc.group);
  const { previous, next } = getAdjacentDocs(slug);
  const canonical = `https://rekalliq.springvoxsl.com/docs/${doc.slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: doc.title,
    name: doc.title,
    description: doc.description,
    url: canonical,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    articleSection: group.title,
    inLanguage: 'en',
    dateModified: DOCS_LAST_REVIEWED_ISO,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Rekall-IQ',
      url: 'https://rekalliq.springvoxsl.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Rekall-IQ',
      url: 'https://rekalliq.springvoxsl.com',
    },
  };

  return (
    <>
      <DocsJsonLd data={jsonLd} />
      <div className="mx-auto max-w-[1200px] px-6 pb-16 pt-8 sm:px-8 sm:pb-20">
      <div className="grid gap-10 lg:grid-cols-[224px_minmax(0,1fr)] xl:grid-cols-[224px_minmax(0,1fr)_192px]">
        <aside className="hidden lg:block">
          <DocsSidebar activeSlug={slug} />
        </aside>

        <div id="top" className="min-w-0 scroll-mt-24">
          <div className="flex items-start justify-between gap-4">
            <nav aria-label="Breadcrumb" className="min-w-0">
              <ol className="flex min-w-0 flex-wrap items-center gap-1.5 text-[11px] text-[var(--ink-muted)]">
                <li>
                  <Link
                    href="/docs"
                    className="transition-colors hover:text-[var(--ink)]"
                  >
                    Docs
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li className="hidden sm:inline">{group.title}</li>
                <li aria-hidden="true" className="hidden sm:inline">
                  /
                </li>
                <li
                  aria-current="page"
                  className="truncate text-[var(--ink-soft)]"
                >
                  {doc.title}
                </li>
              </ol>
            </nav>
            <DocsCopyLink className="hidden sm:inline-flex" />
          </div>

          <div className="mt-5 space-y-2 lg:hidden">
            <DocsSearch
              variant="mobile"
              enableShortcut
              mobileShortcutOnly
              placeholder="Search docs"
            />
            <DocsMobileDisclosure activeSlug={slug} />
          </div>

          <header className="mt-8">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] text-[var(--ink-muted)]">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent-jade-100)] bg-[var(--accent-jade-50)] px-2 py-0.5 text-[var(--accent-jade-hover)]">
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full bg-[var(--accent-jade)]"
                />
                Beta
              </span>
              <span>Reviewed {DOCS_LAST_REVIEWED}</span>
              <span aria-hidden="true">·</span>
              <span>{group.title}</span>
            </div>

            <h1 className="mt-3 text-[32px] font-semibold leading-[1.1] tracking-[-0.03em] text-[var(--ink)] sm:text-[40px]">
              {doc.title}
            </h1>
            <p className="mt-3 max-w-[64ch] text-[16px] leading-7 text-[var(--ink-soft)]">
              {doc.description}
            </p>

            <div className="mt-4 flex items-center gap-2 sm:hidden">
              <DocsCopyLink />
            </div>

            <details className="group mt-6 rounded-[10px] border border-[var(--line)] bg-[var(--surface)] xl:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[13px] font-medium text-[var(--ink)] [&::-webkit-details-marker]:hidden">
                On this page
                <ChevronDown
                  size={16}
                  strokeWidth={1.5}
                  aria-hidden="true"
                  className="text-[var(--ink-muted)] transition-transform group-open:rotate-180"
                />
              </summary>
              <ul className="border-t border-[var(--line)] p-2">
                {doc.sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="block rounded-[6px] px-2 py-1.5 text-[12px] text-[var(--ink-soft)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
                    >
                      {section.title}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          </header>

          <article className="mt-8 max-w-[72ch] border-t border-[var(--line)] pt-8 text-[15px] leading-7 text-[var(--ink-soft)] [&_strong]:font-medium [&_strong]:text-[var(--ink)]">
            <DocsContent slug={doc.slug} />
          </article>

          <div className="mt-10 max-w-[72ch]">
            <DocsFeedback />
          </div>

          <div className="mt-6 max-w-[72ch]">
            <DocsPager previous={previous} next={next} />
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-[var(--line)] pt-5 text-[12px] text-[var(--ink-muted)] sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/docs"
              className="text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)]"
            >
              All documentation
            </Link>
            <Link
              href="/contact"
              className="transition-colors hover:text-[var(--ink)]"
            >
              Talk to us
            </Link>
          </div>
        </div>

        <aside className="hidden xl:block">
          <div className="sticky top-24">
            <DocsToc sections={doc.sections} />
          </div>
        </aside>
      </div>
    </div>
    </>
  );
}
