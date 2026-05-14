import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function LandingCTA() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 pt-4 sm:px-6 sm:pb-24 lg:px-8 lg:pb-32">
      <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white px-5 py-10 shadow-[0_18px_40px_rgba(15,23,42,0.06)] sm:rounded-[40px] sm:px-8 sm:py-16 sm:px-12 lg:rounded-[48px] lg:px-16">
        
        <div className="relative flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-6 text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-700">Get started</p>
            <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl lg:leading-[1.1]">
              Create a workspace for your organisation <br />
              <span className="text-slate-500">and start with approved documents.</span>
            </h2>
            <p className="mt-5 text-base font-medium leading-relaxed text-slate-600 sm:mt-8 sm:text-lg">
              Upload your first documents, invite your team, and give staff a simpler
              way to get answers from company information.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
            <Link
              href="/register"
              className="app-button-primary sm:px-10 sm:py-6 sm:text-base"
            >
              Create a company workspace
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/login"
              className="app-button-secondary sm:px-10 sm:py-6 sm:text-base"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
