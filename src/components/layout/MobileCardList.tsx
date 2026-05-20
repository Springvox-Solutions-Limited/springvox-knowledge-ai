"use client";

import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function MobileCardList({
  className,
  hideAbove = "md",
  ...props
}: HTMLAttributes<HTMLDivElement> & { hideAbove?: "md" | "lg" }) {
  return (
    <div
      className={cn(
        "grid gap-4",
        hideAbove === "md" ? "md:hidden" : "lg:hidden",
        className,
      )}
      {...props}
    />
  );
}
