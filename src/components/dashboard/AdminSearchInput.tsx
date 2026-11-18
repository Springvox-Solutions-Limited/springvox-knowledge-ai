"use client";

import type { ChangeEvent } from "react";

import { SearchBar } from "@/src/components/ui/search-bar";

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
    <SearchBar
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      inputClassName={inputClassName}
      label={placeholder}
    />
  );
}
