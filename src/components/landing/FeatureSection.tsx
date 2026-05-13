import {
  BookCheck,
  FileLock2,
  FolderCog,
  MessageSquareQuote,
  ShieldCheck,
  UsersRound,
  XCircle,
  FileType2,
} from 'lucide-react';

const features = [
  { icon: FileLock2, title: 'Private document upload', description: 'Upload approved PDF and TXT files into a controlled workspace.' },
  { icon: ShieldCheck, title: 'Admin-controlled knowledge base', description: 'Content stays curated by the people responsible for what should be searchable.' },
  { icon: UsersRound, title: 'Role-based access', description: 'Admins, content managers, and viewers each see only the experience they need.' },
  { icon: MessageSquareQuote, title: 'Clean chat-only viewer interface', description: 'End users ask questions without dealing with document management or technical setup.' },
  { icon: BookCheck, title: 'Source-backed AI responses', description: 'Answers include sources so users can verify what the assistant is relying on.' },
  { icon: XCircle, title: 'Strict “I don’t know” fallback', description: 'If the answer is not in the uploaded documents, the assistant says so clearly.' },
  { icon: FileType2, title: 'PDF/TXT support', description: 'The current MVP supports text-based PDF and TXT documents up to 4MB.' },
  { icon: FolderCog, title: 'Shared workspace knowledge', description: 'Uploaded documents serve a shared workspace so approved content can support multiple users.' },
];

export function FeatureSection() {
  return (
    <section id="features" className="border-y border-white/6 bg-[#0D0F12]">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8DA2C7]">Key features</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#F7FAFC] sm:text-4xl">
            Built for controlled knowledge access, not open-ended AI guesswork.
          </h2>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-[26px] border border-white/8 bg-white/[0.03] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.16)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#FF6B00]/20 bg-[#FF6B00]/10">
                <feature.icon className="h-5 w-5 text-[#FF6B00]" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-[#F7FAFC]">{feature.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
