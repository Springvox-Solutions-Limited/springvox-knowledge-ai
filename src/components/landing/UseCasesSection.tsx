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
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-700">Use cases</p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          Useful anywhere teams depend on approved documents and repeated questions.
        </h2>
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {useCases.map((useCase) => (
          <div
            key={useCase.title}
            className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-100 bg-cyan-50">
              <useCase.icon className="h-5 w-5 text-cyan-700" />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-slate-950">{useCase.title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">{useCase.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
