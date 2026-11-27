"use client";
import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/src/lib/supabase";
import { useRouter } from "next/navigation";
import { Mail, Lock, Loader2, ArrowRight, Eye, EyeOff, KeyRound } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "@/src/components/brand/BrandLogo";
import { getDefaultRouteForRole } from "@/src/lib/workspace";
import { getCurrentUserProfile } from "@/src/lib/auth-client";
import { AppButton } from "@/src/components/ui/app-button";

export default function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaLoading, setMfaLoading] = useState(false);
  const router = useRouter();

  async function finishSignIn() {
    const profile = await getCurrentUserProfile();
    router.push(profile ? getDefaultRouteForRole(profile.role) : "/dashboard");
  }

  async function handleMfaSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!mfaFactorId || mfaCode.trim().length < 6) return;
    setMfaLoading(true);
    setError(null);
    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: mfaFactorId,
      });
      if (challengeError) throw challengeError;
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challenge.id,
        code: mfaCode.trim(),
      });
      if (verifyError) throw verifyError;
      await finishSignIn();
    } catch (mfaError) {
      setError(mfaError instanceof Error ? mfaError.message : "That code did not work.");
    } finally {
      setMfaLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (assurance?.nextLevel === "aal2" && assurance.currentLevel !== "aal2") {
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const factor = factors?.totp?.find((item) => item.status === "verified");
        if (factor) {
          setMfaFactorId(factor.id);
          setMfaRequired(true);
          return;
        }
      }

      await finishSignIn();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign in failed.";
      setError(
        msg === "Invalid login credentials"
          ? "Incorrect email or password."
          : /email not confirmed/i.test(msg)
            ? "Email not confirmed. Check your inbox, or resend the verification email."
            : "Sign in failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-sm min-w-0 space-y-7">
      <div className="space-y-2">
        <div className="mb-6 lg:hidden">
          <BrandLogo variant="full" theme="light" imageClassName="h-9" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-[var(--ink)]">
          Welcome back
        </h2>
        <p className="text-sm text-[var(--ink-muted)]">
          Sign in to your Rekall-IQ workspace.
        </p>
      </div>

      {mfaRequired ? (
        <form onSubmit={handleMfaSubmit} className="space-y-5">
          <div className="rounded-[10px] border border-[var(--line)] bg-[var(--surface)] p-4">
            <p className="flex items-center gap-2 text-[12px] font-medium text-[var(--ink)]">
              <KeyRound size={14} className="text-[var(--accent-jade)]" />
              Enter your authenticator code
            </p>
            <p className="mt-1 text-[11px] leading-5 text-[var(--ink-muted)]">
              Open your authenticator app and enter the current six-digit code.
            </p>
            <Input
              value={mfaCode}
              onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              aria-label="Six-digit authenticator code"
              className="mt-3 h-10 rounded-md border-[var(--line)] bg-[var(--canvas)] text-[14px] tracking-[0.25em]"
            />
          </div>
          {error ? (
            <Alert className="rounded-md border-red-500/30 bg-red-500/10 text-red-300">
              <AlertDescription className="text-[12px] font-medium">{error}</AlertDescription>
            </Alert>
          ) : null}
          <AppButton disabled={mfaLoading || mfaCode.length < 6} className="h-10 w-full text-[13px]">
            {mfaLoading ? <Loader2 className="animate-spin" size={16} /> : null}
            Verify and continue
          </AppButton>
          <button
            type="button"
            onClick={async () => {
              await supabase.auth.signOut();
              setMfaRequired(false);
              setMfaCode("");
              setError(null);
            }}
            className="w-full text-[11px] text-[var(--ink-muted)] hover:text-[var(--ink)]"
          >
            Use a different account
          </button>
        </form>
      ) : (
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="login-email" className="mb-1.5 block text-[12px] font-medium text-[var(--ink-soft)]">
            Email
          </label>
          <div className="relative group">
            <Mail
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] transition-colors group-focus-within:text-[var(--accent-jade)]"
            />
            <Input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              className="h-10 rounded-md border-[var(--line)] bg-[var(--surface)] py-2 pl-9 pr-3 text-[13px] text-[var(--ink)] focus-visible:border-[var(--accent-jade)] focus-visible:ring-2 focus-visible:ring-[var(--accent-jade-100)]"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="login-password" className="mb-1.5 block text-[12px] font-medium text-[var(--ink-soft)]">
            Password
          </label>
          <div className="relative group">
            <Lock
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] transition-colors group-focus-within:text-[var(--accent-jade)]"
            />
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              className="h-10 rounded-md border-[var(--line)] bg-[var(--surface)] py-2 pl-9 pr-10 text-[13px] text-[var(--ink)] focus-visible:border-[var(--accent-jade)] focus-visible:ring-2 focus-visible:ring-[var(--accent-jade-100)]"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)]"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-[11px] text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)]"
          >
            Forgot password?
          </Link>
        </div>

        {error && (
          <div className="space-y-1.5">
            <Alert className="rounded-md border-red-500/30 bg-red-500/10 text-red-300">
              <AlertDescription className="text-[12px] font-medium">{error}</AlertDescription>
            </Alert>
            {error.startsWith("Email not confirmed") ? (
              <Link
                href={`/verify-email?email=${encodeURIComponent(email)}`}
                className="block text-[11px] text-[var(--ink-muted)] underline decoration-[var(--line)] underline-offset-4 hover:text-[var(--ink)]"
              >
                Resend verification email
              </Link>
            ) : null}
          </div>
        )}

        <AppButton disabled={loading} className="mt-2 flex h-10 w-full items-center justify-center gap-2 text-[13px]">
          {loading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <>
              <span className="text-sm font-semibold">Sign in</span>
              <ArrowRight size={16} />
            </>
          )}
        </AppButton>
      </form>
      )}

      <div className="text-center text-[11px] text-[var(--ink-muted)]">
        <p className="wrap-anywhere">
          New to Rekall-IQ?{" "}
          <Link
            href="/register"
            className="ml-1 text-[var(--accent-jade)] transition-colors hover:text-[var(--ink)] hover:underline"
          >
            Get started
          </Link>
        </p>
      </div>
    </div>
  );
}
