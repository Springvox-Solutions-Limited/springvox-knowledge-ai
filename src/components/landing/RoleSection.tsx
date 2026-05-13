import { LayoutDashboard, LibraryBig, MessageCircleMore, UploadCloud, UserRound } from 'lucide-react';

const roles = [
  {
    title: 'Admin / Content Manager',
    icon: LibraryBig,
    badge: 'Manage the knowledge workspace',
    items: [
      { icon: UploadCloud, label: 'Upload approved documents' },
      { icon: UserRound, label: 'Invite users manually' },
      { icon: LibraryBig, label: 'Manage users and roles' },
      { icon: LayoutDashboard, label: 'Review analytics and knowledge gaps' },
      { icon: MessageCircleMore, label: 'Review feedback and test answers' },
    ],
  },
  {
    title: 'Viewer / End User',
    icon: MessageCircleMore,
    badge: 'Simple chat experience',
    items: [
      { icon: MessageCircleMore, label: 'Ask questions' },
      { icon: LayoutDashboard, label: 'Get simple answers' },
      { icon: LibraryBig, label: 'See sources' },
      { icon: UserRound, label: 'No admin complexity' },
    ],
  },
];

export function RoleSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8 lg:py-24">
      <div className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8DA2C7]">Role-based experience</p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#F7FAFC] sm:text-4xl">
          One shared knowledge workspace, tailored to the people using it.
        </h2>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        {roles.map((role) => (
          <div
            key={role.title}
            className="rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,rgba(21,23,28,0.96),rgba(13,15,18,0.96))] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.2)]"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#FF6B00]/20 bg-[#FF6B00]/10">
                <role.icon className="h-6 w-6 text-[#FF6B00]" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[#F7FAFC]">{role.title}</h3>
                <p className="mt-1 text-sm text-slate-400">{role.badge}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {role.items.map((item) => (
                <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                  <item.icon className="h-[18px] w-[18px] text-[#FF6B00]" />
                  <span className="text-sm text-slate-200">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
