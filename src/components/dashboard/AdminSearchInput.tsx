"use client";

import type { ChangeEvent } from "react";
import { Search } from "lucide-react";

import { cn } from "@/src/lib/utils";

type AdminSearchInputProps = {
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  className?: string;
  inputClassName?: string;
};

export function AdminSearchInput({
  value,
  onChange,
  placeholder,
  className,
  inputClassName,
}: AdminSearchInputProps) {
  return (
    <label
      className={cn(
        "flex h-12 w-full min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-slate-900 shadow-sm transition focus-within:border-cyan-400 focus-within:ring-4 focus-within:ring-cyan-100",
        className,
      )}
    >
      <div className="pointer-events-none flex h-5 w-5 shrink-0 items-center justify-center text-slate-400">
        <Search size={18} />
      </div>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cn(
          "min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-slate-900 outline-none placeholder:text-slate-400",
          inputClassName,
        )}
      />
    </label>
  );
}
