"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AppButtonTone =
  | "primary"
  | "premium"
  | "secondary"
  | "subtle"
  | "ghost"
  | "destructive";

const toneClasses: Record<AppButtonTone, string> = {
  primary:
    "border-transparent bg-[#1E3A5F] text-white shadow-[0_12px_28px_rgba(30,58,95,0.15)] hover:bg-[#152a46] hover:shadow-[0_12px_32px_rgba(30,58,95,0.22)] active:scale-[0.98] transition-all duration-300 disabled:border-slate-200 disabled:bg-slate-200 disabled:text-slate-500",
  premium:
    "border-transparent bg-gradient-to-r from-[#1E3A5F] to-[#22d3ee] text-white shadow-[0_12px_28px_rgba(34,211,238,0.15)] hover:from-[#152a46] hover:to-[#06b6d4] hover:shadow-[0_12px_32px_rgba(34,211,238,0.25)] hover:ring-2 hover:ring-[#F97316]/50 active:scale-[0.98] transition-all duration-300 disabled:border-slate-200 disabled:bg-slate-200 disabled:text-slate-500",
  secondary:
    "border-slate-200 bg-white text-slate-700 hover:border-slate-350 hover:bg-slate-50 active:scale-[0.98] transition-all duration-300 disabled:bg-slate-100 disabled:text-slate-400",
  subtle:
    "border-cyan-200 bg-cyan-50/50 text-cyan-800 hover:border-cyan-300 hover:bg-cyan-100 active:scale-[0.98] transition-all duration-300 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400",
  ghost:
    "border-transparent bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-950 transition-all duration-300 disabled:text-slate-400",
  destructive:
    "border-red-200 bg-red-50/50 text-red-700 hover:border-red-300 hover:bg-red-100 transition-all duration-300 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400",
};

export function AppButton({
  tone = "primary",
  className,
  ...props
}: React.ComponentProps<typeof Button> & { tone?: AppButtonTone }) {
  return (
    <Button
      className={cn(
        "h-11 rounded-xl px-5 text-sm font-semibold active:scale-[0.98] transition-all duration-200",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
