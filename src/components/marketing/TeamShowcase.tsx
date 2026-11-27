"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Quote, Users } from "lucide-react";

import { cn } from "@/src/lib/utils";
import { CitationMark } from "./ui";

const TEAMS = [
  {
    name: "People and HR",
    question: "What does a new support hire complete in week one?",
    answer:
      "Orientation, the customer data policy, and a first-ticket review with the team lead.",
    source: "Employee_Handbook.pdf · p. 14",
    href: "/solutions#people",
  },
  {
    name: "Support",
    question: "What is the escalation path for a billing dispute?",
    answer:
      "Tier one logs the dispute, then routes to Billing Operations within one business day.",
    source: "Support_Playbook.docx · § 3.2",
    href: "/solutions#support",
  },
  {
    name: "Legal and compliance",
    question: "What is the approved wording for a data request?",
    answer:
      "Use the acknowledgement in Policy 12; do not paraphrase the response window.",
    source: "Data_Requests_Policy.pdf · § 2",
    href: "/solutions#legal",
  },
  {
    name: "Operations",
    question: "What is the sign-off for a purchase above the local limit?",
    answer:
      "Site lead approval first, then Finance for the amount above the regional threshold.",
    source: "Procurement_SOP.pdf · p. 6",
    href: "/solutions#operations",
  },
];

export function TeamShowcase() {
  const [active, setActive] = useState(0);
  const team = TEAMS[active];

  return (
    <div className="grid gap-px overflow-hidden rounded-[16px] border border-[var(--line)] bg-[var(--line)] lg:grid-cols-[0.76fr_1.24fr]">
      <div className="flex flex-col justify-between bg-[var(--canvas)] p-5 sm:p-7">
        <div>
          <span className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-[var(--line)] bg-[var(--surface)]">
            <Users size={16} strokeWidth={1.5} className="text-[var(--accent-jade)]" aria-hidden="true" />
          </span>
          <p className="mt-6 max-w-[26ch] text-[19px] font-medium leading-7 tracking-[-0.02em] text-[var(--ink)]">
            One library.
            <br />
            Every team’s questions.
          </p>
          <p className="mt-3 max-w-[38ch] text-[12px] leading-5 text-[var(--ink-muted)]">
            Collections keep a question inside one department. The permissions stay the
            same; the answers get more specific.
          </p>
        </div>

        <div className="mt-7 space-y-1" role="tablist" aria-label="Teams">
          {TEAMS.map((item, index) => (
            <button
              key={item.name}
              type="button"
              role="tab"
              aria-selected={active === index}
              onClick={() => setActive(index)}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-2 text-left text-[12px] transition-colors",
                active === index
                  ? "bg-[var(--accent-jade-50)] text-[var(--ink)]"
                  : "text-[var(--ink-muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)]",
              )}
            >
              <span>{item.name}</span>
              <span className={cn("font-meta text-[10px]", active === index ? "text-[var(--accent-jade)]" : "text-[var(--ink-muted)]")}>
                0{index + 1}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="relative flex min-h-[360px] flex-col justify-between bg-[var(--canvas)] p-5 sm:p-8">
        <div key={active} className="animate-in fade-in duration-200 motion-reduce:animate-none">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[12px] font-medium text-[var(--ink-muted)]">{team.name}</p>
            <Link href={team.href} className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--ink-muted)] hover:text-[var(--ink)]">
              Open solution <ArrowUpRight size={12} />
            </Link>
          </div>
          <p className="mt-8 flex max-w-[48ch] gap-2 text-[16px] leading-7 text-[var(--ink)] sm:text-[18px]">
            <Quote size={14} strokeWidth={1.5} className="mt-1.5 shrink-0 text-[var(--ink-muted)]" aria-hidden="true" />
            {team.question}
          </p>
          <p className="mt-5 max-w-[58ch] border-l border-[var(--accent-jade-100)] pl-4 text-[13px] leading-6 text-[var(--ink-soft)]">
            {team.answer}
            <CitationMark n={active + 1} />
          </p>
        </div>

        <div className="mt-10 flex flex-wrap items-end justify-between gap-3 border-t border-[var(--line)] pt-4">
          <p className="max-w-[38ch] font-meta text-[10px] leading-4 text-[var(--ink-muted)]">
            {team.source}
          </p>
          <p className="font-meta text-[10px] text-[var(--ink-muted)]">
            {String(active + 1).padStart(2, "0")} / {String(TEAMS.length).padStart(2, "0")}
          </p>
        </div>
      </div>
    </div>
  );
}
