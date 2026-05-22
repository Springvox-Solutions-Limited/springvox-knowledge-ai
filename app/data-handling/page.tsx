import type { Metadata } from 'next';
import { LegalPageLayout } from '@/src/components/legal/LegalPageLayout';
import { LegalSection } from '@/src/components/legal/LegalSection';

export const metadata: Metadata = {
  title: 'Data Handling | SpringVox Knowledge AI',
  description: 'Learn about the lifecycle of your data: how documents are uploaded, processed, embedded, retrieved, and deleted.',
};

export default function DataHandlingPage() {
  return (
    <LegalPageLayout
      title="Data Handling & Processing Lifecycle"
      description="Understanding how your documents flow through our secure ingestion, storage, vectorisation, and retrieval pipeline."
      lastUpdated="May 2026"
      activePath="/data-handling"
    >
      <div className="space-y-4">
        <p className="text-sm leading-6 text-slate-600">
          This document describes the step-by-step processing lifecycle of files uploaded to SpringVox Knowledge AI.
        </p>

        <LegalSection id="1-upload" title="Step 1: Document Upload">
          <p>
            An authorised Workspace Admin selects and uploads approved documents (such as PDF or TXT files) through the workspace administration interface.
          </p>
        </LegalSection>

        <LegalSection id="2-storage" title="Step 2: Private Cloud Storage">
          <p>
            The uploaded file is transferred securely via HTTPS and stored in a private Supabase Storage bucket named <code>documents</code>. Access to this bucket is protected and is not publicly readable.
          </p>
        </LegalSection>

        <LegalSection id="3-processing" title="Step 3: Background Ingestion Queue">
          <p>
            Upon successful storage, the upload API dispatches an asynchronous background processing event to Inngest. This immediately returns a response to the user interface, showing the document status as <code>processing</code>, and prevents timeouts during large file ingestion.
          </p>
        </LegalSection>

        <LegalSection id="4-extraction" title="Step 4: Text Extraction">
          <p>
            Our backend worker downloads the file from Supabase Storage and parses its content to extract readable plaintext. If a document cannot be read or contains no extractable text, processing fails, and the status changes to <code>failed</code> with an error message.
          </p>
        </LegalSection>

        <LegalSection id="5-chunking" title="Step 5: Content Chunking">
          <p>
            The extracted text is split into smaller, overlapping sections called &ldquo;chunks.&rdquo; Chunking ensures that search queries can locate specific paragraphs rather than loading entire multi-page documents, keeping answers precise and preserving AI prompt efficiency.
          </p>
        </LegalSection>

        <LegalSection id="6-embedding" title="Step 6: Vector Embedding Generation">
          <p>
            Each text chunk is processed using the Google Gemini embedding model (<code>gemini-embedding-001</code>). This converts the human-readable text chunk into a high-dimensional mathematical vector that represents the semantic meaning of that content.
          </p>
        </LegalSection>

        <LegalSection id="7-indexing" title="Step 7: Vector Indexing">
          <p>
            The generated vectors, along with the text chunk content and a <code>workspace_id</code> metadata property, are stored in Qdrant Cloud. The document status is updated in the database to <code>ready</code> (displayed as &ldquo;Completed&rdquo; in the dashboard).
          </p>
        </LegalSection>

        <LegalSection id="8-retrieval" title="Step 8: Context Retrieval and Question Answering">
          <p>
            When a team member enters a question in the chat interface:
          </p>
          <ol className="list-decimal pl-5 mt-2 space-y-1">
            <li>The system generates a semantic vector of the user&apos;s question.</li>
            <li>It performs a search in Qdrant, retrieving only chunks that match the user&apos;s <code>workspace_id</code>.</li>
            <li>The retrieved text chunks are sent, alongside the query, to the Google Gemini model to formulate a response.</li>
          </ol>
        </LegalSection>

        <LegalSection id="9-sources" title="Step 9: Answer Citations">
          <p>
            The system returns the generated answer to the user alongside source citations, listing the specific document filenames and context snippets used. This enables users to audit the output and verify the information in plain sight.
          </p>
        </LegalSection>

        <LegalSection id="10-deletion" title="Step 10: Retention and Deletion">
          <p>
            When a Workspace Admin deletes a document:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>The file is permanently removed from the Supabase Storage bucket.</li>
            <li>All associated database chunk records are deleted.</li>
            <li>Related vectors matching the document ID are purged from Qdrant Cloud.</li>
            <li>The document record is removed from the PostgreSQL database.</li>
          </ul>
        </LegalSection>

        <LegalSection id="privacy-boundary" title="Data Privacy Boundary Summary">
          <p>
            All document text extraction, chunk indexing, and question-answering lookups are partitioned using the organisation&apos;s <code>workspace_id</code>. Under no circumstances is context retrieved from or shared with other workspaces on the platform.
          </p>
        </LegalSection>
      </div>
    </LegalPageLayout>
  );
}
