"use client";
import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/src/lib/supabase';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

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
    <div className="w-full max-w-sm space-y-8 bg-[#15171C] p-8 rounded-2xl shadow-2xl border border-[#2D3039]">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 bg-[#FF6B00] rounded-xl mx-auto flex items-center justify-center font-bold text-black shadow-lg shadow-[#FF6B00]/20">S</div>
        <h2 className="text-2xl font-bold tracking-tight text-[#E2E8F0]">
          {mode === 'login' ? 'Welcome back' : 'Create an account'}
        </h2>
        <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
          {mode === 'login' ? 'Auth Required' : 'Knowledge Network'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-600 block ml-1 mb-1">Email Address</label>
          <div className="relative group">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#FF6B00] transition-colors" />
            <input
              type="email"
              required
              className="w-full pl-10 pr-4 py-3 bg-[#0D0F12] border border-[#2D3039] rounded-xl text-sm text-[#E2E8F0] focus:outline-none focus:border-[#FF6B00]/50 transition-all"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-600 block ml-1 mb-1">Password</label>
          <div className="relative group">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#FF6B00] transition-colors" />
            <input
              type="password"
              required
              className="w-full pl-10 pr-4 py-3 bg-[#0D0F12] border border-[#2D3039] rounded-xl text-sm text-[#E2E8F0] focus:outline-none focus:border-[#FF6B00]/50 transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl text-[10px] text-red-400 font-mono italic">
            ERR: {error}
          </div>
        )}

        <button
          disabled={loading}
          className="w-full bg-[#FF6B00] text-black py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#E66000] disabled:opacity-30 transition-all shadow-xl shadow-[#FF6B00]/10"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : (
            <>
              <span className="uppercase tracking-widest text-xs font-bold">{mode === 'login' ? 'Initialize Session' : 'Create Identity'}</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      <div className="text-center text-[10px] text-slate-600 uppercase tracking-widest font-bold">
        {mode === 'login' ? (
          <p>New here? <Link href="/register" className="text-[#FF6B00] hover:underline ml-1">Register</Link></p>
        ) : (
          <p>Identified? <Link href="/login" className="text-[#FF6B00] hover:underline ml-1">Login</Link></p>
        )}
      </div>
    </div>
  );
}
