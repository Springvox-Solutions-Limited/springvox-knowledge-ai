import Link from 'next/link';

const navItems = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#features', label: 'Features' },
  { href: '#use-cases', label: 'Use cases' },
  { href: '#roadmap', label: 'Roadmap' },
];

export function LandingNavbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/6 bg-[#0B0C0E]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF7C1F] to-[#FF6B00] text-base font-black text-black shadow-[0_12px_40px_rgba(255,107,0,0.25)]">
            S
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#8DA2C7]">SpringVox</p>
            <p className="text-base font-semibold text-[#F7FAFC]">Knowledge AI</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-slate-400 transition-colors hover:text-[#F7FAFC]"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:text-white sm:inline-flex"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="inline-flex rounded-full bg-[#FF6B00] px-4 py-2 text-sm font-semibold text-black shadow-[0_14px_40px_rgba(255,107,0,0.28)] transition hover:bg-[#FF7C1F]"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
