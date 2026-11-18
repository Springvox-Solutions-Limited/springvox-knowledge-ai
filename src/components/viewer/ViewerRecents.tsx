"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

import { ConfirmDialog } from "@/src/components/ui/confirm-dialog";
import { getAccessToken } from "@/src/lib/auth-client";
import { cn } from "@/src/lib/utils";
import type { ViewerSession } from "./types";

const CHAT_SESSION_EVENT = "springvox-chat-sessions-changed";

function groupLabel(date: string) {
  const value = new Date(date);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  if (value >= startOfToday) return "Today";
  if (value >= startOfYesterday) return "Yesterday";
  return "Earlier";
}

export function ViewerRecents({
  onNavigate,
  query = "",
}: {
  onNavigate?: () => void;
  query?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeSessionId = searchParams.get("session");
  const [sessions, setSessions] = useState<ViewerSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const token = await getAccessToken();
      if (!token) throw new Error("Your session expired.");
      const response = await fetch("/api/chat/sessions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load recent questions.");
      setSessions(data.sessions || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load recent questions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void load();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [load, pathname]);

  useEffect(() => {
    const reload = () => void load();
    window.addEventListener(CHAT_SESSION_EVENT, reload);
    return () => window.removeEventListener(CHAT_SESSION_EVENT, reload);
  }, [load]);

  const visibleSessions = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return sessions;
    return sessions.filter((session) =>
      session.title.toLowerCase().includes(needle),
    );
  }, [query, sessions]);

  const groups = useMemo(() => {
    const map = new Map<string, ViewerSession[]>();
    for (const session of visibleSessions) {
      const label = groupLabel(session.updated_at);
      map.set(label, [...(map.get(label) || []), session]);
    }
    return Array.from(map.entries());
  }, [visibleSessions]);

  const remove = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      const token = await getAccessToken();
      if (!token) throw new Error("Your session expired.");
      const response = await fetch(`/api/chat/sessions/${deleteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Could not delete that question.");
      }
      const wasActive = activeSessionId === deleteId;
      setDeleteId(null);
      window.dispatchEvent(new Event(CHAT_SESSION_EVENT));
      await load();
      if (wasActive) router.push("/dashboard/chat");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete that question.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-0">
      <div className="flex items-center justify-between px-2.5 pb-1">
        <p className="text-[10px] font-medium text-[var(--ink-muted)]">Recent questions</p>
        {loading ? (
          <Loader2
            size={11}
            className="animate-spin text-[var(--ink-muted)] motion-reduce:animate-none"
            aria-label="Loading recent questions"
          />
        ) : null}
      </div>

      {error ? (
        <p className="px-2.5 py-1 text-[10px] leading-4 text-red-300">{error}</p>
      ) : null}

      {!loading && sessions.length === 0 ? (
        <p className="px-2.5 py-1 text-[11px] leading-5 text-[var(--ink-muted)]">
          Your questions will appear here.
        </p>
      ) : null}
      {!loading && sessions.length > 0 && visibleSessions.length === 0 ? (
        <p className="px-2.5 py-1 text-[11px] leading-5 text-[var(--ink-muted)]">
          No matching questions.
        </p>
      ) : null}

      <div className="space-y-3">
        {groups.map(([label, items]) => (
          <div key={label}>
            <p className="px-2.5 pb-1 text-[9px] text-[var(--ink-muted)]">{label}</p>
            <ul className="space-y-px">
              {items.map((session) => {
                const active = session.id === activeSessionId;
                return (
                  <li key={session.id} className="group/row">
                    <div
                      className={cn(
                        "flex items-center gap-1 rounded-[5px] pr-1 transition-colors",
                        active ? "bg-[var(--surface)]" : "hover:bg-[var(--canvas-soft)]",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          router.push(`/dashboard/chat?session=${session.id}`);
                          onNavigate?.();
                        }}
                        className={cn(
                          "min-w-0 flex-1 truncate rounded-[5px] px-2.5 py-1.5 text-left text-[11.5px] leading-5",
                          active ? "text-[var(--ink)]" : "text-[var(--ink-soft)]",
                        )}
                        title={session.title}
                      >
                        {session.title}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteId(session.id)}
                        aria-label={`Delete ${session.title}`}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] text-[var(--ink-muted)] opacity-100 transition-opacity hover:bg-[var(--surface-2)] hover:text-red-300 sm:opacity-0 sm:group-hover/row:opacity-100 sm:focus-visible:opacity-100"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        title="Delete question"
        description="This removes the question and its answer from your recent questions."
        confirmLabel="Delete"
        cancelLabel="Keep"
        loading={deleting}
        onConfirm={remove}
      />
    </div>
  );
}
