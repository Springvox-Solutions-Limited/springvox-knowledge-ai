import Link from 'next/link';
import { ArrowLeft, FileText, MessageSquare, ShieldCheck } from 'lucide-react';
import AuthForm from '@/src/components/AuthForm';
import { BrandLogo } from '@/src/components/brand/BrandLogo';

const highlights = [
  {
    icon: MessageSquare,
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
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r border-[var(--line)] bg-[var(--brand-sidebar)] p-12 text-white lg:flex">
        <div>
          <BrandLogo variant="full" theme="light" imageClassName="h-10" />
        </div>

        <div className="relative max-w-md space-y-8">
          <h1 className="max-w-md text-[32px] font-medium leading-[1.08] tracking-[-0.04em] text-[var(--ink)]">
            Your company knowledge,<br />answered instantly.
          </h1>
          <div className="space-y-5">
            {highlights.map((item) => (
              <div key={item.title} className="flex gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[var(--line)] text-[var(--ink-soft)]">
                  <item.icon size={18} />
                </div>
                <div>
                  <p className="text-[13px] font-medium text-[var(--ink)]">{item.title}</p>
                  <p className="mt-1 text-[12px] leading-5 text-[var(--ink-soft)]">{item.copy}</p>
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
          <AuthForm />
        </div>
      </div>
    </div>
  );
}
