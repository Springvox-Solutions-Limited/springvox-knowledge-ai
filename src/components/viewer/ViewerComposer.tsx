"use client";

import type React from "react";
import { ArrowUp, FileText, Mic, MicOff, Sliders, Square } from "lucide-react";

import { cn } from "@/src/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ANSWER_MODES = [
  { value: "summary", label: "Summary" },
  { value: "detailed", label: "Detailed" },
  { value: "executive", label: "Executive" },
  { value: "technical", label: "Technical" },
] as const;

export function ViewerComposer({
  input,
  loading,
  isRecording,
  speechSupported,
  inputFocused,
  answerMode,
  scopeCollectionId,
  collections,
  textareaRef,
  large = false,
  onInputChange,
  onInputFocus,
  onSubmit,
  onKeyDown,
  onStopGenerating,
  onToggleRecording,
  onAnswerModeChange,
  onScopeChange,
  onAdjustHeight,
}: {
  input: string;
  loading: boolean;
  isRecording: boolean;
  speechSupported: boolean;
  inputFocused: boolean;
  answerMode: string;
  scopeCollectionId: string;
  collections: Array<{ id: string; name: string }>;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  large?: boolean;
  onInputChange: (value: string) => void;
  onInputFocus: (focused: boolean) => void;
  onSubmit: (event: React.FormEvent) => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
  onStopGenerating: () => void;
  onToggleRecording: () => void;
  onAnswerModeChange: (value: string) => void;
  onScopeChange: (value: string) => void;
  onAdjustHeight: () => void;
}) {
  const scopeLabel =
    scopeCollectionId === "all"
      ? "All sources"
      : collections.find((collection) => collection.id === scopeCollectionId)?.name ||
        "All sources";
  const modeLabel =
    ANSWER_MODES.find((mode) => mode.value === answerMode)?.label || "Detailed";

  return (
    <form onSubmit={onSubmit} className="mx-auto w-full max-w-[768px]">
      <div
        className={cn(
          "rounded-[26px] border bg-[var(--surface)] shadow-[0_8px_28px_-18px_rgba(0,0,0,0.75)] transition-colors",
          inputFocused || isRecording
            ? "border-[var(--accent-jade-100)]"
            : "border-[var(--line)]",
        )}
      >
        <Textarea
          ref={textareaRef}
          rows={1}
          className={cn(
            "max-h-48 w-full resize-none border-0 bg-transparent px-5 pt-3.5 text-[15px] leading-7 text-[var(--ink)] shadow-none outline-none placeholder:text-[var(--ink-muted)] focus-visible:ring-0",
            large ? "min-h-[58px] pb-2" : "min-h-[46px] pb-1",
          )}
          placeholder={
            isRecording
              ? "Listening…"
              : "Ask Rekall"
          }
          aria-label="Ask a question from approved documents"
          value={input}
          onChange={(event) => {
            onInputChange(event.target.value);
            onAdjustHeight();
          }}
          onFocus={() => onInputFocus(true)}
          onBlur={() => onInputFocus(false)}
          onKeyDown={onKeyDown}
          disabled={loading}
          style={{ overflow: "hidden" }}
        />

        <div className="flex items-center gap-1 px-3 pb-2.5 pt-0.5">
          {collections.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  disabled={loading}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-[6px] px-2 text-[11px] text-[var(--ink-muted)] transition-colors hover:bg-[var(--canvas-soft)] hover:text-[var(--ink-soft)]",
                    scopeCollectionId !== "all" && "text-[var(--accent-jade)]",
                  )}
                  aria-label={`Sources: ${scopeLabel}`}
                >
                  <FileText size={13} strokeWidth={1.5} />
                  {scopeLabel}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 rounded-[10px] border-[var(--line)]">
                <DropdownMenuLabel className="text-[11px] text-[var(--ink-muted)]">
                  Sources
                </DropdownMenuLabel>
                <DropdownMenuRadioGroup value={scopeCollectionId} onValueChange={onScopeChange}>
                  <DropdownMenuRadioItem value="all">All sources</DropdownMenuRadioItem>
                  {collections.map((collection) => (
                    <DropdownMenuRadioItem key={collection.id} value={collection.id}>
                      {collection.name}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <span className="inline-flex h-8 items-center gap-1.5 px-2 text-[11px] text-[var(--ink-muted)]">
              <FileText size={13} strokeWidth={1.5} />
              All sources
            </span>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                disabled={loading}
                className="inline-flex h-8 items-center gap-1.5 rounded-[6px] px-2 text-[11px] text-[var(--ink-muted)] transition-colors hover:bg-[var(--canvas-soft)] hover:text-[var(--ink-soft)]"
                aria-label={`Answer style: ${modeLabel}`}
              >
                <Sliders size={13} strokeWidth={1.5} />
                {modeLabel}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40 rounded-[10px] border-[var(--line)]">
              <DropdownMenuLabel className="text-[11px] text-[var(--ink-muted)]">
                Answer style
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup value={answerMode} onValueChange={onAnswerModeChange}>
                {ANSWER_MODES.map((mode) => (
                  <DropdownMenuRadioItem key={mode.value} value={mode.value}>
                    {mode.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={onToggleRecording}
              disabled={loading || !speechSupported}
              aria-label={isRecording ? "Stop recording speech" : "Start recording speech"}
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-[6px] text-[var(--ink-muted)] transition-colors hover:bg-[var(--canvas-soft)] hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-40",
                isRecording && "bg-[var(--accent-jade-50)] text-[var(--accent-jade)]",
              )}
            >
              {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
            </button>

            {loading ? (
              <button
                type="button"
                onClick={onStopGenerating}
                aria-label="Stop generating answer"
                className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] text-[var(--ink-muted)] transition-colors hover:bg-[var(--canvas-soft)] hover:text-[var(--ink)]"
              >
                <Square size={12} className="fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                aria-label="Send message"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-jade)] text-[#04100e] transition-colors hover:bg-[var(--accent-jade-hover)] disabled:bg-[var(--surface-2)] disabled:text-[var(--ink-muted)]"
              >
                <ArrowUp size={15} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      </div>
      <p className="mt-2 text-center text-[10px] text-[var(--ink-muted)]">
        Answers come from approved documents. Open a source before you act on it.
      </p>
    </form>
  );
}
