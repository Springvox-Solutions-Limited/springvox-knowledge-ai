"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { cn } from "@/src/lib/utils";

export type Faq = { q: string; a: string };

export function FaqList({ items }: { items: Faq[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="border-t border-[var(--line)]">
      {items.map((item, index) => {
        const isOpen = open === index;
        const id = `faq-${index}`;
        return (
          <div key={item.q} className="border-b border-[var(--line)]">
            <h3>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : index)}
                aria-expanded={isOpen}
                aria-controls={id}
                className="flex w-full items-start justify-between gap-6 py-5 text-left"
              >
                <span className="text-[16px] leading-6 text-[var(--ink)]">
                  {item.q}
                </span>
                <Plus
                  size={18}
                  strokeWidth={1.5}
                  aria-hidden="true"
                  className={cn(
                    "mt-0.5 shrink-0 text-[var(--ink-muted)] transition-transform duration-200",
                    isOpen && "rotate-45",
                  )}
                />
              </button>
            </h3>
            <div
              id={id}
              hidden={!isOpen}
              className="max-w-[68ch] pb-6 pr-8 text-[15px] leading-7 text-[var(--ink-soft)]"
            >
              {item.a}
            </div>
          </div>
        );
      })}
    </div>
  );
}
