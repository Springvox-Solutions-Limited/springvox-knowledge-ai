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
  ClipboardCheck,
  Settings,
  LogOut, 
  PanelLeftOpen,
  Bell,
  BookOpen,
  UserCircle,
} from 'lucide-react';
import { BrandLogo } from '@/src/components/brand/BrandLogo';
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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceSettings | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

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
            const response = await fetch('/api/notifications?limit=5&unreadOnly=true', {
              headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
              const result = await response.json();
              setUnreadNotificationCount(result.unreadCount || 0);
            }
          }
        } catch {
          setUnreadNotificationCount(0);
        }
      } finally {
        setAuthLoading(false);
      }
    }

    loadAuthContext();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navItems = profile ? getNavItems(profile.role) : [];
  const visibleNavItems = navItems;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (authLoading || !user || !profile) {
    return <div className="flex h-screen w-screen items-center justify-center bg-[var(--surface)] text-sm font-medium text-[var(--ink-muted)]">Loading workspace...</div>;
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
  const navContent = (
    <>
      <div className={cn("flex h-full flex-col", isViewerRole && "gap-6")}>
        <div className={cn("px-2", !isViewerRole && "mb-8")}>
          <BrandLogo
            variant="full"
            theme="light"
            className="h-11"
            imageClassName="h-10 w-auto max-w-[190px] object-contain object-left"
          />
          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-2.5 py-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-jade-50)] text-[11px] font-bold text-[var(--accent-jade)]">
              {(workspace?.name || 'W').slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-[var(--ink)]">
                {workspace?.name || 'Workspace'}
              </p>
              <p className="text-[10px] text-[var(--ink-muted)]">Workspace</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto">
          {isPlatformAdminRole(profile.role) && (
            <div className="mb-4 rounded-xl border border-[var(--line)] bg-[var(--canvas-soft)] p-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--ink-muted)]">
                Quick Switch
              </p>
              <Link
                href="/platform"
                onClick={() => setSidebarOpen(false)}
                className="mt-2.5 flex items-center justify-between rounded-lg border border-[var(--accent-jade-100)] bg-[var(--accent-jade-50)] px-3 py-2 text-xs font-bold text-[var(--accent-jade-hover)] transition hover:bg-[var(--accent-jade-100)]"
              >
                <span>Platform Console</span>
                <span>→</span>
              </Link>
            </div>
          )}
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href;
            const showNotificationBadge = item.href === '/dashboard/notifications' && unreadNotificationCount > 0;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  isActive
                    ? "bg-[var(--accent-jade-50)] text-[var(--accent-jade-hover)]"
                    : "text-[var(--ink-soft)] hover:bg-[var(--canvas-soft)] hover:text-[var(--ink)]",
                )}
              >
                <item.icon size={18} className={cn("shrink-0 transition-colors", isActive ? "text-[var(--accent-jade)]" : "text-[var(--ink-muted)] group-hover:text-[var(--ink-soft)]")} />
                <span className="min-w-0 flex-1">{item.name}</span>
                {showNotificationBadge ? (
                  <span className="rounded-full bg-[var(--accent-jade)] px-2 py-0.5 text-[10px] font-bold text-white">
                    {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                  </span>
                ) : null}
              </Link>
            );
          })}

          {isViewerRole && pathname === '/dashboard/chat' && (
            <ViewerChatSidebarHistory onNavigate={() => setSidebarOpen(false)} />
          )}
        </nav>

        <div className={cn("border-t border-[var(--line)]", isViewerRole ? "pt-5" : "mt-6 pt-6")}>
          <div className="flex flex-col gap-3">
            <Link
              href={isViewerRole ? "/help/user-guide" : "/help/admin-guide"}
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--ink-soft)] transition hover:bg-[var(--canvas-soft)] hover:text-[var(--ink)]"
            >
              <BookOpen size={18} className="shrink-0 text-[var(--ink-muted)]" />
              <span>Help &amp; Guides</span>
            </Link>
            <Link
              href="/dashboard/account"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--canvas-soft)] px-3 py-2.5 transition hover:border-[var(--accent-jade-100)] hover:bg-[var(--surface-2)]"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-jade)] text-[11px] font-bold text-[#04110e] shadow-sm">
                {(user.email || 'U').slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-[var(--ink)]" title={user.email || ''}>
                  {user.email?.split('@')[0]}
                </p>
                <p className="mt-0.5 text-[11px] font-medium text-[var(--ink-muted)]">
                  {getRoleLabel(profile.role)}
                </p>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[10px] font-bold uppercase tracking-widest text-[var(--ink-muted)] transition-all hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
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
    <div className="flex min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      <aside className={cn(
        "hidden min-h-screen shrink-0 bg-[var(--brand-sidebar)] lg:flex border-r border-[var(--line)]",
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
          className="w-[min(100vw-1rem,20rem)] border-r-0 bg-[var(--brand-sidebar)] p-0"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Workspace navigation</SheetTitle>
          </SheetHeader>
          <div className="flex h-full flex-col p-6">{navContent}</div>
        </SheetContent>
      </Sheet>

      <main className="flex min-h-screen min-w-0 flex-1 flex-col overflow-hidden">
        <header className={cn(
          "sticky top-0 z-20 flex w-full items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--surface)] backdrop-blur-xl",
          isViewerRole ? "min-h-[4.75rem] px-5 py-4 md:px-8" : "min-h-16 px-4 py-3 md:px-8"
        )}>
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open workspace navigation"
                className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-2.5 text-[var(--ink-muted)] transition-all hover:bg-[var(--surface-2)] lg:hidden"
              >
                <PanelLeftOpen size={18} />
              </button>
              <Link href="/dashboard" className="flex items-center lg:hidden">
                <BrandLogo
                  variant="full"
                  theme="light"
                  imageClassName="h-8 w-auto max-w-[120px] object-contain object-left"
                />
              </Link>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--ink)]">
                  {workspace?.name || 'Workspace'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
                {isPlatformAdminRole(profile.role) && (
                  <Link
                    href="/platform"
                    className="hidden rounded-full border border-[var(--accent-jade-100)] bg-[var(--accent-jade-50)] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--accent-jade-hover)] transition hover:bg-[var(--accent-jade-100)] sm:inline-flex"
                  >
                    Platform Console
                  </Link>
                )}
                <Link
                  href="/dashboard/notifications"
                  aria-label={`${unreadNotificationCount} unread notifications`}
                  className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)] transition hover:border-[var(--accent-jade-100)] hover:bg-[var(--accent-jade-50)] hover:text-[var(--accent-jade-hover)]"
                >
                  <Bell size={16} />
                  {unreadNotificationCount > 0 ? (
                    <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-[var(--accent-jade)] px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-white">
                      {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                    </span>
                  ) : null}
                </Link>
            </div>
        </header>

        
        <div className={cn(
          "hidden overflow-hidden border-b border-[var(--line)] bg-[var(--surface)] px-4 py-3 sm:block lg:hidden",
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
                    "whitespace-nowrap rounded-lg border px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all",
                    isActive
                      ? "border-[var(--accent-jade-100)] bg-[var(--accent-jade-50)] text-[var(--accent-jade-hover)]"
                      : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)]"
                  )}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-[var(--canvas)]">
          <div className="mx-auto w-full max-w-7xl min-w-0 p-4 sm:p-6 md:p-10">
              {workspaceBlocked ? (
                <div className="admin-page">
                  <div className="admin-hero-card rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">
                    <div className="space-y-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-amber-400/80">
                        Workspace Access Restricted
                      </p>
                      <h1 className="admin-hero-title text-[var(--ink)]">
                        {userStatusMessage
                          ? 'Account access is suspended.'
                          : trialExpired
                            ? 'Your 14-day trial has ended.'
                            : `${workspace?.name} is currently ${workspace?.status}.`}
                      </h1>
                      <p className="max-w-2xl text-sm font-medium leading-7 text-[var(--ink-soft)] sm:text-base">
                        {userStatusMessage ||
                          (trialExpired
                            ? 'Your 14-day trial has ended. Please upgrade to continue using Rekall-IQ.'
                            : workspaceStatusMessage)}
                      </p>
                      <p className="text-xs font-medium text-[var(--ink-muted)]">
                        Tenant uploads, chat, invites, settings updates, and document management are blocked until Rekall-IQ reactivates this workspace.
                      </p>
                      {trialExpired ? (
                        <Link
                          href="/billing-required"
                          className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--accent-jade)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--accent-jade-hover)]"
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


function getDefaultPathForRole(role: UserProfile['role']) {
  return isWorkspaceAdminRole(role) ? '/dashboard' : '/dashboard/chat';
}

function isAllowedPath(role: UserProfile['role'], pathname: string) {
  if (!isWorkspaceAdminRole(role)) {
    return (
      pathname === '/dashboard/chat' ||
      pathname === '/dashboard/notifications' ||
      pathname === '/dashboard/account'
    );
  }

  return true;
}

function getNavItems(role: UserProfile['role']) {
  if (!isWorkspaceAdminRole(role)) {
    return [
      { name: 'Ask Questions', href: '/dashboard/chat', icon: MessageSquare },
      { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
      { name: 'Account', href: '/dashboard/account', icon: UserCircle },
    ];
  }

  const items = [
    { name: 'Overview', href: '/dashboard', icon: BarChart3 },
    { name: 'Documents', href: '/dashboard/documents', icon: FileText },
    { name: 'Upload Documents', href: '/dashboard/upload', icon: Upload },
    { name: 'Ask Questions', href: '/dashboard/chat', icon: MessageSquare },
    { name: 'Analytics', href: '/dashboard/analytics', icon: ChartColumnBig },
    { name: 'Evaluations', href: '/dashboard/evaluations', icon: ClipboardCheck },
    { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
    { name: 'Users', href: '/dashboard/users', icon: Users },
    { name: 'Company Settings', href: '/dashboard/settings', icon: Settings },
    { name: 'Unanswered Questions', href: '/dashboard/knowledge-gaps', icon: CircleAlert },
  ];

  return items;
}
