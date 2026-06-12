"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type AppBadgeTone =
  | "neutral"
  | "success"
  | "info"
  | "warning"
  | "danger";

const toneClasses: Record<AppBadgeTone, string> = {
  neutral: "border-[var(--line)] bg-[var(--surface-2)] text-[var(--ink-soft)]",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  info: "border-[var(--accent-jade-100)] bg-[var(--accent-jade-50)] text-[var(--accent-jade)]",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  danger: "border-red-500/30 bg-red-500/10 text-red-300",
};

export function AppBadge({
  tone = "neutral",
  className,
  ...props
}: React.ComponentProps<typeof Badge> & { tone?: AppBadgeTone }) {
  return (
    <Badge
      className={cn(
        "rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
