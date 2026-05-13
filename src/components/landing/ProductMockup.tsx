import { CheckCircle2, CircleAlert, FileText, MessageSquareText, ShieldCheck, UserPlus2 } from 'lucide-react';

export function ProductMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[620px]">
      <div className="absolute inset-x-10 top-6 h-40 rounded-full bg-cyan-400/18 blur-[120px]" />
      <div className="relative overflow-hidden rounded-[30px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(240,249,255,0.94))] p-4 shadow-[0_30px_80px_rgba(15,23,42,0.18)] sm:p-5">
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-700">Shared workspace</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">Approved knowledge library</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Indexed
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.45fr,0.85fr]">
          <div className="rounded-[26px] border border-slate-200 bg-white p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-3 text-sm text-slate-500">
              <MessageSquareText className="h-4 w-4 text-cyan-600" />
              <span>Illustrative product view</span>
            </div>

            <div className="space-y-4">
              <div className="ml-auto max-w-[88%] rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-slate-900">
                What services are listed in the uploaded proposal?
              </div>

              <div className="max-w-[92%] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
                <p className="mb-3 text-[11px] uppercase tracking-[0.24em] text-cyan-700">Answer</p>
                <div className="space-y-3 text-sm leading-7 text-slate-700">
                  <p>
                    The proposal mentions the following service areas from the approved document context:
                  </p>
                  <div>
                    <p className="font-semibold text-slate-900">Services</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-600">
                      <li>Contact centre services</li>
                      <li>Telephony systems</li>
                      <li>Training and onboarding support</li>
                      <li>Integration support</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[24px] border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-cyan-600" />
                <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-700">Sources</p>
              </div>
              <div className="space-y-3">
                {['Products and Services.pdf — Chunk 2', 'Products and Services.pdf — Chunk 3'].map((source) => (
                  <div key={source} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                    <p className="text-sm font-medium text-slate-900">{source}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Preview: Contact centre solutions, telephony systems, training, and support services.
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-cyan-600" />
                <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-700">Admin workspace</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <span className="text-sm text-slate-800">Proposal.pdf</span>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                    Completed
                  </span>
                </div>
                <p className="text-xs leading-5 text-slate-500">
                  Admin-approved content is uploaded, indexed, and ready for source-backed answers.
                </p>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-900">
                    <UserPlus2 className="h-3.5 w-3.5 text-cyan-600" />
                    Invite link created for new staff
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-900">
                    <CircleAlert className="h-3.5 w-3.5 text-cyan-600" />
                    Knowledge gap captured for unanswered policy question
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
