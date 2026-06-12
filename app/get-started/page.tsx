import { Suspense } from "react";

import { SafePageContainer } from "@/src/components/layout/SafePageContainer";
import WorkspaceOnboardingForm from "@/src/components/WorkspaceOnboardingForm";

export default function GetStartedPage() {
  return (
    <div className="public-page-wrap">
      <SafePageContainer size="wide">
        <Suspense fallback={<div className="public-card w-full max-w-3xl p-8 text-center text-sm text-[var(--ink-muted)]">Loading workspace setup...</div>}>
          <WorkspaceOnboardingForm />
        </Suspense>
      </SafePageContainer>
    </div>
  );
}
