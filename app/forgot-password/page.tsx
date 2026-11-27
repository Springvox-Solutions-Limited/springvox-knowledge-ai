"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Mail } from "lucide-react";

import { BrandLogo } from "@/src/components/brand/BrandLogo";
import { AppButton } from "@/src/components/ui/app-button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/src/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw resetError;
      setSent(true);
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Could not send the reset email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--canvas)] px-4 py-10 text-[var(--ink)]">
      <div className="w-full max-w-[420px]">
        <Link href="/login" className="inline-flex items-center gap-2 text-[12px] text-[var(--ink-muted)] hover:text-[var(--ink)]">
          <ArrowLeft size={14} />
          Back to sign in
        </Link>

        <div className="mt-8">
          <BrandLogo variant="full" theme="light" imageClassName="h-9 w-auto" />
          <h1 className="mt-8 text-[26px] font-medium tracking-[-0.03em] text-[var(--ink)]">Reset your password</h1>
          <p className="mt-2 text-[13px] leading-6 text-[var(--ink-muted)]">
            Enter the email address on your account. We will send a secure reset link.
          </p>
        </div>

        {sent ? (
          <div className="mt-7 rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-4">
            <p className="text-[13px] font-medium text-[var(--ink)]">Check your inbox</p>
            <p className="mt-1 text-[12px] leading-5 text-[var(--ink-soft)]">
              If an account exists for that address, a reset link is on its way. The link expires shortly.
            </p>
            <Link href="/login" className="mt-4 inline-flex text-[12px] font-medium text-[var(--accent-jade)] hover:text-[var(--accent-jade-hover)]">
              Return to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div>
              <label htmlFor="reset-email" className="mb-1.5 block text-[12px] font-medium text-[var(--ink-soft)]">Email</label>
              <div className="relative">
                <Mail size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]" />
                <Input
                  id="reset-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@company.com"
                  className="h-10 rounded-md border-[var(--line)] bg-[var(--surface)] pl-9 text-[13px]"
                />
              </div>
            </div>

            {error ? <p role="alert" className="text-[12px] text-red-300">{error}</p> : null}

            <AppButton type="submit" disabled={loading || !email.trim()} className="h-10 w-full text-[13px]">
              {loading ? <Loader2 size={15} className="animate-spin" /> : null}
              Send reset link
            </AppButton>
          </form>
        )}
      </div>
    </main>
  );
}
