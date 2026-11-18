'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ThumbsDown, ThumbsUp } from 'lucide-react';

type Choice = 'yes' | 'no';

export function DocsFeedback() {
  const [choice, setChoice] = useState<Choice | null>(null);

  return (
    <div className="rounded-[12px] border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5">
      {choice ? (
        <div aria-live="polite">
          <p className="text-[13px] font-medium text-[var(--ink)]">
            Thanks for the signal.
          </p>
          <p className="mt-1 text-[12px] leading-5 text-[var(--ink-soft)]">
            This control is local-only in the docs beta, so nothing was sent. If
            the page missed something,{' '}
            <Link
              href="/contact"
              className="text-[var(--accent-jade)] underline underline-offset-4"
            >
              tell us what you needed
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] font-medium text-[var(--ink)]">
            Was this page helpful?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setChoice('yes')}
              className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-[var(--line)] px-3 text-[12px] text-[var(--ink-soft)] transition-colors hover:border-[var(--accent-jade-100)] hover:bg-[var(--accent-jade-50)] hover:text-[var(--ink)]"
            >
              <ThumbsUp size={13} strokeWidth={1.5} aria-hidden="true" />
              Yes
            </button>
            <button
              type="button"
              onClick={() => setChoice('no')}
              className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-[var(--line)] px-3 text-[12px] text-[var(--ink-soft)] transition-colors hover:border-[var(--accent-jade-100)] hover:bg-[var(--accent-jade-50)] hover:text-[var(--ink)]"
            >
              <ThumbsDown size={13} strokeWidth={1.5} aria-hidden="true" />
              No
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
