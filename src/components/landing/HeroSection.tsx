import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { ProductMockup } from "./ProductMockup";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-[#f4f7fb] pt-14 sm:pt-18 lg:pt-24">
      <div className="absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_58%)] -z-10" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="animate-in space-y-6 pb-8 pt-0 duration-1000 fade-in slide-in-from-left-4 sm:space-y-8 sm:pb-10 sm:pt-4 lg:pb-16 lg:pt-6">
            <div className="inline-flex max-w-full items-center gap-3 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-800 sm:px-5 sm:py-2.5 sm:text-xs sm:tracking-[0.2em]">
              <span className="flex h-2 w-2 rounded-full bg-cyan-500" />
              AI assistant for company knowledge
            </div>

            <h1 className="text-3xl font-bold leading-[1.02] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Turn your company documents into a helpful{" "}
              <span className="text-cyan-700">AI assistant.</span>
            </h1>

            <p className="max-w-xl text-base font-medium leading-relaxed text-slate-700 sm:text-lg">
              Upload documents, invite your team, and let staff ask questions.
              SpringVox answers from your organisation's information with
              sources.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/register"
                className="app-button-primary w-full justify-center sm:w-auto sm:px-8 sm:py-3 sm:text-base"
              >
                Create workspace
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/login"
                className="app-button-secondary w-full justify-center sm:w-auto sm:px-8 sm:py-3 sm:text-base"
              >
                Login
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-slate-500 sm:gap-6 sm:pt-4">
              <div className="h-px w-12 bg-slate-200" />
              <p className="text-[10px] font-black uppercase tracking-widest">
                For approved company information
              </p>
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
