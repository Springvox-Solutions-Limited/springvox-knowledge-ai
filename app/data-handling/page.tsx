import type { Metadata } from 'next';
import Link from 'next/link';

import { LegalPageLayout } from '@/src/components/legal/LegalPageLayout';
import { LegalSection } from '@/src/components/legal/LegalSection';

export const metadata: Metadata = {
  title: 'Data Handling',
  description:
    'The categories of data Rekall-IQ processes, the providers involved, where processing happens, and how deletion works.',
  alternates: { canonical: '/data-handling' },
};

const SUBPROCESSORS = [
  ['Supabase', 'Authentication, Postgres, file storage', 'Account data, workspace data, uploaded files'],
  ['Vercel', 'Application hosting', 'Request logs, runtime data'],
  ['Qdrant', 'Vector index', 'Chunk vectors with workspace and document metadata'],
  ['Google Gemini', 'Answer generation', 'Retrieved passages sent to answer a question'],
  ['Voyage AI', 'Embeddings and reranking', 'Question and passage text'],
  ['LlamaParse', 'Optional advanced parsing', 'Files an admin selects for it'],
  ['Inngest', 'Background jobs', 'Processing events and job metadata'],
  ['Resend', 'Transactional email', 'Email addresses for invitations and notices'],
];

export default function DataHandlingPage() {
  return (
    <LegalPageLayout
      title="Data Handling"
      description="What Rekall-IQ processes, who processes it, where it goes, and how it is removed."
      lastUpdated="November 2026"
      activePath="/data-handling"
    >
      <LegalSection id="roles" title="1. Roles">
        <p>
          For workspace content and user data, the organisation that created the workspace is
          the controller and Rekall-IQ is the processor. For account, billing, and website data,
          Rekall-IQ is the controller. The entity is{' '}
          <strong className="font-medium text-[var(--ink)]">SpringVox</strong>.
        </p>
      </LegalSection>

      <LegalSection id="categories" title="2. Data categories">
        <ul>
          <li>Account identifiers and role assignments.</li>
          <li>Workspace configuration, invitations, and plan state.</li>
          <li>Uploaded documents and the text extracted from them.</li>
          <li>Chunks and embeddings derived from those documents.</li>
          <li>Questions, answers, citations, feedback, and session history.</li>
          <li>Usage counters, knowledge-gap records, and audit events.</li>
          <li>Technical logs, including IP address and user agent.</li>
        </ul>
      </LegalSection>

      <LegalSection id="flow" title="3. Processing flow">
        <p>
          An upload is written to Supabase Storage and queued as a background job. The parser
          extracts text and metadata, the text is chunked and embedded, and vectors are written
          to Qdrant with workspace and document metadata. The document becomes searchable.
        </p>
        <p>
          A question is embedded, matched against workspace-filtered candidates, merged with
          keyword candidates, reranked, compressed into context, and sent to the answer model.
          The answer returns with citations and confidence information.
        </p>
      </LegalSection>

      <LegalSection id="subprocessors" title="4. Subprocessors">
        <p>
          Each provider processes data only for the purpose listed. The list is maintained here
          so a security review does not depend on a sales conversation.
        </p>
        <div className="overflow-x-auto pt-1">
          <table className="w-full min-w-[620px] border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-y border-[var(--line)]">
                <th className="py-2.5 pr-4 font-medium text-[var(--ink-soft)]">Provider</th>
                <th className="px-4 py-2.5 font-medium text-[var(--ink-soft)]">Purpose</th>
                <th className="px-4 py-2.5 font-medium text-[var(--ink-soft)]">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {SUBPROCESSORS.map(([provider, purpose, data]) => (
                <tr key={provider}>
                  <td className="py-2.5 pr-4 text-[var(--ink)]">{provider}</td>
                  <td className="px-4 py-2.5">{purpose}</td>
                  <td className="px-4 py-2.5">{data}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </LegalSection>

      <LegalSection id="locations" title="5. Locations and transfers">
        <p>
          Providers operate infrastructure in several regions, so processing may occur outside
          Nigeria. Transfers rely on the mechanisms available under the Nigeria Data Protection
          Act 2023, and, where the GDPR or UK GDPR applies, on the provider’s appropriate
          safeguards.
        </p>
      </LegalSection>

      <LegalSection id="retention" title="6. Retention and deletion">
        <p>
          Documents stay until an admin deletes them or the workspace is closed. Deleting a
          document removes the stored file and its vectors. Closing a workspace runs the
          deletion lifecycle for documents, chunks, vectors, and chat history.
        </p>
        <p>
          Audit entries, billing state, and security logs may be kept for a limited period to
          meet legal, accounting, and security obligations.
        </p>
      </LegalSection>

      <LegalSection id="security" title="7. Security measures">
        <p>
          Workspace identifiers are applied to every database and vector query. Row-level
          security is enabled on every table. Service-role credentials stay on the server and
          are never exposed to the browser. Document previews are served through an
          authenticated, workspace-scoped stream.
        </p>
        <p>
          The <Link href="/security">security page</Link> describes the controls, the admin
          boundary, and what is not claimed.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="8. Contact">
        <p>
          Data handling questions:{' '}
          <strong className="font-medium text-[var(--ink)]">
            hello@springvoxsl.com
          </strong>
          . General enquiries:{' '}
          <a href="mailto:hello@springvoxsl.com">hello@springvoxsl.com</a>.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
