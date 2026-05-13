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
    return <div className="h-screen w-screen flex items-center justify-center font-mono text-xs animate-pulse">AUTHORIZING...</div>;
  }

  return (
    <div className="flex min-h-screen bg-[#f3f7fb] text-slate-900">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-white/10 bg-[linear-gradient(180deg,#0f1f33_0%,#112742_100%)] text-slate-100 shadow-[24px_0_60px_rgba(15,23,42,0.18)] transition-transform duration-300 lg:static lg:z-auto lg:w-64 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex-1 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="min-w-0">
              <SpringVoxLogo variant="full" theme="light" imageClassName="h-9 w-auto" />
              <div className="mt-2 min-w-0">
                <span className="block truncate text-[10px] uppercase tracking-[0.18em] text-slate-400">
                  {workspace?.name || 'Default Workspace'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg border border-white/10 p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white lg:hidden"
            >
              <PanelLeftClose size={16} />
            </button>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center space-x-3 rounded-xl border px-4 py-3 text-sm font-medium transition-all group",
                    isActive 
                      ? "border-cyan-300/15 bg-cyan-400/10 text-white shadow-[0_12px_28px_rgba(34,211,238,0.1)]" 
                      : "border-transparent text-slate-300 hover:border-white/10 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <item.icon size={18} className={cn("transition-transform group-hover:scale-110", isActive ? "text-cyan-300" : "text-slate-500")} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto border-t border-white/10 bg-white/5 px-6 py-5">
            <div className="flex w-full flex-col gap-3">
              <div className="flex w-full min-h-[72px] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
                 <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-teal-400 to-cyan-400 text-[11px] font-bold text-slate-950 shadow-lg shadow-cyan-400/10">
                   {(workspace?.name || user.email || 'S').slice(0, 1).toUpperCase()}
                 </div>
                 <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-100" title={user.email || ''}>
                      {workspace?.name || user.email?.split('@')[0]}
                    </p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {workspace?.assistant_name || (isManagerRole(profile.role) ? 'Secure Workspace' : 'Workspace Viewer')}
                    </p>
                 </div>
              </div>
            <button 
              onClick={handleLogout}
              className="flex h-11 w-full items-center justify-start gap-3 rounded-xl border border-white/10 bg-transparent px-4 text-sm font-medium text-slate-200 transition-colors hover:border-red-300/30 hover:bg-red-400/10 hover:text-red-100"
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
        <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-md md:px-8">
            <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:text-slate-900 lg:hidden"
        >
          <PanelLeftOpen size={16} />
        </button>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                   <span className="cursor-pointer uppercase tracking-wider hover:text-slate-700">{workspace?.slug || 'Workspace'}</span>
                   <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                   <span className="uppercase tracking-wider capitalize text-slate-900">{pathname.split('/').pop() || 'Knowledge Engine'}</span>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-tighter text-emerald-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    System Active
                </div>
            </div>
        </header>
        <div className="border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "whitespace-nowrap rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] transition-colors",
                    isActive
                      ? "border-cyan-200 bg-cyan-50 text-cyan-700"
                      : "border-slate-200 text-slate-500"
                  )}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="w-full max-w-[1240px] p-4 md:p-8">
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
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Documents', href: '/dashboard/documents', icon: FileText },
    { name: 'Upload', href: '/dashboard/upload', icon: Upload },
    { name: 'Chat', href: '/dashboard/chat', icon: MessageSquare },
    { name: 'Analytics', href: '/dashboard/analytics', icon: ChartColumnBig },
  ];

  if (isAdminRole(role)) {
    items.push({ name: 'Users', href: '/dashboard/users', icon: Users });
    items.push({ name: 'Settings', href: '/dashboard/settings', icon: Settings });
  }

  items.push({ name: 'Knowledge Gaps', href: '/dashboard/knowledge-gaps', icon: CircleAlert });

  return items;
}
