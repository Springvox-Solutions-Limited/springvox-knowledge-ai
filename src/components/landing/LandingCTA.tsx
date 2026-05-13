import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function LandingCTA() {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-20 pt-4 sm:px-6 lg:px-8 lg:pb-24">
      <div className="relative overflow-hidden rounded-[34px] border border-slate-200 bg-[linear-gradient(135deg,rgba(34,211,238,0.1),rgba(255,255,255,0.98)_35%,rgba(239,248,255,0.98))] px-6 py-10 shadow-[0_28px_70px_rgba(15,23,42,0.08)] sm:px-8 lg:px-10">
        <div className="absolute right-10 top-0 h-40 w-40 rounded-full bg-cyan-300/30 blur-[90px]" />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-700">Get started</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Start building a trusted AI knowledge layer for your team.
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Upload approved documents, give users a cleaner way to ask questions, and keep answers tied to verified sources.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-3.5 text-sm font-semibold text-slate-950 shadow-[0_18px_50px_rgba(34,211,238,0.22)] transition hover:from-teal-400 hover:to-cyan-400"
            >
              Create account
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
