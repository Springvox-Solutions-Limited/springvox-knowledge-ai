"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";

import { BrandLogo } from "@/src/components/brand/BrandLogo";
import { AppButton } from "@/src/components/ui/app-button";
import { supabase } from "@/src/lib/supabase";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email")?.trim() || "";
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function resend() {
    if (!email) {
      setError("Open the verification link from your signup email, or return to sign in.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: `${window.location.origin}/login?verified=1` },
      });
      if (resendError) throw resendError;
      setSent(true);
    } catch (resendError) {
      setError(resendError instanceof Error ? resendError.message : "Could not resend the verification email.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--canvas)] px-4 py-10 text-[var(--ink)]">
      <div className="w-full max-w-[440px]">
        <Link href="/login" className="inline-flex items-center gap-2 text-[12px] text-[var(--ink-muted)] hover:text-[var(--ink)]">
          <ArrowLeft size={14} />
          Back to sign in
        </Link>
        <div className="mt-8">
          <BrandLogo variant="full" theme="light" imageClassName="h-9 w-auto" />
          <h1 className="mt-8 text-[26px] font-medium tracking-[-0.03em] text-[var(--ink)]">Verify your email</h1>
          <p className="mt-2 text-[13px] leading-6 text-[var(--ink-soft)]">
            Your workspace is created. Verify {email || "your email address"} to activate your account, then sign in.
          </p>
        </div>

        <div className="mt-7 rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-4">
          <p className="text-[12px] leading-5 text-[var(--ink-soft)]">
            The verification link expires shortly. If it did not arrive, check spam or resend it.
          </p>
          {sent ? <p className="mt-2 text-[12px] text-emerald-300">Verification email sent.</p> : null}
          {error ? <p role="alert" className="mt-2 text-[12px] text-red-300">{error}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <AppButton type="button" tone="secondary" onClick={() => void resend()} disabled={sending} className="h-9 px-3 text-[12px]">
              {sending ? <Loader2 size={14} className="animate-spin" /> : null}
              Resend email
            </AppButton>
            <Link href="/login" className="inline-flex h-9 items-center rounded-md px-3 text-[12px] text-[var(--ink-muted)] hover:bg-[var(--canvas-soft)] hover:text-[var(--ink)]">
              I have verified
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[var(--canvas)] text-[12px] text-[var(--ink-muted)]">Loading…</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
