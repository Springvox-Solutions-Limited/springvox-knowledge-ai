import type { Metadata } from 'next';
import { LegalPageLayout } from '@/src/components/legal/LegalPageLayout';
import { LegalSection } from '@/src/components/legal/LegalSection';

export const metadata: Metadata = {
  title: 'Terms of Service | SpringVox Knowledge AI',
  description: 'Terms and conditions governing the use of the SpringVox Knowledge AI platform.',
};

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      description="These terms outline the rules and responsibilities for using the SpringVox Knowledge AI platform. By accessing the service, you agree to these terms."
      lastUpdated="May 2026"
      activePath="/terms"
    >
      <div className="space-y-4">
        <p className="text-sm leading-6 text-slate-600">
          Please read these Terms of Service (&ldquo;Terms&rdquo;) carefully before using the SpringVox Knowledge AI platform.
        </p>

        <LegalSection id="agreement-to-terms" title="1. Agreement to Terms">
          <p>
            By registering, logging in, or accessing SpringVox Knowledge AI, you agree to comply with and be bound by these Terms. If you are accepting these Terms on behalf of an organisation, you represent that you have the authority to bind that organisation to these Terms.
          </p>
        </LegalSection>

        <LegalSection id="service-description" title="2. Service Description">
          <p>
            SpringVox Knowledge AI is a multi-tenant SaaS application that allows registered organisations to upload internal documents and configure an AI-powered assistant for their staff. The assistant generates answers to user queries using only the workspace&apos;s uploaded documents as context.
          </p>
        </LegalSection>

        <LegalSection id="accounts-and-roles" title="3. Accounts and Roles">
          <p>
            The service utilises role-based access. Users agree to provide accurate registration info. Roles include:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>
              <strong>Workspace Admins:</strong> Responsible for managing workspace settings, uploading/deleting documents, inviting team members, and configuring role permissions.
            </li>
            <li>
              <strong>Viewers:</strong> Staff members with query-only access to ask questions from approved documents.
            </li>
            <li>
              <strong>Platform Admins:</strong> SpringVox operators who manage aggregate system health but do not view tenant document contents by default.
            </li>
          </ul>
          <p className="mt-2">
            Organisations are solely responsible for the actions of users they invite and for maintaining the confidentiality of credentials.
          </p>
        </LegalSection>

        <LegalSection id="customer-content" title="4. Customer Content">
          <p>
            <strong>Ownership:</strong> Customers and organisations retain all ownership, intellectual property rights, and title in the documents and files they upload to the service.
          </p>
          <p>
            <strong>License to Process:</strong> You grant SpringVox a limited, non-exclusive, royalty-free license to parse, index, chunk, convert into embeddings, and query your uploaded content solely to provide the SaaS service to your organisation.
          </p>
          <p>
            <strong>Responsibility:</strong> You warrant that you have all necessary rights, licenses, and permissions to upload the documents to the platform and that doing so does not violate any third-party confidentiality agreements or copyright laws.
          </p>
        </LegalSection>

        <LegalSection id="acceptable-use" title="5. Acceptable Use">
          <p>You agree not to use the platform to:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Upload illegal, defamatory, or infringing content.</li>
            <li>Upload software viruses, malware, or any code designed to disrupt the platform.</li>
            <li>Attempt to bypass multi-tenant isolation, access other workspaces, or probe system vulnerabilities.</li>
            <li>Abuse Gemini API quotas, perform bulk scraping, or engage in automated denial-of-service activities.</li>
            <li>Reverse engineer, decompile, or extract the source code of the platform.</li>
          </ul>
        </LegalSection>

        <LegalSection id="ai-disclaimer" title="6. AI Output Disclaimer">
          <p>
            <strong>Accuracy:</strong> AI-generated answers are produced by retrieval-augmented generation and depend on the quality of uploaded files. AI answers may occasionally contain inaccuracies, omissions, or misstatements.
          </p>
          <p>
            <strong>Verification:</strong> Users should verify critical facts by reviewing the source citations and document references provided with each answer.
          </p>
          <p>
            <strong>No Professional Advice:</strong> The AI output and platform do not constitute professional legal, compliance, financial, medical, or other regulated advice.
          </p>
        </LegalSection>

        <LegalSection id="plans-and-billing" title="7. Plans and Billing">
          <p>
            The platform supports pilot, starter, business, and enterprise workspace plan designations. Paid features, subscription fees, and payment cycles may be activated as billing updates are rolled out. Customer organisations will receive advance notice of updated payment terms prior to any paid billing activation.
          </p>
        </LegalSection>

        <LegalSection id="suspension" title="8. Suspension and Termination">
          <p>
            We reserve the right to suspend or terminate a workspace or user account in the event of:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Violations of these Terms or Acceptable Use rules.</li>
            <li>Threats to platform security, service integrity, or other tenants.</li>
            <li>Non-payment of applicable fees (when billing is active).</li>
            <li>Unlawful or abusive conduct.</li>
          </ul>
        </LegalSection>

        <LegalSection id="availability" title="9. Platform Availability">
          <p>
            While we use reasonable efforts to maintain platform stability and performance, we do not guarantee that the service will be entirely uninterrupted, error-free, or free from scheduled maintenance downtime.
          </p>
        </LegalSection>

        <LegalSection id="third-party-services" title="10. Third-Party Services">
          <p>
            You acknowledge that the service operates in conjunction with third-party infrastructure providers, including Vercel, Supabase, Qdrant Cloud, Google Gemini API, and Inngest. We are not responsible for outages or failures originating from these external providers.
          </p>
        </LegalSection>

        <LegalSection id="limitation-of-liability" title="11. Limitation of Liability">
          <p>
            To the maximum extent permitted by applicable law, SpringVox and its suppliers shall not be liable for any indirect, incidental, special, exemplary, or consequential damages, including loss of profits, data corruption, or business interruption, arising out of or related to the use of the service.
          </p>
        </LegalSection>

        <LegalSection id="changes" title="12. Changes to Service and Terms">
          <p>
            As the product evolves, we may update these Terms or modify the features of the service. Continued use of the platform following the posting of revised Terms constitutes acceptance of those changes.
          </p>
        </LegalSection>

        <LegalSection id="contact" title="13. Contact Us">
          <p>
            For terms support or platform troubleshooting, please reach out to us at:
          </p>
          <div className="mt-2 bg-slate-50 border border-slate-200/80 p-3 rounded-xl inline-block">
            <p className="font-semibold text-slate-800">Email: <a href="mailto:support@springvox.ai" className="text-cyan-600 hover:underline">support@springvox.ai</a></p>
          </div>
        </LegalSection>
      </div>
    </LegalPageLayout>
  );
}
