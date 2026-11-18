"use client";

import Link from "next/link";

export function ViewerBlocked({
  workspaceName,
  userStatusMessage,
  workspaceStatusMessage,
  trialExpired,
}: {
  workspaceName: string;
  userStatusMessage: string | null;
  workspaceStatusMessage: string | null;
  trialExpired: boolean;
}) {
  return (
    <div className="mx-auto w-full max-w-[760px] px-5 py-16 sm:px-8">
      <p className="text-[11px] text-[var(--ink-muted)]">Workspace access</p>
      <h1 className="mt-2 text-[28px] font-medium leading-9 tracking-[-0.03em] text-[var(--ink)]">
        {userStatusMessage
          ? "Your account is suspended."
          : trialExpired
            ? "The trial has ended."
            : `${workspaceName} is unavailable.`}
      </h1>
      <p className="mt-4 max-w-[54ch] text-[13px] leading-6 text-[var(--ink-soft)]">
        {userStatusMessage ||
          (trialExpired
            ? "Your 14-day trial has ended. Ask your workspace admin to upgrade before asking new questions."
            : workspaceStatusMessage ||
              "This workspace is not currently available. Ask your workspace admin for the next step.")}
      </p>
      <p className="mt-3 max-w-[54ch] text-[12px] leading-6 text-[var(--ink-muted)]">
        Your previous questions stay in the workspace. New questions and document access
        are paused until access is restored.
      </p>
      {trialExpired ? (
        <Link
          href="/billing-required"
          className="mt-6 inline-flex h-9 items-center rounded-[6px] bg-[var(--accent-jade)] px-3 text-[12px] font-medium text-[#04100e] hover:bg-[var(--accent-jade-hover)]"
        >
          View billing details
        </Link>
      ) : null}
    </div>
  );
}
