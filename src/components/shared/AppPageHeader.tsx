export function AppPageHeader({
  eyebrow,
  title,
  subtitle,
  aside,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  aside?: React.ReactNode;
}) {
  return (
    <div className="admin-hero-card">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 space-y-2">
          {eyebrow ? <p className="app-section-label">{eyebrow}</p> : null}
          <h1 className="admin-hero-title">{title}</h1>
          <p className="admin-hero-copy max-w-full">{subtitle}</p>
        </div>
        {aside ? <div className="w-full shrink-0 lg:w-auto">{aside}</div> : null}
      </div>
    </div>
  );
}
