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
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-700">Role-based experience</p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          One shared knowledge workspace, tailored to the people using it.
        </h2>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        {roles.map((role) => (
          <div
            key={role.title}
            className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)]"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-100 bg-cyan-50">
                <role.icon className="h-6 w-6 text-cyan-700" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-950">{role.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{role.badge}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {role.items.map((item) => (
                <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <item.icon className="h-[18px] w-[18px] text-cyan-700" />
                  <span className="text-sm text-slate-700">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
