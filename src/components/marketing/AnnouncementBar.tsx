"use client";

import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import { useEffect, useState } from "react";

const STORAGE_KEY = "rekall_announcement_dismissed_v1";

export function AnnouncementBar() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        if (window.localStorage.getItem(STORAGE_KEY) === "1") setHidden(true);
      } catch {
        // Storage can be unavailable; the bar remains dismissible for this visit.
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  if (hidden) return null;

  return (
    <aside data-screenshot-hide aria-label="Announcement" className="relative z-[60] border-b border-[var(--line)] bg-[var(--surface-2)]">
      <div className="mk-shell flex min-h-9 items-center justify-center gap-2 py-1.5 pr-10 text-center">
        <span
          aria-hidden="true"
          className="hidden h-1 w-1 rounded-full bg-[var(--accent-jade)] sm:block"
        />
        <p className="text-[11px] leading-5 text-[var(--ink-soft)]">
          <span className="font-medium text-[var(--ink)]">Open beta.</span>{" "}
          <span className="hidden sm:inline">
            Essential is free while we build. No credit card.
          </span>
          <span className="sm:hidden">Essential is free while we build.</span>
        </p>
        <Link
          href="/pricing"
          className="group inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-[var(--accent-jade)] hover:text-[var(--accent-jade-hover)]"
        >
          See plans
          <ArrowRight
            size={11}
            strokeWidth={1.5}
            aria-hidden="true"
            className="transition-transform duration-200 group-hover:translate-x-0.5"
          />
        </Link>
        <button
          type="button"
          onClick={() => {
            setHidden(true);
            try {
              window.localStorage.setItem(STORAGE_KEY, "1");
            } catch {
              // Ignore storage failures.
            }
          }}
          aria-label="Dismiss announcement"
          className="absolute right-3 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-[5px] text-[var(--ink-muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--ink)] sm:right-5"
        >
          <X size={13} strokeWidth={1.5} />
        </button>
      </div>
    </aside>
  );
}
