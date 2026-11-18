import { FileText, LockKeyhole } from "lucide-react";

import { AskWorkspace, DocumentPage } from "./product-visuals";

export function HeroVisual() {
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="absolute -inset-5 -z-10 hidden rounded-[24px] border border-[var(--line)] opacity-70 lg:block"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-4 left-8 right-8 -z-10 h-16 rounded-[50%] bg-black/40 blur-2xl"
      />

      <div className="relative z-10">
        <AskWorkspace />
      </div>

      <div className="absolute -bottom-14 -left-5 z-20 hidden w-[228px] lg:block">
        <div className="mk-float overflow-hidden">
          <div className="flex items-center gap-2 border-b border-[var(--line)] px-3 py-2">
            <FileText
              size={11}
              strokeWidth={1.5}
              className="text-[var(--accent-jade)]"
              aria-hidden="true"
            />
            <span className="truncate font-meta text-[9px] text-[var(--ink-soft)]">
              Parental_Leave_Policy.pdf
            </span>
            <span className="ml-auto font-meta text-[8px] text-[var(--ink-muted)]">
              p. 8
            </span>
          </div>
          <div className="bg-[var(--canvas)] p-2">
            <DocumentPage compact page="8" section="People · policy 04" title="Parental leave" />
          </div>
          <div className="flex items-center justify-between border-t border-[var(--line)] px-3 py-1.5">
            <span className="inline-flex items-center gap-1 font-meta text-[8px] text-[var(--ink-muted)]">
              <LockKeyhole size={9} strokeWidth={1.5} aria-hidden="true" />
              Workspace-scoped
            </span>
            <span className="font-meta text-[8px] text-[var(--accent-jade)]">
              Cited
            </span>
          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="absolute -right-8 -top-10 -z-10 hidden h-40 w-40 rounded-full border border-[var(--line)] opacity-40 xl:block"
      />
    </div>
  );
}
