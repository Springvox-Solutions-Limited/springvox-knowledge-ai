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
  PanelLeftOpen,
  Bell
} from 'lucide-react';
import { SpringVoxLogo } from '@/src/components/brand/SpringVoxLogo';
import { ViewerChatSidebarHistory } from '@/src/components/dashboard/ViewerChatSidebarHistory';
import { getAccessToken, getCurrentUserProfile, getCurrentWorkspaceSettings } from '@/src/lib/auth-client';
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
  getUserStatusMessage,
  getRoleLabel,
  isPlatformAdminRole,
  isWorkspaceRestrictedStatus,
  isWorkspaceAdminRole,
  type UserProfile,
  type WorkspaceSettings,
} from '@/src/lib/workspace';

type DashboardNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceSettings | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);

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

        try {
          const token = await getAccessToken();
          if (token) {
            const response = await fetch('/api/notifications', {
              headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
              const result = await response.json();
              setNotifications(result.notifications || []);
            }
          }
        } catch {
          setNotifications([]);
        }
      } finally {
        setAuthLoading(false);
      }
    }

    loadAuthContext();
  }, [pathname, router]);

  const navItems = profile ? getNavItems(profile.role) : [];
  const visibleNavItems =
    profile && !isWorkspaceAdminRole(profile.role)
      ? []
      : navItems;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (authLoading || !user || !profile) {
    return <div className="flex h-screen w-screen items-center justify-center bg-white text-sm font-medium text-slate-500">Loading workspace...</div>;
  }

  const workspaceStatusMessage = workspace ? getWorkspaceStatusMessage(workspace.status) : null;
  const userStatusMessage = getUserStatusMessage(profile.status);
  const trialExpired =
    workspace?.subscription_status === 'trial' &&
    workspace.trial_ends_at &&
    new Date(workspace.trial_ends_at).getTime() <= Date.now();
  const workspaceBlocked =
    Boolean(
      userStatusMessage ||
        trialExpired ||
        (workspace && isWorkspaceRestrictedStatus(workspace.status)) ||
        (workspace?.subscription_status &&
          ['past_due', 'expired', 'suspended'].includes(workspace.subscription_status)),
    ) &&
    !isPlatformAdminRole(profile.role);
  const isViewerRole = !isWorkspaceAdminRole(profile.role);
  const currentPageTitle =
    navItems.find((item) => item.href === pathname)?.name ||
    pathname.split('/').pop()?.replace('-', ' ') ||
    'Dashboard';

  const navContent = (
    <>
      <div className={cn("flex h-full flex-col", isViewerRole && "gap-6")}>
        <div className={cn("px-2", !isViewerRole && "mb-8")}>
          <SpringVoxLogo
            variant="full"
            theme="light"
            className="h-11"
            imageClassName="h-10 w-auto max-w-[190px] object-contain object-left"
          />
          <div className={cn("mt-5 flex items-center gap-2 px-1", isViewerRole && "mt-6")}>
            <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.45)]" />
            <span className="block truncate text-[9px] font-bold uppercase tracking-[0.25em] text-slate-400">
              {workspace?.name || 'Workspace'}
            </span>
          </div>
        </div>

        <nav className={cn("space-y-1.5 overflow-y-auto", isViewerRole ? "flex-1" : "flex-1")}>
          <p className={cn(
            "text-[10px] font-bold uppercase tracking-widest text-slate-500",
            isViewerRole ? "mb-4 ml-3" : "mb-4 ml-6"
          )}>
            {isWorkspaceAdminRole(profile.role) ? 'Workspace Admin' : 'Workspace User'}
          </p>
          {isPlatformAdminRole(profile.role) && (
            <div className="mb-4 rounded-2xl border border-white/5 bg-white/[0.02] p-3 shadow-inner">
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
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "group flex items-center gap-3 rounded-xl border transition",
                  isViewerRole
                    ? isActive
                      ? "border-cyan-400/25 bg-cyan-400/10 px-4 py-3.5 text-white"
                      : "border-transparent px-4 py-3.5 text-slate-400 hover:bg-white/[0.03] hover:text-slate-200"
                    : isActive
                      ? "border-cyan-400/25 bg-cyan-400/10 px-4 py-3.5 text-white"
                      : "border-transparent px-4 py-3.5 text-slate-400 hover:bg-white/[0.03] hover:text-slate-200"
                )}
              >
                <item.icon size={18} className={cn("transition-all duration-300", isActive ? "text-cyan-200" : "text-slate-500 group-hover:text-slate-300")} />
                <span className={cn("text-sm font-bold transition-colors", isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200")}>{item.name}</span>
              </Link>
            );
          })}

          {isViewerRole && pathname === '/dashboard/chat' && (
            <ViewerChatSidebarHistory onNavigate={() => setSidebarOpen(false)} />
          )}
        </nav>

        <div className={cn("border-t border-white/5", isViewerRole ? "pt-5" : "mt-6 pt-6")}>
          <div className="flex flex-col gap-3">
            <div className={cn(
              "flex items-center gap-3 border border-white/5 transition-all duration-300",
              isViewerRole
                ? "rounded-2xl bg-white/[0.03] px-4 py-3"
                : "rounded-2xl bg-slate-900 px-4 py-3"
            )}>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1E3A5F] text-[11px] font-bold text-white shadow-sm border border-white/5">
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
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-slate-50/50 text-slate-900">
      <aside className={cn(
        "hidden min-h-screen shrink-0 bg-[#0F172A] text-white shadow-[10px_0_30px_rgba(15,23,42,0.03)] lg:flex border-r border-white/5",
        isViewerRole ? "w-[17.5rem]" : "w-64"
      )}>
        <div className="flex flex-1 flex-col p-6">
          {navContent}
        </div>
      </aside>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent
          side="left"
          aria-describedby={undefined}
          className="w-[min(100vw-1rem,20rem)] border-r-0 bg-[#0F172A] p-0 text-white"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Workspace navigation</SheetTitle>
          </SheetHeader>
          <div className="flex h-full flex-col p-6">{navContent}</div>
        </SheetContent>
      </Sheet>

      <main className="flex min-h-screen min-w-0 flex-1 flex-col overflow-hidden">
        <header className={cn(
          "sticky top-0 z-20 flex w-full items-center justify-between gap-3 border-b border-slate-200 bg-white/80 backdrop-blur-xl",
          isViewerRole ? "min-h-[4.75rem] px-5 py-4 md:px-8" : "min-h-16 px-4 py-3 md:px-8"
        )}>
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
                <h1 className={cn(
                  "truncate font-semibold capitalize text-slate-950",
                  isViewerRole ? "text-base sm:text-[1.05rem]" : "text-sm sm:text-base"
                )}>
                  {currentPageTitle}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
                {isPlatformAdminRole(profile.role) && (
                  <Link
                    href="/platform"
                    className="hidden rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-700 transition hover:border-cyan-300 hover:bg-cyan-100 sm:inline-flex"
                  >
                    Platform Console
                  </Link>
                )}
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-600 sm:px-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    Online
                </div>
            </div>
        </header>

        {notifications.length > 0 ? (
          <section className="border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur-xl md:px-8">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                <Bell size={14} className="text-cyan-600" />
                Notices
              </div>
              <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex min-w-[16rem] max-w-full items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm sm:min-w-0 sm:max-w-[28rem]"
                  >
                    <span className={cn(
                      "mt-0.5 shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em]",
                      getNotificationTypeClass(notification.type),
                    )}>
                      {formatNotificationType(notification.type)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-950">
                        {notification.title}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-slate-600">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}
        
        <div className={cn(
          "hidden overflow-hidden border-b border-slate-200 bg-white px-4 py-3 sm:block lg:hidden",
          isViewerRole && "sm:hidden"
        )}>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {visibleNavItems.map((item) => {
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
                        {userStatusMessage
                          ? 'Account access is suspended.'
                          : trialExpired
                            ? 'Your 14-day trial has ended.'
                            : `${workspace?.name} is currently ${workspace?.status}.`}
                      </h1>
                      <p className="max-w-2xl text-sm font-medium leading-7 text-slate-600 sm:text-base">
                        {userStatusMessage ||
                          (trialExpired
                            ? 'Your 14-day trial has ended. Please upgrade to continue using SpringVox.'
                            : workspaceStatusMessage)}
                      </p>
                      <p className="text-xs font-medium text-slate-500">
                        Tenant uploads, chat, invites, settings updates, and document management are blocked until SpringVox reactivates this workspace.
                      </p>
                      {trialExpired ? (
                        <Link
                          href="/billing-required"
                          className="inline-flex h-11 items-center justify-center rounded-xl bg-[#0d1f35] px-5 text-sm font-semibold text-white transition hover:bg-[#132744]"
                        >
                          View payment required details
                        </Link>
                      ) : null}
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

function formatNotificationType(type: string) {
  return type.replace(/_/g, ' ');
}

function getNotificationTypeClass(type: string) {
  if (type === 'maintenance') {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }

  if (type === 'billing_reminder' || type === 'trial_notice') {
    return 'border-cyan-200 bg-cyan-50 text-cyan-700';
  }

  if (type === 'security_notice') {
    return 'border-red-200 bg-red-50 text-red-700';
  }

  return 'border-slate-200 bg-white text-slate-600';
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
