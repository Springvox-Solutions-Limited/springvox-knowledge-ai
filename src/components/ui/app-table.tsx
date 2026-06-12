"use client";

import * as React from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function AppTable({
  className,
  ...props
}: React.ComponentProps<typeof Table>) {
  return (
    <Table
      className={cn(
        "min-w-full text-left [&_th]:whitespace-nowrap [&_td]:whitespace-normal [&_td]:wrap-break-word",
        className,
      )}
      {...props}
    />
  );
}

export function AppTableHeader({
  className,
  ...props
}: React.ComponentProps<typeof TableHeader>) {
  return (
    <TableHeader
      className={cn("bg-[var(--canvas-soft)] [&_tr]:border-[var(--line)]", className)}
      {...props}
    />
  );
}

export function AppTableBody({
  className,
  ...props
}: React.ComponentProps<typeof TableBody>) {
  return (
    <TableBody
      className={cn("[&_tr]:border-[var(--line-soft)]", className)}
      {...props}
    />
  );
}

export function AppTableRow({
  className,
  ...props
}: React.ComponentProps<typeof TableRow>) {
  return (
    <TableRow className={cn("transition-colors hover:bg-[var(--canvas-soft)]", className)} {...props} />
  );
}

export function AppTableHead({
  className,
  ...props
}: React.ComponentProps<typeof TableHead>) {
  return (
    <TableHead
      className={cn(
        "px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--ink-muted)]",
        className,
      )}
      {...props}
    />
  );
}

export function AppTableCell({
  className,
  ...props
}: React.ComponentProps<typeof TableCell>) {
  return (
    <TableCell className={cn("px-5 py-3 align-middle text-[var(--ink)]", className)} {...props} />
  );
}
