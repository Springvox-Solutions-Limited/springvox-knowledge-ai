# Phase 5A RAG Intelligence

Phase 5A upgrades SpringVox Knowledge AI from basic vector retrieval into a more production-ready enterprise RAG system.

## Architecture

Question flow:

1. User asks a question in a workspace chat.
2. API verifies the authenticated user and workspace access.
3. The query is embedded with the configured embedding provider.
4. Qdrant retrieves workspace-filtered vector candidates.
5. Keyword search retrieves exact-match candidates from chunk text.
6. Candidates are merged and deduplicated.
7. Voyage rerank optionally reorders the top candidate set.
8. Context is grouped by document and compressed.
9. The answer intelligence layer builds deterministic response guidance from intent, answer mode, source categories, table metadata, and preliminary confidence.
10. Gemini streams the answer in the selected answer mode.
11. The API returns answer text, citations, confidence, and follow-up suggestions.

Workspace isolation is preserved at every retrieval step. Qdrant filters always include `workspace_id`, and keyword search is scoped to `document_chunks.workspace_id`.

## Reranking

Environment variables:

- `RAG_RERANK_ENABLED=true`
- `RAG_QDRANT_FETCH_K=30`
- `RAG_RERANK_TOP_K=8`
- `VOYAGE_RERANK_MODEL=rerank-2-lite`

When enabled, SpringVox fetches a larger candidate set from Qdrant, sends candidate excerpts to Voyage Rerank, and keeps the strongest results for Gemini context.

If reranking fails or Voyage is unavailable, the system falls back to vector/keyword ranking and continues answering.

## Confidence Scoring

The answer confidence badge is computed from:

- top retrieval score
- rerank score average
- number of final chunks
- source document coverage
- no-answer state

Labels:

- High Confidence
- Medium Confidence
- Low Confidence

Confidence is a retrieval-quality signal, not a guarantee of truth.

## Hybrid Search

Hybrid search combines:

- vector search from Qdrant
- keyword search over chunk text
- document filename/category/keyword metadata in rerank context

This helps with exact terms such as:

- Cisco 7821
- Extension 501
- Invoice 1032
- Contract ABC-22

## Answer Modes

Chat supports:

- Summary: 3-5 bullets maximum
- Detailed: balanced explanation with figures and caveats where supported
- Executive: business impact, risks, decisions, recommendations, actions
- Technical: procedures, implementation detail, troubleshooting, references

The selected mode is sent with each chat request and changes the Gemini prompt instructions without changing retrieval security.

## Answer Intelligence Layer

Before Gemini is called, SpringVox creates answer-specific guidance from:

- query intent
- selected answer mode
- document categories
- source file types
- table metadata
- preliminary confidence

For business reports and spreadsheets, the model is instructed to prioritize executive summaries, key findings, important numbers, risks/issues, recommendations, and caveats. It must not claim full-report totals or rankings unless the retrieved excerpts support them.

For manuals, procedures, and technical guides, the model is instructed to prioritize direct answers, steps/explanations, relevant notes, caveats, and useful follow-ups.

For low-confidence retrieval, answers should include a short confidence note, what is missing, and safer next questions rather than guessing.

## Document Intelligence

During ingestion, SpringVox generates and stores:

- `document_summary`
- `document_keywords`
- `document_category`

Categories include:

- Manual
- Policy
- Procedure
- Contract
- Financial Report
- Spreadsheet
- Presentation
- Technical Guide
- Knowledge Base
- Other

If Gemini document intelligence fails, ingestion falls back to filename/parser-based metadata so documents do not get stuck.

## Table Intelligence

CSV and XLSX parsers now preserve table metadata:

- sheet names
- column names
- row counts
- column counts
- truncation state

This metadata is stored with parser metadata and chunk metadata, and is also available in Qdrant payloads for retrieval context.

When table metadata is present, the answer intelligence layer asks Gemini to use headers, row relationships, statuses, dates, counts, anomalies, and top/bottom values only when the retrieved context is sufficient.

## LlamaParse Activation

LlamaParse remains optional:

- `LLAMAPARSE_ENABLED=false`
- `LLAMAPARSE_MODE=fallback`
- `LLAMAPARSE_COMPLEX_ONLY=true`

Modes:

- `off`: local parsers only.
- `fallback`: local parser first, then LlamaParse only for weak/empty extraction.
- `force`: LlamaParse first for supported complex files, with local fallback if possible.

With complex-only mode, SpringVox considers LlamaParse for PDF, DOCX, PPTX, and XLSX. TXT and CSV stay local. Missing API keys do not crash ingestion; SpringVox logs a safe warning and uses local parsers.

## Streaming

Gemini answers stream over server-sent events:

- `status`
- `chunk`
- `complete`
- `error`

Sources, confidence, and follow-ups arrive in the completion payload after generation.

## Timing Logs

The chat API logs:

- `retrieval_ms`
- `rerank_ms`
- `generation_ms`
- `total_ms`

Detailed retrieval logs remain controlled by `RAG_DEBUG=true`.
