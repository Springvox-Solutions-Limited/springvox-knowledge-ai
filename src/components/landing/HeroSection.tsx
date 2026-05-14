import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { ProductMockup } from './ProductMockup';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-[#f4f7fb] pt-16 sm:pt-20 lg:pt-28">
      <div className="absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_58%)] -z-10" />
      
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="animate-in space-y-8 py-10 duration-1000 fade-in slide-in-from-left-4 sm:space-y-10 sm:py-12 lg:py-20">
            <div className="inline-flex max-w-full items-center gap-3 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-800 sm:px-5 sm:py-2.5 sm:text-xs sm:tracking-[0.2em]">
              <span className="flex h-2 w-2 rounded-full bg-cyan-500" />
              AI assistant for company knowledge
            </div>

            <h1 className="text-4xl font-bold leading-[1] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Turn your company documents <br />
              into a helpful <br />
              <span className="text-cyan-700">AI assistant.</span>
            </h1>

            <p className="max-w-xl text-base font-medium leading-relaxed text-slate-600 sm:text-lg">
              Upload approved documents, invite your team, and let staff ask questions
              in plain English. SpringVox answers from your organisation&apos;s own
              information and shows sources when available.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/register"
                className="app-button-primary sm:px-8 sm:py-4 sm:text-base"
              >
                Create a company workspace
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/login"
                className="app-button-secondary sm:px-8 sm:py-4 sm:text-base"
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
            <div className="absolute -inset-4 rounded-[48px] bg-cyan-100/40 opacity-80 blur-2xl" />
            <ProductMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
