import Link from 'next/link';
import type { ReactNode } from 'react';

import { SiteShell } from '@/src/components/marketing/SiteShell';
import { PageHero } from '@/src/components/marketing/ui';
import { cn } from '@/src/lib/utils';

interface LegalPageLayoutProps {
  title: string;
  description: string;
  lastUpdated: string;
  activePath: string;
  children: ReactNode;
}

const NAV_ITEMS = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Security and data protection', href: '/security' },
  { label: 'Data Handling', href: '/data-handling' },
  { label: 'Acceptable Use Policy', href: '/acceptable-use' },
];

export function LegalPageLayout({
  title,
  description,
  lastUpdated,
  activePath,
  children,
}: LegalPageLayoutProps) {
  return (
    <SiteShell>
      <PageHero label="Legal and trust" title={title} intro={description} />

      <div className="mx-auto max-w-[1200px] px-6 py-12 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[220px_1fr]">
          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <nav aria-label="Legal documents" className="border-t border-[var(--line)]">
              {NAV_ITEMS.map((item) => {
                const active = activePath === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'block border-b border-[var(--line)] py-2.5 text-[13px] leading-5 transition-colors',
                      active
                        ? 'text-[var(--accent-jade)]'
                        : 'text-[var(--ink-soft)] hover:text-[var(--ink)]',
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <p className="mt-4 font-meta text-[11px] leading-4 text-[var(--ink-muted)]">
              Last updated: {lastUpdated}
            </p>
          </aside>

          <div className="max-w-[70ch]">{children}</div>
        </div>
      </div>
    </SiteShell>
  );
}
