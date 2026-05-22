"use client";
import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/src/lib/supabase";
import { useRouter } from "next/navigation";
import { Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { SpringVoxLogo } from "@/src/components/brand/SpringVoxLogo";
import { getDefaultRouteForRole } from "@/src/lib/workspace";
import { getCurrentUserProfile } from "@/src/lib/auth-client";
import { AppButton } from "@/src/components/ui/app-button";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("Check your email for confirmation!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        const profile = await getCurrentUserProfile();
        router.push(
          profile ? getDefaultRouteForRole(profile.role) : "/dashboard",
        );
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md min-w-0 space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)] sm:p-8">
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <SpringVoxLogo variant="full" theme="light" imageClassName="h-10" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          {mode === "login" ? "Welcome back" : "Create an account"}
        </h2>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
          {mode === "login" ? "Sign in to your workspace" : "Start your workspace access"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="ml-1 block text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">
            Email Address
          </label>
          <div className="relative group">
            <Mail
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-cyan-700"
            />
            <Input
              type="email"
              required
              className="h-12 rounded-xl border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 focus-visible:border-cyan-400 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-cyan-100"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="ml-1 block text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">
            Password
          </label>
          <div className="relative group">
            <Lock
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-cyan-700"
            />
            <Input
              type="password"
              required
              className="h-12 rounded-xl border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 focus-visible:border-cyan-400 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-cyan-100"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <Alert className="rounded-xl border-red-200 bg-red-50/50 text-red-700">
            <AlertDescription className="text-sm font-medium">{error}</AlertDescription>
          </Alert>
        )}

        <AppButton disabled={loading} className="mt-2 flex h-12 w-full items-center justify-center gap-2">
          {loading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <>
              <span className="text-sm font-semibold">
                {mode === "login" ? "Sign in" : "Create account"}
              </span>
              <ArrowRight size={16} />
            </>
          )}
        </AppButton>
      </form>

      <div className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
        {mode === "login" ? (
          <p className="wrap-anywhere">
            New to SpringVox?{" "}
            <Link
              href="/register"
              className="ml-1 text-cyan-700 transition-colors hover:text-slate-950 hover:underline"
            >
              Register
            </Link>
          </p>
        ) : (
          <p className="wrap-anywhere">
            Already Registered?{" "}
            <Link 
              href="/login" 
              className="ml-1 text-cyan-700 transition-colors hover:text-slate-950 hover:underline"
            >
              Login
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
