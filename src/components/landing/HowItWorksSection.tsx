export function HowItWorksSection() {
  const steps = [
    { title: 'Upload documents', detail: 'Add approved PDF or TXT files to your company workspace.' },
    { title: 'Invite your team', detail: 'Give staff access so they can ask questions from the shared document library.' },
    { title: 'Ask questions', detail: 'Team members ask in plain English and get clear answers based on uploaded documents.' },
    { title: 'Improve over time', detail: 'Review unanswered questions and add missing documents when your team needs more coverage.' }
  ];

  return (
    <section id="how-it-works" className="border-y border-slate-200 bg-white py-16 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[0.8fr,1.2fr] lg:gap-20">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-6">How it works</p>
            <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl lg:leading-[1.1]">
              A simple way to turn <br />
              <span className="text-cyan-700">documents into answers.</span>
            </h2>
            <p className="mt-5 text-base font-medium leading-relaxed text-slate-500 sm:mt-8 sm:text-xl">
              SpringVox keeps the process straightforward for non-technical teams:
              upload documents, invite staff, ask questions, and improve where answers are missing.
            </p>
          </div>

          <div className="relative space-y-8 sm:space-y-12">
            {/* The Spine */}
            <div className="absolute bottom-2 left-5 top-2 w-px bg-slate-200 sm:left-6" />
            
            {steps.map((step, index) => (
              <div key={step.title} className="group relative pl-16 sm:pl-20">
                <div className="absolute left-0 top-0 z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-100 bg-white text-sm font-black text-slate-950 transition-all group-hover:border-slate-950 group-hover:bg-slate-950 group-hover:text-white sm:h-12 sm:w-12">
                  {index + 1}
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black tracking-tight text-slate-950 sm:text-xl">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-500 font-medium max-w-md">
                    {step.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
