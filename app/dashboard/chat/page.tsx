"use client";

import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  BrainCircuit,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  FileText,
  Loader2,
  RefreshCw,
  Send,
  ShieldCheck,
  Square,
  ThumbsDown,
  ThumbsUp,
  X,
} from 'lucide-react';

import {
  getAccessToken,
  getCurrentUserProfile,
  getCurrentWorkspaceSettings,
} from '@/src/lib/auth-client';
import { supabase } from '@/src/lib/supabase';
import { cn, truncate } from '@/src/lib/utils';
import {
  isManagerRole,
  type FeedbackRating,
  type UserProfile,
  type WorkspaceSettings,
} from '@/src/lib/workspace';

type Citation = {
  filename: string;
  chunk_index: number;
  preview: string;
  document_id?: string | null;
  chunk_text?: string;
  uploaded_at?: string | null;
  uploaded_by?: string | null;
};

type Message = {
  id: string;
  role: 'user' | 'ai';
  content: string;
  citations?: Citation[];
  statusMessage?: string;
  error?: boolean;
  chatMessageId?: string;
  feedbackSubmitted?: boolean;
  feedbackRating?: FeedbackRating | null;
};

const EMPTY_PROMPTS = [
  'Summarize the uploaded documents',
  'What services are mentioned?',
  'What are the main policies?',
  'What should I know from these documents?',
];

const EXTRA_FEEDBACK_OPTIONS: FeedbackRating[] = ['wrong', 'outdated', 'needs_more_detail'];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const startedAtRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const typingQueueRef = useRef('');
  const typingIntervalRef = useRef<number | null>(null);
  const typingMessageIdRef = useRef<string | null>(null);
  const pendingCompletionRef = useRef<{
    messageId: string;
    payload: {
      answer: string;
      citations: Citation[];
      chatMessageId?: string;
      statusMessage?: string;
    };
  } | null>(null);

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
          setHistoryLoading(false);
          return;
        }

        const { data: history, error } = await supabase
          .from('chat_messages')
          .select('id, question, answer, citations, created_at')
          .eq('workspace_id', currentProfile.workspace_id)
          .order('created_at', { ascending: true })
          .limit(30);

        if (error) {
          throw error;
        }

        const loadedMessages: Message[] = [];
        for (const item of history || []) {
          loadedMessages.push({
            id: `question-${item.id}`,
            role: 'user',
            content: item.question,
          });
          loadedMessages.push({
            id: `answer-${item.id}`,
            role: 'ai',
            content: item.answer,
            citations: Array.isArray(item.citations) ? (item.citations as Citation[]) : [],
            chatMessageId: item.id,
          });
        }

        setMessages(loadedMessages);
      } catch {
        setMessages([]);
      } finally {
        setHistoryLoading(false);
      }
    }

    loadChatContext();
  }, []);

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

  const handleCopyAnswer = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedIndex(id);
    window.setTimeout(() => setCopiedIndex((current) => (current === id ? null : current)), 1800);
  };

  const updateMessage = (messageId: string, updater: (message: Message) => Message) => {
    setMessages((currentMessages) =>
      currentMessages.map((message) => (message.id === messageId ? updater(message) : message)),
    );
  };

  const stopTypingBuffer = () => {
    if (typingIntervalRef.current) {
      window.clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
    typingQueueRef.current = '';
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
      statusMessage: pending.payload.statusMessage || message.statusMessage,
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

  const handleSend = async (event?: React.FormEvent, explicitQuestion?: string) => {
    event?.preventDefault();

    const question = (explicitQuestion ?? input).trim();
    if (!question || loading) {
      return;
    }

    stopTypingBuffer();

    const userMessageId = crypto.randomUUID();
    const assistantMessageId = crypto.randomUUID();

    setMessages((currentMessages) => [
      ...currentMessages,
      { id: userMessageId, role: 'user', content: question },
      { id: assistantMessageId, role: 'ai', content: '', statusMessage: 'Thinking...' },
    ]);
    setActiveMessageId(assistantMessageId);
    setRetryQuestion(question);
    setLoading(true);
    setInput('');
    startedAtRef.current = Date.now();

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('Authentication session expired');
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ question }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error('Query failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          const eventMatch = part.match(/^event:\s*(.+)$/m);
          const dataMatch = part.match(/^data:\s*(.+)$/m);

          if (!dataMatch) {
            continue;
          }

          const eventName = eventMatch?.[1]?.trim() || 'message';
          const payload = JSON.parse(dataMatch[1]);

          if (eventName === 'status') {
            updateMessage(assistantMessageId, (message) => ({
              ...message,
              statusMessage: String(payload.message || ''),
            }));
          }

          if (eventName === 'chunk') {
            typingQueueRef.current += String(payload.delta || '');
            startTypingBuffer(assistantMessageId);
          }

          if (eventName === 'complete') {
            const completionPayload = {
              answer: String(payload.answer || ''),
              citations: Array.isArray(payload.citations) ? (payload.citations as Citation[]) : [],
              chatMessageId: typeof payload.chatMessageId === 'string' ? payload.chatMessageId : undefined,
              statusMessage: String(payload.statusMessage || ''),
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

          if (eventName === 'error') {
            throw new Error(String(payload.message || 'Query failed'));
          }
        }
      }
    } catch (error) {
      stopTypingBuffer();
      if ((error as Error).name === 'AbortError') {
        updateMessage(assistantMessageId, (message) => ({
          ...message,
          statusMessage: 'Generation stopped.',
        }));
      } else {
        updateMessage(assistantMessageId, (message) => ({
          ...message,
          content: message.content || 'Sorry, I encountered an error while preparing your answer.',
          statusMessage: 'Could not finish the answer. Please try again.',
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
        throw new Error('Authentication session expired');
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
        throw new Error('Unable to load source details');
      }

      const data = await response.json();
      setSourceDetails(data.source as Citation);
    } catch (error) {
      setSourceError(error instanceof Error ? error.message : 'Unable to load source details');
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
        throw new Error('Authentication session expired');
      }

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          chatMessageId: targetMessage.chatMessageId,
          rating,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save feedback');
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

  const isViewer = profile?.role === 'viewer';
  const assistantName =
    workspace?.assistant_name ||
    (isViewer ? 'SpringVox Assistant' : 'SpringVox Knowledge AI');
  const companyName = workspace?.name || 'your company';
  const welcomeMessage =
    workspace?.welcome_message ||
    `Ask questions from ${companyName}'s approved knowledge base.`;

  return (
    <>
      <div className="mx-auto flex h-[calc(100vh-165px)] max-w-[920px] flex-col">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto scrollbar-hide rounded-[28px] bg-[linear-gradient(180deg,#081221_0%,#0d1728_100%)] px-3 pb-44 pt-6 shadow-[0_18px_44px_rgba(15,23,42,0.18)] sm:px-5"
        >
          {historyLoading ? (
            <div className="flex items-center gap-3 pt-10 text-sm text-slate-400">
              <Loader2 size={18} className="animate-spin text-accent" />
              Loading your recent conversations...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center space-y-7 pt-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-300 shadow-[0_20px_60px_rgba(34,211,238,0.12)]">
                <BrainCircuit size={30} />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-100 sm:text-3xl">
                  {isViewer
                    ? `Ask questions from ${companyName}'s approved knowledge base.`
                    : `Test how users will experience ${companyName}.`}
                </h2>
                <p className="max-w-xl text-sm leading-7 text-slate-400 sm:text-base">
                  {isViewer
                    ? welcomeMessage
                    : `${welcomeMessage} This is the same experience end users will rely on when they ask questions.`}
                </p>
              </div>
              <div className="grid w-full max-w-3xl gap-3 md:grid-cols-2">
                {EMPTY_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setInput(prompt)}
                    className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3.5 text-left text-sm text-slate-300 transition-all hover:border-cyan-300/30 hover:bg-white/[0.05]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="mb-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div
                  className={cn(
                    'space-y-3',
                    message.role === 'user' ? 'ml-auto max-w-[82%] sm:max-w-[72%]' : 'max-w-full',
                  )}
                >
                  {message.role === 'user' ? (
                    <div className="rounded-[1.4rem] rounded-br-md bg-gradient-to-r from-teal-400 to-cyan-400 px-4 py-3 text-sm leading-7 text-slate-950 shadow-[0_16px_40px_rgba(34,211,238,0.14)]">
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/8 bg-white/[0.03]">
                          <BrainCircuit size={13} className="text-accent" />
                        </div>
                        <span>{assistantName}</span>
                      </div>

                      {!!message.content && (
                        <div className="markdown-container pl-10 text-[15px] leading-8 text-slate-200">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                      )}

                      {(message.statusMessage || (loading && activeMessageId === message.id)) && (
                        <div className="pl-10">
                          <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-2 text-xs text-slate-400">
                            {loading && activeMessageId === message.id ? (
                              <Loader2 size={13} className="animate-spin text-accent" />
                            ) : (
                              <ShieldCheck size={13} className="text-accent" />
                            )}
                            <span>{getVisibleStatus(message.statusMessage || '', isViewer, loading && activeMessageId === message.id)}</span>
                            {loading && activeMessageId === message.id && (
                              <span className="rounded-full border border-white/8 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-slate-500">
                                Thinking for {elapsedSeconds.toFixed(1)}s
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="pl-10">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {!!message.content && (
                            <button
                              type="button"
                              onClick={() => handleCopyAnswer(message.content, message.id)}
                              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs text-slate-500 transition-colors hover:bg-white/[0.04] hover:text-white"
                            >
                              {copiedIndex === message.id ? (
                                <Check size={12} className="text-green-400" />
                              ) : (
                                <Copy size={12} />
                              )}
                              {copiedIndex === message.id ? 'Copied' : 'Copy'}
                            </button>
                          )}
                          {message.error && retryQuestion && (
                            <button
                              type="button"
                              onClick={(event) => handleSend(event, retryQuestion)}
                              disabled={loading}
                              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs text-slate-500 transition-colors hover:bg-white/[0.04] hover:text-white"
                            >
                              <RefreshCw size={12} />
                              Retry
                            </button>
                          )}
                          {loading && activeMessageId === message.id && (
                            <button
                              type="button"
                              onClick={handleStopGenerating}
                              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs text-slate-500 transition-colors hover:bg-white/[0.04] hover:text-white"
                            >
                              <Square size={11} className="fill-current" />
                              Stop
                            </button>
                          )}
                        </div>
                      </div>

                      {message.citations && message.citations.length > 0 && (
                        <CitationList citations={message.citations} onOpenSource={openSource} />
                      )}

                      {message.chatMessageId && (
                        <FeedbackRow
                          loading={feedbackLoadingMessageId === message.id}
                          submitted={message.feedbackSubmitted === true}
                          rating={message.feedbackRating || null}
                          expanded={expandedFeedbackMessageId === message.id}
                          onHelpful={() => submitFeedback(message.id, 'helpful')}
                          onNotHelpful={() => submitFeedback(message.id, 'not_helpful')}
                          onToggleMore={() =>
                            setExpandedFeedbackMessageId((current) =>
                              current === message.id ? null : message.id,
                            )
                          }
                          onSelectMore={(rating) => submitFeedback(message.id, rating)}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="sticky bottom-0 mt-auto bg-[linear-gradient(180deg,rgba(11,12,14,0)_0%,rgba(11,12,14,0.9)_22%,rgba(11,12,14,1)_100%)] px-3 pb-5 pt-10 sm:px-5">
          <form onSubmit={handleSend} className="relative mx-auto max-w-[920px]">
            <div className="rounded-[28px] border border-white/8 bg-[#14161B]/95 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <textarea
                rows={1}
                className="max-h-48 min-h-[64px] w-full resize-none bg-transparent px-5 py-4 pr-24 text-sm leading-7 text-slate-100 outline-none placeholder:text-slate-500"
                placeholder="Ask anything from your approved documents..."
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void handleSend();
                  }
                }}
                disabled={loading}
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                {loading && (
                  <button
                    type="button"
                    onClick={handleStopGenerating}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/8 px-3 py-2 text-[11px] text-slate-300 transition-colors hover:text-white"
                  >
                    <Square size={11} className="fill-current" />
                    Stop
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="rounded-full bg-gradient-to-r from-teal-400 to-cyan-400 p-2.5 text-slate-950 shadow-[0_12px_30px_rgba(34,211,238,0.2)] transition-all hover:from-teal-300 hover:to-cyan-300 disabled:opacity-30"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </form>
          <p className="mt-3 text-center text-xs text-slate-500">
            {isViewer
              ? 'Answers come from approved documents when support is available.'
              : 'Streaming answers stay grounded in approved workspace documents.'}
          </p>
        </div>
      </div>

      <SourceDrawer
        open={!!selectedSource}
        onClose={closeSource}
        citation={sourceDetails}
        loading={sourceLoading}
        error={sourceError}
        managerView={!!profile && isManagerRole(profile.role)}
      />
    </>
  );
}

function getVisibleStatus(statusMessage: string, isViewer: boolean, isActive: boolean) {
  if (isViewer && isActive) {
    return 'Thinking...';
  }

  if (isViewer && !isActive) {
    if (statusMessage.toLowerCase().includes('no supported answer')) {
      return 'Answer not found in approved documents.';
    }

    return 'Answer prepared from approved documents.';
  }

  return statusMessage || 'Thinking...';
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
            item.filename === citation.filename && item.chunk_index === citation.chunk_index,
        ) === index
      );
    })
    .slice(0, 5);

  return (
    <div className="pl-10">
      <button
        type="button"
        onClick={() => setExpanded((currentValue) => !currentValue)}
        className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-2 text-left text-xs text-slate-400 transition-colors hover:bg-white/[0.05] hover:text-white"
      >
        <ShieldCheck size={12} className="text-accent" />
        <span>Sources</span>
        <span className="text-slate-500">· {uniqueCitations.length}</span>
        {expanded ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
      </button>

      {expanded && (
        <div className="mt-3 grid gap-2.5">
          {uniqueCitations.map((citation) => (
            <button
              type="button"
              key={`${citation.filename}-${citation.chunk_index}`}
              onClick={() => onOpenSource(citation)}
              className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-left transition-colors hover:border-accent/30 hover:bg-white/[0.05]"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/8 bg-slate-950">
                  <FileText size={14} className="text-accent" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-100">{citation.filename}</p>
                      <p className="mt-1 text-[11px] text-slate-500">Chunk {citation.chunk_index}</p>
                    </div>
                    <span className="text-[11px] text-accent">View source</span>
                  </div>
                  <p className="mt-2 text-xs leading-6 text-slate-400">
                    {truncate(citation.preview, 120)}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {citations.length > uniqueCitations.length && (
        <p className="mt-2 text-[11px] text-slate-600">Showing top 5 unique sources</p>
      )}
    </div>
  );
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
    <div className="pl-10">
      {submitted ? (
        <p className="text-xs text-slate-500">
          Thanks for the feedback{rating ? ` · ${rating.replaceAll('_', ' ')}` : ''}.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={onHelpful}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/8 px-3 py-1.5 text-xs text-slate-400 transition-colors hover:text-white"
            >
              <ThumbsUp size={12} />
              Helpful
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={onNotHelpful}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/8 px-3 py-1.5 text-xs text-slate-400 transition-colors hover:text-white"
            >
              <ThumbsDown size={12} />
              Not helpful
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={onToggleMore}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-slate-500 transition-colors hover:bg-white/[0.04] hover:text-white"
            >
              More options
            </button>
            {loading && <Loader2 size={13} className="animate-spin text-accent" />}
          </div>

          {expanded && (
            <div className="mt-2 flex flex-wrap gap-2">
              {EXTRA_FEEDBACK_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => onSelectMore(option)}
                  className="rounded-full border border-white/8 px-3 py-1.5 text-xs text-slate-400 transition-colors hover:text-white"
                >
                  {option.replaceAll('_', ' ')}
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
}: {
  open: boolean;
  onClose: () => void;
  citation: Citation | null;
  loading: boolean;
  error: string | null;
  managerView: boolean;
}) {
  const [copied, setCopied] = useState(false);

  if (!open) {
    return null;
  }

  const excerpt = citation?.chunk_text || citation?.preview || '';

  const handleCopyExcerpt = async () => {
    await navigator.clipboard.writeText(excerpt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <>
      <button
        type="button"
        aria-label="Close source panel overlay"
        className="fixed inset-0 z-40 bg-black/60"
        onClick={onClose}
      />
      <aside className="fixed inset-y-0 right-0 z-50 w-full border-l border-white/10 bg-[#0b1728] shadow-[0_0_60px_rgba(0,0,0,0.45)] sm:max-w-xl">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                {managerView ? 'Verified Source' : 'Source'}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-slate-100">
                {citation?.filename || 'Source details'}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 p-2 text-slate-400 transition-colors hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5">
            {loading && (
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-sm text-slate-300">
                <Loader2 size={16} className="animate-spin text-accent" />
                Loading source details...
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-4 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Section</p>
                <p className="mt-2 text-sm text-slate-100">Chunk {citation?.chunk_index || 0}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Excerpt</p>
                  <button
                    type="button"
                    onClick={handleCopyExcerpt}
                    className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 transition-colors hover:text-white"
                  >
                    {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                    {copied ? 'Copied' : 'Copy excerpt'}
                  </button>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-200">
                  {excerpt || 'No excerpt available.'}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Preview</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  {citation?.preview || 'No preview available.'}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Uploaded</p>
                <p className="mt-3 text-sm text-slate-300">
                  {citation?.uploaded_at ? new Date(citation.uploaded_at).toLocaleString() : 'Unknown'}
                </p>
              </div>

              {managerView && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Source metadata</p>
                  <div className="mt-3 space-y-2 text-sm text-slate-300">
                    <p>Document ID: {citation?.document_id || 'Unknown'}</p>
                    <p>Uploaded by: {citation?.uploaded_by || 'Unknown'}</p>
                    <p>Chunk index: {citation?.chunk_index || 0}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
