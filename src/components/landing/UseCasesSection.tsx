import { Building2, Scale, Microscope, Landmark } from 'lucide-react';

export function UseCasesSection() {
  const sectors = [
    { name: 'Finance & Banking', icon: Building2, tags: ['Wealth Management', 'Risk Audit'], desc: 'Manage complex financial regulations and banking policies with absolute accuracy.' },
    { name: 'Legal & Compliance', icon: Scale, tags: ['Case Analysis', 'Due Diligence'], desc: 'Unified search for legal precedents, technical specs, and compliance logs.' },
    { name: 'Healthcare & Science', icon: Microscope, tags: ['Medical Records', 'Protocols'], desc: 'Secure retrieval of clinical mandates, scientific research, and safety protocols.' },
    { name: 'Government', icon: Landmark, tags: ['Policy Documents', 'Public Service'], desc: 'Centralized intelligence for regulations, administrative procedures, and policy archives.' },
  ];

  return (
    <section id="sectors" className="bg-white py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center sm:mb-20">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-6">Expertise</p>
          <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Our <span className="text-slate-400">Industries.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base font-medium leading-relaxed text-slate-500 sm:mt-6 sm:text-xl">
            Our platform is built to handle the unique challenges of different sectors, 
            ensuring every department operates from the same verified context.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4 lg:gap-8">
          {sectors.map((sector) => (
            <div key={sector.name} className="group relative rounded-[28px] border border-slate-100 bg-slate-50/30 p-6 transition-all hover:border-slate-950 hover:bg-white hover:shadow-2xl hover:shadow-slate-100 sm:rounded-[32px] sm:p-8">
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
