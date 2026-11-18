import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Home, Search } from "lucide-react";

import { SiteShell } from "@/src/components/marketing/SiteShell";
import { ButtonLink } from "@/src/components/marketing/ui";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you were looking for does not exist.",
  robots: { index: false, follow: false },
};

const LINKS = [
  { label: "Documentation", href: "/docs", description: "Guides for setup, citations, admin, and security." },
  { label: "Product", href: "/product", description: "What the workspace does, and what it does not." },
  { label: "Pricing", href: "/pricing", description: "The free beta tier and quoted plans." },
  { label: "Contact", href: "/contact", description: "Talk to us about a rollout or a security review." },
];

export default function NotFound() {
  return (
    <SiteShell>
      <section className="relative isolate overflow-hidden border-b border-[var(--line)]">
        <div
          aria-hidden="true"
          className="mk-grid-bg mk-grid-fade pointer-events-none absolute inset-0 -z-10 opacity-50"
        />
        <div className="mk-shell py-20 sm:py-28">
          <p className="font-meta text-[11px] text-[var(--accent-jade)]">404</p>
          <h1 className="mk-h1 mt-4 max-w-[14ch] text-[var(--ink)]">
            This page is not in the library.
          </h1>
          <p className="mk-lede mt-6 max-w-[48ch]">
            The address may have changed, or the page may never have existed. The
            routes below cover most of what people come here for.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/" icon={<Home size={15} strokeWidth={1.5} />}>
              Back to home
            </ButtonLink>
            <ButtonLink href="/docs" variant="secondary" icon={<BookOpen size={15} strokeWidth={1.5} />}>
              Read the docs
            </ButtonLink>
          </div>

          <div className="mt-14 grid gap-px overflow-hidden rounded-[14px] border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex flex-col justify-between gap-6 bg-[var(--canvas)] p-5 transition-colors hover:bg-[var(--surface)]"
              >
                <div>
                  <p className="flex items-center justify-between gap-2 text-[13px] font-medium text-[var(--ink)]">
                    {link.label}
                    <ArrowUpRight
                      size={13}
                      strokeWidth={1.5}
                      className="text-[var(--ink-muted)] transition-colors group-hover:text-[var(--accent-jade)]"
                      aria-hidden="true"
                    />
                  </p>
                  <p className="mt-2 text-[11px] leading-5 text-[var(--ink-muted)]">
                    {link.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <p className="mt-8 flex items-center gap-2 font-meta text-[9px] text-[var(--ink-muted)]">
            <Search size={11} strokeWidth={1.5} aria-hidden="true" />
            Looking for a specific answer? The docs search covers every guide.
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
