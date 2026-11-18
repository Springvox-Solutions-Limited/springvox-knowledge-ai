import {
  Callout,
  DocLink,
  DocsTable,
  Faq,
  GuideSection,
  RelatedLinks,
} from '@/src/components/docs/DocsPrimitives';

export function FaqContent() {
  return (
    <>
      <GuideSection id="account-and-access" title="Account and access">
        <Faq
          items={[
            {
              question: 'How do I create a workspace?',
              answer: (
                <>
                  Open <DocLink href="/register">Create a workspace</DocLink>,
                  enter your company, name, work email, and a password of at
                  least 10 characters with a letter and a number. The account becomes the workspace admin.
                  New workspaces start on a 14-day trial; the current beta terms
                  are on <DocLink href="/pricing">Pricing</DocLink>.
                </>
              ),
            },
            {
              question: 'I was invited. Do I need to create a workspace?',
              answer:
                'No. Open the invitation link and sign in with the invited email. If you do not have an account, create one from the invitation page. Do not create a separate workspace.',
            },
            {
              question: 'The invitation expired. What now?',
              answer:
                'Invitations last seven days. Ask a workspace admin to create a new invitation from Users. Revoked invitations cannot be reactivated.',
            },
            {
              question: 'I forgot my password.',
              answer: (
                <>
                  If you can still sign in, change the password from the account
                  page. If you are locked out, self-serve recovery is not
                  available in this beta. Contact us through the{' '}
                  <DocLink href="/contact">contact page</DocLink> and we will
                  help. Re-inviting an existing user does not reset their
                  password.
                </>
              ),
            },
            {
              question: 'Can a workspace admin make someone a platform admin?',
              answer:
                'No. Platform administration is an operator role. A workspace admin can assign Viewer or Workspace admin only, and cannot modify a platform admin.',
            },
            {
              question: 'Do you support SSO?',
              answer: (
                <>
                  Not yet. Single sign-on and SCIM are planned and are not
                  available in this beta. Sign-in is email and password.
                </>
              ),
            },
          ]}
        />
      </GuideSection>

      <GuideSection id="documents-and-processing" title="Documents and processing">
        <Faq
          items={[
            {
              question: 'Which file types can I upload?',
              answer:
                'PDF, DOCX, XLSX, PPTX, CSV, and TXT. The default limit is 20 MB per file and is shown on the upload screen. The validator checks the file content as well as the extension, so a renamed file is rejected.',
            },
            {
              question: 'Why is a document still processing?',
              answer:
                'Parsing, chunking, embedding, and indexing run as a background job. Large or complex files take longer. Check the status on Documents. If the row is failed, open it for the reason or select Reprocess.',
            },
            {
              question: 'How do I retry a failed document?',
              answer:
                'Use Reprocess on the document row. If it fails again, confirm the file is not empty, is not a renamed format, and has extractable text. Re-export the file and upload a new copy if needed.',
            },
            {
              question: 'Does a scanned PDF work?',
              answer: (
                <>
                  Only if the PDF contains an extractable text layer. OCR for
                  image-only PDFs is not complete in this beta. Run OCR in your
                  source application, save a text-based PDF, and upload again.
                  Advanced parsing is operator-controlled and disabled by
                  default.
                </>
              ),
            },
            {
              question: 'What does deleting a document remove?',
              answer:
                'The stored file, its chunks, and its vectors. Deletion cannot be undone from the app. Upload the replacement and confirm it is Ready before deleting the old version.',
            },
            {
              question: 'Can I upload documents for one team only?',
              answer:
                'Not yet. Every document in a workspace is available to every member. Collections narrow retrieval for a question but are not a permission boundary. Document-level permissions are planned.',
            },
          ]}
        />
      </GuideSection>

      <GuideSection id="asking-and-answers" title="Asking and answers">
        <Faq
          items={[
            {
              question: 'How do I ask my first question?',
              answer:
                'Open Ask questions, type a plain-English question, choose a mode and optional collection, then press Enter. Detailed is the default. See the quickstart for a full walkthrough.',
            },
            {
              question: 'Why did the assistant say it could not find support?',
              answer:
                'The answer was not in the retrieved workspace documents. It is recording a real gap rather than guessing. Rephrase with the document name, remove a collection scope, or ask an admin to add the source.',
            },
            {
              question: 'What do high, medium, and low confidence mean?',
              answer:
                'They describe retrieval quality, not factual correctness. High means strong, multi-passage support; medium means thinner support; low means weak or no support. Open the citations before acting.',
            },
            {
              question: 'What is the difference between an answer mode and a scope?',
              answer:
                'A mode (sliders icon) changes how the answer is written. A scope (document icon) limits which documents are searched. Mode does not change retrieval, and scope does not change the writing style.',
            },
            {
              question: 'Can I see the original document behind a citation?',
              answer:
                'Yes. Select a source chip, read the excerpt, and use View full document to preview the original file. If the citation has no linked document, the excerpt is still available.',
            },
            {
              question: 'Can I get a different answer to the same question?',
              answer:
                'Use Regenerate for a fresh answer, or Edit the question to change the wording, mode, or scope. Regenerate does not change which documents are searched.',
            },
          ]}
        />
      </GuideSection>

      <GuideSection id="privacy-and-permissions" title="Privacy and permissions">
        <Faq
          items={[
            {
              question: 'Can other members see my chats?',
              answer:
                'Your chat thread is private to your account in the product. Workspace admins can see a recent-question list with your email and whether sources were attached, plus unanswered questions and feedback flags. They do not open your full conversation from the analytics screen.',
            },
            {
              question: 'Can a platform operator read our documents?',
              answer:
                'By design, the platform console shows operational metadata such as counts, status, and plans rather than document text or private conversation content. The full position is on the security and data handling pages.',
            },
            {
              question: 'Is workspace data isolated from other tenants?',
              answer:
                'Yes. Application queries and vector searches are scoped by workspace, row-level security is enabled, and service-role credentials stay on the server.',
            },
            {
              question: 'Is our content used to train models?',
              answer: (
                <>
                  The <DocLink href="/data-handling">data handling page</DocLink>{' '}
                  lists what each provider processes and for which purpose. It is
                  the authoritative answer; this FAQ does not add a claim beyond
                  the published policy.
                </>
              ),
            },
            {
              question: 'Are collections a permission control?',
              answer:
                'No. A collection narrows retrieval for a question. Every workspace member can choose any collection, and All documents remains available. Do not use collections for confidentiality.',
            },
          ]}
        />
      </GuideSection>

      <GuideSection id="beta-limits" title="Beta limits">
        <p>
          Beta requests are rate-limited to protect reliability. The limits below
          are the current code defaults and may change during beta. The retry
          window in the message is authoritative for your request.
        </p>
        <DocsTable
          minWidth={600}
          head={['Action', 'Current limit']}
          rows={[
            ['Chat questions', '30 per 10 minutes, per user'],
            ['Document uploads', '20 files per hour, per workspace'],
            ['Document deletes', '30 per hour, per user'],
            ['Notifications', '20 per hour'],
            ['Workspace signup', '5 per hour, per IP address'],
          ]}
        />
        <p>
          Workspaces can also have plan-level caps for monthly questions, daily
          uploads, storage, and model tokens. Those are set by the platform
          operator and shown when a cap is reached.
        </p>
        <Callout tone="note" title="Rate limits are not a plan cap">
          A 429 means the short-term window is full; wait for the retry window. A
          plan cap means the workspace has reached its allowance; the operator has
          to raise it.
        </Callout>
      </GuideSection>

      <GuideSection id="troubleshooting" title="Common fixes">
        <DocsTable
          minWidth={640}
          head={['Problem', 'Fix']}
          rows={[
            [
              'A request returns 429.',
              'Wait for the retry window in the response or message, then retry once. Do not loop the request.',
            ],
            [
              'A document is stuck in Processing.',
              'Give large files more time, then reload Documents. If it shows Failed, use Reprocess.',
            ],
            [
              'A viewer cannot upload or invite.',
              'That is the Viewer role. A workspace admin can promote them from Users.',
            ],
            [
              'An answer cites the wrong version.',
              'Delete the superseded document after the replacement is Ready, then ask again.',
            ],
            [
              'An answer has no citations.',
              'Treat it as unverified. Re-ask with the document name, check Ready status, and mark the answer Not helpful.',
            ],
            [
              'Invitation email did not arrive.',
              'Check spam, then copy the link from the pending invitation on Users and send it directly.',
            ],
            [
              'The page is restricted or suspended.',
              'The workspace lifecycle may be suspended, expired, or past due. Contact the operator through the contact page.',
            ],
            [
              'The docs search finds nothing.',
              'Try a section name such as citations, uploads, or roles, or browse by section from the docs home.',
            ],
          ]}
        />
      </GuideSection>

      <GuideSection id="contact" title="Talk to us">
        <p>
          For product questions, beta access, a security review, or a blocker that
          these pages do not cover, use the{' '}
          <DocLink href="/contact">contact page</DocLink> or email{' '}
          <a
            href="mailto:hello@springvoxsl.com"
            className="font-medium text-[var(--accent-jade)] underline underline-offset-4"
          >
            hello@springvoxsl.com
          </a>
          .
        </p>
        <p>
          For a vulnerability, use the subject “Security disclosure” and include
          reproduction steps. Do not include customer documents or personal data.
          See <DocLink href="/security">Security</DocLink>.
        </p>
        <p>
          The “Was this page helpful?” control is local-only in this beta. To make
          a documentation correction, use the contact page and include the page
          URL.
        </p>
      </GuideSection>

      <GuideSection id="next-steps" title="Keep going">
        <RelatedLinks
          items={[
            {
              href: '/docs/getting-started/quickstart',
              title: 'Quickstart',
              description: 'The first-run walkthrough.',
            },
            {
              href: '/docs/using/asking-questions',
              title: 'Asking questions',
              description: 'Wording, confidence, and follow-ups.',
            },
            {
              href: '/docs/admin/documents-and-uploads',
              title: 'Documents and uploads',
              description: 'Processing, status, and failure recovery.',
            },
            {
              href: '/docs/security/data-handling',
              title: 'Security and data handling',
              description: 'The full data boundary.',
            },
          ]}
        />
      </GuideSection>
    </>
  );
}
