import Link from 'next/link';
import { Children, type ReactNode } from 'react';
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Construction,
  Info,
  Lightbulb,
  TriangleAlert,
} from 'lucide-react';

import { cn } from '@/src/lib/utils';

export const docsLinkClass =
  'font-medium text-[var(--accent-jade)] underline decoration-[var(--line)] underline-offset-4 transition-colors hover:text-[var(--accent-jade-hover)] hover:decoration-[var(--accent-jade)]';

export function DocLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  if (href.startsWith('http') || href.startsWith('mailto:')) {
    return (
      <a href={href} className={cn(docsLinkClass, className)}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={cn(docsLinkClass, className)}>
      {children}
    </Link>
  );
}

export function GuideSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-28 border-t border-[var(--line)] pt-8 first:border-t-0 first:pt-0"
    >
      <h2 className="text-[21px] font-semibold leading-7 tracking-[-0.015em] text-[var(--ink)] sm:text-[23px]">
        {title}
      </h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export function Steps({ children }: { children: ReactNode }) {
  const steps = Children.toArray(children);

  return (
    <ol className="space-y-5">
      {steps.map((step, index) => (
        <li key={index} className="flex gap-4">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface-2)] font-mono text-[11px] tabular-nums text-[var(--ink-soft)]">
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">{step}</div>
        </li>
      ))}
    </ol>
  );
}

export function Step({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div>
      <p className="font-medium text-[var(--ink)]">{title}</p>
      {children ? <div className="mt-1">{children}</div> : null}
    </div>
  );
}

const CALLOUTS = {
  note: {
    icon: Info,
    frame: 'border-[var(--line)] bg-[var(--surface-2)]',
    iconColor: 'text-[var(--ink-soft)]',
    titleColor: 'text-[var(--ink)]',
    label: 'Note',
  },
  tip: {
    icon: Lightbulb,
    frame: 'border-[var(--accent-jade-100)] bg-[var(--accent-jade-50)]',
    iconColor: 'text-[var(--accent-jade)]',
    titleColor: 'text-[var(--accent-jade-hover)]',
    label: 'Tip',
  },
  warning: {
    icon: TriangleAlert,
    frame: 'border-amber-500/30 bg-amber-500/10',
    iconColor: 'text-amber-300',
    titleColor: 'text-amber-200',
    label: 'Important',
  },
  planned: {
    icon: Construction,
    frame: 'border-dashed border-[var(--line)] bg-[var(--canvas-soft)]',
    iconColor: 'text-[var(--ink-muted)]',
    titleColor: 'text-[var(--ink)]',
    label: 'Planned',
  },
} as const;

export function Callout({
  tone = 'note',
  title,
  children,
}: {
  tone?: keyof typeof CALLOUTS;
  title?: string;
  children: ReactNode;
}) {
  const detail = CALLOUTS[tone];
  const Icon = detail.icon;

  return (
    <div className={cn('flex gap-3 rounded-[12px] border p-4', detail.frame)}>
      <Icon
        size={16}
        strokeWidth={1.5}
        aria-hidden="true"
        className={cn('mt-1 shrink-0', detail.iconColor)}
      />
      <div className="min-w-0 space-y-1.5 text-[14px] leading-6">
        <p className={cn('font-medium', detail.titleColor)}>
          {title ?? detail.label}
        </p>
        <div className="text-[var(--ink-soft)] [&_a]:font-medium [&_a]:text-[var(--accent-jade)] [&_a]:underline [&_a]:underline-offset-4">
          {children}
        </div>
      </div>
    </div>
  );
}

export function DocsTable({
  head,
  rows,
  caption,
  minWidth = 560,
}: {
  head: ReactNode[];
  rows: ReactNode[][];
  caption?: string;
  minWidth?: number;
}) {
  return (
    <div className="my-5 max-w-full">
      <div className="max-w-full overflow-x-auto rounded-[12px] border border-[var(--line)]">
        <table
          className="w-full border-collapse text-left text-[13px] leading-5"
          style={{ minWidth }}
        >
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead>
            <tr className="border-b border-[var(--line)] bg-[var(--surface-2)]">
              {head.map((cell, index) => (
                <th
                  key={index}
                  scope="col"
                  className="whitespace-nowrap px-4 py-3 font-medium text-[var(--ink)]"
                >
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line-soft)]">
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="align-top">
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={cn(
                      'px-4 py-3 text-[var(--ink-soft)]',
                      cellIndex === 0 && 'font-medium text-[var(--ink)]',
                    )}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {caption ? (
        <p className="mt-2 text-[12px] leading-5 text-[var(--ink-muted)]">{caption}</p>
      ) : null}
    </div>
  );
}

export function Faq({
  items,
}: {
  items: { question: string; answer: ReactNode }[];
}) {
  return (
    <div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
      {items.map((item) => (
        <details key={item.question} className="group py-4">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-[15px] font-medium text-[var(--ink)]">
            <span>{item.question}</span>
            <ChevronDown
              size={16}
              strokeWidth={1.5}
              aria-hidden="true"
              className="mt-1 shrink-0 text-[var(--ink-muted)] transition-transform group-open:rotate-180"
            />
          </summary>
          <div className="mt-2.5 max-w-[68ch] pr-6 text-[14px] leading-6 text-[var(--ink-soft)]">
            {item.answer}
          </div>
        </details>
      ))}
    </div>
  );
}

export function RelatedLinks({
  items,
}: {
  items: { href: string; title: string; description?: string }[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="group flex min-w-0 flex-col gap-1.5 rounded-[12px] border border-[var(--line)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--accent-jade-100)]"
        >
          <span className="flex items-start justify-between gap-3">
            <span className="text-[14px] font-medium text-[var(--ink)]">
              {item.title}
            </span>
            <ArrowUpRight
              size={14}
              strokeWidth={1.5}
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-[var(--ink-muted)] transition-colors group-hover:text-[var(--accent-jade)]"
            />
          </span>
          {item.description ? (
            <span className="text-[12px] leading-5 text-[var(--ink-muted)]">
              {item.description}
            </span>
          ) : null}
        </Link>
      ))}
    </div>
  );
}

export function CheckList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={index} className="flex gap-2.5">
          <Check
            size={15}
            strokeWidth={1.5}
            aria-hidden="true"
            className="mt-1 shrink-0 text-[var(--accent-jade)]"
          />
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded-[5px] border border-[var(--line)] bg-[var(--surface-2)] px-1.5 py-0.5 font-mono text-[11px] font-medium text-[var(--ink)]">
      {children}
    </kbd>
  );
}

export function PlannedBadge({ children = 'Planned' }: { children?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-[var(--line)] px-2 py-0.5 text-[11px] text-[var(--ink-muted)]">
      <Construction size={11} strokeWidth={1.5} aria-hidden="true" />
      {children}
    </span>
  );
}

export function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-[4px] bg-[var(--surface-2)] px-1.5 py-0.5 font-mono text-[12px] text-[var(--ink)]">
      {children}
    </code>
  );
}
