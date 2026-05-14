import { Suspense } from "react";

import WorkspaceOnboardingForm from "@/src/components/WorkspaceOnboardingForm";

export default function GetStartedPage() {
  return (
    <div className="public-page-wrap">
      <Suspense fallback={<div className="public-card w-full max-w-3xl p-8 text-center text-sm text-slate-500">Loading workspace setup...</div>}>
        <WorkspaceOnboardingForm />
      </Suspense>
    </div>
  );
}
