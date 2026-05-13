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
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#081322]/78 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <SpringVoxLogo variant="full" theme="light" imageClassName="h-9 md:h-10" />
          <span className="sr-only">SpringVox Knowledge AI</span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-slate-300 transition-colors hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden rounded-full border border-cyan-400/20 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-cyan-300/30 hover:bg-white/10 sm:inline-flex"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="inline-flex rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-[0_14px_32px_rgba(34,211,238,0.22)] transition hover:from-teal-400 hover:to-cyan-400"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
