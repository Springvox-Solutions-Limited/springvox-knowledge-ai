import { cn } from "@/src/lib/utils";

export function SkeletonLine({ className }: { className?: string }) {
  return (
    <div className={cn("h-4 animate-pulse rounded-lg bg-[var(--surface-2)]", className)} />
  );
}

export function SkeletonKpiGrid({ count = 4 }: { count?: number }) {
  return (
    <div className={cn("grid gap-4", count === 4 && "md:grid-cols-2 xl:grid-cols-4", count === 3 && "md:grid-cols-3")}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-2xl border border-[var(--line)] bg-[var(--surface-2)]" />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
      <div className="border-b border-[var(--line)] bg-[var(--surface-2)] px-6 py-3">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="h-3 w-20 animate-pulse rounded bg-[var(--surface-2)]" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-slate-50">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4">
            {Array.from({ length: cols }).map((_, j) => (
              <div
                key={j}
                className={cn(
                  "h-4 animate-pulse rounded-lg bg-[var(--surface-2)]",
                  j === 0 ? "flex-1" : "w-20 shrink-0",
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse space-y-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5", className)}>
      <div className="h-3 w-24 rounded-lg bg-[var(--surface-2)]" />
      <div className="h-5 w-40 rounded-lg bg-[var(--surface-2)]" />
      <div className="h-3 w-full rounded-lg bg-[var(--surface-2)]" />
      <div className="h-3 w-3/4 rounded-lg bg-[var(--surface-2)]" />
    </div>
  );
}
