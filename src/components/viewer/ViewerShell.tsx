"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronRight, FileText, Menu, Search, X } from "lucide-react";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getAccessToken } from "@/src/lib/auth-client";
import {
  getRoleLabel,
  type UserProfile,
  type WorkspaceSettings,
} from "@/src/lib/workspace";
import { cn } from "@/src/lib/utils";
import { AiMark } from "./AiMark";
import { ViewerChatTitle } from "./ViewerChatTitle";
import { ViewerProfileMenu } from "./ViewerProfileMenu";
import { ViewerRecents } from "./ViewerRecents";
import type { ViewerCollection } from "./types";

function pageLabel(pathname: string) {
  if (pathname === "/dashboard/chat") return "Ask Rekall";
  if (pathname === "/dashboard/notifications") return "Notifications";
  if (pathname === "/dashboard/account") return "Settings";
  return "Workspace";
}

export function ViewerShell({
  profile,
  workspace,
  email,
  onLogout,
  children,
  blocked,
}: {
  profile: UserProfile;
  workspace: WorkspaceSettings | null;
  email: string | null;
  onLogout: () => void;
  children: React.ReactNode;
  blocked?: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [collections, setCollections] = useState<ViewerCollection[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const displayName =
    profile.full_name?.trim() || email?.split("@")[0] || "Your account";
  const workspaceName = workspace?.name || "Workspace";
  const roleLabel = getRoleLabel(profile.role);
  const label = pageLabel(pathname);

  useEffect(() => {
    let active = true;

    async function loadInbox() {
      try {
        const token = await getAccessToken();
        if (!token) return;
        const response = await fetch("/api/notifications?limit=1&unreadOnly=true", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;
        const data = await response.json();
        if (active) setUnread(data.unreadCount || 0);
      } catch {
        // Inbox still works without the badge.
      }
    }

    async function loadCollections() {
      try {
        const token = await getAccessToken();
        if (!token) return;
        const response = await fetch("/api/collections", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;
        const data = await response.json();
        if (active) {
          setCollections(
            (data.collections || []).map((collection: { id: string; name: string }) => ({
              id: collection.id,
              name: collection.name,
            })),
          );
        }
      } catch {
        // Collections are optional context.
      }
    }

    void loadInbox();
    void loadCollections();

    const reloadInbox = () => void loadInbox();
    window.addEventListener("viewer:notifications-changed", reloadInbox);
    return () => {
      active = false;
      window.removeEventListener("viewer:notifications-changed", reloadInbox);
    };
  }, []);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="px-2.5 pt-4">
        <div className="flex items-center gap-2 px-1">
          <span className="flex h-6 w-6 items-center justify-center">
            <AiMark size={20} className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1 truncate text-[11.5px] font-medium text-[var(--ink)]">
            {workspaceName}
          </span>
        </div>

        <div className="relative mt-3">
          <Search
            size={12}
            strokeWidth={1.5}
            aria-hidden="true"
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search recent questions"
            aria-label="Search recent questions"
            className="h-8 w-full rounded-[5px] border border-[var(--line)] bg-[var(--canvas)] pl-7 pr-7 text-[11px] text-[var(--ink)] transition-colors placeholder:text-[var(--ink-muted)] focus:border-[var(--accent-jade-100)] focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="absolute right-1.5 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-[3px] text-[var(--ink-muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)]"
            >
              <X size={11} strokeWidth={1.5} />
            </button>
          ) : null}
        </div>

        <div className="mt-3 space-y-0.5">
          <Link
            href="/dashboard/chat"
            aria-current={pathname === "/dashboard/chat" ? "page" : undefined}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-2 rounded-[5px] px-2 py-1.5 text-[11.5px] transition-colors",
              pathname === "/dashboard/chat"
                ? "bg-[var(--surface)] text-[var(--ink)]"
                : "text-[var(--ink-soft)] hover:bg-[var(--canvas-soft)] hover:text-[var(--ink)]",
            )}
          >
            <AiMark size={14} className="h-3.5 w-3.5" />
            <span className="flex-1">Ask Rekall</span>
            <span className="text-[9px] text-[var(--ink-muted)]">AI</span>
          </Link>

          <Link
            href="/dashboard/notifications"
            aria-current={pathname === "/dashboard/notifications" ? "page" : undefined}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-2 rounded-[5px] px-2 py-1.5 text-[11.5px] transition-colors",
              pathname === "/dashboard/notifications"
                ? "bg-[var(--surface)] text-[var(--ink)]"
                : "text-[var(--ink-soft)] hover:bg-[var(--canvas-soft)] hover:text-[var(--ink)]",
            )}
          >
            <Bell size={14} strokeWidth={1.5} className="text-[var(--ink-muted)]" />
            <span className="flex-1">Inbox</span>
            {unread > 0 ? (
              <span className="min-w-4 rounded-full bg-[var(--accent-jade)] px-1 text-center text-[9px] font-medium leading-4 text-[#04100e]">
                {unread > 9 ? "9+" : unread}
              </span>
            ) : null}
          </Link>
        </div>
      </div>

      <div className="mt-5 min-h-0 flex-1 overflow-y-auto px-2 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ViewerRecents onNavigate={() => setMobileOpen(false)} query={searchQuery} />

        {collections.length > 0 ? (
          <details className="group mt-5">
            <summary className="flex cursor-pointer list-none items-center gap-2 px-2.5 py-1 text-[9px] text-[var(--ink-muted)] [&::-webkit-details-marker]:hidden">
              <span className="flex-1">Sources</span>
              <span className="text-[8px]">{collections.length}</span>
              <ChevronRight
                size={10}
                strokeWidth={1.5}
                className="transition-transform duration-150 group-open:rotate-90"
                aria-hidden="true"
              />
            </summary>
            <ul className="mt-1 space-y-px">
              {collections.map((collection) => (
                <li key={collection.id}>
                  <button
                    type="button"
                    onClick={() => {
                      router.push(`/dashboard/chat?collection=${collection.id}`);
                      setMobileOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-[5px] px-2.5 py-1.5 text-left text-[11.5px] text-[var(--ink-soft)] transition-colors hover:bg-[var(--canvas-soft)] hover:text-[var(--ink)]"
                  >
                    <FileText size={12} strokeWidth={1.5} className="text-[var(--ink-muted)]" />
                    <span className="truncate">{collection.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </div>

      <div className="border-t border-[var(--line)] p-2">
        <ViewerProfileMenu
          email={email}
          displayName={displayName}
          roleLabel={roleLabel}
          onLogout={onLogout}
        />
      </div>
    </div>
  );

  const isChat = pathname === "/dashboard/chat";

  return (
    <div
      className={cn(
        "bg-[var(--canvas)] text-[var(--ink)]",
        isChat ? "h-dvh overflow-hidden" : "min-h-screen",
      )}
    >
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] border-r border-[var(--line)] bg-[var(--brand-sidebar)] lg:block">
        {sidebar}
      </aside>

      <div
        className={cn(
          "flex min-w-0 flex-col lg:pl-[260px]",
          isChat ? "h-full" : "min-h-screen",
        )}
      >
        <header className="sticky top-0 z-20 flex h-[52px] shrink-0 items-center justify-between gap-3 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--canvas)_92%,transparent)] px-3 backdrop-blur-xl sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open workspace navigation"
              className="inline-flex h-8 w-8 items-center justify-center rounded-[5px] text-[var(--ink-muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--ink)] lg:hidden"
            >
              <Menu size={16} strokeWidth={1.5} />
            </button>
            {pathname === "/dashboard/chat" ? (
              <ViewerChatTitle />
            ) : (
              <nav aria-label="Breadcrumb" className="min-w-0">
                <ol className="flex min-w-0 items-center gap-1.5 text-[11px] text-[var(--ink-muted)]">
                  <li className="hidden truncate sm:inline">{workspaceName}</li>
                  <li aria-hidden="true" className="hidden sm:inline">
                    /
                  </li>
                  <li className="truncate text-[var(--ink-soft)]">{label}</li>
                </ol>
              </nav>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open search and navigation"
              className="inline-flex h-8 w-8 items-center justify-center rounded-[5px] text-[var(--ink-muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--ink)] lg:hidden"
            >
              <Search size={15} strokeWidth={1.5} />
            </button>
          </div>
        </header>

        <main className={cn("min-w-0 flex-1", isChat && "min-h-0 overflow-hidden")}>
          {blocked ?? children}
        </main>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          aria-describedby={undefined}
          className="w-[min(100vw-1rem,280px)] border-r-0 bg-[var(--brand-sidebar)] p-0"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Workspace navigation</SheetTitle>
          </SheetHeader>
          {sidebar}
        </SheetContent>
      </Sheet>

      <nav
        aria-label="Primary"
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 border-t border-[var(--line)] bg-[var(--brand-sidebar)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden",
          pathname === "/dashboard/chat" && "hidden",
        )}
      >
        <div className="mx-auto grid max-w-md grid-cols-2">
          {[
            { href: "/dashboard/chat", label: "Ask", mark: true },
            { href: "/dashboard/notifications", label: "Inbox", mark: false },
          ].map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-[9px] transition-colors",
                  active ? "text-[var(--accent-jade)]" : "text-[var(--ink-muted)]",
                )}
              >
                {item.mark ? (
                  <AiMark size={16} className="h-4 w-4" />
                ) : (
                  <Bell size={16} strokeWidth={1.5} />
                )}
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

    </div>
  );
}
