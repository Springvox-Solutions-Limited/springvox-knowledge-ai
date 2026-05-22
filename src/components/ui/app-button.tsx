"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AppButtonTone =
  | "primary"
  | "secondary"
  | "subtle"
  | "ghost"
  | "destructive";

const toneClasses: Record<AppButtonTone, string> = {
  primary:
    "border-transparent bg-[#0d1f35] text-white shadow-[0_10px_24px_rgba(15,23,42,0.12)] hover:bg-[#132744] disabled:border-slate-200 disabled:bg-slate-200 disabled:text-slate-500",
  secondary:
    "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400",
  subtle:
    "border-cyan-200 bg-cyan-50 text-cyan-800 hover:border-cyan-300 hover:bg-cyan-100 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400",
  ghost:
    "border-transparent bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-950 disabled:text-slate-400",
  destructive:
    "border-red-200 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400",
};

export function AppButton({
  tone = "primary",
  className,
  ...props
}: React.ComponentProps<typeof Button> & { tone?: AppButtonTone }) {
  return (
    <Button
      className={cn(
        "h-11 rounded-xl px-4 text-sm font-semibold transition focus-visible:ring-4 focus-visible:ring-cyan-100 active:scale-[0.99]",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
