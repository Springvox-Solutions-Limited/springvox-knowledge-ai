import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function LandingCTA() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 pt-4 sm:px-6 sm:pb-24 lg:px-8 lg:pb-32">
      <div className="relative overflow-hidden rounded-[32px] bg-slate-950 px-5 py-10 shadow-2xl shadow-slate-900/20 sm:rounded-[40px] sm:px-8 sm:py-16 sm:px-12 lg:rounded-[48px] lg:px-16">
        {/* Subtle decorative glow */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-slate-800 blur-[100px] opacity-50" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-slate-800 blur-[100px] opacity-50" />
        
        <div className="relative flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 mb-6">Get started</p>
            <h2 className="text-2xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl lg:leading-[1.1]">
              Create a workspace for your organisation <br />
              <span className="text-slate-400">and start with approved documents.</span>
            </h2>
            <p className="mt-5 text-base font-medium leading-relaxed text-slate-400 sm:mt-8 sm:text-lg">
              Upload your first documents, invite your team, and give staff a simpler
              way to get answers from company information.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
            <Link
              href="/register"
              className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-white px-6 py-4 text-sm font-bold text-slate-950 shadow-2xl transition-all hover:scale-[1.03] hover:bg-slate-50 active:scale-95 sm:px-10 sm:py-6 sm:text-base"
            >
              Create a company workspace
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-2xl border-2 border-white/20 bg-white/5 px-6 py-4 text-sm font-bold !text-white transition-all hover:border-white/40 hover:bg-white/10 sm:px-10 sm:py-6 sm:text-base"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
