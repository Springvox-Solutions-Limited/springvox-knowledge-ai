import Link from 'next/link';
import { SpringVoxLogo } from '@/src/components/brand/SpringVoxLogo';

export function LandingNavbar() {
  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-white/92 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-6 lg:gap-12">
          <Link href="/" className="flex h-10 min-w-0 items-center group sm:h-12">
            <SpringVoxLogo variant="full" theme="light" imageClassName="h-8 max-w-[150px] sm:h-10 sm:max-w-none md:h-11 transition-transform group-hover:scale-[1.02] block" />
          </Link>
          
          <div className="hidden lg:flex items-center gap-10">
            {[
              { label: 'How It Works', href: '#how-it-works' },
              { label: 'Features', href: '#features' },
              { label: 'Who It Is For', href: '#use-cases' }
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
            Login
          </Link>
          <Link
            href="/register"
            className="app-button-primary px-4 py-2.5 text-[11px] uppercase tracking-[0.12em] sm:px-6 sm:py-3 sm:text-xs sm:tracking-[0.15em] md:px-8 md:py-3.5"
          >
            Create Workspace
          </Link>
        </div>
      </div>
    </nav>
  );
}
