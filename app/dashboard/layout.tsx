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
  PanelLeftOpen
} from 'lucide-react';
import { SpringVoxLogo } from '@/src/components/brand/SpringVoxLogo';
import { getCurrentUserProfile, getCurrentWorkspaceSettings } from '@/src/lib/auth-client';
import { supabase } from '@/src/lib/supabase';
import { cn } from '@/src/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  getWorkspaceStatusMessage,
  getRoleLabel,
  isPlatformAdminRole,
  isWorkspaceRestrictedStatus,
  isWorkspaceAdminRole,
  type UserProfile,
  type WorkspaceSettings,
} from '@/src/lib/workspace';

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
    return <div className="flex h-screen w-screen items-center justify-center bg-white text-sm font-medium text-slate-500">Loading workspace...</div>;
  }

  const workspaceStatusMessage = workspace ? getWorkspaceStatusMessage(workspace.status) : null;
  const workspaceBlocked =
    Boolean(workspace && isWorkspaceRestrictedStatus(workspace.status)) &&
    !isPlatformAdminRole(profile.role);
  const currentPageTitle =
    navItems.find((item) => item.href === pathname)?.name ||
    pathname.split('/').pop()?.replace('-', ' ') ||
    'Dashboard';

  const navContent = (
    <>
      <div className="mb-8 flex items-start justify-between gap-4 px-2">
        <div className="min-w-0 flex-1">
          <SpringVoxLogo
            variant="full"
            theme="light"
            className="h-11"
            imageClassName="h-10 w-auto max-w-[190px] object-contain object-left"
          />
          <div className="mt-5 flex items-center gap-2 px-1">
            <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.45)]" />
            <span className="block truncate text-[9px] font-bold uppercase tracking-[0.25em] text-slate-500">
              {workspace?.name || 'Workspace'}
            </span>
          </div>
        </div>
      </div>

      <nav className="space-y-1.5 flex-1 overflow-y-auto">
        <p className="mb-4 ml-6 text-[10px] font-bold uppercase tracking-widest text-slate-600">
          {isWorkspaceAdminRole(profile.role) ? 'Workspace Admin' : 'Workspace User'}
        </p>
        {isPlatformAdminRole(profile.role) && (
          <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-cyan-200/80">
              Quick Switch
            </p>
            <Link
              href="/platform"
              onClick={() => setSidebarOpen(false)}
              className="mt-3 flex items-center justify-between rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-bold text-cyan-100 transition hover:bg-cyan-400/15"
            >
              <span>Platform Console</span>
              <span>→</span>
            </Link>
          </div>
        )}
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center space-x-3 rounded-xl border px-4 py-3.5 text-sm font-bold transition-all group",
                isActive 
                  ? "border-cyan-400/30 bg-cyan-400/12 text-white shadow-[inset_0_0_0_1px_rgba(34,211,238,0.08)]" 
                  : "border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200"
              )}
            >
              <item.icon size={18} className={cn("transition-all duration-300", isActive ? "text-cyan-200" : "text-slate-500 group-hover:text-slate-300")} />
              <span className={cn("transition-colors", isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200")}>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 border-t border-white/5 pt-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 border border-white/5 transition-all">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#132744] text-[11px] font-bold text-white shadow-sm border border-white/5">
              {(workspace?.name || user.email || 'S').slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-white" title={user.email || ''}>
                {user.email?.split('@')[0]}
              </p>
              <p className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-slate-500">
                {getRoleLabel(profile.role)}
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
    </>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <aside className="hidden min-h-screen w-64 shrink-0 bg-[#0d1f35] text-white shadow-2xl lg:flex">
        <div className="flex flex-1 flex-col p-6">
          {navContent}
        </div>
      </aside>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent
          side="left"
          className="w-[88vw] max-w-[20rem] border-r-0 bg-[#0d1f35] p-0 text-white"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Workspace navigation</SheetTitle>
          </SheetHeader>
          <div className="flex h-full flex-col p-6">{navContent}</div>
        </SheetContent>
      </Sheet>

      <main className="flex min-h-screen min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-20 flex min-h-16 w-full items-center justify-between gap-3 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur-xl md:px-8">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open workspace navigation"
                className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 transition-all hover:bg-slate-50 lg:hidden"
              >
                <PanelLeftOpen size={18} />
              </button>
              <Link href="/dashboard" className="flex items-center lg:hidden">
                <SpringVoxLogo
                  variant="full"
                  theme="light"
                  imageClassName="h-8 w-auto max-w-[120px] object-contain object-left"
                />
              </Link>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                  {workspace?.name || 'Workspace'}
                </p>
                <h1 className="truncate text-sm font-semibold capitalize text-slate-950 sm:text-base">
                  {currentPageTitle}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
                {isPlatformAdminRole(profile.role) && (
                  <Link
                    href="/platform"
                    className="hidden rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-700 transition hover:border-cyan-300 hover:bg-cyan-100 sm:inline-flex"
                  >
                    Platform Console
                  </Link>
                )}
                <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    Online
                </div>
            </div>
        </header>
        
        <div className="hidden overflow-hidden border-b border-slate-200 bg-white px-4 py-3 sm:block lg:hidden">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "whitespace-nowrap rounded-xl border px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all",
                    isActive
                      ? "border-cyan-300 bg-cyan-50 text-cyan-800 shadow-sm"
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
          <div className="mx-auto w-full max-w-7xl min-w-0 p-4 sm:p-6 md:p-10">
              {workspaceBlocked ? (
                <div className="admin-page">
                  <div className="admin-hero-card border border-amber-200 bg-gradient-to-br from-white via-amber-50/70 to-slate-50">
                    <div className="space-y-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-amber-700/70">
                        Workspace Access Restricted
                      </p>
                      <h1 className="admin-hero-title text-slate-950">
                        {workspace?.name} is currently {workspace?.status}.
                      </h1>
                      <p className="max-w-2xl text-sm font-medium leading-7 text-slate-600 sm:text-base">
                        {workspaceStatusMessage}
                      </p>
                      <p className="text-xs font-medium text-slate-500">
                        Tenant uploads, chat, invites, settings updates, and document management are blocked until SpringVox reactivates this workspace.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                children
              )}
          </div>
        </div>
      </main>
    </div>
  );
}

function getDefaultPathForRole(role: UserProfile['role']) {
  return isWorkspaceAdminRole(role) ? '/dashboard' : '/dashboard/chat';
}

function isAllowedPath(role: UserProfile['role'], pathname: string) {
  if (!isWorkspaceAdminRole(role)) {
    return pathname === '/dashboard/chat';
  }

  return true;
}

function getNavItems(role: UserProfile['role']) {
  if (!isWorkspaceAdminRole(role)) {
    return [{ name: 'Ask Questions', href: '/dashboard/chat', icon: MessageSquare }];
  }

  const items = [
    { name: 'Overview', href: '/dashboard', icon: BarChart3 },
    { name: 'Documents', href: '/dashboard/documents', icon: FileText },
    { name: 'Upload Documents', href: '/dashboard/upload', icon: Upload },
    { name: 'Ask Questions', href: '/dashboard/chat', icon: MessageSquare },
    { name: 'Analytics', href: '/dashboard/analytics', icon: ChartColumnBig },
    { name: 'Users', href: '/dashboard/users', icon: Users },
    { name: 'Company Settings', href: '/dashboard/settings', icon: Settings },
    { name: 'Unanswered Questions', href: '/dashboard/knowledge-gaps', icon: CircleAlert },
  ];

  return items;
}
