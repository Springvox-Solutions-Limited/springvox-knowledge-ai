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
        "flex h-11 w-full min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 text-slate-900 shadow-sm transition focus-within:border-cyan-400 focus-within:ring-4 focus-within:ring-cyan-100",
        className,
      )}
    >
      <Search size={17} className="shrink-0 text-slate-400" />
      <Input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cn(
          "min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-slate-900 shadow-none ring-0 placeholder:text-slate-400 focus-visible:border-0 focus-visible:ring-0",
          inputClassName,
        )}
      />
    </label>
  );
}

