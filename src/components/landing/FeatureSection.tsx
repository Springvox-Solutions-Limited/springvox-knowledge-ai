import { CircleAlert, Layers3, Settings2, ShieldCheck } from 'lucide-react';

export function FeatureSection() {
  const primaryFeatures = [
    { 
      title: 'Reliable AI Guardrails', 
      description: 'SpringVox ensures every AI response is strictly grounded in your approved documentation, eliminating guesswork in critical business paths.',
      icon: ShieldCheck,
      detail: 'Source-backed accuracy'
    },
    { 
      title: 'Smart Knowledge Integration', 
      description: 'Our system automatically connects your PDFs and text files into a unified, intelligent library that stays up to date.',
      icon: Layers3,
      detail: 'Easy document syncing'
    },
    { 
      title: 'Central Control Center', 
      description: 'Manage your organization’s knowledge, user permissions, and platform health from one intuitive dashboard.',
      icon: Settings2,
      detail: 'Complete oversight'
    },
    { 
      title: 'Smart Coverage Insights', 
      description: 'Identify exactly what information is missing from your documentation by tracking what users are asking in real-time.',
      icon: CircleAlert,
      detail: 'Knowledge gap tracking'
    }
  ];

  return (
    <section id="features" className="bg-white py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-24">
          <div className="lg:sticky lg:top-40">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-6">Solutions</p>
            <h2 className="text-3xl font-black tracking-tighter text-slate-950 sm:text-5xl lg:text-6xl lg:leading-[1.1]">
              Accuracy for Your <br />
              <span className="text-slate-400">Entire Team.</span>
            </h2>
            <p className="mt-5 text-base font-medium leading-relaxed text-slate-500 sm:mt-8 sm:text-xl">
              We provide the secure bridge between your company data and 
              the power of AI. No hallucinations, just reliable answers.
            </p>
            <div className="mt-8 space-y-4 sm:mt-12 sm:space-y-6">
              {['SOC2 Compliant Architecture', 'End-to-End Encryption', 'Source-Backed Verification'].map((trust) => (
                <div key={trust} className="flex items-center gap-4 text-sm font-bold text-slate-900">
                  <div className="h-1.5 w-1.5 rounded-full bg-slate-950" />
                  {trust}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {primaryFeatures.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-slate-950 hover:shadow-2xl hover:shadow-slate-100 sm:rounded-[32px] sm:p-8 lg:p-10"
              >
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-950 transition-colors group-hover:bg-slate-950 group-hover:text-white sm:mb-8 sm:h-14 sm:w-14">
                  <feature.icon size={24} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{feature.detail}</p>
                <h3 className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl">{feature.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-slate-500 font-medium">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
