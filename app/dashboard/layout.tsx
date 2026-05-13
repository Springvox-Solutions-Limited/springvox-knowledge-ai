"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  BarChart3, 
  FileText, 
  MessageSquare, 
  Upload, 
  LogOut, 
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { getCurrentUserProfile } from '@/src/lib/auth-client';
import { supabase } from '@/src/lib/supabase';
import { cn } from '@/src/lib/utils';
import { isManagerRole, type UserProfile } from '@/src/lib/workspace';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function loadAuthContext() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setUser(user);

      try {
        const currentProfile = await getCurrentUserProfile();
        setProfile(currentProfile);

        if (!currentProfile?.workspace_id) {
          router.replace('/login');
          return;
        }

        if (!isManagerRole(currentProfile.role) && pathname !== '/dashboard/chat') {
          router.replace('/dashboard/chat');
          return;
        }
      } finally {
        setAuthLoading(false);
      }
    }

    loadAuthContext();
  }, [pathname, router]);

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Documents', href: '/dashboard/documents', icon: FileText },
    { name: 'Chat', href: '/dashboard/chat', icon: MessageSquare },
    { name: 'Upload', href: '/dashboard/upload', icon: Upload },
  ];
  const visibleNavItems =
    profile && !isManagerRole(profile.role)
      ? navItems.filter((item) => item.href === '/dashboard/chat')
      : navItems;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (authLoading || !user || !profile) {
    return <div className="h-screen w-screen flex items-center justify-center font-mono text-xs animate-pulse">AUTHORIZING...</div>;
  }

  return (
    <div className="flex min-h-screen bg-[#0B0C0E] text-[#E2E8F0]">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-[#2D3039] bg-[#0D0F12]/95 backdrop-blur-xl transition-transform duration-300 lg:static lg:z-auto lg:w-64 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex-1 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-accent rounded flex items-center justify-center font-bold text-black shadow-lg shadow-accent/20">S</div>
              <span className="font-bold text-lg tracking-tight">SpringVox<span className="text-accent">.AI</span></span>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg border border-[#2D3039] p-2 text-slate-400 transition-colors hover:text-white lg:hidden"
            >
              <PanelLeftClose size={16} />
            </button>
          </div>

          <nav className="space-y-2">
            {visibleNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center space-x-3 rounded-xl border px-4 py-3 text-sm font-medium transition-all group",
                    isActive 
                      ? "border-accent/30 bg-accent/10 text-white shadow-lg shadow-black/20" 
                      : "border-transparent text-slate-400 hover:border-[#2D3039] hover:bg-white/5 hover:text-white"
                  )}
                >
                  <item.icon size={18} className={cn("transition-transform group-hover:scale-110", isActive ? "text-accent" : "text-slate-500")} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto border-t border-[#2D3039] bg-[#0D0F12] px-6 py-5">
            <div className="flex w-full flex-col gap-3">
              <div className="flex w-full min-h-[72px] items-center gap-3 rounded-2xl border border-[#2D3039] bg-[#15171C] px-4 py-3">
                 <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-tr from-accent to-orange-400 shadow-lg shadow-accent/10"></div>
                 <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#E2E8F0]" title={user.email || ''}>
                      {user.email?.split('@')[0]}
                    </p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {isManagerRole(profile.role) ? 'Secure Workspace' : 'Workspace Viewer'}
                    </p>
                 </div>
              </div>
            <button 
              onClick={handleLogout}
              className="flex h-11 w-full items-center justify-start gap-3 rounded-xl border border-red-500/10 px-4 text-sm font-medium text-slate-300 transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <main className="flex-1 overflow-hidden flex flex-col min-h-screen lg:min-h-0">
        <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b border-[#2D3039] bg-[#0D0F12]/80 px-4 backdrop-blur-md md:px-8">
            <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="rounded-lg border border-[#2D3039] p-2 text-slate-400 transition-colors hover:text-white lg:hidden"
                >
                  <PanelLeftOpen size={16} />
                </button>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                   <span className="hover:text-slate-300 cursor-pointer uppercase tracking-wider">Workspace</span>
                   <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                   <span className="text-slate-300 uppercase tracking-wider capitalize">{pathname.split('/').pop() || 'Knowledge Engine'}</span>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-[10px] font-bold uppercase tracking-tighter border border-green-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    System Active
                </div>
            </div>
        </header>
        <div className="border-b border-[#2D3039] bg-[#0D0F12]/80 px-4 py-3 lg:hidden">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {visibleNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "whitespace-nowrap rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] transition-colors",
                    isActive
                      ? "border-accent/30 bg-accent/10 text-accent"
                      : "border-[#2D3039] text-slate-400"
                  )}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="mx-auto w-full max-w-6xl p-4 md:p-8">
              {children}
          </div>
        </div>
      </main>
    </div>
  );
}
