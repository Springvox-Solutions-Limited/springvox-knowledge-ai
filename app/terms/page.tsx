import type { Metadata } from 'next';
import Link from 'next/link';

import { LegalPageLayout } from '@/src/components/legal/LegalPageLayout';
import { LegalSection } from '@/src/components/legal/LegalSection';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'The terms that govern use of the Rekall-IQ workspace, accounts, customer content, and AI-generated answers.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      description="The agreement between your organisation and Rekall-IQ for use of the workspace."
      lastUpdated="November 2026"
      activePath="/terms"
    >
      <p className="text-[14px] leading-7 text-[var(--ink-soft)]">
        These terms govern use of Rekall-IQ. The service is operated by{' '}
        <strong className="font-medium text-[var(--ink)]">SpringVox</strong>,
        established in the Federal Republic of Nigeria.
      </p>

      <LegalSection id="agreement" title="1. Agreement">
        <p>
          By creating a workspace, inviting a user, or using the service, the organisation and
          its users agree to these terms. If you accept on behalf of an organisation, you
          confirm that you are authorised to do so.
        </p>
      </LegalSection>

      <LegalSection id="service" title="2. The service">
        <p>
          Rekall-IQ lets an organisation upload approved documents, invite users, and ask
          questions that are answered from those documents with citations. Features are
          described on the <Link href="/product">product page</Link>. Anything marked planned
          is not part of the service yet.
        </p>
      </LegalSection>

      <LegalSection id="accounts" title="3. Accounts and roles">
        <p>
          Workspace admins control document uploads, user invitations, roles, and workspace
          settings. Viewers can ask questions and read answers. You are responsible for
          keeping credentials secure and for the actions taken under your account.
        </p>
        <p>
          Public signup never creates a platform administrator. Platform administration is
          internal to Rekall-IQ.
        </p>
      </LegalSection>

      <LegalSection id="content" title="4. Customer content">
        <p>
          You keep ownership of the documents and messages you submit. You grant Rekall-IQ a
          limited licence to store, parse, index, embed, retrieve, and display that content
          only to provide the service to your workspace.
        </p>
        <p>
          You confirm that you have the right to upload the content, that it does not infringe
          another party’s rights, and that uploading it does not breach a confidentiality
          obligation.
        </p>
      </LegalSection>

      <LegalSection id="acceptable-use" title="5. Acceptable use">
        <p>
          Use of the service is subject to the{' '}
          <Link href="/acceptable-use">Acceptable Use Policy</Link>. Prohibited conduct
          includes attempting to access another workspace, uploading unlawful material, and
          interfering with the service.
        </p>
      </LegalSection>

      <LegalSection id="ai-output" title="6. AI-generated answers">
        <p>
          Answers are generated from retrieved passages and can be incomplete or wrong. Each
          answer names its sources so it can be checked. You are responsible for verifying an
          answer before relying on it for a legal, financial, medical, or employment decision.
        </p>
        <p>
          The service is not a substitute for professional advice, and it does not make
          decisions on your behalf.
        </p>
      </LegalSection>

      <LegalSection id="fees" title="7. Fees and beta access">
        <p>
          Essential is free during beta. Paid plans are quoted per workspace and confirmed in
          writing before they begin. Unless stated otherwise, fees are exclusive of taxes.
        </p>
        <p>
          Beta features may change or be withdrawn. We will give workspace admins notice
          before a change materially reduces what a paid workspace receives.
        </p>
      </LegalSection>

      <LegalSection id="availability" title="8. Availability and support">
        <p>
          We work to keep the service available, but we do not promise an uptime percentage or
          a response time unless a separate written agreement says so. Support is provided by
          email through the <Link href="/contact">contact page</Link>.
        </p>
      </LegalSection>

      <LegalSection id="ip" title="9. Intellectual property">
        <p>
          Rekall-IQ, including its software, interface, and brand, remains our property. These
          terms do not grant you a right to copy, resell, or reverse engineer the service,
          except where the law does not allow that restriction.
        </p>
      </LegalSection>

      <LegalSection id="termination" title="10. Suspension and termination">
        <p>
          We may suspend a workspace where there is a security risk, non-payment, or a breach
          of these terms or the Acceptable Use Policy. A workspace admin may stop using the
          service at any time and request deletion through the workspace lifecycle.
        </p>
        <p>
          On termination, documents, chunks, vectors, and chat history are removed through the
          deletion flow, subject to the retention described in the{' '}
          <Link href="/privacy">privacy policy</Link>.
        </p>
      </LegalSection>

      <LegalSection id="warranty" title="11. Disclaimers">
        <p>
          The service is provided on an “as available” basis. To the extent permitted by law, we
          disclaim implied warranties of merchantability, fitness for a particular purpose, and
          non-infringement.
        </p>
      </LegalSection>

      <LegalSection id="liability" title="12. Limitation of liability">
        <p>
          To the extent permitted by law, neither party is liable for indirect, incidental, or
          consequential loss, or for lost profits or lost data. Our total liability arising from
          the service is limited to the amount paid for the workspace in the twelve months
          before the event giving rise to the claim.
        </p>
        <p>
          Nothing in these terms limits liability that cannot be limited by law.
        </p>
      </LegalSection>

      <LegalSection id="law" title="13. Governing law">
        <p>
          These terms are governed by the laws of the Federal Republic of Nigeria. The courts of
          Nigeria have jurisdiction, unless a separate written agreement between the parties
          provides otherwise.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="14. Changes">
        <p>
          We may update these terms. Material changes will be posted on this page with a new
          date, and workspace admins will be notified where the change affects them.
          Continued use after the effective date is acceptance of the updated terms.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="15. Contact">
        <p>
          Questions about these terms:{' '}
          <a href="mailto:hello@springvoxsl.com">hello@springvoxsl.com</a>.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
