"use client";

import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type SafePageContainerProps = HTMLAttributes<HTMLDivElement> & {
  size?: "default" | "narrow" | "wide";
};

const sizeClasses: Record<NonNullable<SafePageContainerProps["size"]>, string> = {
  default: "mx-auto w-full max-w-7xl",
  narrow: "mx-auto w-full max-w-3xl",
  wide: "mx-auto w-full max-w-screen-2xl",
};

export function SafePageContainer({
  className,
  size = "default",
  ...props
}: SafePageContainerProps) {
  return (
    <div
      className={cn(
        "min-w-0 max-w-full px-0",
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}
