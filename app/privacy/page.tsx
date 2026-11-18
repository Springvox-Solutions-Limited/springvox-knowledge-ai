import type { Metadata } from 'next';
import Link from 'next/link';

import { CookiePreferencesLink } from '@/src/components/consent/CookieConsent';
import { LegalPageLayout } from '@/src/components/legal/LegalPageLayout';
import { LegalSection } from '@/src/components/legal/LegalSection';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How Rekall-IQ collects, uses, shares, and protects personal data, including cookies, under the Nigeria Data Protection Act 2023 and, where applicable, the GDPR.',
  alternates: { canonical: '/privacy' },
};

const COOKIE_CATEGORIES = [
  {
    name: 'Necessary',
    note: 'Always on',
    purpose:
      'Keeps the site working, keeps signed-in sessions secure where you have an account, and remembers your cookie choice and whether you dismissed the beta announcement.',
    retention:
      'Sign-in storage lasts until you sign out or the session expires. The cookie choice and announcement dismissal stay in your browser until you change them or clear site data.',
  },
  {
    name: 'Analytics',
    note: 'No script yet',
    purpose:
      'Helps us understand which pages and features are useful. Optional and off by default.',
    retention:
      'No analytics cookies or scripts are active today. If we introduce them, this section will name the provider and retention period before they load.',
  },
  {
    name: 'Marketing',
    note: 'No script yet',
    purpose:
      'Measures campaigns or personalises advertising. Optional and off by default.',
    retention:
      'No marketing cookies or scripts are active today. If we introduce them, this section will name the provider and retention period before they load.',
  },
] as const;

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      description="How personal data is collected, used, shared, and protected in Rekall-IQ, and how to exercise your rights."
      lastUpdated="November 2026"
      activePath="/privacy"
    >
      <p className="text-[14px] leading-7 text-[var(--ink-soft)]">
        This policy explains how Rekall-IQ handles personal data, including cookies and
        similar technologies. Rekall-IQ is operated by{' '}
        <strong className="font-medium text-[var(--ink)]">SpringVox</strong>, a company
        established in the Federal Republic of Nigeria.
      </p>

      <LegalSection id="who-we-are" title="1. Who we are">
        <p>
          Rekall-IQ is a multi-tenant workspace that answers staff questions from documents
          an organisation has approved. For the personal data of workspace users, the
          organisation that created the workspace is the controller and Rekall-IQ acts as a
          processor. For account, billing, and website data, Rekall-IQ acts as a controller.
        </p>
      </LegalSection>

      <LegalSection id="data-we-process" title="2. Data we process">
        <ul>
          <li>
            <strong>Account data:</strong> name, email address, authentication identifiers,
            and role. Authentication is handled by Supabase Auth.
          </li>
          <li>
            <strong>Workspace data:</strong> organisation name, workspace slug, settings,
            plan label, invitations, and role assignments.
          </li>
          <li>
            <strong>Uploaded content:</strong> documents an authorised workspace admin adds
            to the library, including the text extracted from them.
          </li>
          <li>
            <strong>Chat data:</strong> questions, answers, citations, feedback, and session
            history.
          </li>
          <li>
            <strong>Usage data:</strong> document counts, question volumes, knowledge gaps,
            and timestamps used for limits and analytics.
          </li>
          <li>
            <strong>Technical data:</strong> IP address, browser user agent, and application
            logs generated when the service is used.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="why-we-process" title="3. Why we process it">
        <p>
          We process personal data to provide and secure the service, authenticate users,
          enforce workspace permissions, process uploaded documents, generate cited answers,
          maintain usage limits, respond to support requests, and meet legal obligations.
        </p>
        <p>
          Under the Nigeria Data Protection Act 2023, and under the GDPR or UK GDPR where it
          applies, our lawful bases are performance of a contract, our legitimate interests in
          operating and securing the service, compliance with legal obligations, and consent
          where we ask for it.
        </p>
      </LegalSection>

      <LegalSection id="ai-processing" title="4. AI processing">
        <p>
          Documents are parsed, split into sections, embedded, and indexed. A question is
          embedded, matched against workspace-filtered passages, reranked, and the retrieved
          passages are sent to the answer model. The reply is returned with citations.
        </p>
        <p>
          We do not intentionally use customer documents or private chat content to train
          public foundation models. Model providers process the passages needed to answer a
          question under their own terms, which are listed on the{' '}
          <Link href="/data-handling">data handling</Link> page.
        </p>
        <p>
          AI output can be wrong. It is provided as an aid, and the cited source is the
          authoritative record.
        </p>
      </LegalSection>

      <LegalSection id="sharing" title="5. Sharing and subprocessors">
        <p>
          We do not sell, rent, or lease personal data. We share it with infrastructure
          providers that process it on our instructions, and only to run the service.
        </p>
        <p>
          Current providers are Supabase, Vercel, Qdrant, Google Gemini, Voyage AI,
          LlamaParse (optional advanced parsing), Inngest, and Resend. Their roles and the
          data they receive are set out on the{' '}
          <Link href="/data-handling">data handling</Link> page.
        </p>
        <p>
          We may also disclose data where required by a valid legal process, or where
          necessary to protect the rights, safety, and security of Rekall-IQ, its users, or the
          public.
        </p>
      </LegalSection>

      <LegalSection id="transfers" title="6. International transfers">
        <p>
          Our providers operate infrastructure in several regions, so personal data may be
          processed outside your country. Where data leaves Nigeria, we rely on the transfer
          mechanisms available under the NDPA. Where the GDPR or UK GDPR applies, we rely on
          the provider’s appropriate safeguards, including standard contractual clauses where
          offered.
        </p>
      </LegalSection>

      <LegalSection id="cookies" title="7. Cookies and similar technologies">
        <p>
          We use cookies and similar technologies, such as browser local storage, to run the
          site, keep it secure, and remember your privacy choices. Necessary technologies are
          always on because the site cannot work without them. Analytics and marketing
          technologies are optional and stay off until you choose to accept them.
        </p>
        <p>
          There are no analytics or marketing scripts on this site today. When you make a
          choice, we store it only in your browser under{' '}
          <code className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 font-meta text-[12px] text-[var(--ink)]">
            rekall_cookie_consent_v1
          </code>
          . It records your category choices, the time you saved them, and whether you
          accepted all, rejected optional cookies, or set a custom choice. It is not sent to
          our servers.
        </p>

        <div className="rounded-[12px] border border-[var(--line)] bg-[var(--canvas-soft)] px-4">
          <dl className="divide-y divide-[var(--line-soft)]">
            {COOKIE_CATEGORIES.map((category) => (
              <div key={category.name} className="py-4">
                <dt className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[13px] font-medium text-[var(--ink)]">
                  {category.name}
                  <span className="font-meta text-[10px] font-normal text-[var(--ink-muted)]">
                    {category.note}
                  </span>
                </dt>
                <dd className="mt-2 grid gap-2 text-[13px] leading-5 text-[var(--ink-soft)] sm:grid-cols-2 sm:gap-4">
                  <div>
                    <p className="font-meta text-[10px] leading-4 text-[var(--ink-muted)]">
                      Purpose
                    </p>
                    <p className="mt-1">{category.purpose}</p>
                  </div>
                  <div>
                    <p className="font-meta text-[10px] leading-4 text-[var(--ink-muted)]">
                      Retention
                    </p>
                    <p className="mt-1">{category.retention}</p>
                  </div>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <p>
          <strong>Changing or withdrawing consent.</strong> You can change your choice at any
          time using the Cookie preferences link in the footer of any public page, or the
          control below. Withdrawing consent stops optional technologies from loading after
          you save the change. It does not affect processing that happened while consent was in
          place.
        </p>

        <div className="flex flex-col gap-3 rounded-[12px] border border-[var(--line)] bg-[var(--canvas-soft)] p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] leading-5 text-[var(--ink-soft)]">
            Your choice is stored only in this browser. You can change it whenever you like.
          </p>
          <CookiePreferencesLink className="shrink-0 text-[13px] font-medium text-[var(--accent-jade)] decoration-[var(--accent-jade-200)] hover:text-[var(--accent-jade-hover)] focus-visible:ring-offset-[var(--canvas-soft)]">
            Cookie preferences
          </CookiePreferencesLink>
        </div>

        <p>
          <strong>Global Privacy Control.</strong> We honour the Global Privacy Control signal.
          If your browser sends it, optional categories start off when no choice has been
          saved, and the preferences dialog says that GPC was detected. We do not treat GPC as
          consent for optional cookies. You can still opt in explicitly, and you can withdraw
          that choice later.
        </p>
      </LegalSection>

      <LegalSection id="retention" title="8. Retention">
        <p>
          Account and workspace data is kept while the workspace is active. Uploaded documents
          are kept until a workspace admin deletes them or the workspace is closed. Chat
          history is kept until a user deletes the session or the workspace is closed. System
          logs are kept for a limited operational and audit period.
        </p>
        <p>
          Some records, such as audit entries and billing state, may be retained for longer
          where required for legal or accounting purposes. Cookie and consent retention is set
          out in section 7.
        </p>
      </LegalSection>

      <LegalSection id="rights" title="9. Your rights">
        <p>
          Depending on your location, you may have the right to access, correct, delete, or
          restrict processing of your personal data, to object to processing, to data
          portability, and to withdraw consent. EU and UK users may also lodge a complaint with
          their local supervisory authority. Nigerian users may complain to the Nigeria Data
          Protection Commission.
        </p>
        <p>
          Workspace users should contact their workspace admin first, because the
          organisation controls that data. You can also contact us at{' '}
          <a href="mailto:hello@springvoxsl.com">hello@springvoxsl.com</a>.
        </p>
      </LegalSection>

      <LegalSection id="security" title="10. Security">
        <p>
          Workspaces are isolated at query time, database tables use row-level security, and
          service-role access stays on the server. The{' '}
          <Link href="/security">security page</Link> describes the controls and the platform
          admin boundary.
        </p>
      </LegalSection>

      <LegalSection id="children" title="11. Children">
        <p>
          Rekall-IQ is a professional tool and is not directed at children. We do not
          knowingly collect personal data from children.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="12. Changes">
        <p>
          We may update this policy. Material changes will be posted on this page with a new
          date, and workspace admins will be notified where the change affects them.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="13. Contact">
        <p>
          Privacy questions, data protection requests, and general enquiries:{' '}
          <a href="mailto:hello@springvoxsl.com">hello@springvoxsl.com</a>.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
