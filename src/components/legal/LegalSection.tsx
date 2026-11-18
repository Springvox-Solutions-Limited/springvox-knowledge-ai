import type { ReactNode } from 'react';

interface LegalSectionProps {
  id: string;
  title: string;
  children: ReactNode;
}

export function LegalSection({ id, title, children }: LegalSectionProps) {
  return (
    <section
      id={id}
      className="scroll-mt-24 border-b border-[var(--line)] py-8 last:border-0 last:pb-0"
    >
      <h2 className="mb-3 font-display text-[22px] leading-7 text-[var(--ink)]">
        {title}
      </h2>
      <div className="space-y-3 text-[14px] leading-7 text-[var(--ink-soft)] [&_a]:text-[var(--accent-jade)] [&_a]:underline [&_a]:underline-offset-4 [&_li]:ml-5 [&_li]:list-disc [&_strong]:font-medium [&_strong]:text-[var(--ink)]">
        {children}
      </div>
    </section>
  );
}
