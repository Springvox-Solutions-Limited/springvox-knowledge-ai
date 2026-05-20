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
    <div className="w-full max-w-md min-w-0 space-y-6 rounded-[30px] border border-slate-100 bg-white/95 p-6 sm:p-8 shadow-[0_30px_70px_rgba(30,58,95,0.06)] backdrop-blur-xl transition-all duration-500 hover:shadow-[0_40px_80px_rgba(30,58,95,0.1)]">
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <SpringVoxLogo variant="full" theme="light" imageClassName="h-10" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          {mode === "login" ? "Welcome Back" : "Create Account"}
        </h2>
        <p className="text-xs font-bold uppercase tracking-widest text-[#F97316] animate-[pulse_3s_infinite]">
          {mode === "login" ? "Secure Ingestion Console" : "Register Credentials"}
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
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors duration-300 group-focus-within:text-[#1E3A5F]"
            />
            <Input
              type="email"
              required
              className="h-12 rounded-xl border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-sm text-slate-900 transition-all duration-300 focus-visible:border-[#1E3A5F] focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-[#22d3ee]/20 focus-visible:ring-offset-0"
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
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors duration-300 group-focus-within:text-[#1E3A5F]"
            />
            <Input
              type="password"
              required
              className="h-12 rounded-xl border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-sm text-slate-900 transition-all duration-300 focus-visible:border-[#1E3A5F] focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-[#22d3ee]/20 focus-visible:ring-offset-0"
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

        <AppButton disabled={loading} tone="premium" className="flex h-12 w-full items-center justify-center gap-2 mt-2">
          {loading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <>
              <span className="uppercase tracking-[0.2em] text-xs font-bold">
                {mode === "login" ? "Initialize Session" : "Create Identity"}
              </span>
              <ArrowRight size={16} />
            </>
          )}
        </AppButton>
      </form>

      <div className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
        {mode === "login" ? (
          <p className="break-words [overflow-wrap:anywhere]">
            New to SpringVox?{" "}
            <Link
              href="/register"
              className="ml-1 text-[#F97316] hover:text-[#1E3A5F] hover:underline transition-colors duration-300"
            >
              Register
            </Link>
          </p>
        ) : (
          <p className="break-words [overflow-wrap:anywhere]">
            Already Registered?{" "}
            <Link 
              href="/login" 
              className="ml-1 text-[#F97316] hover:text-[#1E3A5F] hover:underline transition-colors duration-300"
            >
              Login
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
