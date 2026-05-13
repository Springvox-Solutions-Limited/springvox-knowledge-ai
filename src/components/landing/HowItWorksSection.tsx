export function HowItWorksSection() {
  const steps = [
    { title: 'Upload Documents', detail: 'Securely upload your PDFs and text files into your private workspace.' },
    { title: 'Smart Analysis', detail: 'Our AI reads and organizes your documents to understand their full context.' },
    { title: 'Instant Search', detail: 'Information is mapped out so your team can find any answer in seconds.' },
    { title: 'Ask & Receive', detail: 'Ask any question and get a reliable answer backed by your actual documents.' }
  ];

  return (
    <section id="how-it-works" className="bg-slate-50/50 py-24 lg:py-40 border-y border-slate-100">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid lg:grid-cols-[0.8fr,1.2fr] gap-20 items-center">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-6">Our Process</p>
            <h2 className="text-4xl font-black tracking-tighter text-slate-950 sm:text-6xl lg:leading-[1.1]">
              How SpringVox <br />
              <span className="text-slate-400">Works.</span>
            </h2>
            <p className="mt-8 text-xl leading-relaxed text-slate-500 font-medium">
              A simple, secure process to transform your company data 
              into a trustworthy knowledge base.
            </p>
          </div>

          <div className="relative space-y-12">
            {/* The Spine */}
            <div className="absolute left-6 top-2 bottom-2 w-px bg-slate-200" />
            
            {steps.map((step, index) => (
              <div key={step.title} className="relative pl-20 group">
                <div className="absolute left-0 top-0 flex h-12 w-12 items-center justify-center rounded-full bg-white border-2 border-slate-100 text-slate-950 font-black text-sm z-10 transition-all group-hover:bg-slate-950 group-hover:text-white group-hover:border-slate-950">
                  {index + 1}
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-950 tracking-tight">{step.title}</h3>
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
