import type { Metadata } from 'next';
import { LegalPageLayout } from '@/src/components/legal/LegalPageLayout';
import { LegalSection } from '@/src/components/legal/LegalSection';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | Rekall-IQ',
  description: 'How we collect, use, process, and protect your information in Rekall-IQ.',
};

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      description="We believe in clarity, privacy, and control over your organisational data. This Privacy Policy details how we handle information in Rekall-IQ."
      lastUpdated="May 2026"
      activePath="/privacy"
    >
      <div className="space-y-4">
        <p className="text-sm leading-6 text-[var(--ink-soft)]">
          This Privacy Policy explains how Rekall-IQ (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) collects, uses, shares, and protects information from organisations and users who interact with the Rekall-IQ platform.
        </p>

        <LegalSection id="who-we-are" title="1. Who We Are">
          <p>
            Rekall-IQ is a secure, multi-tenant SaaS platform that allows organisations to upload approved company documents and provide their staff with an AI assistant that answers questions based strictly on the context of those uploaded documents.
          </p>
        </LegalSection>

        <LegalSection id="information-we-collect" title="2. Information We Collect">
          <p>We may collect several categories of information to provide the service:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>
              <strong>Account Information:</strong> Names, email addresses, passwords, and related authentication details. All auth data is securely handled by Supabase Auth.
            </li>
            <li>
              <strong>Workspace Information:</strong> Organisation name, workspace slug, configurations, billing plan labels, and team role assignments.
            </li>
            <li>
              <strong>Uploaded Content:</strong> Text files, PDFs, or other documents uploaded by authorised Workspace Admins for retrieval-augmented question answering.
            </li>
            <li>
              <strong>Chat Information:</strong> Questions asked by users, responses generated, user feedback ratings, and session histories.
            </li>
            <li>
              <strong>Usage and Analytics:</strong> Aggregated indicators such as total document count, query volumes, knowledge gaps, and workspace activity timestamps.
            </li>
            <li>
              <strong>Technical Information:</strong> Device metadata, browser user-agents, IP addresses, and application log files when accessing the platform.
            </li>
          </ul>
        </LegalSection>

        <LegalSection id="how-we-use-information" title="3. How We Use Information">
          <p>We process the information we collect to:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Provide, maintain, and support the Rekall-IQ platform.</li>
            <li>Authenticate users and enforce role-based access permissions.</li>
            <li>Process uploaded documents asynchronously through our background workers.</li>
            <li>Generate context-specific answers from customer documents and display source citations.</li>
            <li>Provide private user chat history and session logs.</li>
            <li>Monitor system reliability, diagnose performance issues, and protect against security incidents or abuse.</li>
          </ul>
        </LegalSection>

        <LegalSection id="ai-processing" title="4. AI Processing & Document Context">
          <p>
            Rekall-IQ utilises advanced language models to generate embeddings and retrieve accurate answers. Specifically:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>
              Uploaded documents are parsed, chunked, and sent to the Google Gemini API to produce vector embeddings and formulate answers to user queries.
            </li>
            <li>
              <strong>No Model Training:</strong> We do not intentionally use customer-provided document contents or private chat histories to train Google Gemini public models or any third-party foundation models.
            </li>
            <li>
              AI processing is scoped to retrieve context exclusively from the specific organisation&apos;s workspace. Third-party provider terms of service may apply.
            </li>
          </ul>
        </LegalSection>

        <LegalSection id="third-party-processors" title="5. Third-Party Service Providers">
          <p>We work with trusted third-party providers to host infrastructure and process data:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Vercel:</strong> For frontend hosting, static site deployment, and API route serverless execution.</li>
            <li><strong>Supabase:</strong> For user authentication, relational application database hosting (PostgreSQL), and document file storage.</li>
            <li><strong>Qdrant Cloud:</strong> For hosting the isolated vector database containing document chunk embeddings.</li>
            <li><strong>Google Gemini API:</strong> For producing embeddings and generating AI question-answering responses.</li>
            <li><strong>Inngest:</strong> For managing background job queues and asynchronous document processing tasks.</li>
          </ul>
        </LegalSection>

        <LegalSection id="data-sharing" title="6. Data Sharing">
          <p>
            We do not sell, rent, or lease your data. We share data only in the following circumstances:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>With infrastructure processors listed in Section 5 strictly to provide the SaaS service.</li>
            <li>To comply with valid legal processes, law enforcement requests, or applicable statutory laws.</li>
            <li>To protect and defend the rights, safety, and security of Rekall-IQ, our users, and the public.</li>
            <li>With the explicit consent or direction of the customer organisation.</li>
          </ul>
        </LegalSection>

        <LegalSection id="data-retention" title="7. Data Retention">
          <p>We retain data according to the following guidelines:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>
              <strong>Account and Workspace data</strong> are retained while the user profile or workspace remains active.
            </li>
            <li>
              <strong>Uploaded documents</strong> are stored until deleted by a Workspace Admin, or until the organisation workspace is closed.
            </li>
            <li>
              <strong>Chat history</strong> is stored to provide users with session history and is maintained until a user deletes a session or when the account is closed.
            </li>
            <li>
              <strong>System logs</strong> are retained for operational, auditing, and debugging purposes for a limited time.
            </li>
          </ul>
        </LegalSection>

        <LegalSection id="data-deletion" title="8. Data Deletion">
          <p>
            authorised Workspace Admins have the ability to delete uploaded documents from the dashboard. Once deleted, the raw document is removed from Supabase Storage and corresponding vector chunks are removed from Qdrant. Users can request total deletion of their profile by contacting us at the address below.
          </p>
        </LegalSection>

        <LegalSection id="security-summary" title="9. Security & Trust">
          <p>
            We take reasonable technical and administrative measures designed to protect information from loss, theft, and unauthorised access. For a detailed breakdown of our security controls, please review our <Link href="/security" className="text-[var(--accent-jade)] hover:underline font-semibold">Security & Data Protection</Link> page.
          </p>
        </LegalSection>

        <LegalSection id="international-transfers" title="10. International Data Transfers">
          <p>
            Our service providers (such as Supabase, Vercel, Google Gemini, and Qdrant) maintain datacenters in various regions. Consequently, your data may be transferred to or processed in jurisdictions outside of your home country.
          </p>
        </LegalSection>

        <LegalSection id="user-rights" title="11. User Rights">
          <p>
            Depending on your location, you may have rights regarding access, correction, deletion, restriction, or objection to the processing of your personal information. Please contact us to submit your request.
          </p>
        </LegalSection>

        <LegalSection id="children" title="12. Children and Minors">
          <p>
            Rekall-IQ is designed for professional business use and is not directed at children under the age of 13 (or the legal age in your jurisdiction). We do not knowingly collect personal information from children.
          </p>
        </LegalSection>

        <LegalSection id="changes" title="13. Changes to this Policy">
          <p>
            We may update this Privacy Policy from time to time. Any updates will be posted on this page with a revised date. We encourage you to review this policy periodically.
          </p>
        </LegalSection>

        <LegalSection id="contact" title="14. Contact Us">
          <p>
            For any questions, requests, or concerns regarding your privacy, please reach out to us at:
          </p>
          <div className="mt-2 bg-[var(--surface-2)] border border-[var(--line)] p-3 rounded-xl inline-block">
            <p className="font-semibold text-[var(--ink)]">Email: <a href="mailto:privacy@rekall-iq.com" className="text-[var(--accent-jade)] hover:underline">privacy@rekall-iq.com</a></p>
          </div>
        </LegalSection>
      </div>
    </LegalPageLayout>
  );
}
