"use client";

import * as React from "react";
import { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { AppCard, AppCardContent } from "@/src/components/ui/app-card";

export function StatCard({
  label,
  value,
  icon: Icon,
  meta,
  className,
}: {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  meta?: React.ReactNode;
  className?: string;
}) {
  return (
    <AppCard className={cn(className)}>
      <AppCardContent className="flex items-start justify-between gap-3 px-4 py-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-medium text-[var(--ink-muted)]">
            {label}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-[22px] font-semibold tracking-tight tabular-nums text-[var(--ink)]">
              {value}
            </h3>
            {meta ? (
              <div className="truncate text-[11px] font-medium text-[var(--ink-muted)]">
                {meta}
              </div>
            ) : null}
          </div>
        </div>
        {Icon ? (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[var(--line)] bg-[var(--canvas-soft)] text-[var(--ink-muted)]">
            <Icon size={15} />
          </div>
        ) : null}
      </AppCardContent>
    </AppCard>
  );
}
