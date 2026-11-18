import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  GraduationCap,
  Landmark,
  LifeBuoy,
  Scale,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";

import { SiteShell } from "@/src/components/marketing/SiteShell";
import {
  ArrowLink,
  ButtonLink,
  PageHero,
  SectionLabel,
} from "@/src/components/marketing/ui";

export const metadata: Metadata = {
  title: "Solutions",
  description:
    "How people teams, support, legal and compliance, operations, education, and public sector teams use Rekall-IQ.",
  alternates: { canonical: "/solutions" },
};

type Team = {
  id: string;
  name: string;
  role: string;
  intro: string;
  asks: string[];
  uploads: string;
  changes: string;
  icon: LucideIcon;
};

const TEAMS: Team[] = [
  {
    id: "people",
    name: "People and HR",
    role: "Onboarding, leave, benefits",
    intro:
      "Every new hire arrives with the same twenty questions, and the answers live in three versions of the handbook.",
    asks: [
      "What does week one look like?",
      "How many days of leave do I have left?",
      "What is the process for a flexible arrangement?",
    ],
    uploads:
      "Handbook, leave policy, benefits guide, code of conduct, onboarding checklists",
    changes:
      "New hires answer their own first-week questions from the approved handbook, with the page attached.",
    icon: Users,
  },
  {
    id: "support",
    name: "Support",
    role: "Playbooks, escalation, product answers",
    intro:
      "The answer is usually in a playbook. The agent is usually on a call, searching four tools for it.",
    asks: [
      "What is the escalation path for a billing dispute?",
      "Which plan includes the audit log?",
      "What do we tell a customer about the outage window?",
    ],
    uploads:
      "Playbooks, escalation matrices, product documentation, known-issue notes",
    changes:
      "Agents get a cited answer at the moment of the ticket, in the customer’s language rather than internal shorthand.",
    icon: LifeBuoy,
  },
  {
    id: "legal",
    name: "Legal and compliance",
    role: "Approved wording, retention, policy",
    intro:
      "Approved wording is the product. A paraphrase with no source is a liability.",
    asks: [
      "What is the approved wording for a data request?",
      "Which retention period applies to closed accounts?",
      "What does the current policy say about remote access?",
    ],
    uploads:
      "Policies, contract templates, regulatory guidance, internal memos",
    changes:
      "Replies quote the policy and link the section, so review is a check rather than a search.",
    icon: Scale,
  },
  {
    id: "operations",
    name: "Operations",
    role: "Procedures, vendors, site guides",
    intro:
      "Procedures change at one site and take months to reach the other eleven.",
    asks: [
      "What is the sign-off for a purchase above the local limit?",
      "Which safety procedure applies to this shift?",
      "Where is the current vendor list?",
    ],
    uploads:
      "Standard operating procedures, vendor lists, site guides, incident reports",
    changes:
      "One approved procedure is the answer everywhere, and the old copy stops being quoted.",
    icon: Workflow,
  },
  {
    id: "education",
    name: "Education",
    role: "Admissions, handbooks, appeals",
    intro:
      "Admissions, handbooks, and administrative rules are spread across departments and intakes.",
    asks: [
      "What are the entry requirements for this programme?",
      "Which deadline applies to a transfer applicant?",
      "What does the student handbook say about appeals?",
    ],
    uploads:
      "Prospectus, handbooks, admissions rules, committee minutes",
    changes:
      "Staff answer from the current year’s documents, with the source open beside the reply.",
    icon: GraduationCap,
  },
  {
    id: "public-sector",
    name: "Public sector",
    role: "Circulars, procedures, service standards",
    intro:
      "Official guidance has to be consistent, attributable, and available to people who are not specialists.",
    asks: [
      "Which procedure applies to this permit?",
      "What is the published timeline for a review?",
      "Where is the current internal circular?",
    ],
    uploads:
      "Circulars, procedures, service standards, official guidance",
    changes:
      "Front-line staff answer from official documents, and the source is visible to the person asking.",
    icon: Landmark,
  },
];

const SHARED = [
  {
    title: "One library",
    copy: "The approved set lives in a private workspace. Collections keep a question inside the department that owns the document.",
  },
  {
    title: "One boundary",
    copy: "Roles, workspace isolation, and the retrieval filter are the same for every team. Only the documents and questions change.",
  },
  {
    title: "One record",
    copy: "The questions a team cannot answer become a gap list. That list is the next document to write.",
  },
];

export default function SolutionsPage() {
  return (
    <SiteShell>
      <PageHero
        label="Solutions"
        title="One workspace. Every team’s questions."
        intro="The documents and permissions stay the same; the questions change. Rekall-IQ gives each team a collection, an answer depth, and a citation it can check."
        actions={
          <>
            <ButtonLink
              href="/register"
              icon={<ArrowUpRight size={15} strokeWidth={1.5} />}
            >
              Create a workspace
            </ButtonLink>
            <ButtonLink href="/contact" variant="secondary">
              Talk to us
            </ButtonLink>
          </>
        }
        aside={
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[12px] border border-[var(--line)] bg-[var(--line)] sm:w-[22rem]">
            {[
              ["6", "teams covered"],
              ["6", "document formats"],
              ["0", "open-web answers"],
              ["1", "workspace per org"],
            ].map(([value, label]) => (
              <div key={label} className="bg-[var(--canvas)] p-3.5">
                <p className="text-[19px] font-medium leading-none tracking-[-0.035em] text-[var(--ink)] tabular-nums">
                  {value}
                </p>
                <p className="mt-1.5 font-meta text-[8px] leading-3.5 text-[var(--ink-muted)]">
                  {label}
                </p>
              </div>
            ))}
          </div>
        }
      />

      <nav
        aria-label="Teams"
        className="sticky top-[68px] z-30 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--canvas)_90%,transparent)] backdrop-blur-xl"
      >
        <div className="mk-shell flex gap-1 overflow-x-auto py-2.5">
          {TEAMS.map((team) => (
            <a
              key={team.id}
              href={`#${team.id}`}
              className="shrink-0 rounded-[7px] px-3 py-1.5 text-[11px] font-medium text-[var(--ink-muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--ink)]"
            >
              {team.name}
            </a>
          ))}
          <ArrowLink href="/contact" className="ml-auto shrink-0 px-3 text-[11px]">
            Talk to us
          </ArrowLink>
        </div>
      </nav>

      <section className="border-b border-[var(--line)]">
        <div className="mk-shell grid gap-12 py-20 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20 lg:py-28">
          <div data-reveal className="lg:sticky lg:top-32 lg:h-fit">
            <SectionLabel>The shared shape</SectionLabel>
            <h2 className="mk-h2 mt-4 max-w-[14ch] text-[var(--ink)]">
              Built for the teams that get asked.
            </h2>
            <p className="mk-lede mt-6 max-w-[40ch]">
              A workspace is one approved set of documents, one boundary, and one
              record of what the set fails to answer. Each team gets a collection
              inside it.
            </p>

            <div className="mt-8 space-y-5 border-t border-[var(--line)] pt-6">
              {SHARED.map((item) => (
                <div key={item.title}>
                  <p className="text-[13px] font-medium text-[var(--ink)]">
                    {item.title}
                  </p>
                  <p className="mt-1 text-[12px] leading-5 text-[var(--ink-muted)]">
                    {item.copy}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <ArrowLink href="/docs/using/collections">
                How collections work
              </ArrowLink>
            </div>
          </div>

          <div>
            {TEAMS.map((team, index) => {
              const Icon = team.icon;
              return (
                <article
                  key={team.id}
                  id={team.id}
                  data-reveal
                  className="scroll-mt-36 border-t border-[var(--line)] py-8 first:border-t-0 first:pt-0"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] border border-[var(--line)] bg-[var(--surface)]">
                        <Icon
                          size={15}
                          strokeWidth={1.5}
                          className="text-[var(--accent-jade)]"
                          aria-hidden="true"
                        />
                      </span>
                      <div>
                        <div className="flex items-baseline gap-2.5">
                          <h2 className="text-[18px] font-medium tracking-[-0.02em] text-[var(--ink)]">
                            {team.name}
                          </h2>
                          <span className="font-meta text-[8px] text-[var(--ink-muted)]">
                            0{index + 1}
                          </span>
                        </div>
                        <p className="mt-0.5 font-meta text-[8px] text-[var(--ink-muted)]">
                          {team.role}
                        </p>
                      </div>
                    </div>
                    <ArrowLink href="/contact" className="text-[11px]">
                      Talk to us
                    </ArrowLink>
                  </div>

                  <p className="mt-4 max-w-[58ch] text-[13px] leading-6 text-[var(--ink-soft)]">
                    {team.intro}
                  </p>

                  <div className="mt-5 grid gap-px overflow-hidden rounded-[12px] border border-[var(--line)] bg-[var(--line)] sm:grid-cols-[1.15fr_0.85fr]">
                    <div className="bg-[var(--canvas)] p-4 sm:p-5">
                      <p className="font-meta text-[8px] text-[var(--ink-muted)]">
                        They ask
                      </p>
                      <ul className="mt-2.5 space-y-2">
                        {team.asks.map((question) => (
                          <li
                            key={question}
                            className="flex gap-2 text-[11px] leading-5 text-[var(--ink-soft)]"
                          >
                            <span
                              aria-hidden="true"
                              className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--line)]"
                            />
                            {question}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-4 border-t border-[var(--line)] pt-3">
                        <p className="font-meta text-[8px] text-[var(--ink-muted)]">
                          They upload
                        </p>
                        <p className="mt-1.5 text-[10px] leading-4 text-[var(--ink-muted)]">
                          {team.uploads}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between bg-[var(--surface)] p-4 sm:p-5">
                      <div>
                        <p className="font-meta text-[8px] text-[var(--accent-jade)]">
                          What changes
                        </p>
                        <p className="mt-2 text-[11px] leading-5 text-[var(--ink-soft)]">
                          {team.changes}
                        </p>
                      </div>
                      <div className="mt-5 flex items-center gap-2 border-t border-[var(--line)] pt-3">
                        <Link
                          href="/product#citations"
                          className="inline-flex items-center gap-1 font-meta text-[8px] text-[var(--ink-muted)]"
                          aria-label={`Read the ${team.name} scenario`}
                        >
                          Cited answer
                          <ArrowUpRight
                            size={9}
                            strokeWidth={1.5}
                            aria-hidden="true"
                          />
                        </Link>
                        <span className="ml-auto font-meta text-[8px] text-[var(--ink-muted)]">
                          Preview
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[var(--surface-2)]">
        <div className="mk-shell grid gap-8 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:py-20">
          <div>
            <SectionLabel>Start with one team</SectionLabel>
            <h2 className="mk-h2 mt-4 max-w-[17ch] text-[var(--ink)]">
              Bring one team’s documents and see how the answers hold up.
            </h2>
            <p className="mk-lede mt-4 max-w-[52ch]">
              Start with the documents that already cause the most repeat
              questions. Add a second collection when the first one earns it.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <ButtonLink
              href="/register"
              icon={<ArrowUpRight size={15} strokeWidth={1.5} />}
            >
              Create a workspace
            </ButtonLink>
            <ButtonLink href="/contact" variant="secondary">
              Talk to us
            </ButtonLink>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
