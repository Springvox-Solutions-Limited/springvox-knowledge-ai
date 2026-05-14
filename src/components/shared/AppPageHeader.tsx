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
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="app-section-label">{eyebrow}</p>
          <h1 className="admin-hero-title">{title}</h1>
          <p className="admin-hero-copy">{subtitle}</p>
        </div>
        {aside ? <div className="shrink-0">{aside}</div> : null}
      </div>
    </div>
  );
}
