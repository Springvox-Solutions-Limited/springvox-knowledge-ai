import { Suspense } from "react";

import WorkspaceOnboardingForm from '@/src/components/WorkspaceOnboardingForm';

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_25%),linear-gradient(180deg,#e9f6fb_0%,#f3f7fb_100%)] px-4 py-8">
      <Suspense fallback={<div className="w-full max-w-3xl rounded-[28px] border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-[0_30px_80px_rgba(15,23,42,0.08)]">Loading workspace setup...</div>}>
        <WorkspaceOnboardingForm />
      </Suspense>
    </div>
  );
}
