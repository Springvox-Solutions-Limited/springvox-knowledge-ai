'use client';

import React from 'react';
import Link from 'next/link';
import { LandingNavbar } from '../landing/LandingNavbar';
import { LandingFooter } from '../landing/LandingFooter';
import { Shield, Scale, FileText, Lock, FileSpreadsheet } from 'lucide-react';

interface LegalPageLayoutProps {
  title: string;
  description: string;
  lastUpdated: string;
  activePath: string;
  children: React.ReactNode;
}

export function LegalPageLayout({
  title,
  description,
  lastUpdated,
  activePath,
  children,
}: LegalPageLayoutProps) {
  const navItems = [
    { label: 'Privacy Policy', href: '/privacy', icon: Shield },
    { label: 'Terms of Service', href: '/terms', icon: Scale },
    { label: 'Security & Data Protection', href: '/security', icon: Lock },
    { label: 'Data Handling', href: '/data-handling', icon: FileSpreadsheet },
    { label: 'Acceptable Use Policy', href: '/acceptable-use', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-[var(--surface-2)] selection:bg-[var(--accent-jade)] selection:text-[#04110e] flex flex-col font-sans">
      <LandingNavbar />

      {/* Main Container */}
      <main className="flex-grow pt-24 pb-16 sm:pt-28 lg:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* Header section */}
          <div className="border-b border-[var(--line)] pb-8 mb-10">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent-jade)] mb-2">
              Rekall-IQ Legal Hub & Trust Center
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--ink)] sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 text-lg text-[var(--ink-soft)] max-w-3xl leading-relaxed">
              {description}
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs font-medium text-[var(--ink-muted)]">
              <span>Last updated:</span>
              <span className="bg-[var(--surface-2)] text-[var(--ink-soft)] px-2 py-0.5 rounded-full font-semibold">
                {lastUpdated}
              </span>
            </div>
          </div>

          {/* Grid Content */}
          <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
            
            {/* Sidebar Navigation */}
            <aside className="lg:sticky lg:top-28 lg:h-fit">
              <div className="bg-[var(--surface)] rounded-2xl border border-[var(--line)] p-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--ink-muted)] px-3 mb-3">
                  Legal Documents
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

              {/* Legal disclaimer card */}
              <div className="mt-5 bg-[var(--accent-jade-50)] border border-[var(--accent-jade-100)] rounded-2xl p-4 text-xs leading-5 text-[var(--ink-soft)] shadow-sm">
                <p className="font-bold text-[var(--accent-jade)] mb-1">Disclaimer</p>
                The information provided on these legal pages is for general informational purposes and does not constitute formal legal advice. Please consult with qualified legal counsel regarding your organisation&apos;s specific regulatory obligations.
              </div>
            </aside>

            {/* Document Body */}
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
