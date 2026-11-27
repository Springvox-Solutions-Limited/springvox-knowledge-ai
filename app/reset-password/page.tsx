"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";

import { BrandLogo } from "@/src/components/brand/BrandLogo";
import { AppButton } from "@/src/components/ui/app-button";
import { Input } from "@/components/ui/input";
import { validatePassword } from "@/src/lib/password-policy";
import { supabase } from "@/src/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      const { data } = await supabase.auth.getSession();
      if (!cancelled) {
        setReady(Boolean(data.session));
        setChecking(false);
      }
    }

    void checkSession();
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setSaving(true);
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      await supabase.auth.signOut();
      router.replace("/login?reset=1");
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Could not update your password.");
    } finally {
      setSaving(false);
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
          <h1 className="mt-8 text-[26px] font-medium tracking-[-0.03em] text-[var(--ink)]">Choose a new password</h1>
        </div>

        {checking ? (
          <div className="mt-7 flex items-center gap-2 text-[12px] text-[var(--ink-muted)]">
            <Loader2 size={14} className="animate-spin" /> Checking reset link…
          </div>
        ) : !ready ? (
          <div className="mt-7 rounded-[10px] border border-amber-500/30 bg-amber-500/10 p-4 text-[12px] leading-5 text-amber-200">
            This reset link is invalid or expired. Request a new one from{" "}
            <Link href="/forgot-password" className="font-medium underline">forgot password</Link>.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div>
              <label htmlFor="new-password" className="mb-1.5 block text-[12px] font-medium text-[var(--ink-soft)]">New password</label>
              <Input id="new-password" type="password" autoComplete="new-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="h-10 rounded-md border-[var(--line)] bg-[var(--surface)] text-[13px]" />
              <p className="mt-1 text-[10px] text-[var(--ink-muted)]">At least 10 characters with a letter and a number.</p>
            </div>
            <div>
              <label htmlFor="confirm-password" className="mb-1.5 block text-[12px] font-medium text-[var(--ink-soft)]">Confirm password</label>
              <Input id="confirm-password" type="password" autoComplete="new-password" required value={confirm} onChange={(event) => setConfirm(event.target.value)} className="h-10 rounded-md border-[var(--line)] bg-[var(--surface)] text-[13px]" />
            </div>
            {error ? <p role="alert" className="text-[12px] text-red-300">{error}</p> : null}
            <AppButton type="submit" disabled={saving} className="h-10 w-full text-[13px]">
              {saving ? <Loader2 size={15} className="animate-spin" /> : null}
              Update password
            </AppButton>
          </form>
        )}
      </div>
    </main>
  );
}
