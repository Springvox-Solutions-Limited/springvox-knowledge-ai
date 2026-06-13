import type { Metadata } from 'next';
import { LegalPageLayout } from '@/src/components/legal/LegalPageLayout';
import { LegalSection } from '@/src/components/legal/LegalSection';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Security & Data Protection | Rekall-IQ',
  description: 'Learn about our security controls, workspace isolation, data protection practices, and privacy boundaries.',
};

export default function SecurityPage() {
  return (
    <LegalPageLayout
      title="Security & Data Protection"
      description="We design security and data isolation directly into our platform architecture to safeguard your organisation's internal knowledge."
      lastUpdated="May 2026"
      activePath="/security"
    >
      <div className="space-y-4">
        <p className="text-sm leading-6 text-[var(--ink-soft)]">
          This page provides transparent information regarding our security practices, architectural design, data isolation, and our security roadmap.
        </p>

        <LegalSection id="security-overview" title="1. Security Overview">
          <p>
            Rekall-IQ is engineered to protect customer knowledge. Our core architecture focuses on strict workspace isolation, role-based access controls, private document storage, and scoping AI processing strictly to retrieved context from your approved files.
          </p>
        </LegalSection>

        <LegalSection id="access-control" title="2. Access Control & Authentication">
          <p>
            We implement granular access controls to ensure users only access the features and data they are authorised to see:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>
              <strong>Supabase Auth:</strong> Utilises secure, industry-standard authentication mechanisms to handle logins, passwords, and sessions.
            </li>
            <li>
              <strong>Workspace Admin:</strong> Controls document uploads, document deletions, user invites, workspace settings, and knowledge gaps.
            </li>
            <li>
              <strong>Viewer:</strong> Scoped to query-only access in the chat interface. Viewers cannot upload documents, delete files, or view workspace-level configurations.
            </li>
          </ul>
        </LegalSection>

        <LegalSection id="workspace-isolation" title="3. Multi-Tenant Workspace Isolation">
          <p>
            Our database and vector storage are designed to enforce partition security between organisations:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>
              <strong>Workspace Scoping:</strong> All database queries are scoped by a unique <code>workspace_id</code>.
            </li>
            <li>
              <strong>Vector Separation:</strong> Document chunk vectors are indexed in Qdrant Cloud and queried with metadata filtering that restricts search queries to matches containing the client&apos;s specific <code>workspace_id</code>.
            </li>
            <li>
              <strong>No Cross-Workspace Exposure:</strong> Users assigned to one workspace are unable to view documents, vectors, chat histories, or analytics from any other workspace.
            </li>
          </ul>
        </LegalSection>

        <LegalSection id="admin-boundary" title="4. Platform Admin Privacy Boundary">
          <p>
            Rekall-IQ operators holding the Platform Admin role can manage system health, view workspace metadata (such as document counts and plan status), and suspend or reactivate workspaces.
          </p>
          <p className="mt-2 font-semibold">
            By default, Platform Admins do not view the text content of your uploaded documents or browse full user chat conversations in cleartext.
          </p>
        </LegalSection>

        <LegalSection id="data-storage" title="5. Data Storage Infrastructure">
          <p>Our infrastructure partners provide secure database, storage, and processing environments:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Supabase PostgreSQL:</strong> Houses structured application database records, user relations, workspace settings, and chat session metadata.</li>
            <li><strong>Supabase Storage:</strong> Stores raw uploaded files (PDFs, TXT) in private storage buckets named <code>documents</code>.</li>
            <li><strong>Qdrant Cloud:</strong> Holds index vectors representing document chunks.</li>
            <li><strong>Vercel:</strong> Runs serverless functions and hosts application routes.</li>
            <li><strong>Inngest:</strong> Coordinates state machine background queues.</li>
          </ul>
        </LegalSection>

        <LegalSection id="ai-processing" title="6. AI Context & Retrieval Bounds">
          <p>
            To prevent generative model hallucination and leakage, the application uses a strict Retrieval-Augmented Generation (RAG) pattern. When a user asks a question, the application retrieves context chunks matching that specific workspace and inserts them directly into the Gemini prompt context. Responses are generated based strictly on this context, and source citations are returned.
          </p>
        </LegalSection>

        <LegalSection id="encryption" title="7. Encryption">
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>
              <strong>In Transit:</strong> All data transmitted to or from the platform is encrypted using Secure Sockets Layer (SSL) / Transport Layer Security (TLS) (HTTPS).
            </li>
            <li>
              <strong>At Rest:</strong> Encryption at rest is managed by our underlying infrastructure providers (Supabase, Qdrant Cloud, and Vercel) using standard disk encryption technologies.
            </li>
          </ul>
        </LegalSection>

        <LegalSection id="background-processing" title="8. Background Processing State Safety">
          <p>
            Document parsing, text extraction, embedding generation, and vector indexing are handled asynchronously by Inngest. Documents are tracked via lifecycle states: <code>processing</code>, <code>ready</code>, or <code>failed</code>. Inngest steps run inside isolated serverless sandboxes.
          </p>
        </LegalSection>

        <LegalSection id="monitoring" title="9. Logging and Monitoring">
          <p>
            We collect application logs for diagnostic and reliability purposes. These logs contain metadata such as API response codes, timestamps, and error codes. We utilise these logs to maintain system health, troubleshoot background jobs, and monitor for unauthorized access attempts.
          </p>
        </LegalSection>

        <LegalSection id="customer-responsibilities" title="10. Customer Security Responsibilities">
          <p>Security is a shared responsibility. We ask that customer organisations:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Ensure only authorised documents are uploaded to the workspace.</li>
            <li>Manage invited users and review team roles regularly.</li>
            <li>Promptly remove users who should no longer have access to the workspace.</li>
            <li>Verify important facts and guidelines output by the AI prior to making operational or regulatory decisions.</li>
          </ul>
        </LegalSection>

        <LegalSection id="roadmap" title="11. Security & Compliance Roadmap">
          <p>We are actively developing security enhancements, with plans to introduce:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Strict rate limiting on login and API endpoints.</li>
            <li>Workspace audit logs tracking admin actions (e.g., uploads, deletions, invites).</li>
            <li>Single Sign-On (SSO) integrations for enterprise tenants.</li>
            <li>Third-party security code audits and penetration testing.</li>
            <li>Formal security compliance reviews (such as SOC 2 and ISO 27001).</li>
          </ul>
        </LegalSection>

        <LegalSection id="contact" title="12. Contact Security">
          <p>
            To report a suspected vulnerability or discuss enterprise security requirements, please email:
          </p>
          <div className="mt-2 bg-[var(--surface-2)] border border-[var(--line)] p-3 rounded-xl inline-block">
            <p className="font-semibold text-[var(--ink)]">Email: <a href="mailto:security@springvoxsl.com" className="text-[var(--accent-jade)] hover:underline">security@springvoxsl.com</a></p>
          </div>
        </LegalSection>
      </div>
    </LegalPageLayout>
  );
}
