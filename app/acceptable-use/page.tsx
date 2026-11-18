import type { Metadata } from 'next';
import Link from 'next/link';

import { LegalPageLayout } from '@/src/components/legal/LegalPageLayout';
import { LegalSection } from '@/src/components/legal/LegalSection';

export const metadata: Metadata = {
  title: 'Acceptable Use Policy',
  description:
    'What may and may not be uploaded or done in a Rekall-IQ workspace, and how breaches are handled.',
  alternates: { canonical: '/acceptable-use' },
};

export default function AcceptableUsePage() {
  return (
    <LegalPageLayout
      title="Acceptable Use Policy"
      description="The boundary for content, access, and conduct in a Rekall-IQ workspace."
      lastUpdated="November 2026"
      activePath="/acceptable-use"
    >
      <p className="text-[14px] leading-7 text-[var(--ink-soft)]">
        This policy applies to every workspace and every user. It is part of the{' '}
        <Link href="/terms">Terms of Service</Link>.
      </p>

      <LegalSection id="purpose" title="1. Purpose">
        <p>
          Rekall-IQ is built for approved company knowledge. Use it for the documents your
          organisation is entitled to rely on, and for questions your team is entitled to ask.
        </p>
      </LegalSection>

      <LegalSection id="content" title="2. Content you may not upload">
        <ul>
          <li>Material you do not have the right to store or process.</li>
          <li>Unlawful content, including content that infringes intellectual property or privacy rights.</li>
          <li>Another organisation’s confidential material, unless you are authorised to process it.</li>
          <li>Credentials, private keys, or secrets that are not needed for a knowledge answer.</li>
          <li>Special category data, unless your organisation has a lawful basis and has configured the workspace appropriately.</li>
        </ul>
      </LegalSection>

      <LegalSection id="conduct" title="3. Conduct you may not engage in">
        <ul>
          <li>Attempting to access another workspace, user account, or vector collection.</li>
          <li>Probing, scanning, or testing the service for vulnerabilities without written permission.</li>
          <li>Attempting prompt injection, data exfiltration, or retrieval of content outside your workspace.</li>
          <li>Uploading malware, or using the service to distribute it.</li>
          <li>Interfering with rate limits, metering, or background processing.</li>
          <li>Reselling or white-labelling the service without an agreement.</li>
        </ul>
      </LegalSection>

      <LegalSection id="answers" title="4. Using generated answers">
        <p>
          An answer is a draft built from retrieved passages. Check the cited source before
          relying on it for a legal, financial, medical, or employment decision. Do not present
          an unverified answer as an official determination.
        </p>
        <p>
          Where your organisation has an approval process for external communication, apply it
          to generated text in the same way you would to text written by a person.
        </p>
      </LegalSection>

      <LegalSection id="enforcement" title="5. Enforcement">
        <p>
          We may remove content, limit features, or suspend a workspace where we reasonably
          believe this policy has been breached, or where the service or another customer is at
          risk. Where it is lawful and safe to do so, we will tell the workspace admin.
        </p>
      </LegalSection>

      <LegalSection id="reporting" title="6. Reporting">
        <p>
          Report abuse or a security issue to{' '}
          <a href="mailto:hello@springvoxsl.com?subject=Acceptable%20use%20report">
            hello@springvoxsl.com
          </a>
          . Include the workspace, the conduct, and any evidence that does not itself contain
          personal data.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
