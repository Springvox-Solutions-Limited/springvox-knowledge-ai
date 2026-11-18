"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  BookOpen,
  Building2,
  ChevronDown,
  FileSearch,
  FolderTree,
  LifeBuoy,
  ListChecks,
  Menu,
  MessageSquare,
  Newspaper,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { BrandLogo } from "@/src/components/brand/BrandLogo";
import { cn } from "@/src/lib/utils";

type MenuItem = {
  label: string;
  href: string;
  description: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
};

type Menu = {
  label: string;
  href?: string;
  items?: MenuItem[];
  featured?: {
    eyebrow: string;
    title: string;
    copy: string;
    href: string;
    action: string;
  };
};

const MENUS: Menu[] = [
  {
    label: "Product",
    items: [
      {
        label: "Cited answers",
        href: "/product",
        description: "A reply assembled from your documents, with the page attached.",
        icon: MessageSquare,
      },
      {
        label: "Library and collections",
        href: "/product#ingestion",
        description: "Six formats, parsed once, grouped by department.",
        icon: FolderTree,
      },
      {
        label: "Knowledge gaps",
        href: "/product#quality",
        description: "See the questions the approved documents fail to answer.",
        icon: ListChecks,
      },
      {
        label: "Security model",
        href: "/security",
        description: "Workspace isolation, roles, and the admin boundary.",
        icon: ShieldCheck,
      },
    ],
    featured: {
      eyebrow: "The product moment",
      title: "One answer. One receipt.",
      copy: "Every sentence that depends on a document carries a numbered source.",
      href: "/product",
      action: "See the workspace",
    },
  },
  {
    label: "Solutions",
    items: [
      {
        label: "People and HR",
        href: "/solutions#people",
        description: "Onboarding, leave, and benefits without the repeat questions.",
        icon: Users,
      },
      {
        label: "Support",
        href: "/solutions#support",
        description: "Playbooks and escalation paths at the moment of the ticket.",
        icon: LifeBuoy,
      },
      {
        label: "Legal and compliance",
        href: "/solutions#legal",
        description: "Approved wording, with the policy section attached.",
        icon: ShieldCheck,
      },
      {
        label: "Operations",
        href: "/solutions#operations",
        description: "One procedure across every site and shift.",
        icon: FileSearch,
      },
    ],
    featured: {
      eyebrow: "Built for the asked",
      title: "One workspace, every team",
      copy: "Collections and permissions stay put. The questions change by department.",
      href: "/solutions",
      action: "Browse solutions",
    },
  },
  {
    label: "Company",
    items: [
      {
        label: "About",
        href: "/about",
        description: "Why we built a narrower assistant, and what we will not claim.",
        icon: Building2,
      },
      {
        label: "Blog",
        href: "/blog",
        description: "Notes on retrieval, citations, and running a knowledge base.",
        icon: Newspaper,
      },
      {
        label: "Contact",
        href: "/contact",
        description: "Talk to us about a rollout, a review, or a document set.",
        icon: ArrowUpRight,
      },
    ],
  },
  { label: "Pricing", href: "/pricing" },
  { label: "Docs", href: "/docs" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    };
    const onPointer = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };
    const onPopState = () => {
      setOpenMenu(null);
      setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  const scheduleClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpenMenu(null), 140);
  };

  const cancelClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
  };

  return (
    <header
      className={cn(
        "sticky top-0 border-b transition-colors duration-300",
        mobileOpen ? "z-[70]" : "z-50",
        scrolled
          ? "border-[var(--line)] bg-[color-mix(in_srgb,var(--canvas)_86%,transparent)] backdrop-blur-xl"
          : "border-transparent bg-[var(--canvas)]",
      )}
    >
      <div className="mk-shell flex h-[68px] items-center justify-between gap-6">
        <Link href="/" className="flex shrink-0 items-center" aria-label="Rekall-IQ home">
          <BrandLogo />
        </Link>

        <div
          ref={navRef}
          className="hidden items-center gap-0.5 lg:flex"
          onMouseLeave={scheduleClose}
        >
          {MENUS.map((menu) => {
            const active = menu.href
              ? isActive(pathname, menu.href)
              : menu.items?.some((item) => isActive(pathname, item.href.split("#")[0])) ?? false;

            if (!menu.items) {
              return (
                <Link
                  key={menu.label}
                  href={menu.href ?? "#"}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpenMenu(null)}
                  className={cn(
                    "rounded-[8px] px-3 py-2 text-[13px] font-medium transition-colors",
                    active
                      ? "text-[var(--ink)]"
                      : "text-[var(--ink-soft)] hover:bg-[var(--surface)] hover:text-[var(--ink)]",
                  )}
                >
                  {menu.label}
                </Link>
              );
            }

            const isOpen = openMenu === menu.label;
            return (
              <div
                key={menu.label}
                className="relative"
                onMouseEnter={() => {
                  cancelClose();
                  setOpenMenu(menu.label);
                }}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-haspopup="true"
                  onClick={() => setOpenMenu(isOpen ? null : menu.label)}
                  onFocus={() => setOpenMenu(menu.label)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-[8px] px-3 py-2 text-[13px] font-medium transition-colors",
                    isOpen || active
                      ? "text-[var(--ink)]"
                      : "text-[var(--ink-soft)] hover:bg-[var(--surface)] hover:text-[var(--ink)]",
                  )}
                >
                  {menu.label}
                  <ChevronDown
                    size={12}
                    strokeWidth={1.5}
                    aria-hidden="true"
                    className={cn(
                      "mt-px text-[var(--ink-muted)] transition-transform duration-200",
                      isOpen && "rotate-180",
                    )}
                  />
                </button>

                {isOpen ? (
                  <div
                    className={cn(
                      "absolute left-1/2 top-[calc(100%+10px)] w-[680px] -translate-x-1/2 overflow-hidden rounded-[16px] border border-[var(--line)] bg-[var(--surface)] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]",
                      menu.featured ? "grid grid-cols-[1fr_236px]" : "",
                    )}
                  >
                    <div className="grid gap-0.5 p-2.5">
                      {menu.items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpenMenu(null)}
                            className="group flex gap-3 rounded-[10px] p-3 transition-colors hover:bg-[var(--surface-2)]"
                          >
                            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border border-[var(--line)] bg-[var(--canvas)] text-[var(--ink-muted)] transition-colors group-hover:border-[var(--accent-jade-100)] group-hover:text-[var(--accent-jade)]">
                              <Icon size={14} strokeWidth={1.5} />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-[13px] font-medium text-[var(--ink)]">
                                {item.label}
                              </span>
                              <span className="mt-0.5 block text-[11px] leading-4 text-[var(--ink-muted)]">
                                {item.description}
                              </span>
                            </span>
                          </Link>
                        );
                      })}
                    </div>

                    {menu.featured ? (
                      <Link
                        href={menu.featured.href}
                        onClick={() => setOpenMenu(null)}
                        className="group flex flex-col justify-between border-l border-[var(--line)] bg-[var(--canvas)] p-5"
                      >
                        <div>
                          <p className="font-meta text-[9px] text-[var(--accent-jade)]">
                            {menu.featured.eyebrow}
                          </p>
                          <p className="mt-2 text-[15px] font-medium leading-5 tracking-[-0.02em] text-[var(--ink)]">
                            {menu.featured.title}
                          </p>
                          <p className="mt-2 text-[11px] leading-5 text-[var(--ink-muted)]">
                            {menu.featured.copy}
                          </p>
                        </div>
                        <span className="mt-6 inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--accent-jade)]">
                          {menu.featured.action}
                          <ArrowUpRight
                            size={12}
                            strokeWidth={1.5}
                            aria-hidden="true"
                            className="transition-transform duration-200 group-hover:translate-x-0.5"
                          />
                        </span>
                      </Link>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden rounded-[8px] px-3 py-2 text-[13px] font-medium text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)] lg:block"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="mk-button mk-button-primary !min-h-9 !rounded-[8px] !px-3.5 !py-2 !text-[13px]"
          >
            Start free
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            aria-expanded={mobileOpen}
            aria-controls="site-mobile-nav"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-[var(--line)] text-[var(--ink)] lg:hidden"
          >
            {mobileOpen ? <X size={17} strokeWidth={1.5} /> : <Menu size={17} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div
          id="site-mobile-nav"
          className="max-h-[calc(100dvh-68px)] overflow-y-auto border-t border-[var(--line)] bg-[var(--canvas)] lg:hidden"
        >
          <div className="mk-shell py-6">
            <div className="flex items-center gap-2 rounded-[10px] border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5">
              <BookOpen size={14} strokeWidth={1.5} className="text-[var(--accent-jade)]" aria-hidden="true" />
              <Link href="/docs" className="text-[13px] text-[var(--ink-soft)]">
                Documentation
              </Link>
              <span className="ml-auto font-meta text-[9px] text-[var(--ink-muted)]">Guides</span>
            </div>

            <nav aria-label="Mobile" className="mt-5">
              {MENUS.filter((menu) => menu.items).map((menu) => (
                <details key={menu.label} className="border-b border-[var(--line)] py-1">
                  <summary className="flex cursor-pointer list-none items-center justify-between py-3.5 text-[15px] font-medium text-[var(--ink)]">
                    {menu.label}
                    <ChevronDown size={15} strokeWidth={1.5} className="text-[var(--ink-muted)]" aria-hidden="true" />
                  </summary>
                  <div className="space-y-0.5 pb-3">
                    {menu.items?.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 rounded-[8px] px-2 py-2.5 text-[13px] text-[var(--ink-soft)] hover:bg-[var(--surface)] hover:text-[var(--ink)]"
                      >
                        <item.icon size={14} strokeWidth={1.5} className="text-[var(--ink-muted)]" />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </details>
              ))}

              {MENUS.filter((menu) => !menu.items).map((menu) => (
                <Link
                  key={menu.label}
                  href={menu.href ?? "#"}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between border-b border-[var(--line)] py-3.5 text-[15px] font-medium text-[var(--ink)]"
                >
                  {menu.label}
                  <ArrowUpRight size={15} strokeWidth={1.5} className="text-[var(--ink-muted)]" aria-hidden="true" />
                </Link>
              ))}
            </nav>

            <div className="mt-6 grid gap-2">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="mk-button mk-button-secondary w-full"
              >
                Log in
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                className="mk-button mk-button-primary w-full"
              >
                Start free
              </Link>
            </div>
            <p className="mt-4 text-center font-meta text-[10px] text-[var(--ink-muted)]">
              Free during beta · No credit card
            </p>
          </div>
        </div>
      ) : null}
    </header>
  );
}
