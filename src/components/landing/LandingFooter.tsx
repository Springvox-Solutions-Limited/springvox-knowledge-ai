import Link from 'next/link';
import { SpringVoxLogo } from '@/src/components/brand/SpringVoxLogo';

export function LandingFooter() {
  return (
    <footer className="bg-white border-t border-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-[1.3fr,0.7fr]">
          <div className="space-y-10">
            <SpringVoxLogo variant="full" theme="light" imageClassName="h-11 sm:h-13" />
            <p className="max-w-md text-base leading-relaxed text-slate-500 font-medium">
              SpringVox Knowledge AI provides secure, institutional-grade intelligence layers 
              for organizations that prioritize certainty and source-backed documentation.
            </p>
            <div className="flex items-center gap-10">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">© 2026 SpringVox</span>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Intelligence Core v3.0</span>
            </div>
          </div>

          <div className="grid gap-12 sm:grid-cols-2 lg:justify-items-end">
            <div className="lg:text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-950 mb-8">Organization</p>
              <nav className="grid gap-5">
                <Link href="/login" className="text-xs font-bold uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-950">
                  Client Portal
                </Link>
                <Link href="/register" className="text-xs font-bold uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-950">
                  Get Started
                </Link>
                <Link href="/dashboard" className="text-xs font-bold uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-950">
                  Solutions
                </Link>
              </nav>
            </div>
            <div className="lg:text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-950 mb-8">Resources</p>
              <nav className="grid gap-5">
                <a href="#how-it-works" className="text-xs font-bold uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-950">
                  Our Process
                </a>
                <a href="#features" className="text-xs font-bold uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-950">
                  Product Roadmap
                </a>
                <a href="https://springvox.com" target="_blank" className="text-xs font-bold uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-950">
                  Global Network
                </a>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
