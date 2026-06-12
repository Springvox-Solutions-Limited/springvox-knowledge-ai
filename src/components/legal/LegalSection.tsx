import React from 'react';

interface LegalSectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
}

export function LegalSection({ id, title, children }: LegalSectionProps) {
  return (
    <section id={id} className="scroll-mt-24 border-b border-[var(--line)] py-10 last:border-0 last:pb-0">
      <h2 className="text-xl font-bold tracking-tight text-[var(--ink)] sm:text-2xl mb-4">
        {title}
      </h2>
      <div className="text-sm leading-7 text-[var(--ink-soft)] space-y-4">
        {children}
      </div>
    </section>
  );
}
