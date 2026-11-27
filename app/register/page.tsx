import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, ShieldCheck, Users } from "lucide-react";

import WorkspaceOnboardingForm from "@/src/components/WorkspaceOnboardingForm";
import { BrandLogo } from "@/src/components/brand/BrandLogo";

const highlights = [
  {
    icon: ShieldCheck,
    title: "You become the workspace admin",
    copy: "The account you create is the admin for your company workspace — you control documents, members, and access.",
  },
  {
    icon: FileText,
    title: "One shared knowledge base",
    copy: "Upload approved documents once; your team asks in plain English and gets answers with citations back to the source.",
  },
  {
    icon: Users,
    title: "Invite your team",
    copy: "Add staff, assign roles, and review analytics and answer quality from a single dashboard.",
  },
];

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen w-full bg-[var(--canvas)]">
      {/* Brand panel — matches /login */}
      <div className="relative hidden w-[42%] flex-col justify-between overflow-hidden border-r border-[var(--line)] bg-[var(--brand-sidebar)] p-12 text-white lg:flex lg:min-h-screen">
        <div>
          <BrandLogo variant="full" theme="light" imageClassName="h-9" />
        </div>

        <div className="max-w-md space-y-8">
          <h1 className="max-w-md text-[32px] font-medium leading-[1.08] tracking-[-0.04em] text-[var(--ink)]">
            Set up your company workspace.
          </h1>
          <div className="space-y-5">
            {highlights.map((item) => (
              <div key={item.title} className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[var(--line)] text-[var(--ink-soft)]">
                  <item.icon size={16} strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-[13px] font-medium text-[var(--ink)]">
                    {item.title}
                  </p>
                  <p className="mt-1 text-[12px] leading-5 text-[var(--ink-soft)]">
                    {item.copy}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-[var(--ink-muted)]">
          © 2026 Rekall-IQ
        </p>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-col px-5 py-8 sm:px-10 lg:w-[58%]">
        <div className="mx-auto flex w-full max-w-2xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)]"
          >
            <ArrowLeft size={14} />
            Back to home
          </Link>
        </div>
        <div className="flex flex-1 items-start justify-center py-8 sm:py-10">
          <Suspense
            fallback={
              <div className="w-full max-w-[560px] rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-8 text-center text-[12px] text-[var(--ink-muted)]">
                Loading workspace setup…
              </div>
            }
          >
            <WorkspaceOnboardingForm embedded />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
