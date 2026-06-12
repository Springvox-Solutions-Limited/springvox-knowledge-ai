import { KeyRound, Lock, Shield, UserCog } from 'lucide-react';

const controls = [
  'Designed with role-based access',
  'Each organisation uses its own workspace',
  'Admins control uploaded knowledge',
  'Users only see what their role allows',
  'Sensitive API keys remain server-side',
  'Answers come from approved documents when support is available',
];

export function SecurityControlSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <div className="grid gap-10 lg:grid-cols-[0.92fr,1.08fr] lg:gap-16">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--accent-jade)]">Trust and control</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--ink)] sm:text-4xl">
            Keep company knowledge useful, controlled, and easy to trust.
          </h2>
          <p className="mt-5 max-w-xl text-sm leading-7 text-[var(--ink-soft)] sm:text-base sm:leading-8">
            Rekall-IQ is built so company admins stay in control of what gets uploaded,
            while everyday staff get a much simpler way to ask questions and review sources.
          </p>
        </div>

        <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:rounded-[30px] sm:p-6">
          <div className="grid gap-3">
            {controls.map((item, index) => {
              const icons = [Shield, UserCog, Lock, KeyRound, Shield];
              const Icon = icons[index] || Shield;
              return (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--accent-jade-100)] bg-[var(--accent-jade-50)]">
                    <Icon className="h-[18px] w-[18px] text-[var(--accent-jade)]" />
                  </div>
                  <span className="text-sm text-[var(--ink-soft)]">{item}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
