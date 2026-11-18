"use client";

import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type OverflowGuardProps = HTMLAttributes<HTMLDivElement> & {
  mode?: "clip" | "scroll";
};

export function OverflowGuard({
  className,
  mode = "clip",
  ...props
}: OverflowGuardProps) {
  return (
    <div
      className={cn(
        "min-w-0 max-w-full",
        mode === "clip"
          ? "overflow-hidden"
          : "overflow-x-auto overflow-y-hidden overscroll-x-contain",
        className,
      )}
      {...props}
    />
  );
}
