import {
  BookCheck,
  ChartNoAxesCombined,
  FileLock2,
  FolderCog,
  MessageSquareCode,
  MessageSquareQuote,
  ShieldCheck,
  UserPlus,
  UsersRound,
  XCircle,
  FileType2,
} from 'lucide-react';

const features = [
  { icon: FolderCog, title: 'Company workspace', description: 'Keep approved knowledge inside a shared workspace for one team or organization.' },
  { icon: FileLock2, title: 'Admin / manager uploads', description: 'Admins and content managers control which PDF and TXT documents become searchable.' },
  { icon: MessageSquareQuote, title: 'Viewer chat-only access', description: 'Staff get a clean assistant experience without dashboard or document-management complexity.' },
  { icon: MessageSquareCode, title: 'Streaming answers', description: 'Answers reveal progressively in chat for a more natural assistant experience.' },
  { icon: BookCheck, title: 'Verified sources', description: 'Responses include supporting sources so users can check where the answer came from.' },
  { icon: XCircle, title: 'Knowledge gap tracking', description: 'Unsupported questions are captured so admins can improve the document set over time.' },
  { icon: UsersRound, title: 'User role management', description: 'Control who can upload, manage users, or stay in viewer mode.' },
  { icon: UserPlus, title: 'Manual invite links', description: 'Invite workspace users by email with shareable links, even before email sending is added.' },
  { icon: ChartNoAxesCombined, title: 'Basic analytics', description: 'Review real workspace activity from documents, questions, feedback, and knowledge gaps.' },
  { icon: ShieldCheck, title: 'Feedback on answers', description: 'Users can mark helpful answers, outdated answers, or unsupported responses.' },
  { icon: FileType2, title: 'PDF/TXT support', description: 'The current MVP supports text-based PDF and TXT documents up to 4MB.' },
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
