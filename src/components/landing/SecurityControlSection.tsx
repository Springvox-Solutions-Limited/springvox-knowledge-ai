import { KeyRound, Lock, Shield, UserCog } from 'lucide-react';

const controls = [
  'Designed with role-based access',
  'Workspace-scoped data boundaries',
  'Admins control uploaded knowledge',
  'Users only see what their role allows',
  'Sensitive API keys remain server-side',
  'Source-backed answers reduce blind trust in AI',
];

export function SecurityControlSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8 lg:py-24">
      <div className="grid gap-10 lg:grid-cols-[0.92fr,1.08fr] lg:gap-16">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-700">Security and control</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Practical controls for a document-grounded assistant.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">
            SpringVox is built to keep knowledge curation in admin hands while giving everyday users a
            simpler way to ask questions. The focus is controlled access, server-side secrets, and source-backed answers.
          </p>
        </div>

        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <div className="grid gap-3">
            {controls.map((item, index) => {
              const icons = [Shield, UserCog, Lock, KeyRound, Shield];
              const Icon = icons[index] || Shield;
              return (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-100 bg-cyan-50">
                    <Icon className="h-[18px] w-[18px] text-cyan-700" />
                  </div>
                  <span className="text-sm text-slate-700">{item}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
