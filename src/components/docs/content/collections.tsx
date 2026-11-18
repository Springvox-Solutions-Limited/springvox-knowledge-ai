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

export function CollectionsContent() {
  return (
    <>
      <GuideSection id="what-collections-are" title="What a collection is">
        <p>
          A collection groups related documents inside one workspace. It gives a
          question a narrower place to search. It does not move the file, change
          who can open it, or create a separate workspace.
        </p>
        <p>
          Collections are optional. A workspace can keep every document in the
          default General collection and still answer questions across all of
          them.
        </p>
      </GuideSection>

      <GuideSection id="default-collections" title="The default collections">
        <p>
          Every workspace starts with eight collections, seeded when the
          workspace is created:
        </p>
        <DocsTable
          minWidth={520}
          head={['Collection', 'Typical documents']}
          rows={[
            ['General', 'Company-wide documents that do not belong to one department'],
            ['HR', 'Handbook, leave, benefits, conduct, onboarding'],
            ['Finance', 'Budgets, reports, invoices, expense rules'],
            ['Legal', 'Contracts, terms, compliance notes, policies'],
            ['Operations', 'Runbooks, procedures, supplier and facility documents'],
            ['Sales', 'Playbooks, pricing notes, proposals, CRM exports'],
            ['Support', 'Support procedures, macros, known-issue notes'],
            ['IT', 'Setup guides, access requests, infrastructure notes'],
          ]}
        />
        <Callout tone="note" title="The beta uses the defaults">
          The current admin screens assign documents to these collections. A
          create-collection control is not exposed in the UI in this beta.
        </Callout>
      </GuideSection>

      <GuideSection id="assign-documents" title="Assign a document">
        <Steps>
          <Step title="At upload time">
            On <DocLink href="/dashboard/upload">Upload documents</DocLink>,
            choose the collection before you add files. Everything in that batch
            goes to the chosen collection.
          </Step>
          <Step title="From the document row">
            On <DocLink href="/dashboard/documents">Documents</DocLink>, open the
            collection selector on a row and choose a collection. The change
            applies to that document only.
          </Step>
          <Step title="In bulk">
            Select several documents, then use the bulk move control to assign
            them to one collection. Use the collection filter to check the
            result.
          </Step>
        </Steps>
        <p>
          A document can sit in one collection at a time. To move it, assign the
          new collection; there is no need to delete and re-upload.
        </p>
      </GuideSection>

      <GuideSection id="scope-a-question" title="Scope a question">
        <Steps>
          <Step title="Open the composer controls">
            In <DocLink href="/dashboard/chat">Ask questions</DocLink>, look for
            the document icon next to the answer-style control.
          </Step>
          <Step title="Choose the scope">
            Select <span className="font-medium text-[var(--ink)]">All documents</span>{' '}
            or one collection. The active scope is shown by the highlighted
            control.
          </Step>
          <Step title="Ask normally">
            The scope applies to that question. Follow-ups in the same thread use
            the scope you last selected unless you change it.
          </Step>
        </Steps>
        <p>
          Scoping to a collection with no documents is intentional: retrieval is
          limited to that empty set, so the assistant returns the no-support
          reply. Check the collection has Ready documents before you use it.
        </p>
      </GuideSection>

      <GuideSection id="when-to-scope" title="When scope helps">
        <CheckList
          items={[
            'A term means different things in different departments, such as “coverage” in Finance and Operations.',
            'You know the answer lives in one team’s documents and want to cut noise from other teams.',
            'You are testing a collection after uploading new documents.',
            'You want to compare how two departments describe the same process.',
          ]}
        />
        <p>
          Scope is less useful when you are not sure which team owns the answer.
          Start with All documents, then narrow the second question once the
          source list tells you where the material came from.
        </p>
      </GuideSection>

      <GuideSection id="keep-them-useful" title="Keep collections useful">
        <ul className="list-disc space-y-2 pl-5 marker:text-[var(--ink-muted)]">
          <li>
            Assign every new document. Unassigned documents still appear under
            All documents, but they are invisible to scoped questions.
          </li>
          <li>
            Move a document when ownership changes. A stale collection can make a
            correct question return the wrong department’s material.
          </li>
          <li>
            Delete superseded documents instead of leaving both versions in the
            collection. Two valid-looking policies produce ambiguous answers.
          </li>
          <li>
            Use the collection filter on the Documents screen for a short monthly
            review of what each team can retrieve.
          </li>
        </ul>
      </GuideSection>

      <GuideSection id="not-a-permission-boundary" title="Collections are not permissions">
        <p>
          Scope narrows retrieval for a question. It does not restrict who can
          ask, and it does not hide documents from other members. Any viewer can
          choose any collection, and All documents remains available unless a
          future permission feature changes that.
        </p>
        <Callout tone="planned" title="Planned: document-level permissions">
          Document-level permissions and role-scoped collections are planned.
          They are not available in this beta. Do not use collections as a
          substitute for confidentiality: only upload documents that every
          member of the workspace is allowed to read.
        </Callout>
      </GuideSection>

      <GuideSection id="next-steps" title="Next steps">
        <RelatedLinks
          items={[
            {
              href: '/docs/admin/documents-and-uploads',
              title: 'Documents and uploads',
              description: 'Assign collections while uploading.',
            },
            {
              href: '/docs/using/asking-questions',
              title: 'Asking questions',
              description: 'Use scope with better question wording.',
            },
            {
              href: '/docs/admin/users-and-roles',
              title: 'Users and roles',
              description: 'Control who can upload and manage documents.',
            },
          ]}
        />
      </GuideSection>
    </>
  );
}
