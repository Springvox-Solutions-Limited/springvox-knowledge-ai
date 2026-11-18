import Link from "next/link";
import { ArrowUpRight, Mail } from "lucide-react";

import { BrandLogo } from "@/src/components/brand/BrandLogo";
import { CookiePreferencesLink } from "@/src/components/consent/CookieConsent";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Product overview", href: "/product" },
      { label: "Pricing", href: "/pricing" },
      { label: "Security", href: "/security" },
      { label: "How it works", href: "/#workspace" },
    ],
  },
  {
    title: "Solutions",
    links: [
      { label: "People and HR", href: "/solutions#people" },
      { label: "Support", href: "/solutions#support" },
      { label: "Legal and compliance", href: "/solutions#legal" },
      { label: "Operations", href: "/solutions#operations" },
      { label: "Education", href: "/solutions#education" },
      { label: "Public sector", href: "/solutions#public-sector" },
    ],
  },
  {
    title: "Documentation",
    links: [
      { label: "Docs", href: "/docs" },
      { label: "Quick start", href: "/docs/getting-started/quickstart" },
      { label: "Admin guide", href: "/docs/admin/documents-and-uploads" },
      { label: "FAQ", href: "/docs/troubleshooting/faq" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
    ],
    sub: {
      title: "Legal",
      links: [
        { label: "Privacy", href: "/privacy" },
        { label: "Terms", href: "/terms" },
        { label: "Acceptable use", href: "/acceptable-use" },
        { label: "Data handling", href: "/data-handling" },
      ],
    },
  },
];

export function SiteFooter() {
  return (
    <footer className="relative border-t border-[var(--line)] bg-[var(--brand-sidebar)]">
      <div className="mk-shell py-14 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.35fr_2.65fr] lg:gap-16">
          <div>
            <BrandLogo />
            <p className="mt-4 max-w-[34ch] text-[12px] leading-5 text-[var(--ink-soft)]">
              Cited answers from the documents your company has approved. A reply that
              uses a document names the file and opens the cited page.
            </p>

            <a
              href="mailto:hello@springvoxsl.com"
              className="mt-6 flex w-fit items-center gap-2 font-meta text-[10px] text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)]"
            >
              <Mail size={12} strokeWidth={1.5} aria-hidden="true" />
              hello@springvoxsl.com
            </a>

            <Link
              href="/register"
              className="mk-button mk-button-primary mt-6 !min-h-10 !px-4 !text-[12px]"
            >
              Create a workspace
              <ArrowUpRight size={13} strokeWidth={1.5} aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-9 sm:grid-cols-4">
            {COLUMNS.map((column) => (
              <div key={column.title}>
                <p className="font-meta text-[9px] text-[var(--ink-muted)]">
                  {column.title}
                </p>
                <ul className="mt-3 space-y-2">
                  {column.links.map((link) => (
                    <li key={`${column.title}-${link.href}`}>
                      <Link
                        href={link.href}
                        className="text-[11px] leading-5 text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)]"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
                {column.sub ? (
                  <>
                    <p className="mt-5 font-meta text-[9px] text-[var(--ink-muted)]">
                      {column.sub.title}
                    </p>
                    <ul className="mt-3 space-y-2">
                      {column.sub.links.map((link) => (
                        <li key={`${column.sub.title}-${link.href}`}>
                          <Link
                            href={link.href}
                            className="text-[11px] leading-5 text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)]"
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-[var(--line)] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-meta text-[9px] text-[var(--ink-muted)]">
            © 2026 Rekall-IQ. Operated by SpringVox.
          </p>
          <CookiePreferencesLink className="text-[10px]" />
        </div>
      </div>
    </footer>
  );
}
