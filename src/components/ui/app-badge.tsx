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
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  info: "border-cyan-200 bg-cyan-50 text-cyan-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-red-200 bg-red-50 text-red-700",
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
