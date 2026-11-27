"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] Unhandled UI error", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--canvas)] px-4 text-[var(--ink)]">
      <div className="w-full max-w-[440px] rounded-[12px] border border-[var(--line)] bg-[var(--surface)] p-6">
        <p className="text-[11px] font-medium text-[var(--ink-muted)]">Something went wrong</p>
        <h1 className="mt-2 text-[24px] font-medium tracking-[-0.03em]">This view could not load.</h1>
        <p className="mt-2 text-[12px] leading-5 text-[var(--ink-soft)]">
          Your data is unchanged. Try the view again, or return to the workspace.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-[var(--accent-jade)] px-3 text-[12px] font-medium text-[#04100e] hover:bg-[var(--accent-jade-hover)]"
          >
            <RefreshCw size={13} />
            Try again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-[var(--line)] px-3 text-[12px] text-[var(--ink-soft)] hover:bg-[var(--canvas-soft)] hover:text-[var(--ink)]"
          >
            <ArrowLeft size={13} />
            Back to workspace
          </Link>
        </div>
        {error.digest ? (
          <p className="mt-4 font-mono text-[10px] text-[var(--ink-muted)]">Reference: {error.digest}</p>
        ) : null}
      </div>
    </main>
  );
}
