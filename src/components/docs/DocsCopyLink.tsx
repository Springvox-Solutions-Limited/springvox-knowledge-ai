'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Link2 } from 'lucide-react';

import { cn } from '@/src/lib/utils';

export function DocsCopyLink({ className }: { className?: string }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const resetSoon = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setCopied(false);
      setFailed(false);
    }, 2200);
  };

  const copyLink = async () => {
    const url = window.location.href;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setFailed(false);
      resetSoon();
    } catch {
      try {
        const field = document.createElement('textarea');
        field.value = url;
        field.setAttribute('readonly', '');
        field.style.position = 'fixed';
        field.style.opacity = '0';
        document.body.appendChild(field);
        field.select();
        document.execCommand('copy');
        document.body.removeChild(field);
        setCopied(true);
        setFailed(false);
        resetSoon();
      } catch {
        setFailed(true);
        setCopied(false);
        resetSoon();
      }
    }
  };

  return (
    <button
      type="button"
      onClick={() => void copyLink()}
      className={cn(
        'inline-flex h-9 shrink-0 items-center gap-2 rounded-[8px] border border-[var(--line)] px-3 text-[12px] text-[var(--ink-soft)] transition-colors hover:border-[var(--accent-jade-100)] hover:bg-[var(--accent-jade-50)] hover:text-[var(--ink)]',
        className,
      )}
      aria-live="polite"
    >
      {copied ? (
        <Check size={14} strokeWidth={1.5} aria-hidden="true" />
      ) : (
        <Link2 size={14} strokeWidth={1.5} aria-hidden="true" />
      )}
      {copied ? 'Link copied' : failed ? 'Copy failed' : 'Copy link'}
    </button>
  );
}
