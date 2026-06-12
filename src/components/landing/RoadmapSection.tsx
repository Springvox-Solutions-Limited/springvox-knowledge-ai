import { CheckCircle2, Compass, ScanText, Sheet, Workflow } from 'lucide-react';

const currentItems = [
  'Upload PDF and TXT documents',
  'Ask questions from approved documents',
  'Company admin and staff roles',
  'Answers with sources when available',
  'Shared company workspace',
];

const roadmapItems = [
  'Email invitations',
  'Subdomains for workspaces',
  'More file types',
  'Better scanned PDF support',
  'DOCX and XLSX support',
  'Background processing',
  'Voice features',
  'Billing',
];

export function RoadmapSection() {
  return (
    <section id="roadmap" className="border-y border-[var(--line)] bg-[var(--canvas-soft)]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--accent-jade)]">Now and next</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--ink)] sm:text-4xl">
            Clear about what is available today and what is still coming later.
          </h2>
        </div>

        <div className="mt-10 grid gap-4 sm:mt-12 sm:gap-6 lg:grid-cols-2">
          <div className="rounded-[28px] border border-emerald-500/30 bg-[var(--surface)] p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:rounded-[30px] sm:p-6">
            <div className="flex items-start gap-3 sm:items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
                <CheckCircle2 className="h-5 w-5 text-emerald-300" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300">Available now</p>
                <h3 className="mt-1 text-xl font-semibold text-[var(--ink)]">Available today</h3>
              </div>
            </div>
            <div className="mt-6 grid gap-3">
              {currentItems.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
                  <span className="text-sm text-[var(--ink-soft)]">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-[var(--accent-jade-100)] bg-[linear-gradient(180deg,#effcff,#ffffff)] p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:rounded-[30px] sm:p-6">
            <div className="flex items-start gap-3 sm:items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--accent-jade-100)] bg-[var(--accent-jade-50)]">
                <Compass className="h-5 w-5 text-[var(--accent-jade)]" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--accent-jade)]">Coming later</p>
                <h3 className="mt-1 text-xl font-semibold text-[var(--ink)]">Future direction</h3>
              </div>
            </div>
            <div className="mt-6 grid gap-3">
              {roadmapItems.map((item, index) => {
                const icons = [Compass, Compass, Workflow, ScanText, Sheet, Workflow, Compass, Compass];
                const Icon = icons[index] || Compass;
                return (
                  <div key={item} className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
                    <Icon className="h-4 w-4 shrink-0 text-[var(--accent-jade)]" />
                    <span className="text-sm text-[var(--ink-soft)]">{item}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
