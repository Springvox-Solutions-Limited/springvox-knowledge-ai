import {
  Callout,
  DocLink,
  DocsTable,
  GuideSection,
  RelatedLinks,
} from '@/src/components/docs/DocsPrimitives';

export function AnswerModesContent() {
  return (
    <>
      <GuideSection id="what-a-mode-changes" title="What an answer mode changes">
        <p>
          An answer mode changes how the reply is written: its structure, length,
          and what it puts first. It does not change which documents are
          searched. The same question in two modes should rest on the same
          sources.
        </p>
        <p>
          Open the mode menu with the sliders icon in the composer. Detailed is
          the default. The setting applies to the next question you send; it does
          not rewrite an answer that is already in the thread.
        </p>
        <Callout tone="note" title="Mode is a writing instruction">
          Rekall-IQ still requires source grounding in every mode. A mode cannot
          make an unsupported answer supported.
        </Callout>
      </GuideSection>

      <GuideSection id="summary" title="Summary">
        <p>
          Summary returns a small set of tight bullets. It is designed for a
          quick scan when you already know the topic and need the main points.
        </p>
        <p>
          <span className="font-medium text-[var(--ink)]">Use it for:</span>{' '}
          checking whether a document covers a topic, refreshing a familiar
          policy, or preparing a short update.
        </p>
        <p>
          <span className="font-medium text-[var(--ink)]">Watch for:</span> a
          summary can drop exceptions and conditions. If the answer affects a
          decision, switch to Detailed and open the source.
        </p>
      </GuideSection>

      <GuideSection id="detailed" title="Detailed">
        <p>
          Detailed is the balanced default. It gives a direct answer, then the
          supporting points, with more room for context and caveats than
          Summary.
        </p>
        <p>
          <span className="font-medium text-[var(--ink)]">Use it for:</span> most
          policy, process, and document questions, especially when you need to
          understand why the answer is what it is.
        </p>
        <p>
          <span className="font-medium text-[var(--ink)]">Watch for:</span> long
          answers can still miss a detail. Read the cited section when a number,
          date, or approval threshold matters.
        </p>
      </GuideSection>

      <GuideSection id="executive" title="Executive">
        <p>
          Executive frames the answer for a decision: the headline, the
          business implication, risks, and next actions. It is deliberately
          shorter and less procedural than Detailed.
        </p>
        <p>
          <span className="font-medium text-[var(--ink)]">Use it for:</span>{' '}
          briefing a stakeholder, preparing a decision note, or turning a long
          policy into what changes for the team.
        </p>
        <p>
          <span className="font-medium text-[var(--ink)]">Watch for:</span> the
          framing can make a recommendation sound more certain than the source
          does. Check the cited passage before repeating it as a commitment.
        </p>
      </GuideSection>

      <GuideSection id="technical" title="Technical">
        <p>
          Technical keeps exact steps, values, identifiers, and terminology from
          the source. It is the right mode for a procedure or a specification.
        </p>
        <p>
          <span className="font-medium text-[var(--ink)]">Use it for:</span>{' '}
          setup instructions, troubleshooting steps, contract codes, model
          numbers, spreadsheet fields, and anything where the exact string
          matters.
        </p>
        <p>
          <span className="font-medium text-[var(--ink)]">Watch for:</span> a
          technical answer can read as authoritative even when the source is an
          older revision. Confirm the document version.
        </p>
      </GuideSection>

      <GuideSection id="choosing-a-mode" title="Choosing a mode">
        <DocsTable
          minWidth={560}
          head={['Task', 'Start with']}
          rows={[
            ['Quickly check whether a topic is covered', 'Summary'],
            ['Understand a policy or process', 'Detailed'],
            ['Brief a manager or decide what to do next', 'Executive'],
            ['Follow exact steps or copy a value', 'Technical'],
            ['Compare two documents', 'Detailed, then follow up'],
          ]}
        />
        <p>
          You do not need to get the mode right first time. Ask in Detailed, then
          re-ask in a different mode if the shape is wrong. A new question is
          usually clearer than trying to force one answer to be everything.
        </p>
      </GuideSection>

      <GuideSection id="mode-and-scope" title="Mode is not scope">
        <p>
          The mode control is the sliders icon. The scope control is the document
          icon, which limits retrieval to one collection. They solve different
          problems:
        </p>
        <ul className="list-disc space-y-2 pl-5 marker:text-[var(--ink-muted)]">
          <li>
            <span className="font-medium text-[var(--ink)]">Mode</span> changes
            how the answer is written.
          </li>
          <li>
            <span className="font-medium text-[var(--ink)]">Scope</span> changes
            which documents can be searched.
          </li>
        </ul>
        <p>
          If an answer is correct in substance but wrong in shape, change the
          mode. If it draws on the wrong department, change the scope. See{' '}
          <DocLink href="/docs/using/collections">Collections and scope</DocLink>.
        </p>
      </GuideSection>

      <GuideSection id="what-it-does-not-change" title="What a mode does not change">
        <ul className="list-disc space-y-2 pl-5 marker:text-[var(--ink-muted)]">
          <li>Which documents are in the workspace.</li>
          <li>The retrieval and reranking steps used to find passages.</li>
          <li>The requirement to attach sources to a supported answer.</li>
          <li>Whether the answer is correct.</li>
        </ul>
        <p>
          Confidence is still computed from retrieval quality after the answer
          is generated. A polished Executive answer with weak retrieval is still
          a low-confidence answer.
        </p>
      </GuideSection>

      <GuideSection id="next-steps" title="Next steps">
        <RelatedLinks
          items={[
            {
              href: '/docs/using/asking-questions',
              title: 'Asking questions',
              description: 'Wording, shortcuts, and follow-ups.',
            },
            {
              href: '/docs/using/sources-and-citations',
              title: 'Sources and citations',
              description: 'Check what the answer is built from.',
            },
            {
              href: '/docs/using/collections',
              title: 'Collections and scope',
              description: 'Limit retrieval to one department.',
            },
          ]}
        />
      </GuideSection>
    </>
  );
}
