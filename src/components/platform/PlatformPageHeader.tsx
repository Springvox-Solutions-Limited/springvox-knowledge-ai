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
    <div className="border-b border-slate-200 pb-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">
        SpringVox Platform
      </p>
      <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 break-words [overflow-wrap:anywhere] sm:text-3xl">
            {title}
          </h1>
          <p className="mt-1 max-w-full break-words text-sm text-slate-700 [overflow-wrap:anywhere]">
            {subtitle}
          </p>
        </div>
        <p className="max-w-xl break-words text-xs leading-6 text-slate-500 [overflow-wrap:anywhere] lg:text-right">
          {privacyNote}
        </p>
      </div>
    </div>
  );
}
