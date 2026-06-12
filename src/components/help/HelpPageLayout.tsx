'use client';

import React from 'react';
import Link from 'next/link';
import { LandingNavbar } from '../landing/LandingNavbar';
import { LandingFooter } from '../landing/LandingFooter';
import { BookOpen, MessageSquare, Settings } from 'lucide-react';

interface HelpPageLayoutProps {
  title: string;
  description: string;
  activePath: string;
  children: React.ReactNode;
}

export function HelpPageLayout({
  title,
  description,
  activePath,
  children,
}: HelpPageLayoutProps) {
  const navItems = [
    { label: 'User Guide', href: '/help/user-guide', icon: MessageSquare },
    { label: 'Admin Guide', href: '/help/admin-guide', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[var(--surface-2)] selection:bg-[var(--accent-jade)] selection:text-[#04110e] flex flex-col font-sans">
      <LandingNavbar />

      <main className="flex-grow pt-24 pb-16 sm:pt-28 lg:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="border-b border-[var(--line)] pb-8 mb-10">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent-jade)] mb-2">
              Rekall-IQ Help Center
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--ink)] sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 text-lg text-[var(--ink-soft)] max-w-3xl leading-relaxed">
              {description}
            </p>
          </div>

          <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
            <aside className="lg:sticky lg:top-28 lg:h-fit">
              <div className="bg-[var(--surface)] rounded-2xl border border-[var(--line)] p-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--ink-muted)] px-3 mb-3">
                  Guides
                </p>
                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const isActive = activePath === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          isActive
                            ? 'bg-[var(--accent-jade-50)] text-[var(--accent-jade-hover)] ring-1 ring-inset ring-[var(--accent-jade-100)]'
                            : 'text-[var(--ink-soft)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]'
                        }`}
                      >
                        <Icon size={16} className={isActive ? 'text-teal-400' : 'text-[var(--ink-muted)]'} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="mt-5 bg-[var(--accent-jade-50)] border border-[var(--accent-jade-100)] rounded-2xl p-4 text-xs leading-5 text-[var(--ink-soft)] shadow-sm">
                <p className="font-bold text-[var(--accent-jade)] mb-1 inline-flex items-center gap-1.5">
                  <BookOpen size={13} /> Beta
                </p>
                Rekall-IQ is in active beta. Features and screens may change — if something looks off or a step doesn&apos;t match, let us know via the contact link in the footer.
              </div>
            </aside>

            <article className="bg-[var(--surface)] rounded-3xl border border-[var(--line)] p-6 sm:p-10 shadow-sm max-w-4xl">
              {children}
            </article>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
