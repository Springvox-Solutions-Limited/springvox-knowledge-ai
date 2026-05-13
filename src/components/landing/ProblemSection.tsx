import { AlertCircle, FileSearch, MessagesSquare, ShieldAlert } from 'lucide-react';

const problemCards = [
  {
    icon: FileSearch,
    title: 'Knowledge lives in scattered documents',
    description: 'Policies, manuals, proposals, SOPs, and internal guides are often hard to search when people need quick answers.',
  },
  {
    icon: MessagesSquare,
    title: 'Teams answer the same questions repeatedly',
    description: 'Support, operations, and internal teams lose time digging through files or routing basic questions back to subject-matter owners.',
  },
  {
    icon: ShieldAlert,
    title: 'Generic AI lacks your approved context',
    description: 'General tools can sound confident without understanding your specific products, rules, or internal language.',
  },
];

export function ProblemSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8 lg:py-24">
      <div className="grid gap-10 lg:grid-cols-[0.92fr,1.08fr] lg:gap-16">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8DA2C7]">The problem</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#F7FAFC] sm:text-4xl">
            Teams need answers they can trust, not just answers that sound good.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
            Company knowledge is often buried in approved documents, but everyday users still need a
            simple way to ask questions. Without a controlled layer, teams either waste time searching
            manually or rely on AI that may not know the right context.
          </p>
          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-300">
            <AlertCircle className="h-4 w-4 text-[#FF6B00]" />
            The goal is not more AI noise. The goal is trusted answers from approved information.
          </div>
        </div>

        <div className="grid gap-4">
          {problemCards.map((card) => (
            <div
              key={card.title}
              className="rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(21,23,28,0.94),rgba(15,17,21,0.94))] p-6 shadow-[0_16px_40px_rgba(0,0,0,0.18)]"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#FF6B00]/20 bg-[#FF6B00]/10">
                  <card.icon className="h-5 w-5 text-[#FF6B00]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#F7FAFC]">{card.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-300">{card.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
