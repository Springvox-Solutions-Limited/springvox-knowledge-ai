import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/src/lib/utils";

const SUPERSCRIPT: Record<number, string> = {
  1: "¹",
  2: "²",
  3: "³",
  4: "⁴",
  5: "⁵",
  6: "⁶",
  7: "⁷",
  8: "⁸",
  9: "⁹",
};

export function SectionLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "flex items-center gap-2.5 font-meta text-[11px] leading-4 text-[var(--ink-muted)]",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="h-1 w-1 shrink-0 rounded-full bg-[var(--accent-jade)]"
      />
      {children}
    </p>
  );
}

/**
 * The product's signature: a superscript reference that maps an answer sentence
 * to a specific source. Use it on answers and nowhere else.
 */
export function CitationMark({
  n,
  className,
  onClick,
  active = false,
}: {
  n: number;
  className?: string;
  onClick?: () => void;
  active?: boolean;
}) {
  const glyph = SUPERSCRIPT[n] ?? `(${n})`;
  const mark = (
    <>
      <span aria-hidden="true">{glyph}</span>
      <span className="sr-only"> (source {n})</span>
    </>
  );
  const markClass = cn(
    "ml-0.5 font-meta text-[0.68em] leading-none text-[var(--accent-jade)] transition-colors",
    active && "text-[var(--accent-jade-hover)]",
    className,
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={`Open source ${n}`}
        aria-pressed={active}
        className={cn("inline cursor-pointer rounded-[2px] border-0 bg-transparent p-0 align-baseline", markClass)}
      >
        {mark}
      </button>
    );
  }

  return <sup className={markClass}>{mark}</sup>;
}

export function FileRail({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none block w-2 self-stretch border-l border-[var(--line)]",
        "bg-[repeating-linear-gradient(to_bottom,var(--line)_0,var(--line)_1px,transparent_1px,transparent_24px)]",
        className,
      )}
    />
  );
}

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "quiet";
  className?: string;
  icon?: ReactNode;
  external?: boolean;
};

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className,
  icon,
  external,
}: ButtonLinkProps) {
  const styles = {
    primary: "mk-button-primary",
    secondary: "mk-button-secondary",
    quiet: "mk-button-quiet",
  }[variant];

  const classes = cn("mk-button group", styles, className);
  const content = (
    <>
      {children}
      {icon ? (
        <span className="transition-transform duration-300 group-hover:translate-x-0.5">
          {icon}
        </span>
      ) : null}
    </>
  );

  if (external) {
    return (
      <a href={href} className={classes} target="_blank" rel="noreferrer">
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {content}
    </Link>
  );
}

export function ArrowLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-1.5 text-[14px] font-medium text-[var(--accent-jade)] transition-colors hover:text-[var(--accent-jade-hover)]",
        className,
      )}
    >
      {children}
      <span
        aria-hidden="true"
        className="transition-transform duration-300 group-hover:translate-x-1"
      >
        →
      </span>
    </Link>
  );
}

export function PageHero({
  label,
  title,
  intro,
  actions,
  aside,
}: {
  label: string;
  title: ReactNode;
  intro?: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <header className="relative isolate overflow-hidden border-b border-[var(--line)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[var(--canvas)]"
      />
      <div
        aria-hidden="true"
        className="mk-grid-bg mk-grid-fade pointer-events-none absolute inset-0 -z-10 opacity-50"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -top-40 -z-10 h-[34rem] w-[34rem] rounded-full border border-[var(--line)] opacity-40"
      />
      <div className="mk-shell grid gap-10 py-16 sm:py-20 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:py-24">
        <div className="max-w-[54rem]">
          <SectionLabel>{label}</SectionLabel>
          <h1 className="mk-h1 mt-5 max-w-[17ch] text-[var(--ink)]">{title}</h1>
          {intro ? (
            <p className="mk-lede mt-6 max-w-[62ch]">{intro}</p>
          ) : null}
          {actions ? (
            <div className="mt-8 flex flex-wrap items-center gap-3">{actions}</div>
          ) : null}
        </div>
        {aside ? <div className="lg:pb-2">{aside}</div> : null}
      </div>
    </header>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-[68ch] space-y-5 text-[15px] leading-7 text-[var(--ink-soft)] [&_a]:text-[var(--accent-jade)] [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-[24px] [&_h2]:leading-8 [&_h2]:text-[var(--ink)] [&_h3]:mt-8 [&_h3]:text-[16px] [&_h3]:font-medium [&_h3]:text-[var(--ink)] [&_li]:ml-5 [&_li]:list-disc [&_strong]:font-medium [&_strong]:text-[var(--ink)]">
      {children}
    </div>
  );
}
