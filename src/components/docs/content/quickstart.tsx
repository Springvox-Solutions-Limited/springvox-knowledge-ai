import {
  Callout,
  CheckList,
  DocLink,
  DocsTable,
  GuideSection,
  Kbd,
  RelatedLinks,
  Steps,
  Step,
} from '@/src/components/docs/DocsPrimitives';

export function QuickstartContent() {
  return (
    <>
      <GuideSection id="before-you-start" title="Before you start">
        <p>
          Rekall-IQ answers questions from documents your organisation has
          approved. It does not search the public web, and it does not answer
          from outside knowledge. That constraint is what makes a cited answer
          useful.
        </p>
        <p>You need three things before the first question:</p>
        <ul className="list-disc space-y-2 pl-5 marker:text-[var(--ink-muted)]">
          <li>
            <span className="font-medium text-[var(--ink)]">A workspace.</span>{' '}
            Create one, or accept an invitation from an existing workspace
            admin.
          </li>
          <li>
            <span className="font-medium text-[var(--ink)]">
              The approved documents.
            </span>{' '}
            PDF, DOCX, XLSX, PPTX, CSV, or TXT, up to 20 MB per file by default.
          </li>
          <li>
            <span className="font-medium text-[var(--ink)]">
              A workspace admin.
            </span>{' '}
            Uploads, invitations, and settings are admin actions. Viewers can
            ask questions but cannot manage the library.
          </li>
        </ul>
        <Callout tone="note" title="This is a beta">
          Features can change, and some screens carry rate limits. Anything
          marked <span className="text-[var(--ink)]">planned</span> on these
          pages is not available in the current build. See{' '}
          <DocLink href="/pricing">Pricing</DocLink> for the current beta terms
          and <DocLink href="/docs/troubleshooting/faq#beta-limits">Beta limits</DocLink>{' '}
          for the numbers.
        </Callout>
      </GuideSection>

      <GuideSection id="create-workspace" title="Create or join a workspace">
        <Steps>
          <Step title="Create the workspace">
            Open <DocLink href="/register">Create a workspace</DocLink> and enter
            your company name, your name, a work email, and a password of at
            least 10 characters with a letter and a number. The account you create becomes the workspace
            admin.
          </Step>
          <Step title="Use the invited email if you were invited">
            An invitation is tied to one email address. If you already have an
            account, sign in with that address. If you do not, create an account
            from the invitation page.
          </Step>
          <Step title="Know what the workspace starts with">
            New workspaces start on a 14-day trial. During beta, the Essential
            plan is free. Pricing and plan changes are on{' '}
            <DocLink href="/pricing">Pricing</DocLink>; nothing on this page
            overrides that page.
          </Step>
        </Steps>
        <p>
          <span className="font-medium text-[var(--ink)]">Expected result:</span>{' '}
          you land in the dashboard. Admins start at the workspace overview;
          viewers start on the chat screen.
        </p>
        <Callout tone="tip" title="Invited users skip creation">
          If you accept an invitation, do not create a second workspace. The
          invitation adds your account to the workspace that sent it.
        </Callout>
      </GuideSection>

      <GuideSection id="upload-documents" title="Upload the approved set">
        <p>
          Sign in as a workspace admin, then open{' '}
          <DocLink href="/dashboard/upload">Upload documents</DocLink>. Choose a
          collection if the documents belong to a department, then drag files
          into the drop area or select them from your computer.
        </p>
        <Steps>
          <Step title="Choose the collection">
            Collections are optional at upload time. Picking one now saves a
            later step and makes scoped questions possible. The default
            collections are General, HR, Finance, Legal, Operations, Sales,
            Support, and IT.
          </Step>
          <Step title="Add the files">
            You can select several files at once. The queue lists each file
            separately, so one bad file does not stop the rest.
          </Step>
          <Step title="Start the upload queue">
            Select <span className="font-medium text-[var(--ink)]">Upload queue</span>{' '}
            and leave the tab open until every item leaves the queue or shows a
            final status. Processing continues in the background.
          </Step>
          <Step title="Wait for Ready">
            A document moves through processing and becomes Ready. A question
            asked before the status is Ready may miss the document.
          </Step>
        </Steps>
        <Callout tone="warning" title="Everyone in the workspace can ask from these files">
          An upload is not private to the admin who added it. Only upload
          documents the whole workspace is allowed to read.
        </Callout>
      </GuideSection>

      <GuideSection id="invite-team" title="Invite your team">
        <Steps>
          <Step title="Open Users">
            Open <DocLink href="/dashboard/users">Users</DocLink> and select{' '}
            <span className="font-medium text-[var(--ink)]">Invite user</span>.
          </Step>
          <Step title="Choose a role">
            Use <span className="font-medium text-[var(--ink)]">Viewer</span> for
            people who ask questions, or{' '}
            <span className="font-medium text-[var(--ink)]">Workspace admin</span>{' '}
            for people who also manage documents, people, and settings.
          </Step>
          <Step title="Send or copy the link">
            Rekall-IQ emails the invitation when email delivery is configured.
            The invite dialog also gives you a link you can copy and send
            directly.
          </Step>
        </Steps>
        <p>
          Invitations expire after seven days. The Users screen lists pending
          invitations and lets an admin copy the link or revoke it.
        </p>
      </GuideSection>

      <GuideSection id="ask-first-question" title="Ask your first question">
        <Steps>
          <Step title="Open chat">
            Open <DocLink href="/dashboard/chat">Ask questions</DocLink>. The
            composer sits at the bottom of the thread.
          </Step>
          <Step title="Pick the answer mode">
            Detailed is the default. Summary, Executive, and Technical change
            how the answer is written, not which documents are searched.
          </Step>
          <Step title="Pick a scope">
            Leave the document scope on{' '}
            <span className="font-medium text-[var(--ink)]">All documents</span>{' '}
            for a first question. Choose a collection when the question belongs
            to one department.
          </Step>
          <Step title="Ask in plain English">
            Type the question and press <Kbd>Enter</Kbd>. Use <Kbd>Shift</Kbd> +{' '}
            <Kbd>Enter</Kbd> for a new line.
          </Step>
        </Steps>
        <p>
          A useful first question names the topic and the context, for example:
          “What is the remote-work policy for UK employees, and which document
          covers it?” A vague question such as “Tell me the policy” gives the
          retriever less to work with.
        </p>
        <p>
          <span className="font-medium text-[var(--ink)]">Expected result:</span>{' '}
          a streamed answer, a confidence label, one or more source chips, and
          optional follow-up questions.
        </p>
      </GuideSection>

      <GuideSection id="read-citation" title="Read a citation">
        <p>
          Every supported answer carries citations. Select a source chip under
          the answer to open its details. The panel shows the matched excerpt,
          the file name, and metadata such as the upload date.
        </p>
        <Steps>
          <Step title="Open the source chip">
            Select the numbered chip. The panel opens beside the conversation.
          </Step>
          <Step title="Read the excerpt">
            The excerpt is the text the model used. Check that it says what the
            answer claims.
          </Step>
          <Step title="Open the full document">
            Select <span className="font-medium text-[var(--ink)]">View full document</span>{' '}
            to open the original file in the preview. Use this for any decision
            that matters.
          </Step>
        </Steps>
        <Callout tone="warning" title="A citation is evidence, not a guarantee">
          The answer can still misread a passage. Open the original before you
          act on a policy, figure, or approval.
        </Callout>
      </GuideSection>

      <GuideSection id="expected-result" title="What success looks like">
        <CheckList
          items={[
            'The workspace has at least one document in Ready status.',
            'A viewer can sign in and reach the chat screen.',
            'A first question returns an answer with at least one source.',
            'The source opens the correct excerpt and the full file previews.',
            'The answer says it could not find support when you ask about something the documents do not cover.',
          ]}
        />
      </GuideSection>

      <GuideSection id="if-something-fails" title="If something fails">
        <DocsTable
          minWidth={620}
          head={['Symptom', 'What to do']}
          rows={[
            [
              'A document stays on Processing for a long time.',
              <>
                Large files and scanned PDFs take longer. Check{' '}
                <DocLink href="/dashboard/documents">Documents</DocLink> for the
                latest status. If it fails, open the row for the reason.
              </>,
            ],
            [
              'A document shows Failed.',
              <>
                Use Reprocess on the document row. If it fails again, read{' '}
                <DocLink href="/docs/admin/documents-and-uploads#fix-a-failure">
                  Fix a failed upload
                </DocLink>
                .
              </>,
            ],
            [
              'The answer says it could not find support.',
              <>
                The content is probably missing or phrased differently. Check the
                source list, then add or update the document. See{' '}
                <DocLink href="/docs/using/asking-questions#no-answer">
                  When there is no answer
                </DocLink>
                .
              </>,
            ],
            [
              'A viewer cannot see Upload or Users.',
              <>
                That is expected. Viewers cannot manage the library. A workspace
                admin can change the role from{' '}
                <DocLink href="/dashboard/users">Users</DocLink>.
              </>,
            ],
            [
              'A request returns a rate-limit message.',
              <>
                Wait for the retry window shown in the message. The current beta
                limits are listed in{' '}
                <DocLink href="/docs/troubleshooting/faq#beta-limits">
                  Beta limits
                </DocLink>
                .
              </>,
            ],
          ]}
        />
      </GuideSection>

      <GuideSection id="next-steps" title="Next steps">
        <RelatedLinks
          items={[
            {
              href: '/docs/using/asking-questions',
              title: 'Asking questions',
              description: 'Phrase questions that retrieve the right passages.',
            },
            {
              href: '/docs/using/sources-and-citations',
              title: 'Sources and citations',
              description: 'Verify an answer in one click.',
            },
            {
              href: '/docs/admin/documents-and-uploads',
              title: 'Documents and uploads',
              description: 'Bulk upload, status, and failure recovery.',
            },
            {
              href: '/docs/admin/users-and-roles',
              title: 'Users and roles',
              description: 'Invite the right people with the right access.',
            },
          ]}
        />
      </GuideSection>
    </>
  );
}
