import Link from 'next/link';
import { Github, Globe, Linkedin, Mail, MessageCircle } from 'lucide-react';

import { SpringVoxLogo } from '@/src/components/brand/SpringVoxLogo';

const footerColumns = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'How It Works', href: '#how-it-works' },
      { label: 'Use Cases', href: '#use-cases' },
      { label: 'Pricing / Plans', href: '#' },
      { label: 'Get Started', href: '/get-started' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Contact', href: 'mailto:hello@springvox.ai' },
      { label: 'Pilot Program', href: '#' },
      { label: 'Roadmap', href: '#' },
      { label: 'Support', href: '/login' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: '#' },
      { label: 'Admin Guide', href: '#' },
      { label: 'User Guide', href: '#' },
      { label: 'Security Overview', href: '/security' },
      { label: 'FAQs', href: '#' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Use', href: '/terms' },
      { label: 'Data Handling', href: '/data-handling' },
      { label: 'Acceptable Use', href: '/acceptable-use' },
      { label: 'Cookie Policy', href: '#' },
    ],
  },
];

const socialLinks = [
  { label: 'Email', href: 'mailto:hello@springvox.ai', icon: Mail },
  { label: 'LinkedIn', href: '#', icon: Linkedin },
  { label: 'GitHub', href: '#', icon: Github },
  { label: 'Contact', href: '#', icon: MessageCircle },
  { label: 'Website', href: '#', icon: Globe },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#0d1f35] text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
          <div className="space-y-5">
            <SpringVoxLogo
              variant="full"
              theme="light"
              imageClassName="h-9 w-auto max-w-[175px] object-contain object-left"
            />
            <div className="space-y-2.5">
              <h2 className="text-base font-semibold tracking-tight text-white">
                SpringVox Knowledge AI
              </h2>
              <p className="max-w-md text-sm leading-6 text-slate-300">
                An AI assistant that helps organisations turn approved documents
                into clear answers for their teams.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {socialLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  aria-label={item.label}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-cyan-100"
                >
                  <item.icon size={16} />
                </a>
              ))}
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-200/80">
                  {column.title}
                </p>
                <nav className="mt-3 grid gap-2.5">
                  {column.links.map((link) =>
                    link.href.startsWith('/') || link.href.startsWith('#') ? (
                      <Link
                        key={link.label}
                        href={link.href}
                        className="text-sm text-slate-300 transition hover:text-white"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        key={link.label}
                        href={link.href}
                        className="text-sm text-slate-300 transition hover:text-white"
                      >
                        {link.label}
                      </a>
                    ),
                  )}
                </nav>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-400">
            © 2026 SpringVox Knowledge AI. All rights reserved.
          </p>
          <div className="inline-flex items-center gap-2 text-sm text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
