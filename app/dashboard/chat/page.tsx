"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  FileText,
  History,
  Loader2,
  MessageSquarePlus,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";

import {
  getAccessToken,
  getCurrentUserProfile,
  getCurrentWorkspaceSettings,
} from "@/src/lib/auth-client";
import { cn } from "@/src/lib/utils";
import {
  isWorkspaceAdminRole,
  type FeedbackRating,
  type UserProfile,
  type WorkspaceSettings,
} from "@/src/lib/workspace";
import { AppButton } from "@/src/components/ui/app-button";
import { BrandLogo } from "@/src/components/brand/BrandLogo";
import { ChatComposer } from "@/src/components/chat/ChatComposer";
import { ViewerChatView } from "@/src/components/viewer/ViewerChatView";
import { ViewerSourceDrawer } from "@/src/components/viewer/ViewerSourceDrawer";
import { ChatMessage } from "@/src/components/chat/ChatMessage";
import { ConfirmDialog } from "@/src/components/ui/confirm-dialog";
import { EmptyState } from "@/src/components/ui/empty-state";
import { FilePreviewDrawer } from "@/src/components/file-preview/FilePreviewDrawer";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";

export type Citation = {
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

export type Message = {
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

type AnswerMode = "summary" | "detailed" | "executive" | "technical";

type SpeechResult = ArrayLike<{ transcript: string }> & { isFinal: boolean };
type SpeechResultList = ArrayLike<SpeechResult>;
type SpeechEvent = { resultIndex: number; results: SpeechResultList };
type SpeechErrorEvent = { error: string };
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechEvent) => void) | null;
  onerror: ((event: SpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

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
    if (textareaRef.current)
      textareaRef.current.style.height = `${minHeight}px`;
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
  const [profileReady, setProfileReady] = useState(false);
  const [workspace, setWorkspace] = useState<WorkspaceSettings | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [selectedSource, setSelectedSource] = useState<Citation | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{
    id: string;
    filename: string;
  } | null>(null);
  const [sourceDetails, setSourceDetails] = useState<Citation | null>(null);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [sourceError, setSourceError] = useState<string | null>(null);
  const [retryQuestion, setRetryQuestion] = useState<string | null>(null);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [feedbackLoadingMessageId, setFeedbackLoadingMessageId] = useState<
    string | null
  >(null);
  const [expandedFeedbackMessageId, setExpandedFeedbackMessageId] = useState<
    string | null
  >(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessionSearch, setSessionSearch] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [answerMode, setAnswerMode] =
    useState<AnswerMode>("detailed");
  const [collections, setCollections] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [scopeCollectionId, setScopeCollectionId] = useState<string>("all");
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [expandedSourceMessageId, setExpandedSourceMessageId] = useState<
    string | null
  >(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef(true);
  const lastMessageCountRef = useRef(0);
  const previousLoadingRef = useRef(false);
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
  const collectionParam = searchParams.get("collection");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const speechWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const SpeechRecognition =
      speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    const supportFrame = window.requestAnimationFrame(() => {
      setSpeechSupported(Boolean(SpeechRecognition));
    });

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: SpeechEvent) => {
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
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

      recognition.onerror = (event: SpeechErrorEvent) => {
        if (event.error === "aborted") {
          // 'aborted' is a benign lifecycle status triggered when stopping recognition programmatically
          return;
        }
        console.warn("Speech recognition warning:", event.error);
        setIsRecording(false);

        if (event.error === "not-allowed") {
          toast.error(
            "Microphone permission denied. Please allow microphone access in your browser settings.",
          );
        } else if (event.error === "network") {
          toast.error(
            "Network error during speech recognition. Please check your network connection.",
          );
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      window.cancelAnimationFrame(supportFrame);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, [adjustHeight]);

  const toggleRecording = () => {
    if (!speechSupported) {
      toast.error(
        "Speech recognition is not supported on this browser. Please try using Chrome, Edge, or Safari.",
      );
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
        setProfileReady(true);

        if (!currentProfile?.workspace_id) {
          setSessions([]);
          return;
        }

        await loadSessions();
      } catch (error) {
        setHistoryError(
          error instanceof Error
            ? error.message
            : "Unable to load chats right now.",
        );
      } finally {
        setHistoryLoading(false);
        setSessionsLoading(false);
      }
    }

    void loadChatContext();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const token = await getAccessToken();
        if (!token) return;
        const res = await fetch("/api/collections", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setCollections(
          (data.collections || []).map((c: { id: string; name: string }) => ({
            id: c.id,
            name: c.name,
          })),
        );
      } catch {
        // Collection scoping is optional.
      }
    })();
  }, []);

  useEffect(() => {
    if (sessionsLoading) return;

    const frame = window.requestAnimationFrame(() => {
      if (!sessionParam) {
        setActiveSessionId(null);
        setMessages([]);
        setRetryQuestion(null);
        return;
      }

      if (sessionParam !== activeSessionId) {
        void loadSession(sessionParam, false);
      }
    });

    return () => window.cancelAnimationFrame(frame);
    // loadSession is a hoisted declaration; the session/loading guards are the real inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSessionId, sessionParam, sessionsLoading]);

  useEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll) return;

    const messageAdded = messages.length > lastMessageCountRef.current;
    const loadingStarted = loading && !previousLoadingRef.current;
    lastMessageCountRef.current = messages.length;
    previousLoadingRef.current = loading;

    if (messageAdded || loadingStarted) {
      autoScrollRef.current = true;
    }

    if (!autoScrollRef.current) return;

    const frame = window.requestAnimationFrame(() => {
      scroll.scrollTop = scroll.scrollHeight;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [messages, loading, sourceDetails]);

  const handleChatScroll = () => {
    const scroll = scrollRef.current;
    if (!scroll) return;
    autoScrollRef.current =
      scroll.scrollHeight - scroll.scrollTop - scroll.clientHeight < 96;
  };

  useEffect(() => {
    if (!loading) {
      const frame = window.requestAnimationFrame(() => setElapsedSeconds(0));
      return () => window.cancelAnimationFrame(frame);
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

  async function loadSessions() {
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
  }



  const notifySessionSidebar = () => {
    window.dispatchEvent(new Event("springvox-chat-sessions-changed"));
  };

  async function loadSession(sessionId: string, closeHistory = true) {
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
  }



  const createNewChat = async () => {
    setHistoryError(null);
    setActiveSessionId(null);
    setMessages([]);
    setRetryQuestion(null);
    setInput("");
    setScopeCollectionId("all");
    adjustHeight(true);
    setHistoryOpen(false);
    router.replace("/dashboard/chat");
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

  const updateMessage = (
    messageId: string,
    updater: (message: Message) => Message,
  ) => {
    setMessages((currentMessages) =>
      currentMessages.map((message) =>
        message.id === messageId ? updater(message) : message,
      ),
    );
  };

  function stopTypingBuffer() {
    if (typingIntervalRef.current) {
      window.clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
    typingQueueRef.current = "";
    typingMessageIdRef.current = null;
    pendingCompletionRef.current = null;
  }



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
      } catch {}
      setIsRecording(false);
    }

    stopTypingBuffer();

    const generateId = () => {
      if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
      }
      return (
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15)
      );
    };

    const userMessageId = generateId();
    const assistantMessageId = generateId();

    setMessages((currentMessages) => [
      ...currentMessages,
      { id: userMessageId, role: "user", content: question },
      {
        id: assistantMessageId,
        role: "ai",
        content: "",
        statusMessage: "Thinking...",
      },
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
          collection_id: scopeCollectionId === "all" ? null : scopeCollectionId,
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
        const failureMessage =
          error instanceof Error && error.message
            ? error.message
            : "Sorry, I encountered an error while preparing your answer.";
        updateMessage(assistantMessageId, (message) => ({
          ...message,
          content: message.content || failureMessage,
          statusMessage: failureMessage,
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

  // Find the user question that produced a given assistant message and re-ask it.
  const handleRegenerate = (assistantMessageId: string) => {
    if (loading) return;
    const index = messages.findIndex(
      (message) => message.id === assistantMessageId,
    );
    if (index <= 0) return;
    const priorQuestion = messages[index - 1];
    if (
      !priorQuestion ||
      priorQuestion.role !== "user" ||
      !priorQuestion.content.trim()
    ) {
      return;
    }
    void handleSend(undefined, priorQuestion.content);
  };

  // Put a previous question back into the composer so the user can revise it.
  const handleEditQuestion = (content: string) => {
    if (loading) return;
    setInput(content);
    setTimeout(() => {
      adjustHeight();
      textareaRef.current?.focus();
    }, 10);
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
        error instanceof Error
          ? error.message
          : "Unable to load source details",
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
  const companyName = workspace?.name || "your company";
  const activeSession =
    sessions.find((session) => session.id === activeSessionId) || null;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setScopeCollectionId(collectionParam || "all");
    });
    return () => window.cancelAnimationFrame(frame);
  }, [collectionParam]);

  const filteredSessions = sessions.filter((session) =>
    session.title.toLowerCase().includes(sessionSearch.toLowerCase()),
  );
  const activeSessionTitle = activeSession?.title || "New conversation";

  if (!profileReady) {
    return (
      <div className="flex min-h-[calc(100dvh-52px)] items-center justify-center">
        <div className="flex items-center gap-2 text-[12px] text-[var(--ink-muted)]">
          <Loader2
            size={13}
            className="animate-spin motion-reduce:animate-none"
            aria-hidden="true"
          />
          Opening workspace…
        </div>
      </div>
    );
  }

  if (isViewer) {
    const viewerFirstName =
      profile?.full_name?.trim().split(" ")[0] ||
      profile?.email?.split("@")[0] ||
      "there";

    return (
      <>
        <ViewerChatView
          messages={messages}
          loading={loading}
          activeMessageId={activeMessageId}
          copiedIndex={copiedIndex}
          elapsedSeconds={elapsedSeconds}
          retryQuestion={retryQuestion}
          feedbackLoadingMessageId={feedbackLoadingMessageId}
          firstName={viewerFirstName}
          workspaceName={workspace?.name || "your workspace"}
          hasActiveSession={Boolean(activeSessionId)}
          input={input}
          answerMode={answerMode}
          scopeCollectionId={scopeCollectionId}
          collections={collections}
          isRecording={isRecording}
          speechSupported={speechSupported}
          inputFocused={inputFocused}
          textareaRef={textareaRef}
          onInputChange={setInput}
          onInputFocus={setInputFocused}
          onSubmit={(event) => {
            void handleSend(event);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void handleSend();
            }
          }}
          onStopGenerating={handleStopGenerating}
          onToggleRecording={toggleRecording}
          onAnswerModeChange={(value) =>
            setAnswerMode(value as typeof answerMode)
          }
          onScopeChange={setScopeCollectionId}
          onAdjustHeight={adjustHeight}
          onCopyAnswer={handleCopyAnswer}
          onEditQuestion={handleEditQuestion}
          onRegenerate={handleRegenerate}
          onRetry={(event, question) => {
            void handleSend(event, question);
          }}
          onOpenSource={(citation) => {
            void openSource(citation);
          }}
          onFollowUp={(followUp) => {
            void handleSend(undefined, followUp);
          }}
          onFeedback={submitFeedback}
          onPrompt={(prompt) => {
            void handleSend(undefined, prompt);
          }}
        />

        <ViewerSourceDrawer
          open={!!selectedSource}
          onClose={closeSource}
          citation={sourceDetails}
          loading={sourceLoading}
          error={sourceError}
          sessionTitle={activeSessionTitle}
          onViewDocument={(documentId, filename) =>
            setPreviewDoc({ id: documentId, filename })
          }
        />

        <FilePreviewDrawer
          open={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          documentId={previewDoc?.id ?? null}
          filename={previewDoc?.filename ?? ""}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex h-full min-h-0 flex-col bg-[var(--canvas)]">
        <div className="flex h-[52px] shrink-0 items-center justify-between gap-3 border-b border-[var(--line)] px-4 sm:px-7">
          <div className="flex min-w-0 items-center gap-2 text-[13px]">
            <h1 className="shrink-0 text-[13px] font-medium text-[var(--ink)]">Ask</h1>
            <span aria-hidden="true" className="text-[var(--ink-muted)]">/</span>
            <span className="truncate text-[var(--ink-muted)]">{activeSessionTitle}</span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[12px] font-medium text-[var(--ink-muted)] transition-colors hover:bg-[var(--canvas-soft)] hover:text-[var(--ink)]"
            >
              <History size={14} strokeWidth={1.5} />
              <span className="hidden sm:inline">History</span>
            </button>
            <AppButton
              type="button"
              tone="secondary"
              onClick={createNewChat}
              disabled={loading}
              className="h-8 px-3 text-[12px]"
            >
              <MessageSquarePlus size={14} />
              New chat
            </AppButton>
          </div>
        </div>

        {historyError ? (
          <div className="mx-4 mt-3 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-300 sm:mx-7">
            {historyError}
          </div>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col">
          <div
            ref={scrollRef}
            onScroll={handleChatScroll}
            role="log"
            aria-live="polite"
            aria-label="Chat conversation"
            className="mx-auto w-full max-w-[768px] flex-1 overflow-y-auto px-4 pb-6 pt-8 scrollbar-hide sm:px-6"
          >
            {historyLoading && messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-[12px] text-[var(--ink-muted)]">
                <Loader2 size={14} className="mr-2 animate-spin" />
                Loading conversation…
              </div>
            ) : messages.length === 0 ? (
              <div className="flex min-h-full flex-col justify-center py-12">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface)]">
                  <BrandLogo
                    variant="mark"
                    theme="dark"
                    className="h-6 w-6"
                    imageClassName="h-6"
                  />
                </div>
                <h2 className="mt-5 text-[26px] font-medium tracking-[-0.03em] text-[var(--ink)]">
                  Ask your documents
                </h2>
                <p className="mt-2 max-w-[52ch] text-[13px] leading-6 text-[var(--ink-muted)]">
                  Answers come from {companyName}&apos;s approved documents. Every
                  reply that uses a source shows the file and section it came from.
                </p>
                <div className="mt-7 grid gap-px overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2">
                  {EMPTY_PROMPTS.map((prompt) => (
                    <button
                      type="button"
                      key={prompt}
                      onClick={() => void handleSend(undefined, prompt)}
                      className="group flex items-center justify-between gap-3 bg-[var(--canvas)] px-4 py-3 text-left text-[12px] leading-5 text-[var(--ink-soft)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--ink)]"
                    >
                      <span>{prompt}</span>
                      <span className="text-[var(--ink-muted)] transition-colors group-hover:text-[var(--accent-jade)]">
                        +
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="mb-8">
                  <ChatMessage
                    message={message}
                    isViewer={false}
                    loading={loading}
                    activeMessageId={activeMessageId}
                    copiedIndex={copiedIndex}
                    elapsedSeconds={elapsedSeconds}
                    retryQuestion={retryQuestion}
                    feedbackLoadingMessageId={feedbackLoadingMessageId}
                    expandedFeedbackMessageId={expandedFeedbackMessageId}
                    onCopyAnswer={handleCopyAnswer}
                    onEditQuestion={handleEditQuestion}
                    onRegenerate={handleRegenerate}
                    onOpenSource={(citation) => void openSource(citation)}
                    onRetry={handleSend}
                    onStopGenerating={handleStopGenerating}
                    onFollowUp={(followUp) => void handleSend(undefined, followUp)}
                    onFeedback={submitFeedback}
                    onToggleFeedback={(messageId) =>
                      setExpandedFeedbackMessageId((current) =>
                        current === messageId ? null : messageId,
                      )
                    }
                    onShowAllSources={() =>
                      setExpandedSourceMessageId((current) =>
                        current === message.id ? null : message.id,
                      )
                    }
                  />
                  {expandedSourceMessageId === message.id &&
                    message.citations &&
                    message.citations.length > 0 && (
                      <div className="mt-1">
                        <CitationList
                          citations={message.citations}
                          onOpenSource={(citation) => void openSource(citation)}
                        />
                      </div>
                    )}
                </div>
              ))
            )}
          </div>

          <div className="shrink-0 bg-[var(--canvas)] px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
            <div className="mx-auto max-w-[768px]">
              <ChatComposer
                input={input}
                loading={loading}
                isViewer={false}
                isRecording={isRecording}
                speechSupported={speechSupported}
                inputFocused={inputFocused}
                answerMode={answerMode}
                scopeCollectionId={scopeCollectionId}
                collections={collections}
                textareaRef={textareaRef}
                onInputChange={setInput}
                onInputFocus={setInputFocused}
                onSubmit={handleSend}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void handleSend();
                  }
                }}
                onStopGenerating={handleStopGenerating}
                onToggleRecording={toggleRecording}
                onAnswerModeChange={(value) =>
                  setAnswerMode(value as typeof answerMode)
                }
                onScopeChange={setScopeCollectionId}
                onAdjustHeight={adjustHeight}
              />
            </div>
          </div>
        </div>
      </div>

      {!isViewer && (
        <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
          <SheetContent
            side="left"
            className="w-[min(100vw-1rem,22rem)] border-r border-[var(--line)] bg-[var(--surface)] p-0"
          >
            <SheetHeader className="border-b border-[var(--line)] px-5 py-4">
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
        onViewDocument={(documentId, filename) =>
          setPreviewDoc({ id: documentId, filename })
        }
      />

      <FilePreviewDrawer
        open={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        documentId={previewDoc?.id ?? null}
        filename={previewDoc?.filename ?? ""}
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
    <div className="flex h-full min-h-[24rem] flex-col bg-[var(--surface)]">
      <div className="border-b border-[var(--line)] p-4">
        <AppButton
          type="button"
          onClick={onNewChat}
          disabled={disabled}
          tone="secondary"
          className="h-9 w-full justify-center text-[12px]"
        >
          <MessageSquarePlus size={15} />
          New chat
        </AppButton>
        <div className="relative mt-3">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]"
          />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search chats"
            aria-label="Search recent chats"
            className="h-9 rounded-md border-[var(--line)] bg-[var(--canvas-soft)] pl-9 text-[12px] shadow-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <div className="mb-2 px-2 text-[11px] font-medium text-[var(--ink-muted)]">
          Recent chats
        </div>
        {loading ? (
          <div className="flex items-center gap-3 rounded-[10px] px-3 py-4 text-sm text-[var(--ink-muted)]">
            <Loader2
              size={16}
              className="animate-spin text-[var(--accent-jade)]"
            />
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
                    "group flex items-start gap-2 rounded-md px-2.5 py-2 transition-colors",
                    active
                      ? "bg-[var(--accent-jade-50)]"
                      : "hover:bg-[var(--canvas-soft)]",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onOpenSession(session.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p
                      className={cn(
                        "truncate text-[12px] font-medium",
                        active
                          ? "text-[var(--accent-jade-hover)]"
                          : "text-[var(--ink)]",
                      )}
                      title={session.title}
                    >
                      {session.title}
                    </p>
                    <p className="mt-0.5 text-[10px] text-[var(--ink-muted)]">
                      {formatSessionDate(session.updated_at)}
                    </p>
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete chat ${session.title}`}
                    title={`Delete ${session.title}`}
                    onClick={() => onDeleteSession(session.id)}
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[var(--ink-muted)] opacity-100 transition-opacity hover:bg-red-500/10 hover:text-red-300 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
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

function CitationList({
  citations,
  onOpenSource,
}: {
  citations: Citation[];
  onOpenSource: (citation: Citation) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  // Group citations by filename and count references
  const groupedCitations = citations.reduce(
    (acc, citation) => {
      const existing = acc.find((item) => item.filename === citation.filename);
      if (existing) {
        existing.count += 1;
        existing.citations.push(citation);
      } else {
        acc.push({
          filename: citation.filename,
          count: 1,
          citations: [citation],
          category: citation.document_category,
          relevance_score: citation.relevance_score,
        });
      }
      return acc;
    },
    [] as Array<{
      filename: string;
      count: number;
      citations: Citation[];
      category?: string;
      relevance_score?: number;
    }>,
  );

  // Show top 5 unique documents
  const visibleGroups = groupedCitations.slice(0, 5);
  const hasMore = groupedCitations.length > 5;

  return (
    <div className="pl-0 sm:pl-10">
      <button
        type="button"
        onClick={() => setExpanded((currentValue) => !currentValue)}
        aria-expanded={expanded}
        className="inline-flex h-8 items-center gap-2 rounded-md border border-[var(--line)] px-2.5 text-left text-[11px] text-[var(--ink-soft)] transition-colors hover:bg-[var(--canvas-soft)] hover:text-[var(--ink)]"
      >
        <ShieldCheck size={12} className="text-[var(--accent-jade)]" />
        <span>Sources</span>
        <span className="text-[var(--ink-muted)]">
          · {visibleGroups.length}
        </span>
        {expanded ? (
          <ChevronUp size={14} className="text-[var(--ink-muted)]" />
        ) : (
          <ChevronDown size={14} className="text-[var(--ink-muted)]" />
        )}
      </button>

      {expanded && (
        <div className="mt-3 grid gap-2.5">
          {visibleGroups.map((group) => (
            <button
              type="button"
              key={group.filename}
              onClick={() => void onOpenSource(group.citations[0])}
              aria-label={`Open source ${group.filename} with ${group.count} references`}
              className="rounded-[10px] border border-[var(--line)] bg-[var(--surface)] px-3.5 py-3 text-left transition-colors hover:border-[var(--accent-jade-100)] hover:bg-[var(--canvas-soft)]"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--accent-jade-100)] bg-[var(--accent-jade-50)]">
                  <FileText size={14} className="text-[var(--accent-jade)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p
                        className="truncate text-sm font-medium text-[var(--ink)]"
                        title={group.filename}
                      >
                        {group.filename}
                      </p>
                      <p className="mt-1 text-[11px] text-[var(--ink-muted)]">
                        {group.count} reference{group.count !== 1 ? "s" : ""}
                        {group.category ? ` · ${group.category}` : ""}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-[11px] text-[var(--accent-jade)]">
                        Open
                      </span>
                      {group.relevance_score ? (
                        <p className="mt-1 text-[10px] text-[var(--ink-muted)]">
                          {(group.relevance_score * 100).toFixed(0)}% relevance
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {hasMore && expanded && (
        <p className="mt-2 text-[11px] text-[var(--ink-soft)]">
          Showing {visibleGroups.length} of {groupedCitations.length} sources
        </p>
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
  onViewDocument,
}: {
  open: boolean;
  onClose: () => void;
  citation: Citation | null;
  loading: boolean;
  error: string | null;
  managerView: boolean;
  sessionTitle: string;
  onViewDocument: (documentId: string, filename: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const excerpt = citation?.chunk_text || citation?.preview || "";

  const handleCopyExcerpt = async () => {
    await navigator.clipboard.writeText(excerpt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
    >
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full max-w-full border-l border-[var(--line)] bg-[var(--surface)] p-0 sm:max-w-xl"
      >
        <div className="flex h-full min-w-0 flex-col">
          <SheetHeader className="border-b border-[var(--line)] px-4 py-4 sm:px-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-[var(--ink-muted)]">
                  {managerView ? "Document source" : "Source"}
                </p>
                <SheetTitle className="mt-1 wrap-anywhere text-left text-[16px] font-semibold text-[var(--ink)]">
                  {citation?.filename || "Source details"}
                </SheetTitle>
                <SheetDescription className="sr-only">
                  View source details and excerpt for the selected citation from{" "}
                  {sessionTitle}.
                </SheetDescription>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close source panel"
                className="rounded-md border border-[var(--line)] p-2 text-[var(--ink-muted)] transition-colors hover:bg-[var(--canvas-soft)] hover:text-[var(--ink-soft)]"
              >
                <X size={16} />
              </button>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-5">
            {citation?.document_id ? (
              <button
                type="button"
                onClick={() =>
                  onViewDocument(
                    citation.document_id as string,
                    citation.filename || "Document",
                  )
                }
                className="app-button-primary mb-5 flex w-full justify-center"
              >
                <FileText size={15} />
                View full document
              </button>
            ) : null}

            {loading && (
              <div className="flex items-center gap-3 rounded-[10px] border border-[var(--line)] bg-[var(--canvas-soft)] px-4 py-4 text-sm text-[var(--ink-soft)]">
                <Loader2
                  size={16}
                  className="animate-spin text-[var(--accent-jade)]"
                />
                Loading source details...
              </div>
            )}

            {error && (
              <div className="rounded-[10px] border border-red-500/30 bg-red-500/10 px-3.5 py-3 text-[12px] text-red-300">
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div className="rounded-[10px] border border-[var(--line)] bg-[var(--canvas-soft)] p-3.5">
                <p className="text-[11px] font-medium text-[var(--ink-muted)]">
                  Section
                </p>
                <p className="mt-2 text-sm text-[var(--ink)]">
                  Section {citation?.chunk_index || 0}
                </p>
              </div>

              <div className="rounded-[10px] border border-[var(--line)] bg-[var(--canvas-soft)] p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-medium text-[var(--ink-muted)]">
                    Excerpt
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyExcerpt}
                    className="flex h-7 items-center gap-1.5 rounded-md border border-[var(--line)] px-2 text-[10px] text-[var(--ink-muted)] transition-colors hover:bg-[var(--canvas-soft)] hover:text-[var(--ink)]"
                  >
                    {copied ? (
                      <Check size={12} className="text-green-400" />
                    ) : (
                      <Copy size={12} />
                    )}
                    {copied ? "Copied" : "Copy excerpt"}
                  </button>
                </div>
                <p className="mt-3 whitespace-pre-wrap wrap-anywhere text-sm leading-7 text-[var(--ink-soft)]">
                  {excerpt || "No excerpt available."}
                </p>
              </div>

              <div className="rounded-[10px] border border-[var(--line)] bg-[var(--canvas-soft)] p-3.5">
                <p className="text-[11px] font-medium text-[var(--ink-muted)]">
                  Preview
                </p>
                <p className="mt-3 wrap-anywhere text-sm leading-7 text-[var(--ink-soft)]">
                  {citation?.preview || "No preview available."}
                </p>
              </div>

              <div className="rounded-[10px] border border-[var(--line)] bg-[var(--canvas-soft)] p-3.5">
                <p className="text-[11px] font-medium text-[var(--ink-muted)]">
                  Uploaded
                </p>
                <p className="mt-3 text-sm text-[var(--ink-soft)]">
                  {citation?.uploaded_at
                    ? new Date(citation.uploaded_at).toLocaleString()
                    : "Unknown"}
                </p>
              </div>

              {managerView && (
                <div className="rounded-[10px] border border-[var(--line)] bg-[var(--canvas-soft)] p-3.5">
                  <p className="text-[11px] font-medium text-[var(--ink-muted)]">
                    Source metadata
                  </p>
                  <div className="mt-3 space-y-2 text-sm text-[var(--ink-soft)]">
                    <p className="wrap-anywhere">
                      Document ID: {citation?.document_id || "Unknown"}
                    </p>
                    <p className="wrap-anywhere">
                      Uploaded by: {citation?.uploaded_by || "Unknown"}
                    </p>
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
