import { CheckCircle2, CircleAlert, FileText, MessageSquareText, ShieldCheck, UserPlus2 } from 'lucide-react';

export function ProductMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[680px]">
      <div className="absolute inset-x-10 top-6 h-48 rounded-full bg-slate-200/50 blur-[120px]" />
      
      <div className="relative overflow-hidden rounded-[40px] border border-slate-200 bg-white p-2 shadow-[0_40px_100px_rgba(0,0,0,0.1)]">
        <div className="overflow-hidden rounded-[32px] border border-slate-100 bg-slate-50/30 p-4 sm:p-6">
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Secure Workspace</p>
              <p className="mt-1 text-sm font-black text-slate-950">Company Knowledge Hub</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-950 bg-slate-950 px-3 py-1 text-[10px] font-bold text-white uppercase tracking-tighter">
              <CheckCircle2 size={12} />
              VERIFIED
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.4fr,0.6fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <MessageSquareText size={14} className="text-slate-950" />
                AI Assistant
              </div>

              <div className="space-y-5">
                <div className="ml-auto max-w-[85%] rounded-2xl bg-slate-950 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-slate-950/10">
                  What are the primary requirements for our new policy?
                </div>

                <div className="max-w-[95%] rounded-2xl border border-slate-100 bg-slate-50 p-6">
                  <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Smart Response</p>
                  <div className="space-y-4 text-sm leading-relaxed text-slate-600 font-medium">
                    <p>Based on your Document Hub:</p>
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <p className="font-bold text-slate-950 mb-2">Section 7.2 Requirements</p>
                      <ul className="list-disc space-y-2 pl-4 text-slate-500">
                        <li>Full data encryption</li>
                        <li>Private document isolation</li>
                        <li>Regular security audits</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
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

              <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <FileText size={14} className="text-slate-950" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Activity Log</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    <span>SYNC_COMPLETE</span>
                    <span className="text-emerald-600">SUCCESS</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    <span>MISSING_INFO_FOUND</span>
                    <span className="text-red-500">NOTICE</span>
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
