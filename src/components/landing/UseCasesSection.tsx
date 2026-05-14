import { Briefcase, Building2, GraduationCap, HeartPulse, Wrench, Users } from 'lucide-react';

export function UseCasesSection() {
  const sectors = [
    { name: 'HR and operations teams', icon: Users, tags: ['Policies', 'Handbooks'], desc: 'Help staff find answers from onboarding guides, policies, and internal procedures.' },
    { name: 'Engineering and service companies', icon: Wrench, tags: ['Services', 'SOPs'], desc: 'Keep technical procedures, service documents, and team instructions easy to ask from.' },
    { name: 'Schools and admin offices', icon: GraduationCap, tags: ['Admissions', 'Guidelines'], desc: 'Give staff one place to check school processes, rules, and administrative documents.' },
    { name: 'Healthcare and support teams', icon: HeartPulse, tags: ['Procedures', 'FAQs'], desc: 'Help teams find approved answers from operational guides, service notes, and internal documents.' },
    { name: 'Sales and customer teams', icon: Briefcase, tags: ['Services', 'Pricing'], desc: 'Make it easier to answer common customer and internal questions from approved materials.' },
    { name: 'Business and admin teams', icon: Building2, tags: ['Operations', 'Templates'], desc: 'Reduce repeated questions by giving the whole organisation a simple document assistant.' },
  ];

  return (
    <section id="use-cases" className="bg-white py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center sm:mb-20">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-6">Who it is for</p>
          <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Helpful across many <span className="text-cyan-700">types of organisations.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base font-medium leading-relaxed text-slate-500 sm:mt-6 sm:text-xl">
            SpringVox is designed for organisations that want staff to find
            answers from approved documents without needing a technical team to explain the system.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8">
          {sectors.map((sector) => (
            <div key={sector.name} className="group relative rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)] transition-all hover:border-cyan-200 sm:rounded-[32px] sm:p-8">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-sm border border-slate-100 group-hover:bg-slate-950 group-hover:text-white transition-colors">
                <sector.icon size={20} />
              </div>
              <h3 className="text-xl font-black text-slate-950 tracking-tight mb-4">{sector.name}</h3>
              <p className="text-sm leading-relaxed text-slate-500 font-medium mb-6">
                {sector.desc}
              </p>
              <div className="flex flex-wrap gap-2">
                {sector.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-slate-200 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
