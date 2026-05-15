"use client";

import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function AppCard({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <Card
      className={cn(
        "rounded-[24px] border-slate-200 bg-white shadow-[0_14px_28px_rgba(15,23,42,0.05)]",
        className,
      )}
      {...props}
    >
      {children}
    </Card>
  );
}

export function AppCardHeader({
  className,
  ...props
}: React.ComponentProps<typeof CardHeader>) {
  return <CardHeader className={cn("space-y-1 pb-4", className)} {...props} />;
}

export function AppCardTitle({
  className,
  ...props
}: React.ComponentProps<typeof CardTitle>) {
  return (
    <CardTitle
      className={cn("text-lg font-bold tracking-tight text-slate-950", className)}
      {...props}
    />
  );
}

export function AppCardContent({
  className,
  ...props
}: React.ComponentProps<typeof CardContent>) {
  return <CardContent className={cn(className)} {...props} />;
}
