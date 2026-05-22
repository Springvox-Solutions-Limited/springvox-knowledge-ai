import type { Metadata } from 'next';
import { LegalPageLayout } from '@/src/components/legal/LegalPageLayout';
import { LegalSection } from '@/src/components/legal/LegalSection';

export const metadata: Metadata = {
  title: 'Acceptable Use Policy | SpringVox Knowledge AI',
  description: 'Rules and guidelines for the acceptable use of the SpringVox Knowledge AI platform.',
};

export default function AcceptableUsePage() {
  return (
    <LegalPageLayout
      title="Acceptable Use Policy"
      description="This Acceptable Use Policy outlines the standards and restrictions that apply when you interact with the SpringVox Knowledge AI platform."
      lastUpdated="May 2026"
      activePath="/acceptable-use"
    >
      <div className="space-y-4">
        <p className="text-sm leading-6 text-slate-600">
          We want to maintain a secure, reliable, and respectful platform for all tenants. By using the platform, you agree to adhere to these guidelines.
        </p>

        <LegalSection id="no-illegal" title="1. No Unlawful or Illegal Uploads">
          <p>
            You must not upload, share, or process content that is unlawful, harmful, threatening, abusive, defamatory, harassing, vulgar, or otherwise objectionable. You are responsible for ensuring your uploads comply with all local, national, and international laws.
          </p>
        </LegalSection>

        <LegalSection id="no-malware" title="2. No Malware or Harmful Code">
          <p>
            You must not transmit or upload files containing Trojan horses, worms, logic bombs, viruses, ransomware, or any other software or code designed to disrupt, disable, damage, or limit the functionality of the system or our service providers.
          </p>
        </LegalSection>

        <LegalSection id="no-bypass" title="3. No Probing or Bypass of Controls">
          <p>
            We enforce multi-tenant isolation. You are strictly prohibited from attempting to:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Access another workspace, database, or storage folder that you are not authorised to see.</li>
            <li>Scan, test, or probe the vulnerabilities of our network, hosting servers, or APIs.</li>
            <li>Circumvent security mechanisms, firewalls, or authentication rules.</li>
          </ul>
        </LegalSection>

        <LegalSection id="no-scraping" title="4. No Scraping or Automated Abuse">
          <p>
            Unless given explicit written permission by us, you must not use scrapers, spiders, crawlers, indexers, or other automated scripts to extract bulk data from the application interfaces. You must not use our API endpoints in a manner that exceeds normal usage patterns or disrupts service delivery for other users.
          </p>
        </LegalSection>

        <LegalSection id="no-infringement" title="5. Intellectual Property and Content Rights">
          <p>
            You must not upload copyrighted documents, manuals, trade secrets, proprietary codes, or private data unless you hold the intellectual property rights or have obtained explicit authorization from the rights holder.
          </p>
        </LegalSection>

        <LegalSection id="no-harmful-ai" title="6. Ethical Use of AI and Outputs">
          <p>
            The generated AI responses are intended to support team knowledge retrieval. You must not use the platform or the generated output to:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Generate spam, misleading communications, or fraudulent documents.</li>
            <li>Conduct automated profiling or decision-making that has legal or critical life consequences.</li>
            <li>Violate Google Gemini API Safety Policies or terms of service.</li>
          </ul>
        </LegalSection>

        <LegalSection id="violations" title="7. Enforcement and Reporting">
          <p>
            We review security logs and reserve the right to suspend workspaces or deactivate individual user accounts that violate this policy.
          </p>
          <p className="mt-2">
            If you witness or suspect any violations, please report them to:
          </p>
          <div className="mt-2 bg-slate-50 border border-slate-200/80 p-3 rounded-xl inline-block">
            <p className="font-semibold text-slate-800">Email: <a href="mailto:support@springvox.ai" className="text-cyan-600 hover:underline">support@springvox.ai</a></p>
          </div>
        </LegalSection>
      </div>
    </LegalPageLayout>
  );
}
