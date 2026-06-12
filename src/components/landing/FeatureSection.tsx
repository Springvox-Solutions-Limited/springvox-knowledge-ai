import { CircleAlert, Layers3, Settings2, ShieldCheck } from 'lucide-react';

export function FeatureSection() {
  const primaryFeatures = [
    { 
      title: 'Company workspace', 
      description: 'Give each organisation its own document library, assistant message, and user access.',
      icon: ShieldCheck,
      detail: 'Approved information only'
    },
    { 
      title: 'Document library', 
      description: 'Upload PDFs and text files your team can ask questions from whenever they need help.',
      icon: Layers3,
      detail: 'Upload and manage files'
    },
    { 
      title: 'User and admin controls', 
      description: 'Company admins can invite users, manage roles, review activity, and keep the workspace organised.',
      icon: Settings2,
      detail: 'Clear admin tools'
    },
    { 
      title: 'Unanswered question tracking', 
      description: 'Spot questions your documents do not answer yet so you know what to upload or improve next.',
      icon: CircleAlert,
      detail: 'See what is missing'
    }
  ];

  return (
    <section id="features" className="bg-[var(--surface)] py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-24">
          <div className="lg:sticky lg:top-40">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--ink-muted)] mb-6">Features</p>
            <h2 className="text-3xl font-bold tracking-tight text-[var(--ink)] sm:text-4xl lg:text-5xl lg:leading-[1.1]">
              Built for everyday teams, <br />
              <span className="text-[var(--accent-jade)]">not just technical users.</span>
            </h2>
            <p className="mt-5 text-base font-medium leading-relaxed text-[var(--ink-muted)] sm:mt-8 sm:text-xl">
              Rekall-IQ helps people find company answers faster without digging
              through folders, asking around, or relying on inconsistent replies.
            </p>
            <div className="mt-8 rounded-[28px] border border-[#18304b] bg-[var(--accent-jade)] p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] sm:mt-12 sm:p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-teal-200/80">
                Why teams trust Rekall-IQ
              </p>
              <div className="mt-4 space-y-3">
                {['Admins choose what gets uploaded', 'Users stay inside their own organisation workspace', 'Answers can show document sources when available'].map((trust) => (
                  <div key={trust} className="flex items-start gap-3 text-sm font-medium text-slate-200">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-teal-300" />
                    <span>{trust}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {primaryFeatures.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)] transition-all hover:border-[var(--accent-jade-100)] hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)] sm:rounded-[32px] sm:p-8 lg:p-10"
              >
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] text-[var(--ink)] transition-colors group-hover:bg-slate-950 group-hover:text-white sm:mb-8 sm:h-14 sm:w-14">
                  <feature.icon size={24} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--ink-muted)] mb-2">{feature.detail}</p>
                <h3 className="text-xl font-black tracking-tight text-[var(--ink)] sm:text-2xl">{feature.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-[var(--ink-muted)] font-medium">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
