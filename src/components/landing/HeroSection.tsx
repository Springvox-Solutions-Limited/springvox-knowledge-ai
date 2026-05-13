import Link from 'next/link';
import { ArrowRight, Play, ShieldCheck } from 'lucide-react';

import { ProductMockup } from './ProductMockup';

const trustPoints = [
  'Company workspace knowledge',
  'Source-backed responses',
  'Admin-controlled uploads and roles',
  'Clean viewer chat experience',
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-white/10">
      <div className="absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-cyan-400/14 blur-[180px]" />
      <div className="mx-auto max-w-7xl px-5 pb-20 pt-14 sm:px-6 lg:px-8 lg:pb-24 lg:pt-20">
        <div className="grid items-center gap-14 lg:grid-cols-[1.02fr,0.98fr]">
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.26em] text-cyan-100">
              <ShieldCheck className="h-3.5 w-3.5" />
              Private AI knowledge assistant
            </div>

            <h1 className="mt-7 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl lg:leading-[1.05]">
              Turn company documents into a trusted AI assistant.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              SpringVox Knowledge AI helps teams upload approved knowledge, invite users, and answer
              staff questions with source-backed AI responses.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-3.5 text-sm font-semibold text-slate-950 shadow-[0_18px_50px_rgba(34,211,238,0.22)] transition hover:from-teal-400 hover:to-cyan-400"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-semibold text-slate-100 transition hover:border-cyan-300/30 hover:bg-white/10"
              >
                Login
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-medium text-slate-300 transition hover:text-white"
              >
                <Play className="h-4 w-4 text-cyan-300" />
                See how it works
              </a>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {trustPoints.map((point) => (
                <div
                  key={point}
                  className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-slate-200 shadow-[0_12px_30px_rgba(2,12,27,0.16)]"
                >
                  {point}
                </div>
              ))}
            </div>
          </div>

          <ProductMockup />
        </div>
      </div>
    </section>
  );
}
