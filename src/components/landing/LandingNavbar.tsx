import Link from 'next/link';
import { SpringVoxLogo } from '@/src/components/brand/SpringVoxLogo';

const navItems = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#features', label: 'Features' },
  { href: '#use-cases', label: 'Use cases' },
  { href: '#roadmap', label: 'Roadmap' },
];

export function LandingNavbar() {
  return (
    <nav className="fixed inset-x-0 top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-6 lg:gap-12">
          <Link href="/" className="flex h-10 min-w-0 items-center group sm:h-12">
            <SpringVoxLogo variant="full" theme="light" imageClassName="h-8 max-w-[150px] sm:h-10 sm:max-w-none md:h-11 transition-transform group-hover:scale-[1.02] block" />
          </Link>
          
          <div className="hidden lg:flex items-center gap-10">
            {[
              { label: 'Solutions', href: '#capabilities' },
              { label: 'Process', href: '#pipeline' },
              { label: 'Industries', href: '#sectors' }
            ].map((item) => (
              <Link 
                key={item.label}
                href={item.href} 
                className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500 hover:text-slate-950 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3 sm:gap-6 md:gap-8">
          <Link 
            href="/login" 
            className="hidden md:block text-xs font-bold uppercase tracking-[0.15em] text-slate-950 hover:text-slate-600 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] !text-white shadow-2xl shadow-slate-950/20 transition-all hover:bg-slate-800 hover:scale-[1.05] active:scale-95 sm:px-6 sm:py-3 sm:text-xs sm:tracking-[0.15em] md:px-8 md:py-3.5"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
