export function PlatformPageHeader({
  title,
  subtitle,
  privacyNote = "Tenant document contents and private chats are not shown in this console.",
}: {
  title: string;
  subtitle: string;
  privacyNote?: string;
}) {
  return (
    <div className="border-b border-[var(--line)] pb-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--ink-muted)]">
        Rekall-IQ Platform
      </p>
      <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)] wrap-anywhere sm:text-3xl">
            {title}
          </h1>
          <p className="mt-1 max-w-full wrap-anywhere text-sm text-[var(--ink-soft)]">
            {subtitle}
          </p>
        </div>
        <p className="max-w-xl wrap-anywhere text-xs leading-6 text-[var(--ink-muted)] lg:text-right">
          {privacyNote}
        </p>
      </div>
    </div>
  );
}
