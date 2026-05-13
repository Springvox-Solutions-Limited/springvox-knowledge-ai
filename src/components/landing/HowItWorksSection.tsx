import { DatabaseZap, FileUp, FileText, MessageSquareDashed, ShieldCheck } from 'lucide-react';

const steps = [
  {
    icon: FileUp,
    title: 'Upload approved documents',
    description: 'Admins and content managers add PDF or TXT files that should power the shared knowledge workspace.',
  },
  {
    icon: FileText,
    title: 'Extract and prepare content',
    description: 'The system extracts text, prepares document chunks, and gets the content ready for retrieval.',
  },
  {
    icon: DatabaseZap,
    title: 'Index knowledge securely',
    description: 'The prepared content is stored for retrieval so questions can be answered from approved context.',
  },
  {
    icon: MessageSquareDashed,
    title: 'Ask questions in chat',
    description: 'Users ask questions in a simple chat interface without needing to browse multiple documents manually.',
  },
  {
    icon: ShieldCheck,
    title: 'Verify answers with sources',
    description: 'Responses are paired with sources so users can see where the answer came from in the document set.',
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="border-y border-slate-200 bg-[#f7fbfd]">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-700">How it works</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            A simple path from approved files to trusted answers.
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-600">
            SpringVox Knowledge AI currently supports PDF and TXT documents in a shared workspace model.
          </p>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-5">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="relative rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]"
            >
              <div className="mb-5 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-100 bg-cyan-50">
                  <step.icon className="h-5 w-5 text-cyan-700" />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-700">
                  Step {index + 1}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-slate-950">{step.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
