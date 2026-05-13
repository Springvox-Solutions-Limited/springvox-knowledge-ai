import Link from 'next/link';
import { SpringVoxLogo } from '@/src/components/brand/SpringVoxLogo';

export function LandingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-[#eef4f8]">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-6 lg:grid-cols-[1.1fr,0.9fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <SpringVoxLogo variant="full" theme="dark" imageClassName="h-10 sm:h-11" />
          </div>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
            A private AI knowledge assistant for approved documents, source-backed answers, and cleaner internal question answering.
          </p>
          <p className="mt-4 text-sm text-slate-500">
            Built as part of the SpringVox intelligent communications vision.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-700">Product</p>
            <div className="mt-4 grid gap-3">
              <Link href="/login" className="text-sm text-slate-700 transition hover:text-slate-950">
                Login
              </Link>
              <Link href="/register" className="text-sm text-slate-700 transition hover:text-slate-950">
                Register
              </Link>
              <Link href="/dashboard" className="text-sm text-slate-700 transition hover:text-slate-950">
                Dashboard
              </Link>
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-700">Explore</p>
            <div className="mt-4 grid gap-3">
              <a href="#how-it-works" className="text-sm text-slate-700 transition hover:text-slate-950">
                How it works
              </a>
              <a href="#features" className="text-sm text-slate-700 transition hover:text-slate-950">
                Features
              </a>
              <a href="#roadmap" className="text-sm text-slate-700 transition hover:text-slate-950">
                Roadmap
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
