import Link from 'next/link';

import { SpringVoxLogo } from '@/src/components/brand/SpringVoxLogo';

export default function BillingRequiredPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 text-slate-900">
      <section className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-6 text-center shadow-[0_18px_44px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="mb-6 flex justify-center">
          <SpringVoxLogo
            variant="full"
            theme="light"
            imageClassName="h-10 w-auto object-contain"
          />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-700">
          Payment required
        </p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
          Your 14-day trial has ended.
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Please upgrade to continue using SpringVox. If you believe this is a mistake,
          contact your workspace administrator or SpringVox support.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[#0d1f35] px-5 text-sm font-semibold text-white transition hover:bg-[#132744]"
          >
            Back to login
          </Link>
          <a
            href="mailto:support@springvox.ai"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Contact support
          </a>
        </div>
      </section>
    </main>
  );
}
