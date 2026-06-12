import Link from 'next/link';
import { Mail } from 'lucide-react';

import { BrandLogo } from '@/src/components/brand/BrandLogo';

const footerColumns = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '/#features' },
      { label: 'How It Works', href: '/#how-it-works' },
      { label: 'Use Cases', href: '/#use-cases' },
      { label: 'Blog', href: '/blog' },
      { label: 'Get Started', href: '/get-started' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Contact', href: 'mailto:hello@rekall-iq.com' },
      { label: 'Support', href: '/login' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'User Guide', href: '/help/user-guide' },
      { label: 'Admin Guide', href: '/help/admin-guide' },
      { label: 'Security Overview', href: '/security' },
      { label: 'Data Handling', href: '/data-handling' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Use', href: '/terms' },
      { label: 'Acceptable Use', href: '/acceptable-use' },
    ],
  },
];

const socialLinks = [
  { label: 'Email us', href: 'mailto:hello@rekall-iq.com', icon: Mail },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--brand-sidebar)] text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
          <div className="space-y-5">
            <BrandLogo
              variant="full"
              theme="light"
              imageClassName="h-9 w-auto max-w-[175px] object-contain object-left"
            />
            <div className="space-y-2.5">
              <h2 className="text-base font-semibold tracking-tight text-white">
                Rekall-IQ
              </h2>
              <p className="max-w-md text-sm leading-6 text-slate-300">
                An AI assistant that helps organisations turn approved documents
                into clear answers for their teams.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {socialLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  aria-label={item.label}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-teal-400/30 hover:bg-teal-400/10 hover:text-teal-100"
                >
                  <item.icon size={16} />
                </a>
              ))}
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--accent-jade)]">
                  {column.title}
                </p>
                <nav className="mt-3 grid gap-2.5">
                  {column.links.map((link) =>
                    link.href.startsWith('/') || link.href.startsWith('#') ? (
                      <Link
                        key={link.label}
                        href={link.href}
                        className="text-sm text-slate-300 transition hover:text-white"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        key={link.label}
                        href={link.href}
                        className="text-sm text-slate-300 transition hover:text-white"
                      >
                        {link.label}
                      </a>
                    ),
                  )}
                </nav>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-5">
          <p className="text-sm text-[var(--ink-muted)]">
            © 2026 Rekall-IQ. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
