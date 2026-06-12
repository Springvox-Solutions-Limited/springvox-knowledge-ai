import Link from 'next/link';
import { ArrowLeft, FileText, ShieldCheck, Sparkles } from 'lucide-react';
import AuthForm from '@/src/components/AuthForm';
import { BrandLogo } from '@/src/components/brand/BrandLogo';

const highlights = [
  {
    icon: Sparkles,
    title: 'Source-grounded answers',
    copy: 'Every reply is drawn from your approved company documents — with citations.',
  },
  {
    icon: ShieldCheck,
    title: 'Workspace isolation',
    copy: 'Each organisation works inside its own private, access-controlled space.',
  },
  {
    icon: FileText,
    title: 'Built for your team',
    copy: 'Upload once, then let staff ask in plain English. No training required.',
  },
];

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full bg-[var(--canvas)]">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-[var(--brand-sidebar)] p-12 text-white lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-90 [background:radial-gradient(circle_at_20%_15%,rgba(20,184,166,0.22),transparent_42%),radial-gradient(circle_at_85%_75%,rgba(13,148,136,0.16),transparent_45%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:48px_48px]"
        />
        <div className="relative">
          <BrandLogo variant="full" theme="light" imageClassName="h-10" />
        </div>

        <div className="relative max-w-md space-y-8">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight">
            Your company knowledge,<br />answered instantly.
          </h1>
          <div className="space-y-5">
            {highlights.map((item) => (
              <div key={item.title} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-teal-300">
                  <item.icon size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--ink-muted)]">{item.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-[var(--ink-muted)]">
          © 2026 Rekall-IQ
        </p>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-col px-5 py-8 sm:px-10 lg:w-1/2">
        <div className="mx-auto flex w-full max-w-sm">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)]"
          >
            <ArrowLeft size={14} />
            Back to home
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <AuthForm mode="login" />
        </div>
      </div>
    </div>
  );
}
