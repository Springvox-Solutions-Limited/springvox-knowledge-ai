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
    <section className="relative overflow-hidden bg-white pt-20 lg:pt-32 border-b border-slate-100">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-slate-50/50 -z-10" />
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-slate-200/20 rounded-full blur-[120px] animate-pulse" />
      
      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-10 py-12 lg:py-20 animate-in fade-in slide-in-from-left-4 duration-1000">
            <div className="inline-flex items-center gap-3 rounded-full bg-slate-950 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.2em] !text-white shadow-2xl shadow-slate-950/20">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              Next-Gen Intelligence Active
            </div>

            <h1 className="text-6xl font-black tracking-tighter text-slate-950 sm:text-7xl lg:text-8xl leading-[0.95]">
              Trusted <br />
              Intelligence. <br />
              <span className="text-slate-300">Absolute Context.</span>
            </h1>

            <p className="max-w-xl text-xl leading-relaxed text-slate-500 font-medium border-l-2 border-slate-100 pl-8">
              SpringVox transforms fragmented documentation into a secure, 
              source-backed AI knowledge base. Built for organizations where 
              accuracy is the only metric that matters.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/register"
                className="group relative inline-flex items-center justify-center gap-4 rounded-2xl bg-slate-950 px-10 py-7 text-base font-bold !text-white transition-all hover:bg-slate-800 hover:scale-[1.02] active:scale-95 overflow-hidden shadow-2xl shadow-slate-950/40"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                Start Your Project
                <ArrowRight className="h-5 w-5 !text-white" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-2xl border-2 border-slate-100 bg-white px-10 py-7 text-base font-bold text-slate-950 transition-all hover:bg-slate-50 hover:border-slate-200"
              >
                View Demo
              </Link>
            </div>

            <div className="pt-8 flex items-center gap-8 text-slate-400">
              <div className="h-px w-12 bg-slate-200" />
              <p className="text-[10px] font-black uppercase tracking-widest">Grounded in SEC-Standard Security</p>
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
