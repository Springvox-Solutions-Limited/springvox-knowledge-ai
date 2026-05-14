import { LayoutDashboard, LibraryBig, MessageCircleMore, UploadCloud, UserRound } from 'lucide-react';

const roles = [
  {
    title: 'Company Admin',
    icon: LibraryBig,
    badge: 'Runs the workspace',
    items: [
      { icon: UploadCloud, label: 'Upload approved documents' },
      { icon: UserRound, label: 'Invite users' },
      { icon: LibraryBig, label: 'Manage users' },
      { icon: LayoutDashboard, label: 'Review analytics and unanswered questions' },
      { icon: MessageCircleMore, label: 'Test answers and review feedback' },
    ],
  },
  {
    title: 'Staff User',
    icon: MessageCircleMore,
    badge: 'Simple question-and-answer experience',
    items: [
      { icon: MessageCircleMore, label: 'Ask questions' },
      { icon: LayoutDashboard, label: 'Get simple answers' },
      { icon: LibraryBig, label: 'Open supporting sources' },
      { icon: UserRound, label: 'No admin complexity' },
    ],
  },
];

export function RoleSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <div className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-700">Roles</p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          One workspace, with a simple experience for every type of user.
        </h2>
      </div>

      <div className="mt-10 grid gap-4 sm:mt-12 sm:gap-6 lg:grid-cols-2">
        {roles.map((role) => (
          <div
            key={role.title}
            className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_20px_50px_rgba(15,23,42,0.06)] sm:rounded-[30px] sm:p-6"
          >
            <div className="flex items-start gap-3 sm:items-center sm:gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-100 bg-cyan-50 sm:h-14 sm:w-14">
                <role.icon className="h-6 w-6 text-cyan-700" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-950 sm:text-xl">{role.title}</h3>
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
