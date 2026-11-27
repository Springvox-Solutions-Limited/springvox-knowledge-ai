"use client";

import { useState } from "react";

import { cn } from "@/src/lib/utils";
import { AskWorkspace, type AskScenario } from "./product-visuals";

const SCENARIOS: Array<{ id: AskScenario; label: string; detail: string }> = [
  { id: "people", label: "People", detail: "Parental leave" },
  { id: "support", label: "Support", detail: "Billing escalation" },
  { id: "legal", label: "Legal", detail: "Data request" },
];

export function HeroDemo() {
  const [active, setActive] = useState<AskScenario>("people");

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="font-meta text-[10px] text-[var(--ink-muted)]">Try a workspace question</p>
        <div role="tablist" aria-label="Sample workspace questions" className="flex items-center gap-1 rounded-[8px] border border-[var(--line)] bg-[var(--canvas)] p-0.5">
          {SCENARIOS.map((scenario) => (
            <button
              key={scenario.id}
              type="button"
              role="tab"
              aria-selected={active === scenario.id}
              onClick={() => setActive(scenario.id)}
              title={scenario.detail}
              className={cn(
                "h-7 rounded-[6px] px-2.5 text-[10px] font-medium transition-colors",
                active === scenario.id
                  ? "bg-[var(--accent-jade-50)] text-[var(--accent-jade-hover)]"
                  : "text-[var(--ink-muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)]",
              )}
            >
              {scenario.label}
            </button>
          ))}
        </div>
      </div>
      <div key={active} className="animate-in fade-in duration-200 motion-reduce:animate-none">
        <AskWorkspace scenario={active} />
      </div>
    </div>
  );
}
