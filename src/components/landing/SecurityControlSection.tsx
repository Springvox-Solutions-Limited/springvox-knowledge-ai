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
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8DA2C7]">Security and control</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#F7FAFC] sm:text-4xl">
            Practical controls for a document-grounded assistant.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
            SpringVox is built to keep knowledge curation in admin hands while giving everyday users a
            simpler way to ask questions. The focus is controlled access, server-side secrets, and source-backed answers.
          </p>
        </div>

        <div className="rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,rgba(21,23,28,0.96),rgba(13,15,18,0.96))] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
          <div className="grid gap-3">
            {controls.map((item, index) => {
              const icons = [Shield, UserCog, Lock, KeyRound, Shield];
              const Icon = icons[index] || Shield;
              return (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#FF6B00]/20 bg-[#FF6B00]/10">
                    <Icon className="h-[18px] w-[18px] text-[#FF6B00]" />
                  </div>
                  <span className="text-sm text-slate-200">{item}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
