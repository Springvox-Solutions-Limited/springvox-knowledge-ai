import type { Metadata } from 'next';
import Link from 'next/link';
import { HelpPageLayout } from '@/src/components/help/HelpPageLayout';
import {
  FileTypesTable,
  GuideCallout,
  GuideFaq,
  GuideFigure,
  GuideSection,
  GuideStep,
  GuideSteps,
  UploadMock,
} from '@/src/components/help/GuideKit';

export const metadata: Metadata = {
  title: 'Admin Guide | Rekall-IQ',
  description:
    'How workspace admins upload documents, organise collections, manage users, and keep answer quality high in Rekall-IQ.',
};

export default function AdminGuidePage() {
  return (
    <HelpPageLayout
      title="Admin Guide"
      description="For workspace admins. Set up your knowledge base, invite your team, and keep answers accurate over time."
      activePath="/help/admin-guide"
    >
      <GuideSection id="quickstart" eyebrow="Get going" title="Quick start in 4 steps">
        <GuideSteps>
          <GuideStep title="Upload your approved documents">
            Add the policies, handbooks, and guides your team should be able to ask about.
          </GuideStep>
          <GuideStep title="Organise them into collections">
            Group documents by department so questions can be scoped precisely.
          </GuideStep>
          <GuideStep title="Invite your team">
            Add members as Viewers (ask questions) or Workspace Admins (full control).
          </GuideStep>
          <GuideStep title="Review gaps weekly">
            Check Unanswered Questions and close gaps by adding or updating documents.
          </GuideStep>
        </GuideSteps>
      </GuideSection>

      <GuideSection id="uploading" eyebrow="Knowledge base" title="Uploading documents">
        <p>
          Go to <strong>Upload Documents</strong> and add files. Each one is processed in the background — parsed,
          chunked, and indexed — so you can keep working while it&apos;s prepared.
        </p>
        <GuideFigure caption="Pick a collection, drop your files, and watch each one move to “Ready”.">
          <UploadMock />
        </GuideFigure>
        <FileTypesTable />
        <GuideCallout tone="note" title="Processing status">
          A document moves from <em>processing</em> → <em>ready</em> (or <em>failed</em>, with a reason). Advanced
          parsing kicks in automatically for complex files like scanned PDFs and dense tables, falling back to local
          parsing if needed.
        </GuideCallout>
        <GuideCallout tone="warning" title="Only upload what you’re allowed to share">
          Everything you upload becomes answerable by <strong>every member</strong> of the workspace. Remove or replace
          anything outdated.
        </GuideCallout>
      </GuideSection>

      <GuideSection id="collections" eyebrow="Organise" title="Collections">
        <p>
          Collections group related documents (e.g. <em>HR</em>, <em>Finance</em>, <em>Legal</em>, <em>Operations</em>).
          Assign a document during upload or later from the Documents list. Members can then <strong>scope</strong> their
          questions to a single collection.
        </p>
        <GuideCallout tone="tip" title="Use collections from day one">
          It costs nothing early and makes scoping, maintenance, and clean-up far easier as your knowledge base grows.
        </GuideCallout>
      </GuideSection>

      <GuideSection id="intelligence" eyebrow="Automatic" title="Document intelligence">
        <p>
          When a document finishes processing, Rekall-IQ automatically generates a short <strong>summary</strong>, a set
          of <strong>keywords</strong>, and a <strong>category</strong> (Manual, Policy, Procedure, Contract, Financial
          Report, Spreadsheet, Presentation, Technical Guide, Knowledge Base, or Other) — so documents are findable by
          meaning, not just filename. Preview any file in place to confirm it parsed correctly.
        </p>
      </GuideSection>

      <GuideSection id="users" eyebrow="People" title="Users and invitations">
        <p>From <strong>Users</strong>, invite teammates by email and assign a role:</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
            <p className="font-semibold text-[var(--ink)]">Viewer</p>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">Ask questions, read answers and sources. Cannot upload or manage documents.</p>
          </div>
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
            <p className="font-semibold text-[var(--ink)]">Workspace Admin</p>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">Full control of documents, users, settings, and analytics for the workspace.</p>
          </div>
        </div>
        <GuideCallout tone="note" title="Invitations are time-limited">
          The invitee sets their own password when they accept. You can change roles or remove members at any time.
        </GuideCallout>
      </GuideSection>

      <GuideSection id="analytics" eyebrow="Measure" title="Analytics">
        <p>
          <strong>Analytics</strong> shows how your workspace is using Rekall-IQ — question volume, activity over time,
          answer coverage, and engagement. Use it to see whether the knowledge base is being adopted and which areas
          attract the most questions, so you know where to invest.
        </p>
      </GuideSection>

      <GuideSection id="knowledge-gaps" eyebrow="Close the gaps" title="Unanswered questions (knowledge gaps)">
        <p>
          A <strong>knowledge gap</strong> is a question your team asked that Rekall-IQ <em>couldn&apos;t</em> answer
          from your documents — or that a user marked “not helpful”. Instead of vanishing, each one is recorded here
          with a count of how many times it&apos;s been asked.
        </p>
        <GuideFigure caption="Gaps are ranked by how often they're asked — tackle the top ones first.">
          <div className="space-y-2">
            {[
              ['12', 'How do I reset my VPN token?'],
              ['7', 'What is the 2026 travel per-diem?'],
              ['4', 'Where is the incident-response runbook?'],
            ].map(([count, q]) => (
              <div key={q} className="flex items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] p-3">
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500/10 px-1.5 text-[11px] font-bold text-red-300">{count}</span>
                <span className="min-w-0 flex-1 truncate text-sm text-[var(--ink-soft)]">{q}</span>
                <span className="shrink-0 rounded-full border border-[var(--line)] px-2 py-0.5 text-[10px] text-[var(--ink-muted)]">open</span>
              </div>
            ))}
          </div>
        </GuideFigure>
        <p>
          <strong>Why it matters:</strong> a gap is a precise, demand-driven signal of what your documentation is
          missing. It turns “we should improve the wiki someday” into a ranked to-do list based on what people actually
          need right now.
        </p>
        <p><strong>How to use it</strong></p>
        <GuideSteps>
          <GuideStep title="Review the list regularly">Sorted by frequency, so the most-asked gaps sit at the top.</GuideStep>
          <GuideStep title="Find the cause">Usually a document is missing, out of date, or worded unclearly.</GuideStep>
          <GuideStep title="Upload or update the document">Add the missing source — or fix the existing one — so the answer now exists.</GuideStep>
          <GuideStep title="Mark it resolved & re-ask">Close the gap, then ask the question again to confirm it answers with sources.</GuideStep>
        </GuideSteps>
        <GuideCallout tone="tip" title="This is your content roadmap">
          Over a few weeks the gap list tells you exactly which policies and procedures to write next — driven by real
          staff demand, not guesswork.
        </GuideCallout>
      </GuideSection>

      <GuideSection id="evaluations" eyebrow="Protect quality" title="Evaluations">
        <p>
          <strong>Evaluations</strong> let you lock in answer quality so it doesn&apos;t quietly regress when documents
          change. You create a set of <strong>golden questions</strong> — ones you know the right answer to — and tell
          Rekall-IQ what a good answer should contain (expected keywords and/or which document it should come from).
          Running the set checks that retrieval still surfaces the right material.
        </p>
        <GuideFigure caption="An evaluation set runs your golden questions and reports how many passed.">
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-[var(--line)] bg-[var(--surface-2)] p-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--ink)]">HR policy checks</p>
                <p className="text-xs text-[var(--ink-muted)]">8 golden questions</p>
              </div>
              <span className="shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">7 / 8 passed</span>
            </div>
            <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)] p-3 text-xs text-[var(--ink-soft)]">
              “How many days of PTO do I get?” → expected keywords <em>25 days, carryover</em> → <span className="font-semibold text-emerald-300">found in Employee-Handbook.pdf ✓</span>
            </div>
          </div>
        </GuideFigure>
        <p>
          <strong>Why it matters:</strong> every upload, deletion, or re-index can shift what the AI retrieves.
          Evaluations are a repeatable “did we break anything?” check — like automated tests for your knowledge base.
        </p>
        <p><strong>How to use it</strong></p>
        <GuideSteps>
          <GuideStep title="Create an evaluation set">Group related golden questions, e.g. “HR policy checks”.</GuideStep>
          <GuideStep title="Add golden questions">For each, list the keywords you expect in a correct answer and/or the source document it should cite.</GuideStep>
          <GuideStep title="Run the set">Rekall-IQ asks each question and scores whether the expected material was retrieved.</GuideStep>
          <GuideStep title="Re-run after big changes">After major uploads or clean-ups, run it again to catch regressions before your team does.</GuideStep>
        </GuideSteps>
        <GuideCallout tone="note" title="Deterministic by design">
          Evaluations check retrieval against your stated expectations — they don&apos;t subjectively “grade” the AI — so
          results stay consistent and comparable from one run to the next.
        </GuideCallout>
      </GuideSection>

      <GuideSection id="rhythm" eyebrow="Habit" title="A simple weekly rhythm">
        <GuideCallout tone="tip" title="15 minutes a week keeps answers sharp">
          Review <strong>Unanswered questions</strong> and close the top gaps, then run your <strong>Evaluation</strong>
          sets after any major document change. That loop is what makes Rekall-IQ measurably better over time.
        </GuideCallout>
      </GuideSection>

      <GuideSection id="limits-settings" eyebrow="Configuration" title="Usage limits & company settings">
        <p>
          Your plan may include limits on monthly questions, daily uploads, storage, and AI usage (configured by the
          platform operator). If your workspace hits a limit, affected actions pause with a clear message — contact the
          operator to raise it.
        </p>
        <p>
          Under <strong>Company Settings</strong> you can update your organisation name, the assistant&apos;s display
          name, and company context — keeping this accurate helps the assistant introduce itself and frame answers
          correctly.
        </p>
      </GuideSection>

      <GuideSection id="faq" eyebrow="Help" title="Frequently asked questions">
        <GuideFaq
          items={[
            {
              q: 'Why did a document fail to process?',
              a: 'Usually an unsupported or corrupted file, or a scanned document with no extractable text. The Documents list shows the reason — try re-exporting or re-saving the file and uploading again.',
            },
            {
              q: 'A member can’t see the Upload or Users screens.',
              a: 'They’re a Viewer. Change their role to Workspace Admin from the Users screen if they need to manage the knowledge base.',
            },
            {
              q: 'How do I improve a bad answer?',
              a: 'Check Unanswered Questions and not-helpful feedback. Most fixes are a document change — add the missing source, replace an outdated one, or clarify the wording — then re-run an Evaluation set.',
            },
            {
              q: 'Can the platform operator read our documents?',
              a: 'The platform console shows operational metadata (counts, status) — not your document contents or members’ private chats.',
            },
          ]}
        />
        <GuideCallout tone="success" title="Set your team up well">
          Point new members to the{' '}
          <Link href="/help/user-guide" className="font-semibold text-[var(--accent-jade)] hover:underline">
            User Guide
          </Link>{' '}
          so they ask effective questions from day one.
        </GuideCallout>
      </GuideSection>
    </HelpPageLayout>
  );
}
