import {
  Callout,
  CheckList,
  DocLink,
  DocsTable,
  GuideSection,
  RelatedLinks,
} from '@/src/components/docs/DocsPrimitives';

export function SourcesAndCitationsContent() {
  return (
    <>
      <GuideSection id="what-a-citation-is" title="What a citation is">
        <p>
          A citation ties part of an answer to a document section that was
          actually retrieved. In chat it appears as a numbered chip under the
          answer, with the file name. Several passages from the same file are
          grouped into one chip.
        </p>
        <p>
          Citations are the point of the product. An answer without a source is
          either an explicit “I could not find support” reply or a reply you
          should treat with suspicion.
        </p>
        <Callout tone="note" title="A section number is a retrieval marker">
          The number on a chip identifies the retrieved section in the context
          that was sent to the model. It is not a page number. The excerpt panel
          shows the text, and the full document opens at the file itself.
        </Callout>
      </GuideSection>

      <GuideSection id="open-a-source" title="Open a source">
        <ol className="list-decimal space-y-2 pl-5 marker:text-[var(--ink-muted)]">
          <li>Find the source chips immediately below the answer.</li>
          <li>Select the chip for the file you want to check.</li>
          <li>
            Read the source drawer that opens. It shows the file name, section,
            excerpt, copy action, upload metadata, and a button to open the full
            document.
          </li>
          <li>
            Select <span className="font-medium text-[var(--ink)]">View full document</span>{' '}
            to preview the original in the app.
          </li>
        </ol>
        <p>
          If an answer used more sources than the chip row shows, select the
          “more” control to expand the list. The preview renders PDF, DOCX,
          XLSX, CSV, and plain text in the app; other files fall back to a
          download. If a citation has no linked document, the excerpt is still
          available but the full-file button is not.
        </p>
      </GuideSection>

      <GuideSection id="read-the-excerpt" title="Read the excerpt">
        <p>
          The excerpt is the passage the model used, not a generated summary of
          it. Read it as the primary evidence. A useful check takes about ten
          seconds:
        </p>
        <CheckList
          items={[
            'Does the excerpt contain the number, date, name, or rule in the answer?',
            'Does it apply to the same team, region, product, or period as the question?',
            'Is there an exception, condition, or “unless” on the next line?',
            'Is this the current version, or a superseded document?',
          ]}
        />
        <p>
          Use <span className="font-medium text-[var(--ink)]">Copy excerpt</span>{' '}
          when you need to put the exact wording in a ticket or email.
        </p>
      </GuideSection>

      <GuideSection id="confidence-and-coverage" title="Confidence and coverage">
        <p>
          The confidence label summarises retrieval quality. The source list
          shows what was retrieved. They are related, not identical: a narrow
          question can produce a high-confidence answer from one strong passage,
          while a broad question can produce a medium answer with several weaker
          ones.
        </p>
        <DocsTable
          minWidth={620}
          head={['What you see', 'How to read it']}
          rows={[
            [
              'High confidence, several sources',
              'Strong retrieval. Spot-check the source that carries the main claim.',
            ],
            [
              'High confidence, one source',
              'The single passage is a close match. Confirm it is complete enough for the decision.',
            ],
            [
              'Medium confidence',
              'Support exists but may be indirect. Open every source.',
            ],
            [
              'Low confidence, sources shown',
              'The passages are weak matches. Do not rely on the answer without the original.',
            ],
            [
              'No confidence, no sources',
              'The answer is the no-support reply. The documents do not cover the question yet.',
            ],
          ]}
        />
      </GuideSection>

      <GuideSection id="check-before-acting" title="Check before acting">
        <p>
          Open the source whenever the answer would change a decision, a payment,
          a customer response, a legal position, or a safety procedure. That is
          the intended workflow, not a sign that the answer failed.
        </p>
        <p>
          For policy questions, confirm the effective date and the owner. For
          figures, confirm the sheet, column, and period. For procedures, confirm
          you are reading the current revision.
        </p>
        <Callout tone="warning" title="Do not cite the assistant as the source">
          Cite the document. The answer is a route into the evidence; the
          document is the evidence.
        </Callout>
      </GuideSection>

      <GuideSection id="missing-citations" title="When citations are missing">
        <p>
          The intended no-support reply has no citations. If an answer makes
          claims with no source chips and is not the no-support message, treat it
          as unverified and mark it Not helpful.
        </p>
        <p>Try these first:</p>
        <CheckList
          items={[
            'Re-ask with the document name or department included.',
            'Remove a collection scope and search all documents.',
            'Confirm the document is Ready on the Documents screen.',
            'Ask the admin whether the document was deleted or replaced.',
            'Ask a narrower question that one section can answer.',
          ]}
        />
      </GuideSection>

      <GuideSection id="send-feedback" title="Send feedback">
        <p>
          Each answer has Helpful and Not helpful buttons. More options adds
          specific reasons: wrong, outdated, or needs more detail. Feedback is
          attached to that answer and is available to workspace admins in
          analytics as a quality flag.
        </p>
        <p>
          Feedback is a signal, not a correction. It does not edit the document
          and does not change the answer. To fix the cause, an admin still needs
          to update the source or close the gap. See{' '}
          <DocLink href="/docs/admin/analytics-and-evaluations">
            Analytics, gaps, and evaluations
          </DocLink>
          .
        </p>
      </GuideSection>

      <GuideSection id="next-steps" title="Next steps">
        <RelatedLinks
          items={[
            {
              href: '/docs/admin/documents-and-uploads',
              title: 'Documents and uploads',
              description: 'Fix a source that is missing or out of date.',
            },
            {
              href: '/docs/admin/analytics-and-evaluations',
              title: 'Analytics and gaps',
              description: 'See which questions are not being answered.',
            },
            {
              href: '/security',
              title: 'Security and data handling',
              description: 'How documents and previews are scoped.',
            },
          ]}
        />
      </GuideSection>
    </>
  );
}
