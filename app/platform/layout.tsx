"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  Building2,
  Bell,
  LayoutGrid,
  LogOut,
  Menu,
  Monitor,
  ReceiptText,
  ScrollText,
  Users,
} from 'lucide-react';

import { SpringVoxLogo } from '@/src/components/brand/SpringVoxLogo';
import { getCurrentUserProfile, getCurrentWorkspaceSettings } from '@/src/lib/auth-client';
import { supabase } from '@/src/lib/supabase';
import { cn } from '@/src/lib/utils';
import { getDefaultRouteForRole, getRoleLabel, getUserStatusMessage, isPlatformAdminRole, type UserProfile, type WorkspaceSettings } from '@/src/lib/workspace';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

const platformNavItems = [
  { name: 'Overview', href: '/platform', icon: LayoutGrid },
  { name: 'Companies', href: '/platform/companies', icon: Building2 },
  { name: 'Workspaces', href: '/platform/workspaces', icon: Building2 },
  { name: 'Users', href: '/platform/users', icon: Users },
  { name: 'Notifications', href: '/platform/notifications', icon: Bell },
  { name: 'Audit Logs', href: '/platform/audit-logs', icon: ScrollText },
  { name: 'Analytics', href: '/platform/analytics', icon: BarChart3 },
  { name: 'Plans', href: '/platform/plans', icon: ReceiptText },
];

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceSettings | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
        return;
      }

      try {
        const [currentProfile, currentWorkspace] = await Promise.all([
          getCurrentUserProfile(),
          getCurrentWorkspaceSettings(),
        ]);

        setProfile(currentProfile);
        setWorkspace(currentWorkspace);

        if (!currentProfile) {
          router.replace('/login');
          return;
        }

        if (getUserStatusMessage(currentProfile.status)) {
          router.replace('/dashboard');
          return;
        }

        if (!isPlatformAdminRole(currentProfile.role)) {
          router.replace(getDefaultRouteForRole(currentProfile.role));
          return;
        }
      } finally {
        setAuthLoading(false);
      }
    }

    load();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (authLoading || !profile) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-sm font-medium text-slate-500">
        Loading platform...
      </div>
    );
  }

  const currentPageTitle =
    platformNavItems.find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    )?.name || 'Platform';

  const navContent = (
    <>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <SpringVoxLogo
            variant="full"
            theme="light"
            className="h-11"
            imageClassName="h-10 w-auto max-w-[190px] object-contain object-left"
          />
          <p className="mt-4 px-1 text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-200/80">
            Platform Admin
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto">
        {platformNavItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== '/platform' && pathname.startsWith(`${item.href}/`));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition',
                active
                  ? 'border-cyan-400/30 bg-cyan-400/12 text-white shadow-[inset_0_0_0_1px_rgba(34,211,238,0.08)]'
                  : 'border-transparent text-slate-300 hover:border-white/8 hover:bg-white/6 hover:text-white',
              )}
            >
              <item.icon size={18} className={active ? 'text-cyan-200' : 'text-slate-400'} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 border-t border-white/10 pt-6">
        <Link
          href="/dashboard"
          onClick={() => setSidebarOpen(false)}
          className="mb-4 flex items-center gap-3 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/20 hover:bg-white/5 hover:text-white"
        >
          <Monitor size={16} className="text-cyan-200" />
          <span>My Workspace</span>
        </Link>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="truncate text-sm font-semibold text-white">{profile.email}</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
            {getRoleLabel(profile.role)}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Workspace: {workspace?.name || 'Default workspace'}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-300 transition hover:border-red-400/20 hover:bg-red-400/10 hover:text-red-100"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-[#f4f7fb] text-slate-900">
      <aside className="hidden min-h-screen w-72 shrink-0 bg-[#0d1f35] text-white shadow-2xl lg:flex">
        <div className="flex h-full flex-1 flex-col p-6">
          {navContent}
        </div>
      </aside>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent
          side="left"
          aria-describedby={undefined}
          className="w-[min(100vw-1rem,20rem)] border-r-0 bg-[#0d1f35] p-0 text-white"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Platform navigation</SheetTitle>
          </SheetHeader>
          <div className="flex h-full flex-col p-6">{navContent}</div>
        </SheetContent>
      </Sheet>

      <main className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/92 backdrop-blur-xl">
          <div className="flex min-h-16 items-center justify-between gap-3 px-4 py-3 md:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open platform navigation"
                className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 lg:hidden"
              >
                <Menu size={18} />
              </button>
              <Link href="/platform" className="flex items-center lg:hidden">
                <SpringVoxLogo
                  variant="full"
                  theme="light"
                  imageClassName="h-8 w-auto max-w-[120px] object-contain object-left"
                />
              </Link>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                  Platform Admin
                </p>
                <h1 className="truncate text-sm font-semibold text-slate-950 sm:text-base">
                  {currentPageTitle}
                </h1>
              </div>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Online
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl min-w-0 p-4 sm:p-6 md:p-10">{children}</div>
        </div>
      </main>
    </div>
  );
}
