import { ArrowRight } from 'lucide-react';

export function ProblemSection() {
  return (
    <section id="problem" className="bg-white py-24 lg:py-40">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-4xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-8">The Industry Crisis</p>
          <h2 className="text-4xl font-black tracking-tighter text-slate-950 sm:text-6xl lg:text-7xl lg:leading-[0.95] mb-12">
            AI without Grounding is <br />
            <span className="text-slate-400 italic">Institutional Liability.</span>
          </h2>
          
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div className="space-y-6">
              <h2 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl leading-[1.1]">
                The SpringVox <br />
                <span className="text-slate-400">Advantage.</span>
              </h2>
              <p className="mt-8 text-xl leading-relaxed text-slate-500 font-medium">
                We eliminate the uncertainty of AI by grounding every answer 
                in your organization’s verified documentation.
              </p>
            </div>

            <div className="rounded-[40px] border-2 border-slate-950 bg-slate-950 p-10 !text-white shadow-2xl shadow-slate-950/20">
              <h3 className="text-2xl font-black tracking-tight mb-6 !text-white">The Difference</h3>
              <div className="space-y-6">
                {[
                   { label: 'GUESSWORK', value: 'ACCURACY', desc: 'Moving from AI guesses to source-backed facts.' },
                   { label: 'SCATTERED', value: 'CONNECTED', desc: 'Consolidating deep documentation into a single intelligent hub.' },
                   { label: 'HIDDEN', value: 'VERIFIABLE', desc: 'Every answer is tied to a verifiable document chunk.' }
                ].map((item) => (
                   <div key={item.label} className="space-y-2">
                     <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest">
                       <span className="text-slate-500 line-through">{item.label}</span>
                       <ArrowRight size={10} className="text-slate-400" />
                       <span className="!text-white">{item.value}</span>
                     </div>
                     <p className="text-xs text-slate-400 font-medium">{item.desc}</p>
                   </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
