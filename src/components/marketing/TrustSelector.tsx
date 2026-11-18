"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { Check, ChevronRight } from "lucide-react";

import { cn } from "@/src/lib/utils";

export type TrustSelectorItem = {
  id: string;
  label: string;
  summary: string;
  title: string;
  points: string[];
  artifact: ReactNode;
};

/**
 * Four-row vertical tab selector for the trust page.
 *
 * The first panel is open in the server-rendered HTML, the row summaries are
 * always present, and every panel is rendered (inactive ones use `hidden`), so
 * the content does not depend on JavaScript to exist. With JavaScript, the
 * tablist follows the WAI-ARIA tabs pattern: roving tabindex, Arrow keys,
 * Home and End, and automatic activation.
 */
export function TrustSelector({
  items,
  className,
}: {
  items: TrustSelectorItem[];
  className?: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const baseId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const lastIndex = items.length - 1;

  if (items.length === 0) return null;

  const select = (index: number) => {
    const next = Math.min(Math.max(index, 0), lastIndex);
    setActiveIndex(next);
    tabRefs.current[next]?.focus();
  };

  const step = (index: number, delta: number) => {
    if (lastIndex < 0) return;
    const next = (index + delta + items.length) % items.length;
    select(next);
  };

  return (
    <div
      className={cn(
        "mk-panel grid overflow-hidden lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]",
        className,
      )}
    >
      <div
        role="tablist"
        aria-label="Security controls"
        aria-orientation="vertical"
        className="border-b border-[var(--line)] lg:border-b-0 lg:border-r"
      >
        {items.map((item, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={item.id}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${item.id}`}
              aria-selected={isActive}
              aria-controls={`${baseId}-panel-${item.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveIndex(index)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown" || event.key === "ArrowRight") {
                  event.preventDefault();
                  step(index, 1);
                } else if (
                  event.key === "ArrowUp" ||
                  event.key === "ArrowLeft"
                ) {
                  event.preventDefault();
                  step(index, -1);
                } else if (event.key === "Home") {
                  event.preventDefault();
                  select(0);
                } else if (event.key === "End") {
                  event.preventDefault();
                  select(lastIndex);
                }
              }}
              className={cn(
                "group relative flex w-full items-start gap-3 border-b border-[var(--line)] px-4 py-4 text-left transition-colors duration-200 last:border-b-0 focus-visible:outline-offset-[-2px] sm:px-5",
                isActive
                  ? "bg-[var(--canvas)]"
                  : "hover:bg-[var(--surface-2)]",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "absolute inset-y-0 left-0 w-px",
                  isActive ? "bg-[var(--accent-jade)]" : "bg-transparent",
                )}
              />
              <span
                aria-hidden="true"
                className={cn(
                  "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] border font-meta text-[10px] tabular-nums",
                  isActive
                    ? "border-[var(--accent-jade)] bg-[var(--accent-jade)] text-[#04100e]"
                    : "border-[var(--line)] text-[var(--ink-muted)]",
                )}
              >
                {String(index + 1).padStart(2, "0")}
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span
                    className={cn(
                      "text-[14px] font-medium",
                      isActive
                        ? "text-[var(--ink)]"
                        : "text-[var(--ink-soft)]",
                    )}
                  >
                    {item.label}
                  </span>
                  {isActive ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--accent-jade-100)] bg-[var(--accent-jade-50)] px-1.5 py-0.5 font-meta text-[8px] leading-3 text-[var(--accent-jade)]">
                      <Check size={8} strokeWidth={2.5} aria-hidden="true" />
                      Viewing
                    </span>
                  ) : null}
                </span>
                <span className="mt-1 block text-[11px] leading-5 text-[var(--ink-muted)]">
                  {item.summary}
                </span>
              </span>

              <ChevronRight
                size={14}
                strokeWidth={1.5}
                aria-hidden="true"
                className={cn(
                  "mt-1 shrink-0 transition-transform duration-200 motion-reduce:transition-none",
                  isActive
                    ? "rotate-90 text-[var(--accent-jade)]"
                    : "text-[var(--ink-muted)]",
                )}
              />
            </button>
          );
        })}
      </div>

      <div className="min-w-0 bg-[var(--canvas)] p-4 sm:p-6">
        {items.map((item, index) => {
          const isActive = index === activeIndex;
          return (
            <div
              key={item.id}
              id={`${baseId}-panel-${item.id}`}
              role="tabpanel"
              aria-labelledby={`${baseId}-tab-${item.id}`}
              tabIndex={0}
              hidden={!isActive}
            >
              <div className="motion-safe:[animation:mk-rise_0.3s_var(--mk-ease)_both]">
                <p className="mk-meta text-[var(--accent-jade)]">{item.label}</p>
                <h3 className="mt-2 text-[19px] font-medium leading-7 tracking-[-0.02em] text-[var(--ink)]">
                  {item.title}
                </h3>

                <ul className="mt-4 space-y-2.5">
                  {item.points.map((point) => (
                    <li
                      key={point}
                      className="flex gap-2.5 text-[12px] leading-6 text-[var(--ink-soft)] sm:text-[13px]"
                    >
                      <Check
                        size={13}
                        strokeWidth={2}
                        aria-hidden="true"
                        className="mt-1 shrink-0 text-[var(--accent-jade)]"
                      />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-5">{item.artifact}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
