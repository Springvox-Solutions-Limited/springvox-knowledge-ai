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
      <AppCardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          {Icon ? (
            <div className="rounded-lg border border-cyan-100 bg-cyan-50 p-2 text-cyan-800">
              <Icon size={16} />
            </div>
          ) : (
            <div />
          )}
          {meta ? (
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              {meta}
            </div>
          ) : null}
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          {label}
        </p>
        <h3 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-950">
          {value}
        </h3>
      </AppCardContent>
    </AppCard>
  );
}
