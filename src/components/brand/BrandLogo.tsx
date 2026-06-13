"use client";

import { cn } from '@/src/lib/utils';

const MARK_SRC = '/brand/rekall-mark.png';

type BrandLogoProps = {
  variant?: 'full' | 'mark';
  /** Surface the logo sits on. Kept for API compatibility; the wordmark uses theme tokens so it stays readable in either case. */
  theme?: 'light' | 'dark';
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
};

/**
 * The Rekall-IQ brand. The mark is the transparent magnifying-glass "R" asset
 * (`public/brand/rekall-mark.png`); the full variant pairs it with the wordmark.
 */
export function BrandLogo({
  variant = 'full',
  theme = 'dark',
  className,
  imageClassName,
  fallbackClassName,
}: BrandLogoProps) {
  void theme;

  if (variant === 'mark') {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={MARK_SRC} alt="" aria-hidden className={cn('h-full w-full object-contain', imageClassName)} />
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={MARK_SRC} alt="" aria-hidden className="h-9 w-9 shrink-0 object-contain" />
      <span className="text-[18px] font-bold leading-none tracking-tight text-[var(--ink)] sm:text-[19px]">
        Rekall<span className="text-[var(--accent-jade)]">-IQ</span>
      </span>
      <span className={cn('sr-only', fallbackClassName)}>Rekall-IQ</span>
    </div>
  );
}
