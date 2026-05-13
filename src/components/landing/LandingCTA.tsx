import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function LandingCTA() {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-20 pt-4 sm:px-6 lg:px-8 lg:pb-24">
      <div className="relative overflow-hidden rounded-[34px] border border-white/8 bg-[linear-gradient(135deg,rgba(255,107,0,0.14),rgba(21,23,28,0.96)_40%,rgba(13,15,18,0.98))] px-6 py-10 shadow-[0_28px_70px_rgba(0,0,0,0.25)] sm:px-8 lg:px-10">
        <div className="absolute right-10 top-0 h-40 w-40 rounded-full bg-[#FF6B00]/18 blur-[90px]" />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#FFB27A]">Get started</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#F7FAFC] sm:text-4xl">
              Start building a trusted AI knowledge layer for your team.
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-300">
              Upload approved documents, give users a cleaner way to ask questions, and keep answers tied to verified sources.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#FF6B00] px-6 py-3.5 text-sm font-semibold text-black shadow-[0_18px_50px_rgba(255,107,0,0.28)] transition hover:bg-[#FF7C1F]"
            >
              Create account
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-3.5 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.05]"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
