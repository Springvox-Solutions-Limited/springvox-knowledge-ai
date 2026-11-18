import {
  Callout,
  CheckList,
  DocLink,
  DocsTable,
  GuideSection,
  RelatedLinks,
} from '@/src/components/docs/DocsPrimitives';

export function DataHandlingContent() {
  return (
    <>
      <GuideSection id="workspace-isolation" title="Workspace isolation">
        <p>
          Each organisation works inside its own workspace. Documents, chunks,
          chat messages, invitations, notifications, audit events, and usage
          records carry a workspace identifier, and every server query checks it.
        </p>
        <p>
          Vector searches include a workspace filter in the Qdrant payload. A
          retrieval cannot return another tenant’s passage even when the question
          text is identical. Row-level security is enabled on every table and is
          not disabled for convenience. Service-role credentials stay on the
          server.
        </p>
        <Callout tone="note" title="The short version">
          The workspace boundary is enforced on the server in application queries
          and in vector filters. It is not a client-side filter and it is not a
          UI convention.
        </Callout>
      </GuideSection>

      <GuideSection id="access-boundaries" title="Access boundaries">
        <DocsTable
          minWidth={640}
          head={['Role', 'Data boundary']}
          rows={[
            [
              'Viewer',
              'Asks questions and reads answers, sources, and their own notifications. Cannot manage documents or people.',
            ],
            [
              'Workspace admin',
              'Manages the workspace library, people, settings, analytics, and evaluations. Can see recent questions, unanswered questions, and feedback flags, but not another member’s full chat thread from the analytics screen.',
            ],
            [
              'Platform admin',
              'Operates workspace health, plans, lifecycle, and diagnostics. By design the platform console shows operational metadata rather than document text or private conversation content.',
            ],
          ]}
        />
        <p>
          Workspace admins cannot modify a platform admin, cannot grant platform
          admin, and cannot reach another workspace. Public signup never creates a
          platform admin.
        </p>
      </GuideSection>

      <GuideSection id="data-flow" title="What moves, and where">
        <ol className="list-decimal space-y-2 pl-5 marker:text-[var(--ink-muted)]">
          <li>
            An upload is stored in Supabase Storage and queued as a background
            job.
          </li>
          <li>
            The parser extracts text and metadata. Text is chunked and embedded.
          </li>
          <li>
            Vectors are written to Qdrant with workspace and document metadata.
          </li>
          <li>
            A question is embedded, matched against workspace-filtered vector
            candidates, merged with keyword candidates, reranked, and compressed
            into context.
          </li>
          <li>
            Retrieved passages are sent to the answer model. The reply returns
            with citations and a confidence label.
          </li>
        </ol>
        <p>
          The <DocLink href="/security">Security page</DocLink> and{' '}
          <DocLink href="/data-handling">Data handling page</DocLink> are the
          public policy surface for this flow. They describe the same providers
          listed below.
        </p>
      </GuideSection>

      <GuideSection id="providers" title="Providers">
        <DocsTable
          minWidth={720}
          head={['Provider', 'Purpose', 'Data']}
          rows={[
            ['Supabase', 'Authentication, Postgres, file storage', 'Account records, workspace data, uploaded documents'],
            ['Vercel', 'Application hosting', 'Request logs and application runtime'],
            ['Qdrant', 'Vector index', 'Chunk vectors with workspace metadata'],
            ['Google Gemini', 'Answer generation', 'Retrieved passages needed to answer a question'],
            ['Voyage AI', 'Embeddings and reranking', 'Question and passage text'],
            ['LlamaParse', 'Optional advanced parsing', 'Files an admin chooses to parse with it'],
            ['Inngest', 'Background job orchestration', 'Document processing events and job metadata'],
            ['Resend', 'Transactional email', 'Invitation and account email addresses'],
          ]}
        />
        <p>
          Advanced parsing is disabled by default and controlled by the platform
          operator. When it is enabled, supported files may be sent to the
          configured parser. The data handling page lists the full set of
          subprocessors and the transfer position.
        </p>
      </GuideSection>

      <GuideSection id="retention-and-deletion" title="Retention and deletion">
        <p>
          Documents stay until an admin deletes them or the workspace is closed.
          Deleting a document removes the stored file, its chunks, and its
          vectors. A workspace deletion runs the lifecycle for documents, chunks,
          vectors, and chat history.
        </p>
        <p>
          Some operational records, such as audit entries, billing state, and
          security logs, may be retained for a limited period to meet legal,
          accounting, and security obligations. The{' '}
          <DocLink href="/privacy">privacy policy</DocLink> sets out the
          categories and the request process. The{' '}
          <DocLink href="/data-handling">data handling page</DocLink> describes
          processing roles and locations.
        </p>
        <Callout tone="warning" title="Deletion is deliberate">
          A deleted document is removed from retrieval and cannot be restored
          from the app. Keep an approved copy in your own records before deleting
          a source.
        </Callout>
      </GuideSection>

      <GuideSection id="what-is-not-claimed" title="What is not claimed">
        <p className="text-[var(--ink)]">
          Rekall-IQ does not claim SOC 2 or ISO 27001 certification.
        </p>
        <p>
          The site does not publish customer names, logos, or usage statistics
          that cannot be evidenced. If a certification is completed, or a
          customer agrees to be named, it will appear on the security page with
          the details.
        </p>
        <p>
          Confidence is a retrieval-quality indicator, not a legal, security, or
          factual guarantee. The citations are the evidence to check.
        </p>
      </GuideSection>

      <GuideSection id="planned-work" title="Planned work">
        <Callout tone="planned" title="Not in this beta">
          Single sign-on, SCIM, source connectors such as Google Drive,
          document-level permissions, and complete OCR for scanned PDFs are
          planned. They are not available now and should not be assumed in a
          security review or a rollout plan.
        </Callout>
        <p>
          The workspace boundary is tenant-level. Collections do not create
          document-level permissions; any member of the workspace can ask across
          the workspace library. See{' '}
          <DocLink href="/docs/using/collections#not-a-permission-boundary">
            Collections are not permissions
          </DocLink>
          .
        </p>
      </GuideSection>

      <GuideSection id="admin-checklist" title="Admin checklist">
        <CheckList
          items={[
            'Upload only documents the whole workspace is permitted to read.',
            'Remove superseded versions so retrieval cannot cite an old policy.',
            'Review the Users screen monthly and suspend accounts that should no longer have access.',
            'Keep the workspace name, assistant name, and support email accurate in settings.',
            'Watch the unanswered-question list and feedback flags for sources that need work.',
            'Send security questions to the published contact rather than guessing at the answer.',
          ]}
        />
      </GuideSection>

      <GuideSection id="report-a-vulnerability" title="Report a vulnerability">
        <p>
          Email{' '}
          <a
            href="mailto:hello@springvoxsl.com?subject=Security%20disclosure"
            className="font-medium text-[var(--accent-jade)] underline underline-offset-4"
          >
            hello@springvoxsl.com
          </a>{' '}
          with the subject “Security disclosure”. Include steps to reproduce, the
          affected page or workspace, and the relevant request details. Do not
          include customer documents or personal data.
        </p>
        <p>
          We will confirm receipt, investigate, and tell you the outcome. Give us
          a reasonable window to fix the issue before publishing it.
        </p>
      </GuideSection>

      <GuideSection id="next-steps" title="Next steps">
        <RelatedLinks
          items={[
            {
              href: '/security',
              title: 'Security and data handling',
              description: 'The full public security page.',
            },
            {
              href: '/data-handling',
              title: 'Data handling policy',
              description: 'Categories, providers, locations, and retention.',
            },
            {
              href: '/privacy',
              title: 'Privacy policy',
              description: 'How personal data is handled.',
            },
            {
              href: '/docs/admin/documents-and-uploads',
              title: 'Documents and uploads',
              description: 'Apply the upload policy in practice.',
            },
          ]}
        />
      </GuideSection>
    </>
  );
}
