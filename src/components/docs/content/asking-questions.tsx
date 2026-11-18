import {
  Callout,
  CheckList,
  DocLink,
  DocsTable,
  GuideSection,
  Kbd,
  RelatedLinks,
  Steps,
  Step,
} from '@/src/components/docs/DocsPrimitives';

export function AskingQuestionsContent() {
  return (
    <>
      <GuideSection id="where-to-ask" title="Where to ask">
        <p>
          The chat screen is at{' '}
          <DocLink href="/dashboard/chat">Ask questions</DocLink>. A workspace
          admin lands on the workspace overview first and reaches chat from the
          sidebar. A viewer goes straight to chat after signing in.
        </p>
        <p>
          Use <span className="font-medium text-[var(--ink)]">New chat</span> for
          a new topic. Earlier conversations stay in the history panel, and you
          can reopen one without losing its context. You can also delete a
          conversation from that panel.
        </p>
        <Callout tone="tip" title="One topic per thread">
          A thread keeps its context, so a follow-up like “and for contractors?”
          lands better than starting from zero. A new topic is usually faster in
          a new thread.
        </Callout>
      </GuideSection>

      <GuideSection id="write-question" title="Write a question that works">
        <p>
          Retrieval starts from your wording. The clearer the topic, document,
          team, or date, the more likely the right passage is found.
        </p>
        <DocsTable
          minWidth={620}
          head={['Instead of', 'Ask']}
          rows={[
            ['“What is the policy?”', '“What is the remote-work policy for UK employees?”'],
            [
              '“Show me Q1.”',
              '“In Q1-Finance-Report.xlsx, which call-failure reason appears most often?”',
            ],
            [
              '“Is travel allowed?”',
              '“Does the 2026 travel policy allow business-class flights, and what approval is needed?”',
            ],
            [
              '“Tell me everything about onboarding.”',
              '“What should a new hire do in their first week, according to the onboarding handbook?”',
            ],
          ]}
        />
        <p>Three habits help:</p>
        <CheckList
          items={[
            'Name the document, department, system, or date range when you know it.',
            'Ask one question at a time. Split a compound question if the answer would be long.',
            'Use the exact term from the source when it matters, including product codes and form names.',
          ]}
        />
        <p>
          You can ask follow-ups in plain language. The assistant keeps the
          thread context, so “what about managers?” is a complete question.
        </p>
      </GuideSection>

      <GuideSection id="send-and-shortcuts" title="Send, dictate, or stop">
        <ul className="list-disc space-y-2 pl-5 marker:text-[var(--ink-muted)]">
          <li>
            Press <Kbd>Enter</Kbd> to send. Press <Kbd>Shift</Kbd> +{' '}
            <Kbd>Enter</Kbd> for a new line.
          </li>
          <li>
            Use the microphone button to dictate when your browser supports
            speech recognition. The button is disabled when the browser does
            not.
          </li>
          <li>
            Select <span className="font-medium text-[var(--ink)]">Stop</span> or
            the stop button while an answer streams to end generation. What has
            streamed so far stays in the thread.
          </li>
          <li>
            Questions are capped at 2,000 characters. Split a longer brief into
            smaller questions.
          </li>
        </ul>
        <Callout tone="note" title="Answers stream in">
          The answer appears progressively. The confidence label, sources, and
          follow-ups arrive after generation completes, so do not judge the
          result from the first line.
        </Callout>
      </GuideSection>

      <GuideSection id="read-answer" title="Read the answer">
        <p>
          A completed answer can include four parts: the answer text, a
          confidence label, source chips, and follow-up suggestions. The answer
          is written in Markdown, so lists, tables, and headings are used when
          they fit the source.
        </p>
        <ul className="list-disc space-y-2 pl-5 marker:text-[var(--ink-muted)]">
          <li>
            <span className="font-medium text-[var(--ink)]">Confidence</span> is
            a retrieval-quality signal: high, medium, or low. It is not a
            correctness grade.
          </li>
          <li>
            <span className="font-medium text-[var(--ink)]">Sources</span> are
            the documents and sections used. Open them before acting.
          </li>
          <li>
            <span className="font-medium text-[var(--ink)]">Follow-ups</span> are
            suggested next questions. They are optional prompts, not extra
            evidence.
          </li>
        </ul>
        <p>
          Actions sit under the answer: Copy, Regenerate, and — while an answer
          is still streaming — Stop. Hover a question you asked to reveal Edit,
          which puts it back in the composer so you can rephrase and send it
          again.
        </p>
      </GuideSection>

      <GuideSection id="follow-ups" title="Follow up and refine">
        <Steps>
          <Step title="Use the thread context">
            Ask a shorter follow-up, such as “Which document says that?” or
            “What changed in the 2026 version?”. The assistant can use the
            preceding exchange.
          </Step>
          <Step title="Select a suggested follow-up">
            The suggestion buttons run the question immediately. Use them as a
            starting point, not as a substitute for checking the source.
          </Step>
          <Step title="Regenerate when the shape is wrong">
            Regenerate asks for a fresh answer to the same question. It does not
            change the documents that were retrieved.
          </Step>
          <Step title="Edit the question when the framing is wrong">
            Edit restores the question in the composer. Change the wording,
            scope, or mode, then send it again.
          </Step>
        </Steps>
      </GuideSection>

      <GuideSection id="confidence" title="Understand confidence">
        <p>
          Confidence is calculated from retrieval strength, reranking, how many
          passages were used, and whether multiple documents were involved. A
          missing answer is always low.
        </p>
        <DocsTable
          minWidth={620}
          head={['Label', 'What it means', 'What to do']}
          rows={[
            [
              'High',
              'Strong retrieval signals and usable source coverage.',
              'Read the answer, then spot-check the main source.',
            ],
            [
              'Medium',
              'Relevant support exists, but it is thinner or less direct.',
              'Open every source before relying on a number or approval.',
            ],
            [
              'Low',
              'Weak support, a narrow match, or no supported answer.',
              'Rephrase, scope to a collection, or add the missing document.',
            ],
          ]}
        />
        <Callout tone="warning" title="High confidence is not approval">
          Confidence is a retrieval indicator. Only the cited document can
          confirm a policy, price, date, or approval path.
        </Callout>
      </GuideSection>

      <GuideSection id="no-answer" title="When there is no answer">
        <p>
          If nothing relevant is found, the assistant says it could not find
          support in the uploaded documents and suggests asking about the
          documents or a specific file. It does not guess and does not search the
          web. No citations are shown because there is nothing to cite.
        </p>
        <p>
          The question is recorded in the workspace’s unanswered-questions list
          so an admin can see the gap. Asking the same thing again will not
          create a new answer until the documents change.
        </p>
        <p>Try these before assuming the knowledge base is empty:</p>
        <CheckList
          items={[
            'Use the term or file name the document is likely to contain.',
            'Remove a collection scope and ask across all documents.',
            'Ask for a summary of one document to confirm it processed correctly.',
            'Ask an admin whether the document is Ready and whether a newer version replaced it.',
          ]}
        />
      </GuideSection>

      <GuideSection id="privacy" title="Chat history and privacy">
        <p>
          Conversations are saved to your account. Other members do not see your
          thread in chat. The admin analytics screen does show a recent-question
          list with the asker’s email and whether sources were attached, plus
          aggregate usage and the unanswered-question list. It does not show your
          full conversation.
        </p>
        <Callout tone="note" title="What admins can review">
          Workspace admins can see recent questions, answer coverage, unanswered
          questions, and feedback flags. Platform operators manage workspace
          health and by default see operational metadata rather than document
          text or private conversation content. The full detail is in{' '}
          <DocLink href="/security">Security</DocLink> and{' '}
          <DocLink href="/data-handling">Data handling</DocLink>.
        </Callout>
      </GuideSection>

      <GuideSection id="troubleshooting" title="Troubleshooting">
        <DocsTable
          minWidth={600}
          head={['Problem', 'Fix']}
          rows={[
            [
              'The send button is disabled.',
              'The composer is empty, the question exceeds 2,000 characters, or an answer is still streaming. Stop the answer or shorten the question.',
            ],
            [
              'The answer stops midway.',
              'Use Retry when the message shows an error. If the stream stopped without an error, ask again or regenerate.',
            ],
            [
              'Sources point to the wrong section.',
              'Open the full document to confirm. Mark the answer Not helpful so the workspace can review it.',
            ],
            [
              'Answers are slow.',
              'Large documents and long questions take longer. Try a narrower question or a collection scope.',
            ],
            [
              'A rate-limit message appears.',
              'Wait for the retry window in the message. The current beta limits are listed in the FAQ.',
            ],
          ]}
        />
      </GuideSection>

      <GuideSection id="next-steps" title="Next steps">
        <RelatedLinks
          items={[
            {
              href: '/docs/using/answer-modes',
              title: 'Answer modes',
              description: 'Match the answer shape to the audience.',
            },
            {
              href: '/docs/using/sources-and-citations',
              title: 'Sources and citations',
              description: 'Open the evidence behind an answer.',
            },
            {
              href: '/docs/using/collections',
              title: 'Collections and scope',
              description: 'Narrow retrieval to one department.',
            },
            {
              href: '/docs/troubleshooting/faq',
              title: 'FAQ and troubleshooting',
              description: 'Short answers for common problems.',
            },
          ]}
        />
      </GuideSection>
    </>
  );
}
