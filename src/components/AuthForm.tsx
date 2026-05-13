"use client";
import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/src/lib/supabase';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { SpringVoxLogo } from '@/src/components/brand/SpringVoxLogo';

export default function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'register') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Check your email for confirmation!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-8 rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <SpringVoxLogo variant="full" theme="light" imageClassName="h-10" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          {mode === 'login' ? 'Welcome back' : 'Create an account'}
        </h2>
        <p className="text-xs font-semibold uppercase tracking-widest text-cyan-700">
          {mode === 'login' ? 'Auth Required' : 'Knowledge Network'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-1">
          <label className="mb-1 ml-1 block text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Email Address</label>
          <div className="relative group">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-cyan-700" />
            <input
              type="email"
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 transition-all focus:border-cyan-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-cyan-100"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="mb-1 ml-1 block text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Password</label>
          <div className="relative group">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-cyan-700" />
            <input
              type="password"
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 transition-all focus:border-cyan-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-cyan-100"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 font-mono text-[10px] italic text-red-500">
            ERR: {error}
          </div>
        )}

        <button
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 py-4 font-bold text-slate-950 shadow-xl shadow-cyan-400/10 transition-all hover:from-teal-400 hover:to-cyan-400 disabled:opacity-30"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : (
            <>
              <span className="uppercase tracking-widest text-xs font-bold">{mode === 'login' ? 'Initialize Session' : 'Create Identity'}</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      <div className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
        {mode === 'login' ? (
          <p>New here? <Link href="/register" className="ml-1 text-cyan-700 hover:underline">Register</Link></p>
        ) : (
          <p>Identified? <Link href="/login" className="ml-1 text-cyan-700 hover:underline">Login</Link></p>
        )}
      </div>
    </div>
  );
}
