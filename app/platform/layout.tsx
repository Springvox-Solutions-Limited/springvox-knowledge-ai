"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Building2,
  Bell,
  Activity,
  LayoutGrid,
  Menu,
  Search,
  Monitor,
  ReceiptText,
  ScrollText,
  Server,
  Wrench,
  Users,
} from "lucide-react";

import { BrandLogo } from "@/src/components/brand/BrandLogo";
import {
  CommandPalette,
  type CommandAction,
} from "@/src/components/shell/CommandPalette";
import { ProfileMenu } from "@/src/components/shell/ProfileMenu";
import { getCurrentUserProfile } from "@/src/lib/auth-client";
import { supabase } from "@/src/lib/supabase";
import { cn } from "@/src/lib/utils";
import {
  getDefaultRouteForRole,
  getRoleLabel,
  getUserStatusMessage,
  isPlatformAdminRole,
  type UserProfile,
} from "@/src/lib/workspace";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const platformNavGroups = [
  {
    label: "Monitor",
    items: [
      { name: "Overview", href: "/platform", icon: LayoutGrid },
      { name: "Companies", href: "/platform/companies", icon: Building2 },
      { name: "Workspaces", href: "/platform/workspaces", icon: Server },
      { name: "Users", href: "/platform/users", icon: Users },
    ],
  },
  {
    label: "Operations",
    items: [
      { name: "Audit logs", href: "/platform/audit-logs", icon: ScrollText },
      { name: "Usage", href: "/platform/usage", icon: Activity },
      { name: "Diagnostics", href: "/platform/diagnostics", icon: Wrench },
    ],
  },
  {
    label: "Administration",
    items: [
      { name: "Notifications", href: "/platform/notifications", icon: Bell },
      { name: "Analytics", href: "/platform/analytics", icon: BarChart3 },
      { name: "Plans", href: "/platform/plans", icon: ReceiptText },
    ],
  },
];

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      try {
        const currentProfile = await getCurrentUserProfile();

        setProfile(currentProfile);

        if (!currentProfile) {
          router.replace("/login");
          return;
        }

        if (getUserStatusMessage(currentProfile.status)) {
          router.replace("/dashboard");
          return;
        }

        if (!isPlatformAdminRole(currentProfile.role)) {
          router.replace(getDefaultRouteForRole(currentProfile.role));
          return;
        }

        if (process.env.NEXT_PUBLIC_PLATFORM_MFA_REQUIRED === "true") {
          const { data: factors } = await supabase.auth.mfa.listFactors();
          const hasVerifiedFactor = (factors?.totp ?? []).some(
            (factor) => factor.status === "verified",
          );
          if (!hasVerifiedFactor) {
            router.replace("/dashboard/account?mfa=required");
            return;
          }

          const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
          if (assurance?.nextLevel === "aal2" && assurance.currentLevel !== "aal2") {
            router.replace("/login?mfa=1");
            return;
          }
        }
      } finally {
        setAuthLoading(false);
      }
    }

    load();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (authLoading || !profile) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--surface-2)] text-sm font-medium text-[var(--ink-muted)]">
        Loading platform...
      </div>
    );
  }

  const pageLabelFallbacks: Record<string, string> = {
    "/platform/companies": "Companies",
    "/platform/workspaces": "Workspaces",
    "/platform/users": "Users",
    "/platform/audit-logs": "Audit logs",
    "/platform/usage": "Usage",
    "/platform/diagnostics": "Diagnostics",
    "/platform/notifications": "Notifications",
    "/platform/analytics": "Analytics",
    "/platform/plans": "Plans",
  };
  const currentPageLabel =
    platformNavGroups.flatMap((group) => group.items).find((item) => item.href === pathname)?.name ||
    pageLabelFallbacks[pathname] ||
    (pathname.startsWith("/platform/companies/") ? "Company detail" : "Overview");

  const commandActions: CommandAction[] = [
    {
      id: "my-workspace",
      label: "Open my workspace",
      group: "Actions",
      href: "/dashboard",
      icon: Monitor,
      keywords: ["tenant", "company", "dashboard"],
    },
    ...platformNavGroups.flatMap((group) =>
      group.items.map((item) => ({
        id: `nav-${item.href}`,
        label: item.name,
        group: "Go to",
        href: item.href,
        icon: item.icon,
        keywords: [group.label],
      })),
    ),
  ];

  const navContent = (
    <>
      <div className="mb-5 px-2">
        <BrandLogo
          variant="full"
          theme="light"
          className="h-9"
          imageClassName="h-8 w-auto max-w-[170px] object-contain object-left"
        />
        <p className="mt-1.5 text-[11px] font-medium text-[var(--ink-muted)]">
          Platform admin
        </p>
      </div>

      <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1 scrollbar-hide">
        {platformNavGroups.map((group) => (
          <div key={group.label}>
            <p className="px-2 pb-1.5 text-[11px] font-medium text-[var(--ink-muted)]">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/platform" &&
                    pathname.startsWith(`${item.href}/`));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "group flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium transition-colors",
                      active
                        ? "bg-[var(--accent-jade-50)] text-[var(--ink)]"
                        : "text-[var(--ink-soft)] hover:bg-[var(--canvas-soft)] hover:text-[var(--ink)]",
                    )}
                  >
                    <item.icon
                      size={15}
                      strokeWidth={1.5}
                      className={
                        active
                          ? "text-[var(--accent-jade)]"
                          : "text-[var(--ink-muted)] group-hover:text-[var(--ink-soft)]"
                      }
                    />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-6 border-t border-[var(--line)] pt-6">
        <Link
          href="/dashboard"
          onClick={() => setSidebarOpen(false)}
          className="mb-4 flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[12px] font-medium text-[var(--ink-muted)] transition-colors hover:bg-[var(--canvas-soft)] hover:text-[var(--ink)]"
        >
          <Monitor size={16} className="text-[var(--accent-jade)]" />
          <span>My workspace</span>
        </Link>
        <ProfileMenu
          email={profile.email}
          roleLabel={getRoleLabel(profile.role)}
          displayName={profile.email.split("@")[0]}
          helpHref="/help/admin-guide"
          onLogout={handleLogout}
        />
      </div>
    </>
  );

  return (
    <div className="flex h-dvh overflow-hidden bg-[var(--canvas)] text-[var(--ink)] lg:flex">
      <aside className="hidden w-[15rem] border-r border-[var(--line)] bg-[var(--brand-sidebar)] lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:overflow-hidden">
        <div className="flex h-full w-full flex-col p-3">{navContent}</div>
      </aside>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent
          side="left"
          aria-describedby={undefined}
          className="w-[min(100vw-1rem,20rem)] border-r-0 bg-[var(--brand-sidebar)] p-0 text-[var(--ink)]"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Platform navigation</SheetTitle>
          </SheetHeader>
          <div className="flex h-full flex-col p-3">{navContent}</div>
        </SheetContent>
      </Sheet>

      <main className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:ml-[15rem]">
        <header className="z-20 flex h-[52px] shrink-0 items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--surface)] px-4 md:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open platform navigation"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--ink-muted)] hover:bg-[var(--canvas-soft)] hover:text-[var(--ink)] lg:hidden"
            >
              <Menu size={18} />
            </button>
            <Link href="/platform" className="flex items-center lg:hidden">
              <BrandLogo
                variant="full"
                theme="light"
                imageClassName="h-8 w-auto max-w-[120px] object-contain object-left"
              />
            </Link>
            <div className="flex min-w-0 items-center gap-1.5 text-[12px]">
              <span className="truncate font-medium text-[var(--ink-soft)]">Platform</span>
              <span aria-hidden="true" className="text-[var(--ink-muted)]">/</span>
              <span className="truncate font-medium text-[var(--ink)]">{currentPageLabel}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("open-platform-palette"))}
              className="hidden h-8 items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--canvas-soft)] px-2.5 text-[11px] text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)] sm:inline-flex"
              aria-label="Search platform pages and actions"
            >
              <Search size={13} />
              Search
              <kbd className="ml-2 rounded border border-[var(--line)] px-1 text-[9px]">⌘K</kbd>
            </button>
            <span className="hidden rounded-md border border-[var(--line)] px-2 py-1 text-[10px] font-medium text-[var(--ink-muted)] sm:inline-flex">
              {process.env.NODE_ENV === "production" ? "Production" : "Development"}
            </span>
          </div>
        </header>

        <div className="admin-scroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
          <div className="mx-auto w-full max-w-[1440px] min-w-0 p-4 sm:p-6 md:p-7">
            {children}
          </div>
        </div>
      </main>

      <CommandPalette actions={commandActions} openEvent="open-platform-palette" />
    </div>
  );
}
