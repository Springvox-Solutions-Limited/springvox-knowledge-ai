import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

import { getDocsHref, type DocsPage } from '@/src/lib/docs';

function PagerCard({
  doc,
  direction,
}: {
  doc: DocsPage;
  direction: 'previous' | 'next';
}) {
  const isNext = direction === 'next';

  return (
    <Link
      href={getDocsHref(doc)}
      className="group flex min-w-0 flex-col gap-1.5 rounded-[12px] border border-[var(--line)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--accent-jade-100)]"
    >
      <span className="flex items-center justify-between gap-2 text-[11px] text-[var(--ink-muted)]">
        <span className="inline-flex items-center gap-1.5">
          {isNext ? null : (
            <ArrowLeft size={12} strokeWidth={1.5} aria-hidden="true" />
          )}
          {isNext ? 'Next' : 'Previous'}
        </span>
        {isNext ? (
          <ArrowRight
            size={14}
            strokeWidth={1.5}
            aria-hidden="true"
            className="transition-colors group-hover:text-[var(--accent-jade)]"
          />
        ) : null}
      </span>
      <span className="text-[14px] font-medium leading-5 text-[var(--ink)]">
        {doc.title}
      </span>
    </Link>
  );
}

export function DocsPager({
  previous,
  next,
}: {
  previous: DocsPage | null;
  next: DocsPage | null;
}) {
  if (!previous && !next) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {previous ? <PagerCard doc={previous} direction="previous" /> : <span />}
      {next ? (
        <div className="sm:col-start-2">
          <PagerCard doc={next} direction="next" />
        </div>
      ) : null}
    </div>
  );
}
