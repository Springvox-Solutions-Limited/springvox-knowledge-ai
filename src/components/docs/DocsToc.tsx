'use client';

import { useEffect, useState } from 'react';

import type { DocsSectionMeta } from '@/src/lib/docs';
import { cn } from '@/src/lib/utils';

export function DocsToc({ sections }: { sections: DocsSectionMeta[] }) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? '');

  useEffect(() => {
    if (sections.length === 0) return;

    const elements = sections
      .map((section) => document.getElementById(section.id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (elements.length === 0) return;

    const updateActive = () => {
      const current = [...elements]
        .reverse()
        .find((element) => element.getBoundingClientRect().top <= 144);

      setActiveId(current?.id ?? sections[0].id);
    };

    updateActive();

    const observer = new IntersectionObserver(updateActive, {
      rootMargin: '-96px 0px -60% 0px',
      threshold: [0, 1],
    });

    elements.forEach((element) => observer.observe(element));
    window.addEventListener('hashchange', updateActive);

    return () => {
      observer.disconnect();
      window.removeEventListener('hashchange', updateActive);
    };
  }, [sections]);

  return (
    <nav aria-label="On this page">
      <p className="text-[11px] text-[var(--ink-muted)]">On this page</p>
      <ul className="mt-3 border-l border-[var(--line)]">
        {sections.map((section) => {
          const active = activeId === section.id;
          return (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                aria-current={active ? 'location' : undefined}
                className={cn(
                  '-ml-px block border-l py-1.5 pl-3 text-[12px] leading-5 transition-colors',
                  active
                    ? 'border-[var(--accent-jade)] text-[var(--ink)]'
                    : 'border-transparent text-[var(--ink-muted)] hover:border-[var(--line)] hover:text-[var(--ink-soft)]',
                )}
              >
                {section.title}
              </a>
            </li>
          );
        })}
      </ul>
      <a
        href="#top"
        className="mt-4 inline-block pl-3 text-[11px] text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)]"
      >
        Back to top
      </a>
    </nav>
  );
}
