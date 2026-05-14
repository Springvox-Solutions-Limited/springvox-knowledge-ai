export function PlatformPageHeader({
  title,
  subtitle,
  privacyNote = 'Tenant document contents and private chats are not shown in this console.',
}: {
  title: string;
  subtitle: string;
  privacyNote?: string;
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-slate-200 pb-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">SpringVox Platform</p>
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
        </div>
        <p className="max-w-md text-xs text-slate-500 lg:text-right">{privacyNote}</p>
      </div>
    </div>
  );
}
