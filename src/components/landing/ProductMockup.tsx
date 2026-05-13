import { CheckCircle2, CircleAlert, FileText, MessageSquareText, ShieldCheck, UserPlus2 } from 'lucide-react';

export function ProductMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[620px]">
      <div className="absolute inset-x-10 top-6 h-40 rounded-full bg-[#FF6B00]/18 blur-[120px]" />
      <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(21,23,28,0.96),rgba(12,13,16,0.96))] p-4 shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:p-5">
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#8DA2C7]">Shared workspace</p>
            <p className="mt-1 text-sm font-semibold text-[#F7FAFC]">Approved knowledge library</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/12 px-3 py-1 text-[11px] font-semibold text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Indexed
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.45fr,0.85fr]">
          <div className="rounded-[26px] border border-white/8 bg-[#0F1115] p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-3 text-sm text-slate-400">
              <MessageSquareText className="h-4 w-4 text-[#FF6B00]" />
              <span>Illustrative product view</span>
            </div>

            <div className="space-y-4">
              <div className="ml-auto max-w-[88%] rounded-2xl border border-[#FF6B00]/20 bg-[#FF6B00]/10 px-4 py-3 text-sm text-[#FFD9BF]">
                What services are listed in the uploaded proposal?
              </div>

              <div className="max-w-[92%] rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4 shadow-[0_8px_24px_rgba(0,0,0,0.2)]">
                <p className="mb-3 text-[11px] uppercase tracking-[0.24em] text-[#8DA2C7]">Answer</p>
                <div className="space-y-3 text-sm leading-7 text-slate-200">
                  <p>
                    The proposal mentions the following service areas from the approved document context:
                  </p>
                  <div>
                    <p className="font-semibold text-[#F7FAFC]">Services</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-300">
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
            <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
              <div className="mb-3 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#FF6B00]" />
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#8DA2C7]">Sources</p>
              </div>
              <div className="space-y-3">
                {['Products and Services.pdf — Chunk 2', 'Products and Services.pdf — Chunk 3'].map((source) => (
                  <div key={source} className="rounded-2xl border border-white/8 bg-[#0F1115] px-3 py-3">
                    <p className="text-sm font-medium text-[#F7FAFC]">{source}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      Preview: Contact centre solutions, telephony systems, training, and support services.
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
              <div className="mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#FF6B00]" />
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#8DA2C7]">Admin workspace</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-[#0F1115] px-3 py-3">
                  <span className="text-sm text-slate-200">Proposal.pdf</span>
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                    Completed
                  </span>
                </div>
                <p className="text-xs leading-5 text-slate-400">
                  Admin-approved content is uploaded, indexed, and ready for source-backed answers.
                </p>
                <div className="rounded-2xl border border-white/8 bg-[#0F1115] px-3 py-3">
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-[#F7FAFC]">
                    <UserPlus2 className="h-3.5 w-3.5 text-[#FF6B00]" />
                    Invite link created for new staff
                  </div>
                </div>
                <div className="rounded-2xl border border-white/8 bg-[#0F1115] px-3 py-3">
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-[#F7FAFC]">
                    <CircleAlert className="h-3.5 w-3.5 text-[#FF6B00]" />
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
