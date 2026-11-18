"use client";

import type { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface-2)] px-5 py-10 text-center",
        className,
      )}
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)]">
        <Icon size={22} />
      </div>
      <p className="mt-4 text-sm font-semibold text-[var(--ink)]">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-xs text-[var(--ink-muted)]">{description}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
