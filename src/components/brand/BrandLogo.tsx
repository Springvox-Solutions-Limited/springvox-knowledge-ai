"use client";

import { cn } from '@/src/lib/utils';

type BrandLogoProps = {
  variant?: 'full' | 'mark';
  /** Surface the logo sits on. Kept for API compatibility; the wordmark uses theme tokens so it stays readable in either case. */
  theme?: 'light' | 'dark';
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
};

/**
 * The Rekall-IQ "R" monogram, authored as an inline SVG so it is crisp at any
 * size (favicon → hero) and themeable. Used as the app mark and the assistant
 * avatar so the identity stays consistent everywhere.
 */
export function RekallMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'relative inline-flex items-center justify-center overflow-hidden rounded-[28%] bg-[#0b1413] ring-1 ring-inset ring-[var(--accent-jade)]/25',
        className,
      )}
    >
      <svg viewBox="0 0 48 48" fill="none" className="h-[60%] w-[60%]">
        <defs>
          <linearGradient id="rk-mark" x1="14" y1="8" x2="34" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2dd4bf" />
            <stop offset="1" stopColor="#0d9488" />
          </linearGradient>
        </defs>
        <g
          stroke="url(#rk-mark)"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M16 8 V40" />
          <path d="M16 8 H26 A9 9 0 0 1 26 26 H16" />
          <path d="M21 25 L34 40" />
        </g>
      </svg>
    </span>
  );
}

export function BrandLogo({
  variant = 'full',
  theme = 'dark',
  className,
  imageClassName,
  fallbackClassName,
}: BrandLogoProps) {
  void theme;
  // `imageClassName` historically sized a wide <img> logo (e.g. "w-auto max-w-[190px]").
  // The mark is a fixed square, so we ignore that legacy sizing to avoid a collapsed width.
  void imageClassName;

  if (variant === 'mark') {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <RekallMark className="h-full w-full" />
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <RekallMark className="h-9 w-9 shrink-0" />
      <span className="text-[18px] font-bold leading-none tracking-tight text-[var(--ink)] sm:text-[19px]">
        Rekall<span className="text-[var(--accent-jade)]">-IQ</span>
      </span>
      <span className={cn('sr-only', fallbackClassName)}>Rekall-IQ</span>
    </div>
  );
}
