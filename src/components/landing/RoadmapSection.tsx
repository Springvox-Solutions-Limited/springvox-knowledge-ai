import { CheckCircle2, Compass, ScanText, Sheet, Workflow } from 'lucide-react';

const currentItems = [
  'Upload PDF and TXT documents',
  'Ask questions from approved documents',
  'Admin and viewer roles',
  'Source-backed answers',
  'Shared workspace knowledge',
];

const roadmapItems = [
  'Better document parsing with OCR support',
  'Background processing for larger files',
  'DOCX and XLSX support',
  'More team and workspace management controls',
  'Knowledge analytics and admin insights',
  'Integrations with cloud drives and internal systems',
  'Optional deployment paths for specific organizations',
];

export function RoadmapSection() {
  return (
    <section id="roadmap" className="border-y border-white/6 bg-[#0D0F12]">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8DA2C7]">Built for today. Designed for what comes next.</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#F7FAFC] sm:text-4xl">
            Clear about what the MVP does now, and honest about what is still ahead.
          </h2>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[30px] border border-emerald-500/12 bg-[linear-gradient(180deg,rgba(18,34,25,0.28),rgba(13,15,18,0.96))] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
                <CheckCircle2 className="h-5 w-5 text-emerald-300" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300">Current MVP</p>
                <h3 className="mt-1 text-xl font-semibold text-[#F7FAFC]">Available today</h3>
              </div>
            </div>
            <div className="mt-6 grid gap-3">
              {currentItems.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
                  <span className="text-sm text-slate-200">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-[#FF6B00]/14 bg-[linear-gradient(180deg,rgba(255,107,0,0.08),rgba(13,15,18,0.96))] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#FF6B00]/20 bg-[#FF6B00]/10">
                <Compass className="h-5 w-5 text-[#FF6B00]" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#FFB27A]">Roadmap</p>
                <h3 className="mt-1 text-xl font-semibold text-[#F7FAFC]">Future direction</h3>
              </div>
            </div>
            <div className="mt-6 grid gap-3">
              {roadmapItems.map((item, index) => {
                const icons = [ScanText, Workflow, Sheet, Compass, Compass, Compass, Compass];
                const Icon = icons[index] || Compass;
                return (
                  <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                    <Icon className="h-4 w-4 shrink-0 text-[#FFB27A]" />
                    <span className="text-sm text-slate-200">{item}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
