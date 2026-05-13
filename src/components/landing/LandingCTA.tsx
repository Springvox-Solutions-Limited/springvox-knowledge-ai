import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function LandingCTA() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-24 pt-4 lg:px-8 lg:pb-32">
      <div className="relative overflow-hidden rounded-[48px] bg-slate-950 px-8 py-16 shadow-2xl shadow-slate-900/20 sm:px-12 lg:px-16">
        {/* Subtle decorative glow */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-slate-800 blur-[100px] opacity-50" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-slate-800 blur-[100px] opacity-50" />
        
        <div className="relative flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500 mb-6">Final Integration</p>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-5xl lg:leading-[1.1]">
              Secure your <br />
              <span className="text-slate-400">Knowledge Edge today.</span>
            </h2>
            <p className="mt-8 text-lg leading-relaxed text-slate-400 font-medium">
              Join leading organizations transitioning from fragmented documentation to unified, 
              source-backed AI intelligence. Deploy your workspace in minutes.
            </p>
          </div>

          <div className="flex flex-col gap-6 sm:flex-row">
            <Link
              href="/register"
              className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-white px-10 py-6 text-base font-bold text-slate-950 shadow-2xl transition-all hover:bg-slate-50 hover:scale-[1.03] active:scale-95"
            >
              Start Your Project
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-2xl border-2 border-white/20 bg-white/5 px-10 py-6 text-base font-bold !text-white transition-all hover:bg-white/10 hover:border-white/40"
            >
              Client Portal
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
