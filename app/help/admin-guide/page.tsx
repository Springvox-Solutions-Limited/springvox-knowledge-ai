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

      <GuideSection id="quality" eyebrow="Keep it accurate" title="Analytics, gaps & evaluations">
        <p>Three tools keep answer quality high over time:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Analytics</strong> — question volume, activity over time, and adoption. See whether the knowledge
            base is being used and which areas get the most questions.
          </li>
          <li>
            <strong>Unanswered Questions</strong> — when the assistant can&apos;t answer, or users mark answers
            not-helpful, those surface here. Each gap usually means a document is missing, outdated, or unclear.
          </li>
          <li>
            <strong>Evaluations</strong> — create a set of “golden” questions with the keywords/sources you expect, then
            run it to confirm retrieval still returns the right material.
          </li>
        </ul>
        <GuideCallout tone="tip" title="A simple weekly rhythm">
          Review Unanswered Questions weekly and close gaps, and run an Evaluation set after major uploads to catch
          regressions before your team does.
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
