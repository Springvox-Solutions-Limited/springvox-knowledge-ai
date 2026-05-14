import { ArrowRight } from 'lucide-react';

export function ProblemSection() {
  return (
    <section id="problem" className="bg-white py-16 sm:py-24 lg:py-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-8">The problem</p>
          <h2 className="mb-8 text-3xl font-bold tracking-tight text-slate-950 sm:mb-12 sm:text-5xl lg:text-6xl lg:leading-tight">
            Company answers should not depend <br />
            <span className="text-cyan-700">on guesswork.</span>
          </h2>
          
          <div className="grid items-start gap-8 md:grid-cols-2 md:gap-12">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold leading-[1.1] tracking-tight text-slate-950 sm:text-4xl">
                Keep your team aligned <br />
                <span className="text-slate-400">with approved information.</span>
              </h2>
              <p className="mt-4 text-base font-medium leading-relaxed text-slate-500 sm:mt-8 sm:text-xl">
                Documents get scattered, staff repeat the same questions, and new
                team members struggle to find the right file. SpringVox gives your
                organisation one simple place to ask and answer from approved documents.
              </p>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)] sm:rounded-[40px] sm:p-10">
              <h3 className="mb-6 text-2xl font-bold tracking-tight text-slate-950">What improves</h3>
              <div className="space-y-6">
                {[
                   { label: 'SCATTERED FILES', value: 'ONE LIBRARY', desc: 'Keep approved company documents in one workspace.' },
                   { label: 'REPEATED QUESTIONS', value: 'FASTER ANSWERS', desc: 'Staff can ask once and get a clear answer in seconds.' },
                   { label: 'UNCERTAIN ANSWERS', value: 'TRUSTED SOURCES', desc: 'Users can open the supporting document section when needed.' }
                ].map((item) => (
                   <div key={item.label} className="space-y-2">
                     <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest">
                       <span className="text-slate-400 line-through">{item.label}</span>
                       <ArrowRight size={10} className="text-cyan-600" />
                       <span className="text-slate-950">{item.value}</span>
                     </div>
                     <p className="text-xs font-medium text-slate-500">{item.desc}</p>
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
