import { CheckCircle2, FileText, MessageSquareText, ShieldCheck } from 'lucide-react';

export function ProductMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[680px]">
      <div className="absolute inset-x-4 top-4 h-40 rounded-full bg-slate-200/50 blur-[90px] sm:inset-x-10 sm:top-6 sm:h-48 sm:blur-[120px]" />
      
      <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-2 shadow-[0_40px_100px_rgba(0,0,0,0.1)] sm:rounded-[40px]">
        <div className="overflow-hidden rounded-[24px] border border-slate-100 bg-slate-50/30 p-3 sm:rounded-[32px] sm:p-6">
          <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Company workspace</p>
              <p className="mt-1 text-sm font-black text-slate-950">Approved document library</p>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-950 bg-slate-950 px-3 py-1 text-[10px] font-bold uppercase tracking-tighter text-white">
              <CheckCircle2 size={12} />
              Ready for your team
            </div>
          </div>

          <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.4fr,0.6fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-6 flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <MessageSquareText size={14} className="text-slate-950" />
                Staff assistant
              </div>

              <div className="space-y-5">
                <div className="ml-auto max-w-[92%] rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-slate-950/10 sm:max-w-[85%] sm:px-5">
                  What does our onboarding policy say new staff should complete in week one?
                </div>

                <div className="max-w-full rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:max-w-[95%] sm:p-6">
                  <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Answer</p>
                  <div className="space-y-4 text-sm leading-relaxed text-slate-600 font-medium">
                    <p>Here&apos;s what the uploaded handbook says:</p>
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <p className="font-bold text-slate-950 mb-2">Week one checklist</p>
                      <ul className="list-disc space-y-2 pl-4 text-slate-500">
                        <li>Complete orientation and policy review</li>
                        <li>Meet the assigned team lead</li>
                        <li>Finish required compliance training</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-4 flex items-center gap-2">
                  <ShieldCheck size={14} className="text-slate-950" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Sources</p>
                </div>
                <div className="space-y-3">
                  {['Security_Policy.pdf', 'Compliance_Guide.pdf'].map((source) => (
                    <div key={source} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                      <p className="text-[11px] font-bold text-slate-950">{source}</p>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                        <div className="h-full bg-slate-950 w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-4 flex items-center gap-2">
                  <FileText size={14} className="text-slate-950" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Recent activity</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    <span>HANDBOOK UPLOADED</span>
                    <span className="text-emerald-600">READY</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    <span>NEW STAFF QUESTION</span>
                    <span className="text-red-500">REVIEW</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
