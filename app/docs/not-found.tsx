import Link from 'next/link';
import { BookOpen, CircleHelp } from 'lucide-react';

export default function DocsNotFound() {
  return (
    <div className="mx-auto max-w-[1200px] px-6 py-20 sm:px-8 sm:py-28">
      <p className="font-mono text-[11px] text-[var(--ink-muted)]">404</p>
      <h1 className="mt-3 text-[32px] font-semibold tracking-[-0.03em] text-[var(--ink)] sm:text-[40px]">
        That page is not in the docs
      </h1>
      <p className="mt-3 max-w-[58ch] text-[15px] leading-7 text-[var(--ink-soft)]">
        The link may be from an older guide. The quickstart and the FAQ cover
        most starting points, and search covers every guide and section.
      </p>
      <div className="mt-7 flex flex-wrap gap-3">
        <Link
          href="/docs"
          className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-[var(--accent-jade)] px-4 text-[13px] font-medium text-[#04100e] transition-colors hover:bg-[var(--accent-jade-hover)]"
        >
          <BookOpen size={15} strokeWidth={1.5} aria-hidden="true" />
          Docs home
        </Link>
        <Link
          href="/docs/troubleshooting/faq"
          className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-[var(--line)] px-4 text-[13px] text-[var(--ink)] transition-colors hover:bg-[var(--surface)]"
        >
          <CircleHelp size={15} strokeWidth={1.5} aria-hidden="true" />
          Troubleshooting
        </Link>
      </div>
    </div>
  );
}
