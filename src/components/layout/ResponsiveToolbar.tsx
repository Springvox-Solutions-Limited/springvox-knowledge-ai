"use client";

import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function ResponsiveToolbar({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center",
        className,
      )}
      {...props}
    />
  );
}
