import { Building2, GraduationCap, Headset, NotebookTabs, ScrollText, Settings2 } from 'lucide-react';

const useCases = [
  {
    icon: ScrollText,
    title: 'Company policy assistant',
    description: 'Help staff ask policy questions from approved HR or operations documents.',
  },
  {
    icon: Building2,
    title: 'Product and service knowledge base',
    description: 'Turn internal proposals, service decks, and product notes into a searchable assistant.',
  },
  {
    icon: Headset,
    title: 'Customer support internal assistant',
    description: 'Give teams a faster way to answer recurring questions from approved support materials.',
  },
  {
    icon: GraduationCap,
    title: 'Staff onboarding assistant',
    description: 'Let new team members ask questions about internal guides and training documents.',
  },
  {
    icon: NotebookTabs,
    title: 'School or admin document assistant',
    description: 'Use approved academic or administrative documents to answer everyday operational questions.',
  },
  {
    icon: Settings2,
    title: 'Operations and SOP assistant',
    description: 'Make standard operating procedures easier to reference without hunting through folders.',
  },
];

export function UseCasesSection() {
  return (
    <section id="use-cases" className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8 lg:py-24">
      <div className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8DA2C7]">Use cases</p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#F7FAFC] sm:text-4xl">
          Useful anywhere teams depend on approved documents and repeated questions.
        </h2>
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {useCases.map((useCase) => (
          <div
            key={useCase.title}
            className="rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(21,23,28,0.96),rgba(13,15,18,0.96))] p-6 shadow-[0_16px_40px_rgba(0,0,0,0.16)]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#FF6B00]/20 bg-[#FF6B00]/10">
              <useCase.icon className="h-5 w-5 text-[#FF6B00]" />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-[#F7FAFC]">{useCase.title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-300">{useCase.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
