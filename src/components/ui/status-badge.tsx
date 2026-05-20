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
          : value === "ready"
            ? "Completed"
            : value === "processing"
              ? "Processing"
              : value === "failed"
                ? "Failed"
                : value;

  if (value === "active" || value === "ready") {
    return <AppBadge tone="success">{label}</AppBadge>;
  }

  if (value === "trial" || value === "processing") {
    return <AppBadge tone="info">{label}</AppBadge>;
  }

  if (value === "suspended" || value === "failed") {
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
