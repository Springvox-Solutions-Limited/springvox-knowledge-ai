import Link from 'next/link';

export function LandingFooter() {
  return (
    <footer className="border-t border-white/6 bg-[#090A0C]">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-6 lg:grid-cols-[1.1fr,0.9fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF7C1F] to-[#FF6B00] text-base font-black text-black shadow-[0_12px_40px_rgba(255,107,0,0.25)]">
              S
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-[#8DA2C7]">SpringVox</p>
              <p className="text-base font-semibold text-[#F7FAFC]">Knowledge AI</p>
            </div>
          </div>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400">
            A private AI knowledge assistant for approved documents, source-backed answers, and cleaner internal question answering.
          </p>
          <p className="mt-4 text-sm text-slate-500">
            Built as part of the SpringVox intelligent communications vision.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8DA2C7]">Product</p>
            <div className="mt-4 grid gap-3">
              <Link href="/login" className="text-sm text-slate-300 transition hover:text-white">
                Login
              </Link>
              <Link href="/register" className="text-sm text-slate-300 transition hover:text-white">
                Register
              </Link>
              <Link href="/dashboard" className="text-sm text-slate-300 transition hover:text-white">
                Dashboard
              </Link>
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8DA2C7]">Explore</p>
            <div className="mt-4 grid gap-3">
              <a href="#how-it-works" className="text-sm text-slate-300 transition hover:text-white">
                How it works
              </a>
              <a href="#features" className="text-sm text-slate-300 transition hover:text-white">
                Features
              </a>
              <a href="#roadmap" className="text-sm text-slate-300 transition hover:text-white">
                Roadmap
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
