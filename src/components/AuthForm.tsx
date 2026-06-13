"use client";
import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/src/lib/supabase";
import { useRouter } from "next/navigation";
import { Mail, Lock, Loader2, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "@/src/components/brand/BrandLogo";
import { getDefaultRouteForRole } from "@/src/lib/workspace";
import { getCurrentUserProfile } from "@/src/lib/auth-client";
import { AppButton } from "@/src/components/ui/app-button";

export default function AuthForm({ mode }: { mode: "login" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      const profile = await getCurrentUserProfile();
      router.push(profile ? getDefaultRouteForRole(profile.role) : "/dashboard");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign in failed.";
      setError(
        msg === "Invalid login credentials"
          ? "Incorrect email or password."
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

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="login-email" className="ml-1 block text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--ink-muted)]">
            Email Address
          </label>
          <div className="relative group">
            <Mail
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] transition-colors group-focus-within:text-[var(--accent-jade)]"
            />
            <Input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              className="h-12 rounded-xl border-[var(--line)] bg-[var(--surface-2)] py-3 pl-11 pr-4 text-sm text-[var(--ink)] focus-visible:border-teal-400 focus-visible:bg-[var(--surface)] focus-visible:ring-4 focus-visible:ring-[var(--accent-jade-100)]"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="login-password" className="ml-1 block text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--ink-muted)]">
            Password
          </label>
          <div className="relative group">
            <Lock
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] transition-colors group-focus-within:text-[var(--accent-jade)]"
            />
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              className="h-12 rounded-xl border-[var(--line)] bg-[var(--surface-2)] py-3 pl-11 pr-12 text-sm text-[var(--ink)] focus-visible:border-teal-400 focus-visible:bg-[var(--surface)] focus-visible:ring-4 focus-visible:ring-[var(--accent-jade-100)]"
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

        {error && (
          <Alert className="rounded-xl border-red-500/30 bg-red-500/10 text-red-300">
            <AlertDescription className="text-sm font-medium">{error}</AlertDescription>
          </Alert>
        )}

        <AppButton disabled={loading} className="mt-2 flex h-12 w-full items-center justify-center gap-2">
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

      <div className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--ink-muted)]">
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
