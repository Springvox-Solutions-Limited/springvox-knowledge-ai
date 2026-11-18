"use client";

import { useEffect, useRef, type RefObject } from "react";
import { FileText } from "lucide-react";

import type { FeedbackRating } from "@/src/lib/workspace";
import { AiMark } from "./AiMark";
import { ViewerComposer } from "./ViewerComposer";
import { ViewerMessage } from "./ViewerMessage";
import type { ViewerCollection, ViewerMessage as ViewerMessageType, ViewerViewCitation } from "./types";

const SUGGESTIONS = [
  {
    title: "Summarise the onboarding policy",
    detail: "A short answer with the page attached",
  },
  {
    title: "What does our remote work policy say?",
    detail: "Check the approved wording, not a paraphrase",
  },
  {
    title: "How do I request leave?",
    detail: "Steps and the document that owns the process",
  },
  {
    title: "Where is the expense process documented?",
    detail: "Find the right policy before you spend",
  },
];

export function ViewerChatView({
  messages,
  loading,
  activeMessageId,
  copiedIndex,
  elapsedSeconds,
  retryQuestion,
  feedbackLoadingMessageId,
  firstName,
  workspaceName,
  hasActiveSession,
  input,
  answerMode,
  scopeCollectionId,
  collections,
  isRecording,
  speechSupported,
  inputFocused,
  textareaRef,
  onInputChange,
  onInputFocus,
  onSubmit,
  onKeyDown,
  onStopGenerating,
  onToggleRecording,
  onAnswerModeChange,
  onScopeChange,
  onAdjustHeight,
  onCopyAnswer,
  onEditQuestion,
  onRegenerate,
  onRetry,
  onOpenSource,
  onFollowUp,
  onFeedback,
  onPrompt,
}: {
  messages: ViewerMessageType[];
  loading: boolean;
  activeMessageId: string | null;
  copiedIndex: string | null;
  elapsedSeconds: number;
  retryQuestion: string | null;
  feedbackLoadingMessageId: string | null;
  firstName: string;
  workspaceName: string;
  hasActiveSession: boolean;
  input: string;
  answerMode: string;
  scopeCollectionId: string;
  collections: ViewerCollection[];
  isRecording: boolean;
  speechSupported: boolean;
  inputFocused: boolean;
  textareaRef: RefObject<HTMLTextAreaElement>;
  onInputChange: (value: string) => void;
  onInputFocus: (focused: boolean) => void;
  onSubmit: (event: React.FormEvent) => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
  onStopGenerating: () => void;
  onToggleRecording: () => void;
  onAnswerModeChange: (value: string) => void;
  onScopeChange: (value: string) => void;
  onAdjustHeight: () => void;
  onCopyAnswer: (content: string, id: string) => void;
  onEditQuestion: (content: string) => void;
  onRegenerate: (id: string) => void;
  onRetry: (event: React.FormEvent, question: string) => void;
  onOpenSource: (citation: ViewerViewCitation) => void;
  onFollowUp: (question: string) => void;
  onFeedback: (messageId: string, rating: FeedbackRating) => void;
  onPrompt: (prompt: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef(true);
  const lastMessageCountRef = useRef(messages.length);
  const previousLoadingRef = useRef(loading);
  const isEmpty = messages.length === 0 && !hasActiveSession;

  useEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll) return;

    const messageAdded = messages.length > lastMessageCountRef.current;
    const loadingStarted = loading && !previousLoadingRef.current;
    lastMessageCountRef.current = messages.length;
    previousLoadingRef.current = loading;

    // New questions and freshly loaded sessions should always start at the
    // bottom. Streaming updates only follow the bottom while the reader is
    // already there, so scrolling up to read older content is not interrupted.
    if (messageAdded || loadingStarted) {
      autoScrollRef.current = true;
    }

    if (!autoScrollRef.current) return;

    const frame = window.requestAnimationFrame(() => {
      scroll.scrollTop = scroll.scrollHeight;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [messages, loading]);

  const handleScroll = () => {
    const scroll = scrollRef.current;
    if (!scroll) return;
    const distanceFromBottom = scroll.scrollHeight - scroll.scrollTop - scroll.clientHeight;
    autoScrollRef.current = distanceFromBottom < 96;
  };

  const composer = (
    <ViewerComposer
      input={input}
      loading={loading}
      isRecording={isRecording}
      speechSupported={speechSupported}
      inputFocused={inputFocused}
      answerMode={answerMode}
      scopeCollectionId={scopeCollectionId}
      collections={collections}
      textareaRef={textareaRef}
      large={isEmpty}
      onInputChange={onInputChange}
      onInputFocus={onInputFocus}
      onSubmit={onSubmit}
      onKeyDown={onKeyDown}
      onStopGenerating={onStopGenerating}
      onToggleRecording={onToggleRecording}
      onAnswerModeChange={onAnswerModeChange}
      onScopeChange={onScopeChange}
      onAdjustHeight={onAdjustHeight}
    />
  );

  if (isEmpty) {
    return (
      <div className="flex h-full flex-col overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[768px] flex-1 flex-col justify-center px-5 py-14 sm:px-8 sm:py-20">
          <div className="mx-auto w-full max-w-[720px]">
            <p className="text-[13px] text-[var(--ink-muted)]">
              Good {greetingForHour(new Date().getHours())}, {firstName}
            </p>
            <h1 className="mt-2 text-[30px] font-medium leading-[1.15] tracking-[-0.035em] text-[var(--ink)] sm:text-[36px]">
              What can I help you find?
            </h1>
            <p className="mt-3 max-w-[54ch] text-[13px] leading-6 text-[var(--ink-soft)]">
              Answers come from {workspaceName}&apos;s approved documents. Every reply
              that uses a document shows the file and section it came from.
            </p>

            <div className="mt-8">{composer}</div>

            <div className="mt-10">
              <p className="text-[10px] font-medium text-[var(--ink-muted)]">
                Try asking
              </p>
              <div className="mt-2 grid gap-px overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion.title}
                    type="button"
                    onClick={() => onPrompt(suggestion.title)}
                    className="group flex items-start gap-2.5 bg-[var(--canvas)] p-3.5 text-left transition-colors hover:bg-[var(--surface)]"
                  >
                    <FileText
                      size={13}
                      strokeWidth={1.5}
                      className="mt-0.5 shrink-0 text-[var(--ink-muted)] group-hover:text-[var(--accent-jade)]"
                      aria-hidden="true"
                    />
                    <span className="min-w-0">
                      <span className="block text-[12px] leading-5 text-[var(--ink)]">
                        {suggestion.title}
                      </span>
                      <span className="mt-0.5 block text-[10px] leading-4 text-[var(--ink-muted)]">
                        {suggestion.detail}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-8 flex items-center gap-1.5 text-[10px] text-[var(--ink-muted)]">
              <AiMark size={11} className="h-3 w-3" />
              Scoped to this workspace
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mx-auto flex min-h-0 w-full max-w-[768px] flex-1 flex-col px-4 sm:px-6">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="min-h-0 flex-1 space-y-8 overflow-y-auto pb-4 pt-6 scrollbar-hide"
          role="log"
          aria-live="polite"
          aria-label="Conversation"
        >
          {messages.map((message) => (
            <ViewerMessage
              key={message.id}
              message={message}
              active={loading && activeMessageId === message.id}
              loading={loading}
              copied={copiedIndex === message.id}
              elapsedSeconds={elapsedSeconds}
              retryQuestion={retryQuestion}
              feedbackLoading={feedbackLoadingMessageId === message.id}
              onCopy={onCopyAnswer}
              onEdit={onEditQuestion}
              onRegenerate={onRegenerate}
              onRetry={onRetry}
              onStop={onStopGenerating}
              onOpenSource={onOpenSource}
              onFollowUp={onFollowUp}
              onFeedback={onFeedback}
            />
          ))}
        </div>

        <div className="shrink-0 bg-[var(--canvas)] pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
          {composer}
        </div>
      </div>
    </div>
  );
}

function greetingForHour(hour: number) {
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}
