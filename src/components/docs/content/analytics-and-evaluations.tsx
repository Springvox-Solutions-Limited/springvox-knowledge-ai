import {
  Callout,
  CheckList,
  DocLink,
  DocsTable,
  GuideSection,
  RelatedLinks,
  Steps,
  Step,
} from '@/src/components/docs/DocsPrimitives';

export function AnalyticsAndEvaluationsContent() {
  return (
    <>
      <GuideSection id="analytics" title="Analytics">
        <p>
          <DocLink href="/dashboard/analytics">Analytics</DocLink> is the
          workspace health view. It is available to workspace admins and covers
          the whole workspace, not one person’s chat history.
        </p>
        <DocsTable
          minWidth={640}
          head={['Metric', 'What it tells you']}
          rows={[
            ['Documents uploaded', 'Total documents and indexed sections, with a breakdown of Ready and Failed.'],
            ['Questions asked', 'Total questions and questions in the last seven days.'],
            ['Unanswered questions', 'Open knowledge gaps recorded when no supported answer was found.'],
            ['Answers with sources', 'The share of answers that carried at least one citation. The headline percentage is calculated as 100 minus the no-answer rate.'],
            ['Feedback flags', 'Recent answers marked not helpful, wrong, or outdated.'],
            ['Pending invites', 'People invited but not yet joined.'],
          ]}
        />
        <p>
          The page also charts question volume for the last 14 days and breaks
          down user, admin, and invite counts. Use it to see adoption and whether
          answer coverage is moving in the right direction, not as a formal
          quality score.
        </p>
        <Callout tone="note" title="Coverage is a retrieval signal">
          “Answers with sources” is not a correctness measure. An answer can cite
          a weak passage. The gap list and source checks are the better quality
          signals.
        </Callout>
      </GuideSection>

      <GuideSection id="recent-questions" title="Recent questions">
        <p>
          The Recent questions table shows the latest questions with the asker’s
          email, whether sources were attached, and whether the reply was a
          no-answer. It is a sample for spotting patterns, not a transcript
          browser.
        </p>
        <p>
          Open chat to ask a follow-up yourself, or use the question text to find
          the document that should have covered it. Admins do not see the full
          answer in this table.
        </p>
      </GuideSection>

      <GuideSection id="unanswered-questions" title="Unanswered questions">
        <p>
          <DocLink href="/dashboard/knowledge-gaps">Unanswered questions</DocLink>{' '}
          is the gap list. A gap is created automatically when chat returns the
          no-support reply for a question. Each gap stores the question text, how
          many times it has been asked, when it was last asked, and a status:
          open, reviewed, resolved, or ignored.
        </p>
        <p>
          “Not helpful” feedback is tracked separately as an answer-quality flag
          in analytics. It does not create a knowledge gap by itself. If a bad
          answer needs the gap list, the underlying question still has to be
          unanswerable from the documents.
        </p>
        <DocsTable
          minWidth={560}
          head={['Status', 'Use it when']}
          rows={[
            ['Open', 'The gap is new or still needs a document change.'],
            ['Reviewed', 'Someone has checked the cause and decided what to do.'],
            ['Resolved', 'The document was added or fixed, and the question now answers with sources.'],
            ['Ignored', 'The question is out of scope for this workspace.'],
          ]}
        />
      </GuideSection>

      <GuideSection id="work-the-gap-list" title="Work the gap list">
        <p>
          The list is ordered by how often a question is asked. That makes it a
          demand-driven content roadmap rather than a guess.
        </p>
        <Steps>
          <Step title="Read the top gaps">
            Start with the most frequent open questions. Look for clusters: five
            variants of the same missing policy are one fix, not five.
          </Step>
          <Step title="Find the cause">
            Usually the document is missing, outdated, split across files, or
            worded with different terms than the asker used.
          </Step>
          <Step title="Change the source">
            Add the missing document, replace the outdated one, or clarify the
            wording. If the question is out of scope, mark it ignored with a
            reason.
          </Step>
          <Step title="Verify and resolve">
            Ask the question again. If it now returns a cited answer, mark the gap
            resolved. Use Reviewed when the cause is understood but the fix is
            still in progress.
          </Step>
        </Steps>
        <Callout tone="tip" title="Share the list">
          The top five gaps make a concrete agenda for the team that owns the
          documents. “People asked this 12 times and we had no source” is easier
          to act on than a general request to improve the wiki.
        </Callout>
      </GuideSection>

      <GuideSection id="evaluations" title="Evaluations">
        <p>
          <DocLink href="/dashboard/evaluations">Evaluations</DocLink> is a
          repeatable retrieval smoke test. You create a set of golden questions,
          state what a good retrieval should contain, and run the set after a
          document change.
        </p>
        <p>
          The run is deterministic. It searches indexed chunks for the question
          terms and your expected keywords, then checks whether the expected
          filenames or keywords are present. It does not call the answer model and
          does not judge writing quality. That makes it fast and comparable, but
          it is not an end-to-end RAG evaluation.
        </p>
      </GuideSection>

      <GuideSection id="create-a-set" title="Create an evaluation set">
        <Steps>
          <Step title="Create the set">
            Select <span className="font-medium text-[var(--ink)]">New eval set</span>{' '}
            and give it a specific name, such as “HR handbook checks”.
          </Step>
          <Step title="Add golden questions">
            Enter the question, the expected document file names, and any expected
            keywords. Add one question at a time to the chosen set.
          </Step>
          <Step title="Run the set">
            Use Run on the set. The set view shows passed and total questions
            plus average latency. The run also stores a result for each
            question, including the matched document names, matched keywords,
            and latency.
          </Step>
        </Steps>
      </GuideSection>

      <GuideSection id="golden-questions" title="Write golden questions">
        <CheckList
          items={[
            'Choose questions whose correct source you already know.',
            'Use the file name exactly as it appears in the library when you expect a document match.',
            'Add two or three distinctive keywords, not generic words such as “policy” or “employee”.',
            'Cover the questions the team actually asks, not only easy ones.',
            'Keep the set small enough to run after every significant change.',
          ]}
        />
        <Callout tone="note" title="A question with no expectations always passes">
          If both expected documents and expected keywords are empty, the run
          treats the expectations as satisfied. Add at least one expectation to
          make the check meaningful.
        </Callout>
      </GuideSection>

      <GuideSection id="run-and-read-results" title="Run and read results">
        <p>
          Each golden question scores 0.5 for an expected document match and 0.5
          for an expected keyword match. A question passes at 0.5 or higher, which
          means matching either expectation is enough. The run stores the matched
          document names, matched keywords, latency, and a confidence-like label
          derived from the score.
        </p>
        <DocsTable
          minWidth={560}
          head={['Result', 'Reading']}
          rows={[
            ['Passed', 'At least one expectation matched. Check which one before calling it healthy.'],
            ['Low latency', 'Retrieval was quick. It does not prove the retrieval was relevant.'],
            ['Failed', 'Neither expectation matched. Check that the file is Ready and the keywords appear in the source text.'],
            ['Regression after a change', 'Compare the new run with the previous run on the same set.'],
          ]}
        />
        <p>
          Re-run the set after a bulk upload, a deletion, a reprocess, or a change
          to how documents are chunked. A falling pass rate is a signal to inspect
          the source, not to edit the expectations until they pass.
        </p>
      </GuideSection>

      <GuideSection id="settings-and-limits" title="Settings and workspace limits">
        <p>
          <DocLink href="/dashboard/settings">Workspace settings</DocLink> controls
          the workspace identity: organisation name, assistant persona, primary
          brand colour, support email, website, industry, logo URL, and welcome
          message. The workspace slug is read-only.
        </p>
        <p>
          Per-workspace usage caps for questions, uploads, storage, and model
          tokens are set by the platform operator. If a cap is reached, the
          affected action pauses with a message. Ask the operator to raise it.
        </p>
        <p>
          Contact and notification email behaviour depends on the mail provider
          configured for the deployment. If a member welcome or invitation email
          does not arrive, use the copy-link path on the Users screen.
        </p>
      </GuideSection>

      <GuideSection id="weekly-rhythm" title="A weekly rhythm">
        <p>
          A short recurring loop keeps the knowledge base honest:
        </p>
        <CheckList
          items={[
            'Review the top open gaps and assign each one an owner.',
            'Add or update the documents that close them.',
            'Run the evaluation sets after the document change.',
            'Check the recent feedback flags for answers that looked wrong or outdated.',
            'Resolve only the gaps you have verified with a new cited answer.',
          ]}
        />
      </GuideSection>

      <GuideSection id="next-steps" title="Next steps">
        <RelatedLinks
          items={[
            {
              href: '/docs/admin/documents-and-uploads',
              title: 'Documents and uploads',
              description: 'Fix the source behind a gap.',
            },
            {
              href: '/docs/using/sources-and-citations',
              title: 'Sources and citations',
              description: 'How members verify an answer.',
            },
            {
              href: '/docs/admin/users-and-roles',
              title: 'Users and roles',
              description: 'Who can see analytics and manage the workspace.',
            },
          ]}
        />
      </GuideSection>
    </>
  );
}
