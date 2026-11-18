'use client';

import Link from 'next/link';
import { BookOpen, MessageSquare, Settings } from 'lucide-react';

import { SiteShell } from '@/src/components/marketing/SiteShell';
import { PageHero } from '@/src/components/marketing/ui';
import { cn } from '@/src/lib/utils';

interface HelpPageLayoutProps {
  title: string;
  description: string;
  activePath: string;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { label: 'User guide', href: '/help/user-guide', icon: MessageSquare },
  { label: 'Admin guide', href: '/help/admin-guide', icon: Settings },
];

export function HelpPageLayout({
  title,
  description,
  activePath,
  children,
}: HelpPageLayoutProps) {
  return (
    <SiteShell>
      <div>
        <PageHero label="Help centre" title={title} intro={description} />

        <div className="mx-auto max-w-[1200px] px-6 py-12 sm:px-8">
          <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
            <aside className="lg:sticky lg:top-24 lg:h-fit">
              <nav aria-label="Guides" className="border-t border-[var(--line)]">
                {NAV_ITEMS.map((item) => {
                  const isActive = activePath === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-3 border-b border-[var(--line)] py-2.5 text-[13px] transition-colors',
                        isActive
                          ? 'text-[var(--accent-jade)]'
                          : 'text-[var(--ink-soft)] hover:text-[var(--ink)]',
                      )}
                    >
                      <Icon size={16} strokeWidth={1.5} aria-hidden="true" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-5 rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-4 text-[12px] leading-5 text-[var(--ink-soft)]">
                <p className="mb-1 inline-flex items-center gap-1.5 font-medium text-[var(--accent-jade)]">
                  <BookOpen size={13} strokeWidth={1.5} aria-hidden="true" /> Beta
                </p>
                <span className="mt-1 block">
                  Rekall-IQ is in active beta. If a step no longer matches the product, tell
                  us through the contact page.
                </span>
              </div>
            </aside>

            <article className="max-w-[70ch]">{children}</article>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
