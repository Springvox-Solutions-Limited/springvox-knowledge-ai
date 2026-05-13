"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  BarChart3, 
  ChartColumnBig,
  FileText, 
  MessageSquare, 
  Upload, 
  Users,
  CircleAlert,
  Settings,
  LogOut, 
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { SpringVoxLogo } from '@/src/components/brand/SpringVoxLogo';
import { getCurrentUserProfile, getCurrentWorkspaceSettings } from '@/src/lib/auth-client';
import { supabase } from '@/src/lib/supabase';
import { cn } from '@/src/lib/utils';
import { isAdminRole, isManagerRole, type UserProfile, type WorkspaceSettings } from '@/src/lib/workspace';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceSettings | null>(null);
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
        const currentWorkspace = await getCurrentWorkspaceSettings();
        setWorkspace(currentWorkspace);

        if (!currentProfile?.workspace_id) {
          router.replace('/login');
          return;
        }

        if (!isAllowedPath(currentProfile.role, pathname)) {
          router.replace(getDefaultPathForRole(currentProfile.role));
          return;
        }
      } finally {
        setAuthLoading(false);
      }
    }

    loadAuthContext();
  }, [pathname, router]);

  const navItems = profile ? getNavItems(profile.role) : [];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (authLoading || !user || !profile) {
    return <div className="h-screen w-screen flex items-center justify-center font-mono text-[10px] tracking-widest text-slate-400 bg-white">INITIALIZING ENCRYPTION...</div>;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-30 flex w-72 flex-col bg-slate-950 text-white shadow-2xl transition-transform duration-300 lg:static lg:z-auto lg:w-64 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex-1 flex flex-col p-6">
          <div className="mb-10 flex items-center justify-between px-2">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <SpringVoxLogo variant="mark" theme="dark" imageClassName="h-8 w-8 rounded-xl" />
                <span className="text-lg font-black tracking-tighter text-white">SPRINGVOX</span>
              </div>
              <div className="mt-5 flex items-center gap-2 px-1">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                <span className="block truncate text-[9px] font-bold uppercase tracking-[0.25em] text-slate-500">
                  {workspace?.name || 'Workspace'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="rounded-xl border border-white/10 p-2 text-slate-500 transition-colors hover:bg-white/5 hover:text-white lg:hidden"
            >
              <PanelLeftClose size={16} />
            </button>
          </div>

          <nav className="space-y-1.5 flex-1">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-600 ml-6">Workspace Admin</p>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center space-x-3 rounded-xl px-4 py-3.5 text-sm font-bold transition-all group",
                    isActive 
                      ? "bg-white text-slate-950 shadow-lg" 
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                  )}
                >
                  <item.icon size={18} className={cn("transition-all duration-300", isActive ? "text-slate-950" : "text-slate-500 group-hover:text-slate-300")} />
                  <span className={cn("transition-colors", isActive ? "text-slate-950" : "text-slate-400 group-hover:text-slate-200")}>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-6 border-t border-white/5">
             <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 border border-white/5 transition-all">
                 <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-[11px] font-bold text-white shadow-sm border border-white/5">
                   {(workspace?.name || user.email || 'S').slice(0, 1).toUpperCase()}
                 </div>
                 <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-white" title={user.email || ''}>
                      {user.email?.split('@')[0]}
                    </p>
                    <p className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-slate-500">
                      {profile.role.replace('_', ' ')}
                    </p>
                 </div>
              </div>
              <button 
                onClick={handleLogout}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/5 bg-transparent text-[10px] font-bold uppercase tracking-widest text-slate-500 transition-all hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-950/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <main className="flex-1 overflow-hidden flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-xl md:px-8">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 transition-all hover:bg-slate-50 lg:hidden"
              >
                <PanelLeftOpen size={18} />
              </button>
              <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.15em]">
                 <span className="text-slate-400 hover:text-slate-950 transition-colors cursor-default">{workspace?.name || 'SpringVox'}</span>
                 <span className="text-slate-300">/</span>
                 <span className="text-slate-950">{pathname.split('/').pop()?.replace('-', ' ') || 'Dashboard'}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    System Online
                </div>
            </div>
        </header>
        
        {/* Mobile Sub-Nav */}
        <div className="border-b border-slate-200 bg-white px-4 py-3 lg:hidden overflow-hidden">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "whitespace-nowrap rounded-xl px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all",
                    isActive
                      ? "bg-slate-950 text-white shadow-md"
                      : "bg-slate-50 text-slate-500 border border-slate-100"
                  )}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#f8fafc]">
          <div className="mx-auto w-full max-w-7xl p-4 md:p-10">
              {children}
          </div>
        </div>
      </main>
    </div>
  );
}

function getDefaultPathForRole(role: UserProfile['role']) {
  return isManagerRole(role) ? '/dashboard' : '/dashboard/chat';
}

function isAllowedPath(role: UserProfile['role'], pathname: string) {
  if (!isManagerRole(role)) {
    return pathname === '/dashboard/chat';
  }

  if (!isAdminRole(role) && (pathname === '/dashboard/users' || pathname === '/dashboard/settings')) {
    return false;
  }

  return true;
}

function getNavItems(role: UserProfile['role']) {
  if (!isManagerRole(role)) {
    return [{ name: 'Chat', href: '/dashboard/chat', icon: MessageSquare }];
  }

  const items = [
    { name: 'Overview', href: '/dashboard', icon: BarChart3 },
    { name: 'Documents', href: '/dashboard/documents', icon: FileText },
    { name: 'Ingestion', href: '/dashboard/upload', icon: Upload },
    { name: 'Workspace Chat', href: '/dashboard/chat', icon: MessageSquare },
    { name: 'Intelligence', href: '/dashboard/analytics', icon: ChartColumnBig },
  ];

  if (isAdminRole(role)) {
    items.push({ name: 'User Directory', href: '/dashboard/users', icon: Users });
    items.push({ name: 'System Settings', href: '/dashboard/settings', icon: Settings });
  }

  items.push({ name: 'Coverage Gaps', href: '/dashboard/knowledge-gaps', icon: CircleAlert });

  return items;
}
