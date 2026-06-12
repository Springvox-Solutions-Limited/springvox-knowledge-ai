"use client";

import type { ChangeEvent } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/src/lib/utils";

export function SearchBar({
  value,
  onChange,
  placeholder,
  className,
  inputClassName,
  label = "Search",
}: {
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  className?: string;
  inputClassName?: string;
  label?: string;
}) {
  return (
    <label
      aria-label={label}
      className={cn(
        "flex h-11 w-full min-w-0 items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 text-[var(--ink)] shadow-sm transition focus-within:border-teal-400 focus-within:ring-4 focus-within:ring-[var(--accent-jade-100)]",
        className,
      )}
    >
      <Search size={17} className="shrink-0 text-[var(--ink-muted)]" />
      <Input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cn(
          "min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-[var(--ink)] shadow-none ring-0 placeholder:text-[var(--ink-muted)] focus-visible:border-0 focus-visible:ring-0",
          inputClassName,
        )}
      />
    </label>
  );
}

