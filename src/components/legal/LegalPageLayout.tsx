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
    <div className="min-h-screen bg-slate-50/50 selection:bg-slate-900 selection:text-white flex flex-col font-sans">
      <LandingNavbar />

      {/* Main Container */}
      <main className="flex-grow pt-24 pb-16 sm:pt-28 lg:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* Header section */}
          <div className="border-b border-slate-200 pb-8 mb-10">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-600 mb-2">
              Springvox Legal Hub & Trust Center
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 text-lg text-slate-600 max-w-3xl leading-relaxed">
              {description}
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs font-medium text-slate-400">
              <span>Last updated:</span>
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                {lastUpdated}
              </span>
            </div>
          </div>

          {/* Grid Content */}
          <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
            
            {/* Sidebar Navigation */}
            <aside className="lg:sticky lg:top-28 lg:h-fit">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 px-3 mb-3">
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
                            ? 'bg-slate-900 text-white shadow-sm shadow-slate-900/10'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <Icon size={16} className={isActive ? 'text-cyan-400' : 'text-slate-400'} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Legal disclaimer card */}
              <div className="mt-5 bg-cyan-50/50 border border-cyan-100/70 rounded-2xl p-4 text-xs leading-5 text-slate-600 shadow-sm">
                <p className="font-bold text-cyan-800 mb-1">Disclaimer</p>
                The information provided on these legal pages is for general informational purposes and does not constitute formal legal advice. Please consult with qualified legal counsel regarding your organisation&apos;s specific regulatory obligations.
              </div>
            </aside>

            {/* Document Body */}
            <article className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-sm max-w-4xl">
              {children}
            </article>

          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
