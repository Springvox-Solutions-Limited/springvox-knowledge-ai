'use client';

import Link from 'next/link';
import { Menu } from 'lucide-react';
import { BrandLogo } from '@/src/components/brand/BrandLogo';
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
    <nav className="fixed inset-x-0 top-0 z-50 overflow-x-clip border-b border-[var(--line)] bg-[var(--surface)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-6 lg:px-8">
        <div className="flex min-w-0 items-center lg:justify-start">
          <Link href="/" className="flex h-10 min-w-0 items-center group sm:h-12">
            <BrandLogo variant="full" theme="light" imageClassName="h-8 max-w-[150px] sm:h-10 sm:max-w-none md:h-11 transition-transform group-hover:scale-[1.02] block" />
          </Link>
        </div>

        <div className="hidden lg:flex items-center justify-center gap-8 xl:gap-10">
          {navLinks.map((item) => (
            <Link 
              key={item.label}
              href={item.href} 
              className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)]"
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
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink-soft)] transition hover:bg-[var(--surface-2)] lg:hidden"
          >
            <Menu size={18} />
          </button>
          <Link 
            href="/login" 
            className="hidden md:block text-xs font-bold uppercase tracking-[0.15em] text-[var(--ink)] hover:text-[var(--ink-soft)] transition-colors"
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
          className="w-[min(100vw-1rem,22rem)] border-r border-[var(--line)] bg-[var(--surface)] p-0"
        >
          <SheetHeader className="border-b border-[var(--line)] px-5 py-5">
            <SheetTitle className="text-left">
              <BrandLogo
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
                  className="flex rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3 text-sm font-semibold text-[var(--ink-soft)] transition hover:border-[var(--line)] hover:bg-[var(--surface)]"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="mt-6 space-y-3 border-t border-[var(--line)] pt-5">
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
