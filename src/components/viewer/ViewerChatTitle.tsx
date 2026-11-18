"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { getAccessToken } from "@/src/lib/auth-client";

const CHAT_SESSION_EVENT = "springvox-chat-sessions-changed";

export function ViewerChatTitle() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");
  const [title, setTitle] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!sessionId) {
      setTitle(null);
      return;
    }
    try {
      const token = await getAccessToken();
      if (!token) return;
      const response = await fetch("/api/chat/sessions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;
      const data = await response.json();
      const match = (data.sessions || []).find(
        (session: { id: string; title: string }) => session.id === sessionId,
      );
      if (match) setTitle(match.title);
    } catch {
      // The composer remains usable if the title is unavailable.
    }
  }, [sessionId]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void load();
    });
    const reload = () => void load();
    window.addEventListener(CHAT_SESSION_EVENT, reload);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener(CHAT_SESSION_EVENT, reload);
    };
  }, [load]);

  return (
    <span className="block max-w-[46vw] truncate text-[12px] font-medium text-[var(--ink)] sm:max-w-[42ch]">
      {sessionId ? title || "Chat" : "New chat"}
    </span>
  );
}
