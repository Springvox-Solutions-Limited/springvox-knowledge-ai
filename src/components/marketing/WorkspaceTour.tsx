"use client";

import { useId, useRef, useState } from "react";
import {
  FileSearch,
  FolderOpen,
  ListChecks,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/src/lib/utils";
import {
  AskWorkspace,
  GapsWorkspace,
  LibraryWorkspace,
  SourcesWorkspace,
} from "./product-visuals";

type TabKey = "ask" | "sources" | "library" | "gaps";

const TABS: Array<{
  key: TabKey;
  label: string;
  icon: LucideIcon;
  title: string;
  copy: string;
  points: string[];
}> = [
  {
    key: "ask",
    label: "Ask",
    icon: MessageSquare,
    title: "The answer arrives with its sources attached",
    copy: "Staff ask in plain English. The reply is assembled from passages in the workspace library, and every sentence that depends on a document carries a numbered reference.",
    points: [
      "Answer modes from summary to technical",
      "Scope a question to one collection",
      "The question stays in the conversation",
    ],
  },
  {
    key: "sources",
    label: "Sources",
    icon: FileSearch,
    title: "The citation points at a page, not a folder",
    copy: "Open a reference and the original document renders beside the answer. The highlighted paragraph is the passage the model actually used, not a link to a shared drive.",
    points: [
      "Page, section, and collection in one view",
      "Authenticated, workspace-scoped preview",
      "Proof of the wording before you act on it",
    ],
  },
  {
    key: "library",
    label: "Library",
    icon: FolderOpen,
    title: "One approved set, visibly current",
    copy: "Admins upload the files the organisation has approved. Parsing, sectioning, and indexing run in the background, and the library shows what is ready and what is still processing.",
    points: [
      "Six formats, parsed with page references",
      "Collections by department",
      "Search and filter the approved set",
    ],
  },
  {
    key: "gaps",
    label: "Gaps",
    icon: ListChecks,
    title: "The questions the documents fail to answer",
    copy: "When retrieval finds nothing good, the answer says so and the question is logged. Admins get a ranked list of what to write next instead of a silent hallucination.",
    points: [
      "Coverage measured over time",
      "Ranked by how often a question is asked",
      "A document backlog with evidence",
    ],
  },
];

const PANELS: Record<TabKey, React.ComponentType<{ className?: string }>> = {
  ask: AskWorkspace,
  sources: SourcesWorkspace,
  library: LibraryWorkspace,
  gaps: GapsWorkspace,
};

export function WorkspaceTour({ className }: { className?: string }) {
  const [active, setActive] = useState<TabKey>("ask");
  const baseId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const activeTab = TABS.find((tab) => tab.key === active) ?? TABS[0];

  const focusTab = (index: number) => {
    const next = TABS[(index + TABS.length) % TABS.length];
    setActive(next.key);
    tabRefs.current[(index + TABS.length) % TABS.length]?.focus();
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[20px] border border-[var(--line)] bg-[var(--surface)]",
        className,
      )}
    >
      <div className="flex flex-col gap-6 border-b border-[var(--line)] p-4 sm:p-6 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
        <div className="max-w-[46rem]">
          <p className="mk-meta">Inside the workspace</p>
          <h2 className="mk-h2 mt-3 text-[var(--ink)]">
            A product you can inspect, not just read about
          </h2>
        </div>
        <div
          role="tablist"
          aria-label="Workspace views"
          className="mk-scroll-x -mx-1 flex gap-1 rounded-[12px] border border-[var(--line)] bg-[var(--canvas)] p-1"
        >
          {TABS.map((tab, index) => {
            const Icon = tab.icon;
            const isActive = tab.key === active;
            return (
              <button
                key={tab.key}
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                type="button"
                role="tab"
                id={`${baseId}-tab-${tab.key}`}
                aria-selected={isActive}
                aria-controls={`${baseId}-panel-${tab.key}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActive(tab.key)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowRight") {
                    event.preventDefault();
                    focusTab(index + 1);
                  }
                  if (event.key === "ArrowLeft") {
                    event.preventDefault();
                    focusTab(index - 1);
                  }
                  if (event.key === "Home") {
                    event.preventDefault();
                    focusTab(0);
                  }
                  if (event.key === "End") {
                    event.preventDefault();
                    focusTab(TABS.length - 1);
                  }
                }}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-[8px] px-3 py-2 text-[12px] font-medium transition-colors",
                  isActive
                    ? "bg-[var(--accent-jade)] text-[#04100e]"
                    : "text-[var(--ink-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]",
                )}
              >
                <Icon size={13} strokeWidth={1.5} aria-hidden="true" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="border-b border-[var(--line)] p-5 sm:p-6 lg:border-b-0 lg:border-r">
          <p className="font-meta text-[10px] text-[var(--accent-jade)]">
            {activeTab.label} view
          </p>
          <h3 className="mt-2 text-[18px] font-medium leading-6 tracking-[-0.02em] text-[var(--ink)]">
            {activeTab.title}
          </h3>
          <p className="mt-3 text-[13px] leading-6 text-[var(--ink-soft)]">
            {activeTab.copy}
          </p>
          <ul className="mt-5 space-y-2 border-t border-[var(--line)] pt-4">
            {activeTab.points.map((point) => (
              <li
                key={point}
                className="flex gap-2.5 text-[11px] leading-5 text-[var(--ink-muted)]"
              >
                <span
                  aria-hidden="true"
                  className="mt-2.5 h-px w-3 shrink-0 bg-[var(--accent-jade)]"
                />
                {point}
              </li>
            ))}
          </ul>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--canvas)] px-3 py-1.5 font-meta text-[9px] text-[var(--ink-muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Preview · sample content
          </div>
        </div>

        {TABS.map((tab) => {
          const TabPanel = PANELS[tab.key];
          const isActive = tab.key === active;
          return (
            <div
              key={tab.key}
              id={`${baseId}-panel-${tab.key}`}
              role="tabpanel"
              aria-labelledby={`${baseId}-tab-${tab.key}`}
              hidden={!isActive}
              className="min-w-0 bg-[var(--canvas)] p-3 motion-safe:[animation:mk-rise_0.45s_var(--mk-ease)_both] sm:p-5"
            >
              {isActive ? <TabPanel /> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
