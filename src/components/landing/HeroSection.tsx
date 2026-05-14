import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { ProductMockup } from './ProductMockup';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-slate-100 bg-white pt-16 sm:pt-20 lg:pt-32">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-slate-50/50 -z-10" />
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-slate-200/20 rounded-full blur-[120px] animate-pulse" />
      
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="animate-in space-y-8 py-10 duration-1000 fade-in slide-in-from-left-4 sm:space-y-10 sm:py-12 lg:py-20">
            <div className="inline-flex max-w-full items-center gap-3 rounded-full bg-slate-950 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] !text-white shadow-2xl shadow-slate-950/20 sm:px-5 sm:py-2.5 sm:text-xs sm:tracking-[0.2em]">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              AI assistant for company knowledge
            </div>

            <h1 className="text-4xl font-black leading-[0.95] tracking-tighter text-slate-950 sm:text-6xl lg:text-8xl">
              Turn your company documents <br />
              into a helpful <br />
              <span className="text-slate-300">AI assistant.</span>
            </h1>

            <p className="max-w-xl border-l-2 border-slate-100 pl-4 text-base font-medium leading-relaxed text-slate-500 sm:pl-8 sm:text-xl">
              Upload approved documents, invite your team, and let staff ask questions
              in plain English. SpringVox answers from your organisation&apos;s own
              information and shows sources when available.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/register"
                className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-2xl bg-slate-950 px-6 py-4 text-sm font-bold !text-white shadow-2xl shadow-slate-950/40 transition-all hover:scale-[1.02] hover:bg-slate-800 active:scale-95 sm:gap-4 sm:px-10 sm:py-7 sm:text-base"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                Create a company workspace
                <ArrowRight className="h-5 w-5 !text-white" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-2xl border-2 border-slate-100 bg-white px-6 py-4 text-sm font-bold text-slate-950 transition-all hover:border-slate-200 hover:bg-slate-50 sm:px-10 sm:py-7 sm:text-base"
              >
                Login
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-4 text-slate-400 sm:gap-8 sm:pt-8">
              <div className="h-px w-12 bg-slate-200" />
              <p className="text-[10px] font-black uppercase tracking-widest">Built for approved company information</p>
            </div>
          </div>

          <div className="relative animate-in fade-in slide-in-from-right-4 duration-1000 delay-300">
            <div className="absolute -inset-4 rounded-[48px] bg-slate-100 opacity-50 blur-2xl" />
            <ProductMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
