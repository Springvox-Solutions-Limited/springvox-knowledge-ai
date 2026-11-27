export function PlatformPageHeader({
  title,
  subtitle,
  privacyNote,
  aside,
}: {
  title: string;
  subtitle: string;
  privacyNote?: string;
  aside?: React.ReactNode;
}) {
  return (
    <div className="border-b border-[var(--line)] pb-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-[24px] font-semibold tracking-[-0.03em] text-[var(--ink)] wrap-anywhere sm:text-[28px]">
            {title}
          </h1>
          <p className="mt-1 max-w-full text-[13px] leading-6 text-[var(--ink-soft)] wrap-anywhere">
            {subtitle}
          </p>
        </div>
        <div className="flex flex-col gap-2 lg:items-end">
          {aside}
          {privacyNote ? (
            <p className="max-w-xl wrap-anywhere text-[11px] leading-5 text-[var(--ink-muted)] lg:text-right">
              {privacyNote}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
