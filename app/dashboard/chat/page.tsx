"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  FileText,
  History,
  Loader2,
  MessageSquarePlus,
  Mic,
  MicOff,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Square,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  X,
} from "lucide-react";

import {
  getAccessToken,
  getCurrentUserProfile,
  getCurrentWorkspaceSettings,
} from "@/src/lib/auth-client";
import { cn, truncate } from "@/src/lib/utils";
import {
  isWorkspaceAdminRole,
  type FeedbackRating,
  type UserProfile,
  type WorkspaceSettings,
} from "@/src/lib/workspace";
import { AppPageHeader } from "@/src/components/shared/AppPageHeader";
import { AppButton } from "@/src/components/ui/app-button";
import { SpringVoxLogo } from "@/src/components/brand/SpringVoxLogo";
import { ConfirmDialog } from "@/src/components/ui/confirm-dialog";
import { EmptyState } from "@/src/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Citation = {
  filename: string;
  chunk_index: number;
  preview: string;
  document_id?: string | null;
  chunk_text?: string;
  uploaded_at?: string | null;
  uploaded_by?: string | null;
  document_category?: string | null;
  relevance_score?: number;
  confidence?: "high" | "medium" | "low";
};

type StoredChatMessage = {
  id: string;
  question: string;
  answer: string;
  citations: Citation[];
  created_at: string;
};

type ChatSessionSummary = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

type Message = {
  id: string;
  role: "user" | "ai";
  content: string;
  citations?: Citation[];
  followUps?: string[];
  statusMessage?: string;
  confidence?: "high" | "medium" | "low";
  error?: boolean;
  chatMessageId?: string;
  feedbackSubmitted?: boolean;
  feedbackRating?: FeedbackRating | null;
};

const EMPTY_PROMPTS = [
  "Summarise the uploaded documents",
  "What services are mentioned?",
  "What policies should I know?",
  "What are the key points?",
];

const EXTRA_FEEDBACK_OPTIONS: FeedbackRating[] = [
  "wrong",
  "outdated",
  "needs_more_detail",
];

const ANSWER_MODES = [
  { value: "summary", label: "Summary" },
  { value: "detailed", label: "Detailed" },
  { value: "executive", label: "Executive" },
  { value: "technical", label: "Technical" },
] as const;

function useAutoResizeTextarea({
  minHeight,
  maxHeight,
}: {
  minHeight: number;
  maxHeight?: number;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }
      textarea.style.height = `${minHeight}px`;
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight ?? Infinity),
      );
      textarea.style.height = `${newHeight}px`;
    },
    [maxHeight, minHeight],
  );

  useEffect(() => {
    if (textareaRef.current) textareaRef.current.style.height = `${minHeight}px`;
  }, [minHeight]);

  return { textareaRef, adjustHeight };
}

function mapStoredMessagesToThread(messages: StoredChatMessage[]): Message[] {
  return messages.flatMap((item) => [
    {
      id: `question-${item.id}`,
      role: "user" as const,
      content: item.question,
    },
    {
      id: `answer-${item.id}`,
      role: "ai" as const,
      content: item.answer,
      citations: Array.isArray(item.citations) ? item.citations : [],
      chatMessageId: item.id,
    },
  ]);
}

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceSettings | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [selectedSource, setSelectedSource] = useState<Citation | null>(null);
  const [sourceDetails, setSourceDetails] = useState<Citation | null>(null);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [sourceError, setSourceError] = useState<string | null>(null);
  const [retryQuestion, setRetryQuestion] = useState<string | null>(null);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [feedbackLoadingMessageId, setFeedbackLoadingMessageId] = useState<string | null>(null);
  const [expandedFeedbackMessageId, setExpandedFeedbackMessageId] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessionSearch, setSessionSearch] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [answerMode, setAnswerMode] = useState<(typeof ANSWER_MODES)[number]["value"]>("detailed");
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const startedAtRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const typingQueueRef = useRef("");
  const typingIntervalRef = useRef<number | null>(null);
  const typingMessageIdRef = useRef<string | null>(null);
  const pendingCompletionRef = useRef<{
    messageId: string;
    payload: {
      answer: string;
      citations: Citation[];
      followUps: string[];
      chatMessageId?: string;
      statusMessage?: string;
      confidence?: "high" | "medium" | "low";
    };
  } | null>(null);
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 56,
    maxHeight: 192,
  });
  const sessionParam = searchParams.get("session");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setInput((prev) => {
            const trimmed = prev.trim();
            const connector = trimmed ? " " : "";
            return `${trimmed}${connector}${finalTranscript.trim()}`;
          });
          setTimeout(() => adjustHeight(), 10);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === "aborted") {
          // 'aborted' is a benign lifecycle status triggered when stopping recognition programmatically
          return;
        }
        console.warn("Speech recognition warning:", event.error);
        setIsRecording(false);

        if (event.error === "not-allowed") {
          toast.error("Microphone permission denied. Please allow microphone access in your browser settings.");
        } else if (event.error === "network") {
          toast.error("Network error during speech recognition. Please check your network connection.");
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    };
  }, [adjustHeight]);

  const toggleRecording = () => {
    if (!speechSupported) {
      toast.error("Speech recognition is not supported on this browser. Please try using Chrome, Edge, or Safari.");
      return;
    }
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  useEffect(() => {
    async function loadChatContext() {
      try {
        const [currentProfile, currentWorkspace] = await Promise.all([
          getCurrentUserProfile(),
          getCurrentWorkspaceSettings(),
        ]);

        setProfile(currentProfile);
        setWorkspace(currentWorkspace);

        if (!currentProfile?.workspace_id) {
          setSessions([]);
          return;
        }

        await loadSessions();
      } catch (error) {
        setHistoryError(
          error instanceof Error ? error.message : "Unable to load chats right now.",
        );
      } finally {
        setHistoryLoading(false);
        setSessionsLoading(false);
      }
    }

    void loadChatContext();
  }, []);

  useEffect(() => {
    if (sessionsLoading) {
      return;
    }

    if (!sessionParam) {
      setActiveSessionId(null);
      setMessages([]);
      setRetryQuestion(null);
      return;
    }

    if (sessionParam !== activeSessionId) {
      void loadSession(sessionParam, false);
    }
  }, [activeSessionId, sessionParam, sessionsLoading]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, sourceDetails]);

  useEffect(() => {
    if (!loading) {
      setElapsedSeconds(0);
      return;
    }

    const interval = window.setInterval(() => {
      if (!startedAtRef.current) {
        return;
      }

      setElapsedSeconds((Date.now() - startedAtRef.current) / 1000);
    }, 100);

    return () => window.clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    return () => {
      stopTypingBuffer();
    };
  }, []);

  const loadSessions = async () => {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      throw new Error("Authentication session expired");
    }

    const response = await fetch("/api/chat/sessions", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to load chats");
    }

    setSessions(data.sessions || []);
  };

  const notifySessionSidebar = () => {
    window.dispatchEvent(new Event("springvox-chat-sessions-changed"));
  };

  const loadSession = async (sessionId: string, closeHistory = true) => {
    try {
      setHistoryLoading(true);
      setHistoryError(null);

      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error("Authentication session expired");
      }

      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to load chat");
      }

      setActiveSessionId(sessionId);
      setMessages(mapStoredMessagesToThread(data.messages || []));
      setRetryQuestion(null);
      if (sessionParam !== sessionId) {
        router.replace(`/dashboard/chat?session=${sessionId}`);
      }
      if (closeHistory) {
        setHistoryOpen(false);
      }
    } catch (error) {
      setHistoryError(
        error instanceof Error ? error.message : "Unable to load that chat.",
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  const createNewChat = async () => {
    try {
      setHistoryError(null);
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error("Authentication session expired");
      }

      const response = await fetch("/api/chat/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to create chat");
      }

      setActiveSessionId(data.session.id);
      setMessages([]);
      setRetryQuestion(null);
      setInput("");
      adjustHeight(true);
      setHistoryOpen(false);
      await loadSessions();
      notifySessionSidebar();
      router.replace(`/dashboard/chat?session=${data.session.id}`);
    } catch (error) {
      setHistoryError(
        error instanceof Error ? error.message : "Unable to create a new chat.",
      );
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      setHistoryError(null);
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error("Authentication session expired");
      }

      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete chat");
      }

      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setMessages([]);
        setRetryQuestion(null);
        router.replace("/dashboard/chat");
      }

      setDeleteSessionId(null);
      await loadSessions();
      notifySessionSidebar();
    } catch (error) {
      setHistoryError(
        error instanceof Error ? error.message : "Unable to delete that chat.",
      );
    }
  };

  const handleCopyAnswer = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedIndex(id);
    window.setTimeout(
      () => setCopiedIndex((current) => (current === id ? null : current)),
      1800,
    );
  };

  const updateMessage = (messageId: string, updater: (message: Message) => Message) => {
    setMessages((currentMessages) =>
      currentMessages.map((message) =>
        message.id === messageId ? updater(message) : message,
      ),
    );
  };

  const stopTypingBuffer = () => {
    if (typingIntervalRef.current) {
      window.clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
    typingQueueRef.current = "";
    typingMessageIdRef.current = null;
    pendingCompletionRef.current = null;
  };

  const finalizePendingCompletion = () => {
    const pending = pendingCompletionRef.current;
    if (!pending) {
      return;
    }

    updateMessage(pending.messageId, (message) => ({
      ...message,
      content: pending.payload.answer || message.content,
      citations: pending.payload.citations || [],
      followUps: pending.payload.followUps || [],
      statusMessage: pending.payload.statusMessage || message.statusMessage,
      confidence: pending.payload.confidence || message.confidence,
      chatMessageId: pending.payload.chatMessageId,
    }));

    pendingCompletionRef.current = null;
    if (typingIntervalRef.current) {
      window.clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
    typingMessageIdRef.current = null;
  };

  const startTypingBuffer = (messageId: string) => {
    typingMessageIdRef.current = messageId;

    if (typingIntervalRef.current) {
      return;
    }

    typingIntervalRef.current = window.setInterval(() => {
      const activeId = typingMessageIdRef.current;
      if (!activeId) {
        stopTypingBuffer();
        return;
      }

      if (!typingQueueRef.current) {
        if (pendingCompletionRef.current) {
          finalizePendingCompletion();
        }
        return;
      }

      const nextSlice = typingQueueRef.current.slice(0, 5);
      typingQueueRef.current = typingQueueRef.current.slice(5);

      updateMessage(activeId, (message) => ({
        ...message,
        content: message.content + nextSlice,
      }));
    }, 20);
  };

  const handleSend = async (
    event?: React.FormEvent,
    explicitQuestion?: string,
  ) => {
    event?.preventDefault();

    const question = (explicitQuestion ?? input).trim();
    if (!question || loading) {
      return;
    }

    if (isRecording) {
      try {
        recognitionRef.current?.stop();
      } catch (e) {}
      setIsRecording(false);
    }

    stopTypingBuffer();

    const generateId = () => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
      }
      return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    };

    const userMessageId = generateId();
    const assistantMessageId = generateId();

    setMessages((currentMessages) => [
      ...currentMessages,
      { id: userMessageId, role: "user", content: question },
      { id: assistantMessageId, role: "ai", content: "", statusMessage: "Thinking..." },
    ]);
    setActiveMessageId(assistantMessageId);
    setRetryQuestion(question);
    setLoading(true);
    setHistoryError(null);
    setInput("");
    adjustHeight(true);
    startedAtRef.current = Date.now();

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error("Authentication session expired");
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          question,
          session_id: activeSessionId,
          answer_mode: answerMode,
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error("Query failed");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          const eventMatch = part.match(/^event:\s*(.+)$/m);
          const dataMatch = part.match(/^data:\s*(.+)$/m);

          if (!dataMatch) {
            continue;
          }

          const eventName = eventMatch?.[1]?.trim() || "message";
          const payload = JSON.parse(dataMatch[1]);

          if (eventName === "status") {
            updateMessage(assistantMessageId, (message) => ({
              ...message,
              statusMessage: String(payload.message || ""),
            }));
          }

          if (eventName === "chunk") {
            typingQueueRef.current += String(payload.delta || "");
            startTypingBuffer(assistantMessageId);
          }

          if (eventName === "complete") {
            const sessionId =
              typeof payload.sessionId === "string" ? payload.sessionId : null;
            if (sessionId) {
              setActiveSessionId(sessionId);
              void loadSessions();
              notifySessionSidebar();
              router.replace(`/dashboard/chat?session=${sessionId}`);
            }

            const completionPayload = {
              answer: String(payload.answer || ""),
              citations: Array.isArray(payload.citations)
                ? (payload.citations as Citation[])
                : [],
              followUps: Array.isArray(payload.followUps)
                ? (payload.followUps as string[])
                : [],
              chatMessageId:
                typeof payload.chatMessageId === "string"
                  ? payload.chatMessageId
                  : undefined,
              statusMessage: String(payload.statusMessage || ""),
              confidence:
                payload.confidence === "high" ||
                payload.confidence === "medium" ||
                payload.confidence === "low"
                  ? payload.confidence
                  : undefined,
            };

            if (typingQueueRef.current) {
              pendingCompletionRef.current = {
                messageId: assistantMessageId,
                payload: completionPayload,
              };
            } else {
              pendingCompletionRef.current = {
                messageId: assistantMessageId,
                payload: completionPayload,
              };
              finalizePendingCompletion();
            }
          }

          if (eventName === "error") {
            throw new Error(String(payload.message || "Query failed"));
          }
        }
      }
    } catch (error) {
      stopTypingBuffer();
      if ((error as Error).name === "AbortError") {
        updateMessage(assistantMessageId, (message) => ({
          ...message,
          statusMessage: "Generation stopped.",
        }));
      } else {
        updateMessage(assistantMessageId, (message) => ({
          ...message,
          content:
            message.content ||
            "Sorry, I encountered an error while preparing your answer.",
          statusMessage: "Could not finish the answer. Please try again.",
          error: true,
        }));
      }
    } finally {
      setLoading(false);
      setActiveMessageId(null);
      startedAtRef.current = null;
      abortControllerRef.current = null;
    }
  };

  const handleStopGenerating = () => {
    stopTypingBuffer();
    abortControllerRef.current?.abort();
  };

  const openSource = async (citation: Citation) => {
    setSelectedSource(citation);
    setSourceDetails(citation);
    setSourceError(null);

    if (!citation.document_id) {
      return;
    }

    try {
      setSourceLoading(true);
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error("Authentication session expired");
      }

      const response = await fetch(
        `/api/sources?documentId=${encodeURIComponent(citation.document_id)}&chunkIndex=${encodeURIComponent(String(citation.chunk_index))}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Unable to load source details");
      }

      const data = await response.json();
      setSourceDetails(data.source as Citation);
    } catch (error) {
      setSourceError(
        error instanceof Error ? error.message : "Unable to load source details",
      );
    } finally {
      setSourceLoading(false);
    }
  };

  const closeSource = () => {
    setSelectedSource(null);
    setSourceDetails(null);
    setSourceLoading(false);
    setSourceError(null);
  };

  const submitFeedback = async (messageId: string, rating: FeedbackRating) => {
    const targetMessage = messages.find((message) => message.id === messageId);
    if (!targetMessage?.chatMessageId) {
      return;
    }

    try {
      setFeedbackLoadingMessageId(messageId);
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error("Authentication session expired");
      }

      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          chatMessageId: targetMessage.chatMessageId,
          rating,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save feedback");
      }

      updateMessage(messageId, (message) => ({
        ...message,
        feedbackSubmitted: true,
        feedbackRating: rating,
      }));
      setExpandedFeedbackMessageId(null);
    } catch {
      updateMessage(messageId, (message) => ({
        ...message,
        feedbackSubmitted: true,
      }));
    } finally {
      setFeedbackLoadingMessageId(null);
    }
  };

  const isViewer = profile?.role === "viewer";
  const assistantName =
    workspace?.assistant_name ||
    (isViewer ? "SpringVox Assistant" : "SpringVox Knowledge AI");
  const companyName = workspace?.name || "your company";
  const activeSession = sessions.find((session) => session.id === activeSessionId) || null;
  const filteredSessions = sessions.filter((session) =>
    session.title.toLowerCase().includes(sessionSearch.toLowerCase()),
  );
  const activeSessionTitle = activeSession?.title || "Current chat";

  const historyPanel = (
    <ChatHistoryPanel
      sessions={filteredSessions}
      loading={sessionsLoading}
      search={sessionSearch}
      onSearchChange={setSessionSearch}
      activeSessionId={activeSessionId}
      onNewChat={createNewChat}
      onOpenSession={(sessionId) => void loadSession(sessionId)}
      onDeleteSession={(sessionId) => setDeleteSessionId(sessionId)}
      disabled={loading}
    />
  );

  return (
    <>
      <div className={cn("admin-page", isViewer && "px-0")}>
        {!isViewer && (
          <AppPageHeader
            eyebrow=""
            title="Ask Questions"
            subtitle={`Ask questions from ${companyName}'s approved documents.`}
          />
        )}

        <div
          className={cn(
            isViewer
              ? "grid grid-cols-1 gap-4"
              : "flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6",
          )}
        >
          {!isViewer && (
            <aside className="hidden lg:sticky lg:top-6 lg:block lg:w-[18.5rem] lg:shrink-0">
              {historyPanel}
            </aside>
          )}

          <div className="min-w-0">
            {!isViewer && (
            <div className="mb-3 flex items-center justify-between gap-3 lg:hidden">
              <button
                type="button"
                onClick={() => setHistoryOpen(true)}
                aria-label="Open recent chats"
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <History size={16} />
                Recent Chats
              </button>
              <AppButton
                type="button"
                tone="secondary"
                onClick={createNewChat}
                disabled={loading}
                className="shrink-0"
              >
                <MessageSquarePlus size={16} />
                New Chat
              </AppButton>
            </div>
            )}

            {historyError ? (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {historyError}
              </div>
            ) : null}

            <div className={cn(
              "relative isolate flex min-w-0 flex-col overflow-hidden rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.94)_0%,rgba(255,255,255,0.98)_52%,rgba(248,250,252,0.96)_100%)] shadow-[0_22px_70px_rgba(15,23,42,0.07)]",
              isViewer
                ? "mx-auto h-[calc(100dvh-155px)] max-w-4xl"
                : "mx-auto h-[calc(100dvh-165px)] max-w-4xl lg:mx-0 lg:max-w-none sm:h-[calc(100dvh-170px)]"
            )}>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.045)_1px,transparent_1px)] bg-[size:44px_44px]"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-0 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-200/30 blur-3xl"
              />
              <div
                ref={scrollRef}
                role="log"
                aria-live="polite"
                aria-label="Chat conversation"
                className={cn(
                  "flex-1 overflow-y-auto scrollbar-hide",
                  isViewer
                    ? "px-1 pb-28 pt-4 sm:px-4 sm:pb-32"
                    : "px-0 pb-32 pt-5 sm:px-2 sm:pb-36"
                )}
              >
                {historyLoading ? (
                  <div className="flex items-center gap-3 pt-10 text-sm text-slate-500">
                    <Loader2 size={18} className="animate-spin text-teal-600" />
                    Loading your chat...
                  </div>
                ) : messages.length === 0 ? (
                  <div className={cn(
                    "flex h-full flex-col items-center justify-center text-center",
                    isViewer ? "space-y-5 px-4 pt-6" : "space-y-5 px-4 pt-6"
                  )}>
                    <div className={cn(
                      "flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-[0_18px_40px_rgba(15,23,42,0.10)] backdrop-blur"
                    )}>
                      <SpringVoxLogo
                        variant="mark"
                        theme="dark"
                        className="h-10 w-10 rounded-xl"
                        imageClassName="h-10"
                      />
                    </div>
                    <div className="space-y-3">
                      <h2 className={cn(
                        "font-semibold tracking-tight text-slate-900",
                        isViewer ? "text-2xl sm:text-3xl" : "text-2xl sm:text-3xl"
                      )}>
                        {messages.length === 0 && !activeSessionId ? (
                          <>
                            Hi, I&apos;m <span className="text-teal-700">{assistantName}</span>.
                          </>
                        ) : (
                          "Ask your first question"
                        )}
                      </h2>
                      <p className={cn(
                        "max-w-xl leading-7 text-slate-500",
                        isViewer ? "text-sm sm:text-base" : "text-sm sm:text-base"
                      )}>
                        Ask questions from your organisation&apos;s approved documents.
                      </p>
                    </div>
                    <div className={cn(
                      "flex w-full max-w-3xl flex-wrap gap-2 sm:gap-3",
                      isViewer ? "justify-center" : "justify-center"
                    )}>
                      {EMPTY_PROMPTS.map((prompt) => (
                        <button
                          type="button"
                          key={prompt}
                          onClick={() => setInput(prompt)}
                          className={cn(
                            "rounded-full border border-slate-200 bg-white text-slate-700 transition-all hover:border-cyan-200 hover:bg-cyan-50",
                            isViewer ? "px-4 py-2.5 text-sm shadow-sm" : "px-4 py-2.5 text-sm shadow-sm"
                          )}
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className="mb-7 animate-in fade-in slide-in-from-bottom-2 duration-300"
                    >
                      <div
                        className={cn(
                      "space-y-3",
                      message.role === "user"
                            ? "ml-auto max-w-[92%] sm:max-w-[70%]"
                            : "max-w-full",
                        )}
                      >
                        {message.role === "user" ? (
                            <div className={cn(
                              "rounded-2xl rounded-br-md bg-slate-900 text-white shadow-sm",
                              isViewer ? "px-5 py-3.5 text-[15px] leading-7" : "px-5 py-3.5 text-[15px] leading-7"
                            )}>
                            <div className="whitespace-pre-wrap wrap-anywhere">{message.content}</div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white p-1.5 shadow-sm">
                                <SpringVoxLogo
                                  variant="mark"
                                  theme="dark"
                                  className="h-5 w-5"
                                  imageClassName="h-5"
                                />
                              </div>
                              <span className="font-medium text-slate-600">
                                {assistantName}
                              </span>
                            </div>

                            {message.confidence && (
                              <div className="pl-0 sm:pl-10">
                                <span className={cn(
                                  "inline-flex rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em]",
                                  getConfidenceClass(message.confidence),
                                )}>
                                  {formatConfidence(message.confidence)} Confidence
                                </span>
                              </div>
                            )}

                            {!!message.content && (
                              <div className={cn(
                                "markdown-container overflow-hidden pl-0 text-slate-800",
                                isViewer ? "text-[15px] leading-8 sm:pl-10" : "text-[15px] leading-8 sm:pl-10"
                              )}>
                                <ReactMarkdown>{message.content}</ReactMarkdown>
                              </div>
                            )}

                            {(message.statusMessage ||
                              (loading && activeMessageId === message.id)) && (
                              <div className="pl-0 sm:pl-10">
                                <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow-sm">
                                  {loading && activeMessageId === message.id ? (
                                    <Loader2
                                      size={13}
                                      className="animate-spin text-teal-600"
                                    />
                                  ) : (
                                    <ShieldCheck
                                      size={13}
                                      className="text-teal-600"
                                    />
                                  )}
                                  <span>
                                    {getVisibleStatus(
                                      message.statusMessage || "",
                                      isViewer,
                                      loading && activeMessageId === message.id,
                                    )}
                                  </span>
                                  {loading && activeMessageId === message.id && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">
                                      <ThinkingDots />
                                      {elapsedSeconds.toFixed(1)}s
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="pl-0 sm:pl-10">
                              <div className="flex flex-wrap items-center gap-1.5">
                                {!!message.content && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleCopyAnswer(message.content, message.id)
                                    }
                                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                                  >
                                    {copiedIndex === message.id ? (
                                      <Check size={12} className="text-green-600" />
                                    ) : (
                                      <Copy size={12} />
                                    )}
                                    {copiedIndex === message.id ? "Copied" : "Copy"}
                                  </button>
                                )}
                                {message.error && retryQuestion && (
                                  <button
                                    type="button"
                                    onClick={(event) => handleSend(event, retryQuestion)}
                                    disabled={loading}
                                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                                  >
                                    <RefreshCw size={12} />
                                    Retry
                                  </button>
                                )}
                                {loading && activeMessageId === message.id && (
                                  <button
                                    type="button"
                                    onClick={handleStopGenerating}
                                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                                  >
                                    <Square size={11} className="fill-current" />
                                    Stop
                                  </button>
                                )}
                              </div>
                            </div>

                            {message.citations && message.citations.length > 0 && (
                              <CitationList
                                citations={message.citations}
                                onOpenSource={openSource}
                              />
                            )}

                            {message.followUps && message.followUps.length > 0 && (
                              <FollowUpChips
                                followUps={message.followUps}
                                disabled={loading}
                                onSelect={(followUp) => void handleSend(undefined, followUp)}
                              />
                            )}

                            {message.chatMessageId && (
                              <FeedbackRow
                                loading={feedbackLoadingMessageId === message.id}
                                submitted={message.feedbackSubmitted === true}
                                rating={message.feedbackRating || null}
                                expanded={expandedFeedbackMessageId === message.id}
                                onHelpful={() =>
                                  submitFeedback(message.id, "helpful")
                                }
                                onNotHelpful={() =>
                                  submitFeedback(message.id, "not_helpful")
                                }
                                onToggleMore={() =>
                                  setExpandedFeedbackMessageId((current) =>
                                    current === message.id ? null : message.id,
                                  )
                                }
                                onSelectMore={(rating) =>
                                  submitFeedback(message.id, rating)
                                }
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className={cn(
                  "sticky bottom-0 mt-auto bg-[linear-gradient(180deg,rgba(248,250,252,0)_0%,rgba(248,250,252,0.92)_24%,rgba(248,250,252,1)_100%)] pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-6",
                isViewer ? "px-1 pt-4 sm:px-4 sm:pb-6 sm:pt-5" : "px-0 pt-4 sm:px-2 sm:pb-5 sm:pt-5"
              )}>
                <div className="mx-auto mb-3 flex max-w-4xl flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    Answer mode
                  </span>
                  {ANSWER_MODES.map((mode) => (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => setAnswerMode(mode.value)}
                      disabled={loading}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                        answerMode === mode.value
                          ? "border-cyan-300 bg-cyan-50 text-cyan-800"
                          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                      )}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
                <form onSubmit={handleSend} className={cn(
                  "relative",
                  isViewer ? "mx-auto max-w-4xl" : "mx-auto max-w-4xl"
                )}>
                  <div
                    className={cn(
                      "relative rounded-2xl border bg-white/95 shadow-[0_16px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl transition",
                      inputFocused
                        ? "border-cyan-400/50 ring-4 ring-cyan-50"
                        : isRecording
                        ? "border-cyan-400/60 ring-4 ring-cyan-50"
                        : "border-slate-200/80",
                    )}
                  >
                    <button
                      type="button"
                      onClick={toggleRecording}
                      disabled={loading}
                      aria-label={isRecording ? "Stop recording speech" : "Start recording speech"}
                      title={isRecording ? "Stop recording speech" : "Start recording speech"}
                      className={cn(
                        "absolute left-3.5 bottom-2.5 z-10 rounded-full p-2.5 outline-none transition active:scale-95",
                        isRecording
                          ? "bg-cyan-700 text-white hover:bg-cyan-800 focus-visible:ring-4 focus-visible:ring-cyan-100"
                          : "bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-slate-200",
                        !speechSupported && "opacity-50 cursor-not-allowed hover:bg-slate-50 hover:text-slate-400"
                      )}
                    >
                      {isRecording ? <MicOff size={16} className="animate-pulse" /> : <Mic size={16} />}
                    </button>
                    <Textarea
                      ref={textareaRef}
                      rows={1}
                      className={cn(
                        "max-h-48 w-full resize-none border-0 bg-transparent text-slate-900 shadow-none outline-none placeholder:text-slate-400 focus-visible:ring-0",
                        isViewer
                          ? "min-h-[58px] py-3.5 pl-14 pr-5 text-[15px] leading-7 sm:pr-28"
                          : "min-h-[56px] py-3.5 pl-12 pr-4 text-sm leading-7 sm:pl-14 sm:pr-28"
                      )}
                      placeholder={
                        isRecording
                          ? "Listening... Speak clearly now..."
                          : "Ask anything from your approved documents..."
                      }
                      aria-label="Ask a question from approved documents"
                      value={input}
                      onChange={(event) => {
                        setInput(event.target.value);
                        adjustHeight();
                      }}
                      onFocus={() => setInputFocused(true)}
                      onBlur={() => setInputFocused(false)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          void handleSend();
                        }
                      }}
                      disabled={loading}
                      style={{ overflow: "hidden" }}
                    />
                    <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-4 py-3 sm:absolute sm:bottom-3 sm:right-3 sm:border-t-0 sm:bg-transparent sm:p-0">
                      {loading && (
                        <button
                          aria-label="Stop generating answer"
                          type="button"
                          onClick={handleStopGenerating}
                          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-2 text-[11px] text-slate-500 transition-colors hover:text-slate-800 sm:px-3"
                        >
                          <Square size={11} className="fill-current" />
                          <span className="hidden sm:inline">Stop</span>
                        </button>
                      )}
                      <button
                        aria-label="Send message"
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="rounded-full bg-[#0d1f35] p-2.5 text-white shadow-[0_4px_12px_rgba(15,23,42,0.14)] transition hover:bg-[#132744] focus-visible:ring-4 focus-visible:ring-cyan-100 active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                </form>
                <p className="mt-3 text-center text-xs text-slate-400">
                  {isViewer
                    ? "Answers use approved documents when support is available."
                    : "Answers use approved company documents and may include sources."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!isViewer && (
      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent
          side="left"
          className="w-[min(100vw-1rem,22rem)] border-r border-slate-200 bg-white p-0"
        >
          <SheetHeader className="border-b border-slate-200 px-5 py-4">
            <SheetTitle>Recent Chats</SheetTitle>
            <SheetDescription className="sr-only">
              Browse, reopen, or delete your recent private chat sessions.
            </SheetDescription>
          </SheetHeader>
          <div className="p-4">
            <ChatHistoryPanel
              sessions={filteredSessions}
              loading={sessionsLoading}
              search={sessionSearch}
              onSearchChange={setSessionSearch}
              activeSessionId={activeSessionId}
              onNewChat={createNewChat}
              onOpenSession={(sessionId) => void loadSession(sessionId, true)}
              onDeleteSession={(sessionId) => setDeleteSessionId(sessionId)}
              disabled={loading}
            />
          </div>
        </SheetContent>
      </Sheet>
      )}

      <ConfirmDialog
        open={Boolean(deleteSessionId)}
        onOpenChange={(open) => {
          if (!open) setDeleteSessionId(null);
        }}
        title="Delete chat"
        description="This conversation will be removed from your chat history."
        confirmLabel="Delete chat"
        cancelLabel="Keep chat"
        confirmTone="destructive"
        loading={false}
        onConfirm={async () => {
          if (!deleteSessionId) return;
          await deleteSession(deleteSessionId);
        }}
      />

      <SourceDrawer
        open={!!selectedSource}
        onClose={closeSource}
        citation={sourceDetails}
        loading={sourceLoading}
        error={sourceError}
        managerView={!!profile && isWorkspaceAdminRole(profile.role)}
        sessionTitle={activeSessionTitle}
      />
    </>
  );
}

function ChatHistoryPanel({
  sessions,
  loading,
  search,
  onSearchChange,
  activeSessionId,
  onNewChat,
  onOpenSession,
  onDeleteSession,
  disabled,
}: {
  sessions: ChatSessionSummary[];
  loading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  activeSessionId: string | null;
  onNewChat: () => void;
  onOpenSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex h-full min-h-[24rem] flex-col rounded-[28px] border border-slate-200 bg-white shadow-[0_14px_28px_rgba(15,23,42,0.05)]">
      <div className="border-b border-slate-200 p-4">
        <AppButton
          type="button"
          onClick={onNewChat}
          disabled={disabled}
          className="w-full justify-center"
        >
          <MessageSquarePlus size={16} />
          New Chat
        </AppButton>
        <div className="relative mt-3">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search chats..."
            aria-label="Search recent chats"
            className="h-11 rounded-xl border-slate-200 bg-white pl-9 text-sm shadow-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
          Recent Chats
        </div>
        {loading ? (
          <div className="flex items-center gap-3 rounded-2xl px-3 py-4 text-sm text-slate-500">
            <Loader2 size={16} className="animate-spin text-teal-600" />
            Loading chats...
          </div>
        ) : sessions.length === 0 ? (
          <EmptyState
            icon={History}
            title="No chats yet"
            description="Start a new conversation to see it here."
            className="px-4 py-10"
          />
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => {
              const active = activeSessionId === session.id;

              return (
                <div
                  key={session.id}
                  className={cn(
                    "group flex items-start gap-2 rounded-2xl border px-3 py-3 transition",
                    active
                      ? "border-cyan-200 bg-cyan-50/70"
                      : "border-transparent hover:border-slate-200 hover:bg-slate-50/70",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onOpenSession(session.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p
                      className={cn(
                        "truncate text-sm font-semibold",
                        active ? "text-cyan-900" : "text-slate-900",
                      )}
                      title={session.title}
                    >
                      {session.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatSessionDate(session.updated_at)}
                    </p>
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete chat ${session.title}`}
                    title={`Delete ${session.title}`}
                    onClick={() => onDeleteSession(session.id)}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function formatSessionDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function getVisibleStatus(
  statusMessage: string,
  isViewer: boolean,
  isActive: boolean,
) {
  if (isViewer && isActive) {
    return "Searching approved documents...";
  }

  if (isViewer && !isActive) {
    if (statusMessage.toLowerCase().includes("no supported answer")) {
      return "I couldn't find an answer in the uploaded documents.";
    }

    return "Answer prepared from uploaded documents.";
  }

  if (isActive) {
    return "Thinking...";
  }

  return statusMessage || "Thinking...";
}

function FollowUpChips({
  followUps,
  disabled,
  onSelect,
}: {
  followUps: string[];
  disabled: boolean;
  onSelect: (followUp: string) => void;
}) {
  return (
    <div className="pl-0 sm:pl-10">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        Suggested follow-ups
      </p>
      <div className="flex flex-wrap gap-2">
        {followUps.slice(0, 5).map((followUp) => (
          <button
            key={followUp}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(followUp)}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-left text-xs font-medium text-slate-600 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {followUp}
          </button>
        ))}
      </div>
    </div>
  );
}

function CitationList({
  citations,
  onOpenSource,
}: {
  citations: Citation[];
  onOpenSource: (citation: Citation) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const uniqueCitations = citations
    .filter((citation, index, allCitations) => {
      return (
        allCitations.findIndex(
          (item) =>
            item.filename === citation.filename &&
            item.chunk_index === citation.chunk_index,
        ) === index
      );
    })
    .slice(0, 5);

  return (
    <div className="pl-0 sm:pl-10">
      <button
        type="button"
        onClick={() => setExpanded((currentValue) => !currentValue)}
        aria-expanded={expanded}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-left text-xs text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 shadow-sm"
      >
        <ShieldCheck size={12} className="text-teal-600" />
        <span>Sources</span>
        <span className="text-slate-500">· {uniqueCitations.length}</span>
        {expanded ? (
          <ChevronUp size={14} className="text-slate-500" />
        ) : (
          <ChevronDown size={14} className="text-slate-500" />
        )}
      </button>

      {expanded && (
        <div className="mt-3 grid gap-2.5">
          {uniqueCitations.map((citation) => (
            <button
              type="button"
              key={`${citation.filename}-${citation.chunk_index}`}
              onClick={() => onOpenSource(citation)}
              aria-label={`Open source ${citation.filename} section ${citation.chunk_index}`}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition-colors hover:border-teal-300 hover:bg-teal-50/30"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-teal-200 bg-teal-50">
                  <FileText size={14} className="text-teal-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900" title={citation.filename}>
                        {citation.filename}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Section {citation.chunk_index}
                        {citation.document_category ? ` · ${citation.document_category}` : ""}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-[11px] text-teal-600">Open</span>
                      {citation.relevance_score ? (
                        <p className="mt-1 text-[10px] text-slate-400">
                          {(citation.relevance_score * 100).toFixed(0)}% relevance
                        </p>
                      ) : null}
                    </div>
                  </div>
                  {citation.confidence ? (
                    <span className={cn(
                      "mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]",
                      getConfidenceClass(citation.confidence),
                    )}>
                      {formatConfidence(citation.confidence)}
                    </span>
                  ) : null}
                  <p className="mt-2 text-xs leading-6 text-slate-500">
                    {truncate(citation.preview, 120)}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {citations.length > uniqueCitations.length && (
        <p className="mt-2 text-[11px] text-slate-600">
          Showing top 5 unique sources
        </p>
      )}
    </div>
  );
}

function formatConfidence(confidence: "high" | "medium" | "low") {
  return confidence.charAt(0).toUpperCase() + confidence.slice(1);
}

function getConfidenceClass(confidence: "high" | "medium" | "low") {
  if (confidence === "high") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (confidence === "medium") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-red-200 bg-red-50 text-red-700";
}

function FeedbackRow({
  loading,
  submitted,
  rating,
  expanded,
  onHelpful,
  onNotHelpful,
  onToggleMore,
  onSelectMore,
}: {
  loading: boolean;
  submitted: boolean;
  rating: FeedbackRating | null;
  expanded: boolean;
  onHelpful: () => void;
  onNotHelpful: () => void;
  onToggleMore: () => void;
  onSelectMore: (rating: FeedbackRating) => void;
}) {
  return (
    <div className="pl-0 sm:pl-10">
      {submitted ? (
        <p className="text-xs text-slate-500">
          Thanks for the feedback{rating ? ` · ${rating.replaceAll("_", " ")}` : ""}.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={onHelpful}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
            >
              <ThumbsUp size={12} />
              Helpful
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={onNotHelpful}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
            >
              <ThumbsDown size={12} />
              Not helpful
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={onToggleMore}
              aria-expanded={expanded}
              aria-label="Show more feedback options"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700"
            >
              More options
            </button>
            {loading && <Loader2 size={13} className="animate-spin text-teal-600" />}
          </div>

          {expanded && (
            <div className="mt-2 flex flex-wrap gap-2">
              {EXTRA_FEEDBACK_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => onSelectMore(option)}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
                >
                  {option.replaceAll("_", " ")}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SourceDrawer({
  open,
  onClose,
  citation,
  loading,
  error,
  managerView,
  sessionTitle,
}: {
  open: boolean;
  onClose: () => void;
  citation: Citation | null;
  loading: boolean;
  error: string | null;
  managerView: boolean;
  sessionTitle: string;
}) {
  const [copied, setCopied] = useState(false);

  const excerpt = citation?.chunk_text || citation?.preview || "";

  const handleCopyExcerpt = async () => {
    await navigator.clipboard.writeText(excerpt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen) {
        onClose();
      }
    }}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full max-w-full border-l border-slate-200 bg-white p-0 sm:max-w-xl"
      >
        <div className="flex h-full min-w-0 flex-col">
          <SheetHeader className="border-b border-slate-200 px-4 py-4 sm:px-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                  {managerView ? "Document Source" : "Source"}
                </p>
                <SheetTitle className="mt-1 wrap-anywhere text-left text-lg font-semibold text-slate-900">
                  {citation?.filename || "Source details"}
                </SheetTitle>
                <SheetDescription className="sr-only">
                  View source details and excerpt for the selected citation from {sessionTitle}.
                </SheetDescription>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close source panel"
                className="rounded-xl border border-slate-200 p-2.5 text-slate-400 transition-colors hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-5">
            {loading && (
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                <Loader2 size={16} className="animate-spin text-teal-600" />
                Loading source details...
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                  Section
                </p>
                <p className="mt-2 text-sm text-slate-800">
                  Section {citation?.chunk_index || 0}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                    Excerpt
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyExcerpt}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 transition-colors hover:text-slate-800"
                  >
                    {copied ? (
                      <Check size={12} className="text-green-400" />
                    ) : (
                      <Copy size={12} />
                    )}
                    {copied ? "Copied" : "Copy excerpt"}
                  </button>
                </div>
                <p className="mt-3 whitespace-pre-wrap wrap-anywhere text-sm leading-7 text-slate-700">
                  {excerpt || "No excerpt available."}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                  Preview
                </p>
                <p className="mt-3 wrap-anywhere text-sm leading-7 text-slate-600">
                  {citation?.preview || "No preview available."}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                  Uploaded
                </p>
                <p className="mt-3 text-sm text-slate-600">
                  {citation?.uploaded_at
                    ? new Date(citation.uploaded_at).toLocaleString()
                    : "Unknown"}
                </p>
              </div>

              {managerView && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                    Source metadata
                  </p>
                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                    <p className="wrap-anywhere">Document ID: {citation?.document_id || "Unknown"}</p>
                    <p className="wrap-anywhere">Uploaded by: {citation?.uploaded_by || "Unknown"}</p>
                    <p>Section: {citation?.chunk_index || 0}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block h-1 w-1 rounded-full bg-teal-500"
          style={{
            animation: "thinking-dot 1.2s ease-in-out infinite",
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes thinking-dot {
          0%, 100% { opacity: 0.3; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1.15); }
        }
      `}</style>
    </span>
  );
}
