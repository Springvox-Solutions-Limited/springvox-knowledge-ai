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
  X,
} from 'lucide-react';

import { getAccessToken, getCurrentUserProfile } from '@/src/lib/auth-client';
import { cn, truncate } from '@/src/lib/utils';
import { isManagerRole, type UserProfile } from '@/src/lib/workspace';

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
};

const EMPTY_PROMPTS = [
  'Summarize my uploaded document',
  'List the key products and services',
  'What are the main features mentioned?',
  'What should I know from this document?',
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [selectedSource, setSelectedSource] = useState<Citation | null>(null);
  const [sourceDetails, setSourceDetails] = useState<Citation | null>(null);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [sourceError, setSourceError] = useState<string | null>(null);
  const [retryQuestion, setRetryQuestion] = useState<string | null>(null);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const startedAtRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    getCurrentUserProfile()
      .then((currentProfile) => setProfile(currentProfile))
      .catch(() => setProfile(null));
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

  const handleSend = async (
    event?: React.FormEvent,
    explicitQuestion?: string,
  ) => {
    event?.preventDefault();

    const question = (explicitQuestion ?? input).trim();
    if (!question || loading) {
      return;
    }

    const userMessageId = crypto.randomUUID();
    const assistantMessageId = crypto.randomUUID();

    setMessages((currentMessages) => [
      ...currentMessages,
      { id: userMessageId, role: 'user', content: question },
      { id: assistantMessageId, role: 'ai', content: '', statusMessage: 'Starting answer...' },
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
            updateMessage(assistantMessageId, (message) => ({
              ...message,
              content: message.content + String(payload.delta || ''),
            }));
          }

          if (eventName === 'complete') {
            updateMessage(assistantMessageId, (message) => ({
              ...message,
              content: String(payload.answer || message.content),
              citations: Array.isArray(payload.citations) ? (payload.citations as Citation[]) : [],
              statusMessage: String(payload.statusMessage || ''),
            }));
          }

          if (eventName === 'error') {
            throw new Error(String(payload.message || 'Query failed'));
          }
        }
      }
    } catch (error) {
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

  const isViewer = profile?.role === 'viewer';

  return (
    <>
      <div className="mx-auto flex h-[calc(100vh-165px)] max-w-6xl flex-col">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto scrollbar-hide px-2 pb-44 pt-4 md:px-4"
        >
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center space-y-6 pt-24 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-accent text-black shadow-2xl shadow-accent/20">
                <BrainCircuit size={40} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-[#E2E8F0]">
                  Ask a question about your uploaded documents.
                </h2>
                <p className="max-w-md text-sm text-slate-500">
                  SpringVox answers from approved documents and shows the supporting sources separately.
                </p>
              </div>
              <div className="grid w-full max-w-2xl gap-3 px-4 md:grid-cols-2">
                {EMPTY_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setInput(prompt)}
                    className="rounded-2xl border border-[#2D3039] bg-[#15171C] p-4 text-left text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400 transition-all hover:border-accent/50 hover:bg-[#1A1C20]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'mb-8 flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300',
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row',
              )}
            >
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-sm',
                  message.role === 'user'
                    ? 'bg-accent font-bold text-black'
                    : 'border border-[#2D3039] bg-[#15171C]',
                )}
              >
                {message.role === 'user' ? (
                  <span className="text-[10px]">YOU</span>
                ) : (
                  <BrainCircuit size={14} className="text-accent" />
                )}
              </div>

              <div
                className={cn(
                  'space-y-4 max-w-[92%] md:max-w-[84%] xl:max-w-[78%]',
                  message.role === 'user' ? 'items-end' : 'items-start',
                )}
              >
                <div
                  className={cn(
                    'rounded-[1.6rem] border text-sm leading-7 shadow-xl',
                    message.role === 'user'
                      ? 'rounded-tr-none border-accent/20 bg-accent/10 text-[#E2E8F0]'
                      : 'rounded-tl-none border-[#2D3039] bg-[#15171C] text-slate-200',
                  )}
                >
                  {message.role === 'ai' ? (
                    <>
                      <div className="flex items-center justify-between border-b border-[#2D3039] px-5 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                          Answer
                        </p>
                        <div className="flex items-center gap-2">
                          {message.error && retryQuestion && (
                            <button
                              type="button"
                              onClick={(event) => handleSend(event, retryQuestion)}
                              disabled={loading}
                              className="flex items-center gap-2 rounded-lg border border-[#2D3039] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 transition-colors hover:text-white"
                            >
                              <RefreshCw size={12} />
                              Retry
                            </button>
                          )}
                          {!!message.content && (
                            <button
                              type="button"
                              onClick={() => handleCopyAnswer(message.content, message.id)}
                              className="flex items-center gap-2 rounded-lg border border-[#2D3039] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 transition-colors hover:text-white"
                            >
                              {copiedIndex === message.id ? (
                                <Check size={12} className="text-green-400" />
                              ) : (
                                <Copy size={12} />
                              )}
                              {copiedIndex === message.id ? 'Copied' : 'Copy answer'}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="px-5 py-5">
                        <div className="markdown-container">
                          <ReactMarkdown>{message.content || ' '}</ReactMarkdown>
                        </div>

                        {(message.statusMessage || (loading && activeMessageId === message.id)) && (
                          <div className="mt-5 rounded-2xl border border-[#2D3039] bg-[#101217] px-4 py-3">
                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                              {loading && activeMessageId === message.id ? (
                                <Loader2 size={14} className="animate-spin text-accent" />
                              ) : (
                                <ShieldCheck size={14} className="text-accent" />
                              )}
                              <span>{message.statusMessage}</span>
                              {loading && activeMessageId === message.id && (
                                <span className="rounded-full border border-[#2D3039] px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-slate-500">
                                  Thinking for {elapsedSeconds.toFixed(1)}s
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="whitespace-pre-wrap px-5 py-4">{message.content}</div>
                  )}
                </div>

                {message.citations && message.citations.length > 0 && (
                  <CitationList
                    citations={message.citations}
                    onOpenSource={openSource}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="sticky bottom-0 mt-auto bg-[linear-gradient(180deg,rgba(11,12,14,0)_0%,rgba(11,12,14,0.92)_28%,rgba(11,12,14,1)_100%)] px-2 pb-4 pt-8 md:px-4">
          <form onSubmit={handleSend} className="relative mx-auto flex max-w-4xl gap-2">
            <div className="group relative flex-1">
              <input
                className="w-full rounded-2xl border border-[#2D3039] bg-[#1A1C20] py-4 pl-5 pr-28 text-sm text-[#E2E8F0] shadow-2xl shadow-black/50 transition-all focus:border-accent/50 focus:outline-none"
                placeholder="Ask your documents anything..."
                value={input}
                onChange={(event) => setInput(event.target.value)}
                disabled={loading}
              />
              <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
                {loading ? (
                  <button
                    type="button"
                    onClick={handleStopGenerating}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#2D3039] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300 transition-colors hover:text-white"
                  >
                    <Square size={12} className="fill-current" />
                    Stop
                  </button>
                ) : (
                  <div className="hidden text-[10px] font-bold uppercase tracking-widest text-slate-600 md:block">
                    Return ↵
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="rounded-lg bg-accent p-2 text-black shadow-lg shadow-accent/20 transition-all hover:bg-orange-600 disabled:opacity-30"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </form>
          <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.4em] text-slate-500">
            {isViewer ? 'SPRINGVOX KNOWLEDGE ASSISTANT' : 'SPRINGVOX KNOWLEDGE ENGINE • 1.0'}
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
    <div className="w-full rounded-2xl border border-[#2D3039] bg-[#101217] p-3 md:p-4">
      <button
        type="button"
        onClick={() => setExpanded((currentValue) => !currentValue)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
          <ShieldCheck size={12} className="text-accent" />
          Sources
          <span className="rounded-full border border-[#2D3039] px-2 py-0.5 text-[9px] text-slate-500">
            {uniqueCitations.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            {expanded ? 'Hide sources' : 'Show sources'}
          </span>
          {expanded ? (
            <ChevronUp size={14} className="text-slate-500" />
          ) : (
            <ChevronDown size={14} className="text-slate-500" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="mt-4 grid gap-3">
          {uniqueCitations.map((citation) => (
            <button
              type="button"
              key={`${citation.filename}-${citation.chunk_index}`}
              onClick={() => onOpenSource(citation)}
              className="rounded-xl border border-[#2D3039] bg-[#15171C] p-4 text-left transition-colors hover:border-accent/30"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#2D3039] bg-[#0D0F12]">
                  <FileText size={14} className="text-accent" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#E2E8F0]">{citation.filename}</p>
                      <p className="mt-1 text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500">
                        Chunk {citation.chunk_index}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
                      View source
                    </span>
                  </div>
                  <p className="mt-3 text-xs leading-6 text-slate-400">
                    {truncate(citation.preview, 160)}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {!expanded && (
        <p className="mt-2 pl-5 text-xs leading-6 text-slate-500">
          View the supporting document sections used to ground this answer.
        </p>
      )}
      {citations.length > uniqueCitations.length && (
        <p className="mt-2 pl-5 text-[10px] font-mono uppercase tracking-[0.16em] text-slate-600">
          Showing top 5 unique sources
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
      <aside className="fixed inset-y-0 right-0 z-50 w-full border-l border-[#2D3039] bg-[#0D0F12] shadow-[0_0_60px_rgba(0,0,0,0.45)] sm:max-w-xl">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-[#2D3039] px-5 py-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                {managerView ? 'Verified Source' : 'Source'}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-[#E2E8F0]">
                {citation?.filename || 'Source details'}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#2D3039] p-2 text-slate-400 transition-colors hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5">
            {loading && (
              <div className="flex items-center gap-3 rounded-2xl border border-[#2D3039] bg-[#15171C] px-4 py-4 text-sm text-slate-300">
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
              <div className="rounded-2xl border border-[#2D3039] bg-[#15171C] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                  {managerView ? 'Section' : 'Section'}
                </p>
                <p className="mt-2 text-sm text-[#E2E8F0]">Chunk {citation?.chunk_index || 0}</p>
              </div>

              <div className="rounded-2xl border border-[#2D3039] bg-[#15171C] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                    {managerView ? 'Excerpt' : 'Excerpt'}
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyExcerpt}
                    className="flex items-center gap-2 rounded-lg border border-[#2D3039] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 transition-colors hover:text-white"
                  >
                    {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                    {copied ? 'Copied' : 'Copy excerpt'}
                  </button>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-200">
                  {excerpt || 'No excerpt available.'}
                </p>
              </div>

              <div className="rounded-2xl border border-[#2D3039] bg-[#15171C] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                  Preview
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  {citation?.preview || 'No preview available.'}
                </p>
              </div>

              <div className="rounded-2xl border border-[#2D3039] bg-[#15171C] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                  Uploaded
                </p>
                <p className="mt-3 text-sm text-slate-300">
                  {citation?.uploaded_at ? new Date(citation.uploaded_at).toLocaleString() : 'Unknown'}
                </p>
              </div>

              {managerView && (
                <div className="rounded-2xl border border-[#2D3039] bg-[#15171C] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                    Source metadata
                  </p>
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
