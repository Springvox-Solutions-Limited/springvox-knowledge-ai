import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function LandingCTA() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 pt-4 sm:px-6 sm:pb-24 lg:px-8 lg:pb-32">
      <div className="relative overflow-hidden rounded-[32px] border border-[#18304b] bg-[var(--accent-jade)] px-5 py-10 shadow-[0_18px_40px_rgba(15,23,42,0.12)] sm:rounded-[40px] sm:px-8 sm:py-16 sm:px-12 lg:rounded-[48px] lg:px-16">
        <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.16),transparent_62%)]" />
        <div className="relative flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-6 text-[10px] font-bold uppercase tracking-[0.3em] text-teal-200">Get started</p>
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl lg:leading-[1.1]">
              Create a workspace for your organisation <br />
              <span className="text-teal-200">and start with approved documents.</span>
            </h2>
            <p className="mt-5 text-base font-medium leading-relaxed text-slate-300 sm:mt-8 sm:text-lg">
              Upload your first documents, invite your team, and give staff a simpler
              way to get answers from company information.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--surface)] px-5 py-3 text-sm font-semibold text-[var(--ink)] shadow-[0_12px_28px_rgba(15,23,42,0.18)] transition hover:bg-[var(--surface-2)] sm:px-10 sm:py-6 sm:text-base"
            >
              Create a company workspace
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 sm:px-10 sm:py-6 sm:text-base"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
