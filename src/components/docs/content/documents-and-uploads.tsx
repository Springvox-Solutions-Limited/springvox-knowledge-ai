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

export function DocumentsAndUploadsContent() {
  return (
    <>
      <GuideSection id="before-you-upload" title="Before you upload">
        <p>
          Uploading is a workspace admin action. Everything you add becomes
          available to every member of the workspace, so the first check is
          permission, not file format.
        </p>
        <CheckList
          items={[
            'The document is approved for the whole workspace to read.',
            'It is the current version, not a draft or a superseded copy.',
            'It contains text that a parser can extract. Scanned image-only PDFs may fail.',
            'It belongs to a collection, or you are deliberately leaving it in General.',
          ]}
        />
        <Callout tone="warning" title="Uploads are workspace-wide">
          A viewer can ask from any document in the workspace. If a file is
          restricted to a small group, do not upload it until document-level
          permissions are available.
        </Callout>
      </GuideSection>

      <GuideSection id="supported-formats" title="Supported formats and size">
        <DocsTable
          minWidth={560}
          head={['Format', 'Best for', 'Notes']}
          rows={[
            ['PDF', 'Reports, policies, manuals, signed documents', 'Scanned pages need extractable text'],
            ['DOCX', 'Handbooks, procedures, long-form policy', 'Word documents'],
            ['XLSX', 'Budgets, trackers, structured data', 'Tables are preserved for retrieval'],
            ['PPTX', 'Training decks, presentations', 'Slide text is extracted'],
            ['CSV', 'Exports and simple structured data', 'Keep the header row'],
            ['TXT', 'Plain notes and exports', 'UTF-8 text works best'],
          ]}
        />
        <p>
          The default upload limit is 20 MB per file and is shown on the upload
          screen. The validator checks both the file extension and the file
          content, so renaming a different format to .pdf does not make it
          accepted.
        </p>
      </GuideSection>

      <GuideSection id="upload-files" title="Upload files">
        <Steps>
          <Step title="Open the upload screen">
            Go to <DocLink href="/dashboard/upload">Upload documents</DocLink>.
          </Step>
          <Step title="Choose a collection">
            Pick a department, or leave the batch unassigned. You can move
            documents later from the library.
          </Step>
          <Step title="Add one or many files">
            Drag files onto the drop area or select them from your computer.
            Supported files are queued; unsupported or oversized files are
            marked with a reason.
          </Step>
          <Step title="Start the queue">
            Select <span className="font-medium text-[var(--ink)]">Upload queue</span>.
            The queue processes files in small batches so one failure does not
            stop the rest.
          </Step>
          <Step title="Watch each file">
            Each row moves through queued, uploading, processing, completed, or
            failed. Use Retry on a failed row without restarting the batch.
          </Step>
        </Steps>
        <p>
          You can keep working while files process. The library is the source of
          truth for the final status.
        </p>
      </GuideSection>

      <GuideSection id="processing" title="What happens after upload">
        <p>
          The file is stored, a document row is created as processing, and a
          background job takes over. The job extracts text and metadata, creates
          chunks, embeds them, writes vectors with workspace and document
          metadata, and stores document intelligence.
        </p>
        <p>
          Document intelligence adds a short summary, keywords, and a category:
          Manual, Policy, Procedure, Contract, Financial Report, Spreadsheet,
          Presentation, Technical Guide, Knowledge Base, or Other. These fields
          help retrieval and make the library easier to scan.
        </p>
        <Callout tone="note" title="Advanced parsing is operator-controlled">
          Advanced parsing for complex files is disabled by default and is
          configured by the platform operator. Admins do not enable it per file.
          When it is enabled, supported documents may be sent to the configured
          parsing provider; see{' '}
          <DocLink href="/docs/security/data-handling">Security and data handling</DocLink>.
        </Callout>
      </GuideSection>

      <GuideSection id="document-status" title="Read the document status">
        <DocsTable
          minWidth={600}
          head={['Status', 'Meaning', 'What to do']}
          rows={[
            [
              'Processing',
              'The file is uploaded and the background job is still parsing or indexing it.',
              'Wait. Large or complex files take longer. Questions may miss the document until it is Ready.',
            ],
            [
              'Ready',
              'The document is indexed and can be retrieved by chat.',
              'Ask a test question or preview the file to confirm it parsed correctly.',
            ],
            [
              'Failed',
              'Processing stopped. The row shows the reason.',
              'Use Reprocess first. If it fails again, read the reason and re-export the file.',
            ],
          ]}
        />
        <p>
          On <DocLink href="/dashboard/documents">Documents</DocLink> you can
          search, filter by status or collection, sort, preview, download, export
          a CSV of selected rows, reprocess, move, and delete. The row shows the
          parser, category, section count, and processing message.
        </p>
      </GuideSection>

      <GuideSection id="organize-with-collections" title="Organise with collections">
        <p>
          Assign documents at upload time or later from the row or bulk action.
          Collections make scoped questions possible; they do not change
          permissions. See{' '}
          <DocLink href="/docs/using/collections">
            Collections and scope
          </DocLink>{' '}
          for the full behaviour.
        </p>
      </GuideSection>

      <GuideSection id="replace-or-delete" title="Replace or delete a document">
        <p>
          To replace a policy, upload the new version, confirm it is Ready, then
          delete the old one. Leaving both versions in the library can produce an
          answer that cites the superseded document.
        </p>
        <Steps>
          <Step title="Upload the replacement">
            Put the new file in the same collection and wait for Ready.
          </Step>
          <Step title="Verify the replacement">
            Ask a question that should cite it and open the source.
          </Step>
          <Step title="Delete the old version">
            Use the row menu or select several documents for a bulk delete.
            Confirm the prompt.
          </Step>
        </Steps>
        <Callout tone="warning" title="Deletion is not a recycle bin">
          Deleting removes the stored file, its chunks, and its vectors. It cannot
          be undone from the app. Keep the original elsewhere before deleting.
        </Callout>
      </GuideSection>

      <GuideSection id="fix-a-failure" title="Fix a failed upload">
        <DocsTable
          minWidth={640}
          head={['Reason', 'Likely cause', 'Fix']}
          rows={[
            [
              'Unsupported file type',
              'The extension is not PDF, DOCX, XLSX, PPTX, CSV, or TXT.',
              'Export the document to a supported format, then upload again.',
            ],
            [
              'File content does not match its extension',
              'The file was renamed, or the content is a different format.',
              'Open the file and re-export it in its real format.',
            ],
            [
              'The file is too large',
              'It exceeds the configured upload limit.',
              'Split the document, compress it, or ask the operator about the limit.',
            ],
            [
              'The file is empty',
              'The file has no content or the export produced zero bytes.',
              'Re-export from the source application.',
            ],
            [
              'Could not extract text',
              'The PDF is scanned images without an extractable text layer.',
              'Run OCR in your source application, save a text-based PDF, and upload it again.',
            ],
            [
              'Processing failed',
              'The parser or indexer hit an error during the job.',
              'Use Reprocess. If it fails again, re-export the file and upload a new copy.',
            ],
          ]}
        />
        <Callout tone="planned" title="Planned: built-in OCR">
          OCR for scanned PDFs is not complete in this beta. Image-only files may
          fail until a text layer is added or advanced parsing is configured.
        </Callout>
      </GuideSection>

      <GuideSection id="what-to-upload" title="What to upload, and what not to">
        <p>Good candidates are authoritative and current:</p>
        <CheckList
          items={[
            'Approved policies, handbooks, and procedures.',
            'Product manuals and technical guides used by the team.',
            'Finance and operations reports that are safe to share.',
            'Training material that people already rely on.',
          ]}
        />
        <p>Leave these out:</p>
        <ul className="list-disc space-y-2 pl-5 marker:text-[var(--ink-muted)]">
          <li>Drafts, personal notes, and documents with no owner.</li>
          <li>
            Files containing personal data, credentials, or restricted commercial
            terms that the whole workspace should not see.
          </li>
          <li>Duplicate versions of the same policy.</li>
          <li>Anything you are not authorised to share.</li>
        </ul>
      </GuideSection>

      <GuideSection id="next-steps" title="Next steps">
        <RelatedLinks
          items={[
            {
              href: '/docs/using/collections',
              title: 'Collections and scope',
              description: 'Make department scoping useful.',
            },
            {
              href: '/docs/admin/analytics-and-evaluations',
              title: 'Analytics, gaps, and evaluations',
              description: 'Check that the new documents are answering questions.',
            },
            {
              href: '/docs/security/data-handling',
              title: 'Security and data handling',
              description: 'How files, vectors, and deletion work.',
            },
          ]}
        />
      </GuideSection>
    </>
  );
}
