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
        "min-w-full text-left [&_th]:whitespace-nowrap [&_td]:whitespace-normal [&_td]:break-words",
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
      className={cn("bg-slate-50/70 [&_tr]:border-slate-200", className)}
      {...props}
    />
  );
}

export function AppTableBody({
  className,
  ...props
}: React.ComponentProps<typeof TableBody>) {
  return <TableBody className={cn("[&_tr]:border-slate-100", className)} {...props} />;
}

export function AppTableRow({
  className,
  ...props
}: React.ComponentProps<typeof TableRow>) {
  return <TableRow className={cn("hover:bg-slate-50/60", className)} {...props} />;
}

export function AppTableHead({
  className,
  ...props
}: React.ComponentProps<typeof TableHead>) {
  return (
    <TableHead
      className={cn(
        "px-5 py-4 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500",
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
  return <TableCell className={cn("px-5 py-4 align-middle", className)} {...props} />;
}
