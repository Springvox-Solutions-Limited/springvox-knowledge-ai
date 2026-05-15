"use client";

import { AppBadge } from "@/src/components/ui/app-badge";

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const value = status || "unknown";
  const label = value === "active"
    ? "Active"
    : value === "trial"
      ? "Trial"
      : value === "suspended"
        ? "Suspended"
        : value === "inactive"
          ? "Inactive"
          : value;

  if (value === "active") {
    return <AppBadge tone="success">{label}</AppBadge>;
  }

  if (value === "trial") {
    return <AppBadge tone="info">{label}</AppBadge>;
  }

  if (value === "suspended") {
    return <AppBadge tone="warning">{label}</AppBadge>;
  }

  if (value === "inactive") {
    return <AppBadge>{label}</AppBadge>;
  }

  return <AppBadge>{label}</AppBadge>;
}

export function PlanBadge({ plan }: { plan: string | null | undefined }) {
  const value = plan || "unknown";
  const label = value.charAt(0).toUpperCase() + value.slice(1);
  return <AppBadge>{label}</AppBadge>;
}
