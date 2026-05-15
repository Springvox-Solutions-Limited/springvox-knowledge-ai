"use client";

import * as React from "react";
import { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-14 text-center",
        className,
      )}
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400">
        <Icon size={24} />
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-950">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">{description}</p>
    </div>
  );
}
