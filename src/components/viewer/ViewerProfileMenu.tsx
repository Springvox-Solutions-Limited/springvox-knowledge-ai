"use client";

import Link from "next/link";
import { BookOpen, ChevronsUpDown, LogOut, UserRound } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ViewerProfileMenu({
  email,
  displayName,
  roleLabel,
  onLogout,
}: {
  email: string | null;
  displayName: string;
  roleLabel: string;
  onLogout: () => void;
}) {
  const initial = (displayName || email || "U").charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Account menu for ${displayName || email || "user"}`}
          className="flex w-full items-center gap-2.5 rounded-[6px] px-2 py-2 text-left transition-colors hover:bg-[var(--canvas-soft)]"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[5px] bg-[var(--surface-2)] text-[11px] font-medium text-[var(--ink)]">
            {initial}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[11.5px] font-medium text-[var(--ink)]">
              {displayName || email}
            </span>
            <span className="block truncate text-[10px] text-[var(--ink-muted)]">
              {roleLabel}
            </span>
          </span>
          <ChevronsUpDown size={13} className="shrink-0 text-[var(--ink-muted)]" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        side="top"
        sideOffset={8}
        className="min-w-[13rem] rounded-[10px] border-[var(--line)] bg-[var(--surface)] text-[var(--ink)]"
      >
        <DropdownMenuLabel className="px-2.5 py-2">
          <span className="block truncate text-[12px] font-medium text-[var(--ink)]">
            {email || displayName}
          </span>
          <span className="mt-0.5 block text-[10px] text-[var(--ink-muted)]">
            {roleLabel}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-[var(--line)]" />
        <DropdownMenuItem asChild className="gap-2.5 text-[12px] text-[var(--ink-soft)]">
          <Link href="/dashboard/account">
            <UserRound size={14} className="text-[var(--ink-muted)]" />
            Account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="gap-2.5 text-[12px] text-[var(--ink-soft)]">
          <Link href="/docs">
            <BookOpen size={14} className="text-[var(--ink-muted)]" />
            Documentation
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-[var(--line)]" />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => onLogout()}
          className="gap-2.5 text-[12px] text-red-300 focus:bg-red-500/10 focus:text-red-300"
        >
          <LogOut size={14} />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
