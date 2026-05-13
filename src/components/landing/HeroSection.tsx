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
    <section className="relative overflow-hidden border-b border-white/6">
      <div className="absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#FF6B00]/10 blur-[180px]" />
      <div className="mx-auto max-w-7xl px-5 pb-20 pt-14 sm:px-6 lg:px-8 lg:pb-24 lg:pt-20">
        <div className="grid items-center gap-14 lg:grid-cols-[1.02fr,0.98fr]">
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#FF6B00]/20 bg-[#FF6B00]/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.26em] text-[#FFB27A]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Private AI knowledge assistant
            </div>

            <h1 className="mt-7 max-w-3xl text-4xl font-semibold tracking-tight text-[#F7FAFC] sm:text-5xl lg:text-6xl lg:leading-[1.05]">
              Turn company documents into a trusted AI assistant.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              SpringVox Knowledge AI helps teams upload approved knowledge, invite users, and answer
              staff questions with source-backed AI responses.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#FF6B00] px-6 py-3.5 text-sm font-semibold text-black shadow-[0_18px_50px_rgba(255,107,0,0.28)] transition hover:bg-[#FF7C1F]"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-3.5 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.05]"
              >
                Login
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-medium text-slate-400 transition hover:text-white"
              >
                <Play className="h-4 w-4 text-[#FF6B00]" />
                See how it works
              </a>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {trustPoints.map((point) => (
                <div
                  key={point}
                  className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300 shadow-[0_12px_30px_rgba(0,0,0,0.16)]"
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
