/**
 * One week of questions, drawn once. The current week carries the accent;
 * everything else is a neutral step. No glow, no gradient.
 */
export function CoverageLedger({ className }: { className?: string }) {
  const bars = [6, 9, 7, 12, 10, 14, 11];
  const max = Math.max(...bars);
  const width = 232;
  const height = 56;
  const gap = 8;
  const barWidth = (width - gap * (bars.length - 1)) / bars.length;

  return (
    <div data-ledger className={className}>
      <div className="flex items-baseline justify-between">
        <span className="font-meta text-[11px] text-[var(--ink-muted)]">
          Questions answered · illustrative preview
        </span>
        <span className="font-meta text-[11px] text-[var(--ink-muted)]">
          Last 7 days
        </span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mt-2 h-14 w-full" preserveAspectRatio="none"
        role="img"
        aria-label="Questions answered rose from 6 to 14 over seven days"
      >
        <line
          x1="0"
          y1="55.5"
          x2={width}
          y2="55.5"
          stroke="var(--line)"
          strokeWidth="1"
        />
        {bars.map((value, index) => {
          const h = Math.round((value / max) * 40);
          const x = index * (barWidth + gap);
          const active = index === bars.length - 1;
          return (
            <rect
              key={index}
              x={x}
              y={52 - h}
              width={barWidth}
              height={h}
              rx="1.5"
              fill={active ? "var(--accent-jade)" : "var(--ink)"}
              opacity={active ? 1 : 0.22}
            />
          );
        })}
      </svg>
      <div className="mt-1 flex justify-between font-meta text-[10px] text-[var(--ink-muted)]">
        <span>Mon</span>
        <span>Sun</span>
      </div>
    </div>
  );
}
