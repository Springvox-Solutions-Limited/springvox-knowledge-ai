import Link from 'next/link';
import { BookOpen, ChevronDown } from 'lucide-react';

import { DOCS_BY_GROUP, getDocsHref } from '@/src/lib/docs';
import { cn } from '@/src/lib/utils';
import { DOC_ICONS } from './DocsIcons';
import { DocsSearch } from './DocsSearch';

function NavLinks({
  activeSlug,
  onNavigate,
  label = 'Documentation',
}: {
  activeSlug?: string;
  onNavigate?: () => void;
  label?: string;
}) {
  return (
    <nav aria-label={label}>
      {DOCS_BY_GROUP.map(({ group, docs }) => (
        <div key={group.id} className="mb-6 last:mb-0">
          <p className="mb-2 px-2.5 text-[11px] text-[var(--ink-muted)]">
            {group.title}
          </p>
          <ul className="space-y-0.5">
            {docs.map((doc) => {
              const Icon = DOC_ICONS[doc.slug] ?? BookOpen;
              const active = doc.slug === activeSlug;
              return (
                <li key={doc.slug}>
                  <Link
                    href={getDocsHref(doc)}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-start gap-2.5 rounded-[8px] border px-2.5 py-2 text-[13px] leading-5 transition-colors',
                      active
                        ? 'border-[var(--accent-jade-100)] bg-[var(--accent-jade-50)] text-[var(--ink)]'
                        : 'border-transparent text-[var(--ink-soft)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]',
                    )}
                  >
                    <Icon
                      size={15}
                      strokeWidth={1.5}
                      aria-hidden="true"
                      className={cn(
                        'mt-0.5 shrink-0',
                        active
                          ? 'text-[var(--accent-jade)]'
                          : 'text-[var(--ink-muted)]',
                      )}
                    />
                    <span className="min-w-0">{doc.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function BetaNote() {
  return (
    <div className="mt-6 rounded-[10px] border border-[var(--line)] bg-[var(--canvas-soft)] p-3.5">
      <p className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent-jade-100)] bg-[var(--accent-jade-50)] px-2 py-0.5 text-[11px] text-[var(--accent-jade-hover)]">
        Beta
      </p>
      <p className="mt-2 text-[11px] leading-5 text-[var(--ink-muted)]">
        These pages cover the current beta build. Planned work is marked as
        planned.
      </p>
      <Link
        href="/contact"
        className="mt-2 inline-block text-[11px] text-[var(--accent-jade)] underline underline-offset-4"
      >
        Talk to us
      </Link>
    </div>
  );
}

export function DocsSidebar({ activeSlug }: { activeSlug?: string }) {
  return (
    <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pb-8 pr-1">
      <Link
        href="/docs"
        className="mb-4 flex items-center gap-2 px-2.5 text-[13px] font-medium text-[var(--ink)]"
      >
        <BookOpen
          size={16}
          strokeWidth={1.5}
          aria-hidden="true"
          className="text-[var(--ink-muted)]"
        />
        Documentation
      </Link>
      <DocsSearch
        variant="sidebar"
        enableShortcut
        desktopShortcutOnly
        placeholder="Search docs"
      />
      <div className="mt-6">
        <NavLinks activeSlug={activeSlug} />
      </div>
      <BetaNote />
    </div>
  );
}

export function DocsMobileDisclosure({ activeSlug }: { activeSlug?: string }) {
  return (
    <details className="group rounded-[10px] border border-[var(--line)] bg-[var(--surface)]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[13px] font-medium text-[var(--ink)] [&::-webkit-details-marker]:hidden">
        Browse docs
        <ChevronDown
          size={16}
          strokeWidth={1.5}
          aria-hidden="true"
          className="text-[var(--ink-muted)] transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="max-h-[65vh] overflow-y-auto border-t border-[var(--line)] px-3 py-4">
        <NavLinks activeSlug={activeSlug} label="Documentation, mobile" />
      </div>
    </details>
  );
}
