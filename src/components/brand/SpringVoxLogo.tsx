"use client";

import { cn } from '@/src/lib/utils';

type SpringVoxLogoProps = {
  variant?: 'full' | 'mark';
  theme?: 'light' | 'dark';
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
};

export function SpringVoxLogo({
  variant = 'full',
  theme = 'dark',
  className,
  imageClassName,
  fallbackClassName,
}: SpringVoxLogoProps) {
  const logoSrc = theme === 'light' ? '/brand/springvox-logo-light.png' : '/brand/springvox-logo.png';

  if (variant === 'mark') {
    return (
      <div className={cn('flex items-center', className)}>
        <img
          src={logoSrc}
          alt="SpringVox"
          className={cn('h-10 w-10 rounded-2xl object-contain object-center', imageClassName)}
        />
      </div>
    );
  }

  return (
    <div className={cn('flex items-center', className)}>
      <img
        src={logoSrc}
        alt="SpringVox Knowledge AI"
        className={cn('h-10 w-auto max-w-none object-contain object-center', imageClassName)}
      />
      <span className={cn('sr-only', fallbackClassName)}>SpringVox Knowledge AI</span>
    </div>
  );
}
