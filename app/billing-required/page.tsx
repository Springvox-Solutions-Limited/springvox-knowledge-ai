import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { BrandLogo } from '@/src/components/brand/BrandLogo';

export default function BillingRequiredPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--surface-2)] px-4 py-10 text-[var(--ink)]">
      <div className="mb-6 w-full max-w-lg">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)]"
        >
          <ArrowLeft size={14} />
          Back to home
        </Link>
      </div>
      <section className="w-full max-w-lg rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-6 text-center shadow-[0_18px_44px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="mb-6 flex justify-center">
          <BrandLogo
            variant="full"
            theme="light"
            imageClassName="h-10 w-auto object-contain"
          />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--accent-jade)]">
          Trial ended
        </p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-[var(--ink)]">
          Your 14-day trial has ended.
        </h1>
        <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
          To continue using Rekall-IQ, please contact your workspace administrator or reach out to Rekall-IQ support to discuss your options.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--accent-jade)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--accent-jade-hover)]"
          >
            Sign in
          </Link>
          <a
            href="mailto:support@rekall-iq.com"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface)] px-5 text-sm font-semibold text-[var(--ink-soft)] transition hover:bg-[var(--surface-2)]"
          >
            Contact support
          </a>
        </div>
      </section>
    </main>
  );
}
