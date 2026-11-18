'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { CornerDownLeft, Search, X } from 'lucide-react';

import { searchDocs, getDocsGroup, type DocsSearchHit } from '@/src/lib/docs';
import { cn } from '@/src/lib/utils';

type DocsSearchProps = {
  variant?: 'hero' | 'sidebar' | 'mobile';
  enableShortcut?: boolean;
  desktopShortcutOnly?: boolean;
  mobileShortcutOnly?: boolean;
  placeholder?: string;
  className?: string;
};

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return (
    tag === 'input' ||
    tag === 'textarea' ||
    tag === 'select' ||
    target.isContentEditable
  );
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function Highlight({ text, query }: { text: string; query: string }) {
  const tokens = Array.from(
    new Set(
      query
        .trim()
        .split(/\s+/)
        .filter((token) => token.length > 0),
    ),
  ).sort((left, right) => right.length - left.length);

  if (tokens.length === 0) return <>{text}</>;

  const pattern = new RegExp(`(${tokens.map(escapeRegExp).join('|')})`, 'gi');
  const lowered = tokens.map((token) => token.toLowerCase());
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, index) =>
        lowered.includes(part.toLowerCase()) ? (
          <mark
            key={index}
            className="rounded-[3px] bg-[var(--accent-jade-50)] px-0.5 text-[var(--accent-jade-hover)]"
          >
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}

function resultHref(hit: DocsSearchHit): string {
  const base = `/docs/${hit.doc.slug}`;
  return hit.section ? `${base}#${hit.section.id}` : base;
}

export function DocsSearch({
  variant = 'sidebar',
  enableShortcut = false,
  desktopShortcutOnly = false,
  mobileShortcutOnly = false,
  placeholder = 'Search docs',
  className,
}: DocsSearchProps) {
  const router = useRouter();
  const inputId = useId();
  const resultsId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultRefs = useRef<Array<HTMLAnchorElement | null>>([]);

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const hits = useMemo(() => searchDocs(query), [query]);
  const hasQuery = query.trim().length > 0;

  useEffect(() => {
    if (!enableShortcut) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const isModifier = event.metaKey || event.ctrlKey;
      const isShortcutKey = isModifier && event.key.toLowerCase() === 'k';

      if (isShortcutKey) {
        if (
          desktopShortcutOnly &&
          typeof window !== 'undefined' &&
          !window.matchMedia('(min-width: 1024px)').matches
        ) {
          return;
        }

        if (
          mobileShortcutOnly &&
          typeof window !== 'undefined' &&
          window.matchMedia('(min-width: 1024px)').matches
        ) {
          return;
        }

        event.preventDefault();
        inputRef.current?.focus();
        if (inputRef.current?.value.trim()) {
          setOpen(true);
        }
        return;
      }

      if (
        event.key === '/' &&
        !isModifier &&
        !event.altKey &&
        !isEditableTarget(event.target)
      ) {
        event.preventDefault();
        inputRef.current?.focus();
        if (inputRef.current?.value.trim()) {
          setOpen(true);
        }
        return;
      }

      if (event.key === 'Escape' && open) {
        setOpen(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [desktopShortcutOnly, enableShortcut, mobileShortcutOnly, open]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const goToFirstResult = () => {
    if (hits.length === 0) return;
    setOpen(false);
    router.push(resultHref(hits[0]));
  };

  const focusResult = (index: number) => {
    resultRefs.current[index]?.focus();
  };

  const handleResultKeyDown = (
    event: React.KeyboardEvent<HTMLAnchorElement>,
    index: number,
  ) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusResult(Math.min(index + 1, hits.length - 1));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (index === 0) {
        inputRef.current?.focus();
      } else {
        focusResult(index - 1);
      }
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      inputRef.current?.focus();
    }
  };

  const isHero = variant === 'hero';
  const isSidebar = variant === 'sidebar';

  return (
    <div ref={wrapperRef} className={cn('relative w-full', className)}>
      <form
        role="search"
        aria-label={
          isHero
            ? "Search documentation"
            : variant === 'mobile'
              ? "Search documentation, mobile"
              : "Search documentation, sidebar"
        }
        onSubmit={(event) => {
          event.preventDefault();
          goToFirstResult();
        }}
      >
        <label htmlFor={inputId} className="sr-only">
          Search documentation
        </label>
        <div className="relative">
          <Search
            size={isHero ? 18 : 15}
            strokeWidth={1.5}
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute top-1/2 -translate-y-1/2 text-[var(--ink-muted)]',
              isHero ? 'left-4' : 'left-3',
            )}
          />
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            value={query}
            placeholder={placeholder}
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="go"
            aria-controls={open && hasQuery ? resultsId : undefined}
            aria-describedby={hasQuery ? undefined : `${inputId}-hint`}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(event.target.value.trim().length > 0);
            }}
            onFocus={() => {
              if (hasQuery) setOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown' && hits.length > 0) {
                event.preventDefault();
                setOpen(true);
                focusResult(0);
                return;
              }

              if (event.key === 'Escape') {
                setOpen(false);
                inputRef.current?.blur();
              }
            }}
            className={cn(
              'w-full border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--ink-muted)] focus:border-[var(--accent-jade-200)]',
              isHero
                ? 'h-12 rounded-[12px] pl-11 pr-12 text-[15px]'
                : 'h-10 rounded-[10px] pl-9 pr-9 text-[13px]',
            )}
          />
          {hasQuery ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setOpen(false);
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-[6px] text-[var(--ink-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
            >
              <X size={15} strokeWidth={1.5} aria-hidden="true" />
            </button>
          ) : (
            <span
              id={`${inputId}-hint`}
              className={cn(
                'pointer-events-none absolute top-1/2 hidden -translate-y-1/2 items-center gap-1 text-[var(--ink-muted)] sm:flex',
                isSidebar ? 'right-2' : 'right-2.5',
              )}
            >
              <span className="sr-only">
                Press slash or Control K to focus search
              </span>
              <kbd className="rounded-[4px] border border-[var(--line)] bg-[var(--surface-2)] px-1.5 py-0.5 font-mono text-[10px]">
                /
              </kbd>
              {isSidebar ? null : (
                <kbd className="rounded-[4px] border border-[var(--line)] bg-[var(--surface-2)] px-1.5 py-0.5 font-mono text-[10px]">
                  Ctrl K
                </kbd>
              )}
            </span>
          )}
        </div>
      </form>

      <p className="sr-only" aria-live="polite">
        {hasQuery
          ? hits.length === 0
            ? 'No documentation matches'
            : `${hits.length} documentation ${hits.length === 1 ? 'match' : 'matches'}`
          : ''}
      </p>

      {open && hasQuery ? (
        <div
          id={resultsId}
          className={cn(
            'z-30 max-h-[min(420px,60vh)] overflow-y-auto rounded-[12px] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--brand-shadow)]',
            isHero
              ? 'absolute left-0 right-0 top-[calc(100%+8px)]'
              : 'mt-2',
          )}
        >
          {hits.length === 0 ? (
            <div className="p-4">
              <p className="text-[13px] font-medium text-[var(--ink)]">
                No matches for “{query.trim()}”
              </p>
              <p className="mt-1 text-[12px] leading-5 text-[var(--ink-muted)]">
                Try a section name such as citations, collections, or uploads.
                If the answer is not here,{' '}
                <Link
                  href="/contact"
                  className="text-[var(--accent-jade)] underline underline-offset-4"
                  onClick={() => setOpen(false)}
                >
                  talk to us
                </Link>
                .
              </p>
            </div>
          ) : (
            <>
              <p className="border-b border-[var(--line)] px-4 py-2.5 text-[11px] text-[var(--ink-muted)]">
                {hits.length} {hits.length === 1 ? 'result' : 'results'}
              </p>
              <ul className="divide-y divide-[var(--line-soft)]">
                {hits.map((hit, index) => (
                  <li key={`${hit.doc.slug}-${hit.section?.id ?? 'top'}`}>
                    <Link
                      ref={(element) => {
                        resultRefs.current[index] = element;
                      }}
                      href={resultHref(hit)}
                      onClick={() => setOpen(false)}
                      onKeyDown={(event) => handleResultKeyDown(event, index)}
                      className="block px-4 py-3 transition-colors hover:bg-[var(--surface-2)] focus:bg-[var(--surface-2)] focus:outline-none"
                    >
                      <span className="flex items-center gap-2 text-[11px] text-[var(--ink-muted)]">
                        {getDocsGroup(hit.doc.group).title}
                        {hit.section ? (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="truncate">
                              <Highlight text={hit.section.title} query={query} />
                            </span>
                          </>
                        ) : null}
                      </span>
                      <span className="mt-1 block text-[14px] font-medium text-[var(--ink)]">
                        <Highlight text={hit.doc.title} query={query} />
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-[12px] leading-5 text-[var(--ink-muted)]">
                        <Highlight text={hit.doc.description} query={query} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="flex items-center gap-1.5 border-t border-[var(--line)] px-4 py-2.5 text-[11px] text-[var(--ink-muted)]">
                <CornerDownLeft size={12} strokeWidth={1.5} aria-hidden="true" />
                Enter opens the first result
              </p>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
