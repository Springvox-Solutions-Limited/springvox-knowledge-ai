'use client';

import Link from 'next/link';
import { Menu } from 'lucide-react';
import { SpringVoxLogo } from '@/src/components/brand/SpringVoxLogo';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useState } from 'react';

export function LandingNavbar() {
  const [open, setOpen] = useState(false);
  const navLinks = [
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'Features', href: '/#features' },
    { label: 'Who It Is For', href: '/#use-cases' },
    { label: 'Blog', href: '/blog' },
  ];

  return (
    <nav className="fixed inset-x-0 top-0 z-50 overflow-x-clip border-b border-slate-200 bg-white/92 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-6 lg:px-8">
        <div className="flex min-w-0 items-center lg:justify-start">
          <Link href="/" className="flex h-10 min-w-0 items-center group sm:h-12">
            <SpringVoxLogo variant="full" theme="light" imageClassName="h-8 max-w-[150px] sm:h-10 sm:max-w-none md:h-11 transition-transform group-hover:scale-[1.02] block" />
          </Link>
        </div>

        <div className="hidden lg:flex items-center justify-center gap-8 xl:gap-10">
          {navLinks.map((item) => (
            <Link 
              key={item.label}
              href={item.href} 
              className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500 transition-colors hover:text-slate-950"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-3 sm:gap-6 md:gap-8 lg:justify-end">
          <button
            type="button"
            aria-label="Open navigation menu"
            onClick={() => setOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 lg:hidden"
          >
            <Menu size={18} />
          </button>
          <Link 
            href="/login" 
            className="hidden md:block text-xs font-bold uppercase tracking-[0.15em] text-slate-950 hover:text-slate-600 transition-colors"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="app-button-primary hidden px-4 py-2.5 text-[11px] uppercase tracking-[0.12em] sm:inline-flex sm:px-6 sm:py-3 sm:text-xs sm:tracking-[0.15em] md:px-8 md:py-3.5"
          >
            Create Workspace
          </Link>
        </div>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          aria-describedby={undefined}
          className="w-[min(100vw-1rem,22rem)] border-r border-slate-200 bg-white p-0"
        >
          <SheetHeader className="border-b border-slate-200 px-5 py-5">
            <SheetTitle className="text-left">
              <SpringVoxLogo
                variant="full"
                theme="light"
                imageClassName="h-9 w-auto max-w-[160px] object-contain object-left"
              />
            </SheetTitle>
          </SheetHeader>
          <div className="flex h-full min-w-0 flex-col px-5 py-5">
            <div className="space-y-2">
              {navLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="mt-6 space-y-3 border-t border-slate-200 pt-5">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="app-button-secondary flex w-full justify-center"
              >
                Login
              </Link>
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className="app-button-primary flex w-full justify-center text-center"
              >
                Create Workspace
              </Link>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
