import Link from 'next/link';
import { SpringVoxLogo } from '@/src/components/brand/SpringVoxLogo';

export function LandingFooter() {
  return (
    <footer className="bg-white border-t border-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid gap-10 sm:gap-16 lg:grid-cols-[1.3fr,0.7fr]">
          <div className="space-y-6 sm:space-y-10">
            <SpringVoxLogo variant="full" theme="light" imageClassName="h-9 sm:h-11" />
            <p className="max-w-md text-sm font-medium leading-relaxed text-slate-500 sm:text-base">
              SpringVox Knowledge AI helps organisations turn approved documents
              into a simple question-and-answer assistant for their teams.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-10">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">© 2026 SpringVox</span>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">AI assistant for company knowledge</span>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 sm:gap-12 lg:justify-items-end">
            <div className="lg:text-right">
              <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-950 sm:mb-8">Organization</p>
              <nav className="grid gap-5">
                <Link href="/login" className="text-xs font-bold uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-950">
                  Login
                </Link>
                <Link href="/register" className="text-xs font-bold uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-950">
                  Create Workspace
                </Link>
                <Link href="/dashboard" className="text-xs font-bold uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-950">
                  Dashboard
                </Link>
              </nav>
            </div>
            <div className="lg:text-right">
              <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-950 sm:mb-8">Resources</p>
              <nav className="grid gap-5">
                <a href="#how-it-works" className="text-xs font-bold uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-950">
                  How It Works
                </a>
                <a href="#features" className="text-xs font-bold uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-950">
                  Features
                </a>
                <a href="https://springvox.com" target="_blank" className="text-xs font-bold uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-950">
                  SpringVox
                </a>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
