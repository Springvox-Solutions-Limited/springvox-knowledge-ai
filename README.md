# Rekall-IQ

Rekall-IQ is a secure multi-tenant SaaS platform for company knowledge. Organisations upload approved documents, invite their team, and ask questions in plain English. Answers are grounded in uploaded documents, include sources, and remain scoped to the user’s workspace.

## Current Platform Status

- Phase 1: workspace SaaS foundation, roles, Supabase Auth, storage, Qdrant, Gemini chat.
- Phase 2: multi-format ingestion for PDF, TXT, DOCX, CSV, XLSX, PPTX, optional LlamaParse, bulk upload.
- Phase 3: production RAG retrieval, intent classification, context compression, follow-ups, Voyage embeddings.
- Phase 4: trial lifecycle, notifications, audit logs, platform operations, user controls, security linter fixes.
- Phase 5A: Voyage reranking, hybrid search, confidence scoring, answer modes, document intelligence, improved source quality.
- Phase 5B: beta rate limiting, usage metering, evaluations, diagnostics, workspace deletion lifecycle, support documentation.
- Phase 6 (in progress):
  - **Security hardening** — privilege-escalation fix, atomic rate limiter, `xlsx`→`exceljs` (CVE), chat length cap, CSP + security headers.
  - **6B Centralized API client** (`src/lib/api-client.ts`) — auto-attaches the Supabase token, refreshes on 401, redirects on hard auth failure.
  - **6E Chat UX** — regenerate response, edit-and-resend question.
  - **6G Workspace limits** — `workspace_limits` table + platform-admin UI for per-workspace question/upload/storage/token caps.
  - **6D Department collections** — General/HR/Finance/Legal/Operations/Sales/Support/IT; assign documents to a collection, filter the library, and scope chat retrieval to a collection ("All documents" by default).
  - **6C In-app file preview + real citations** — a secure, workspace-scoped stream endpoint (`/api/documents/[id]/stream`) plus a preview drawer that renders the actual file (PDF, image, DOCX, XLSX/CSV, Markdown, text) from an authenticated blob URL. Chat citations now open the real document via "View full document"; the Documents page has a "Preview" action.
  - **6F Document intelligence** — richer, retrieval-friendly summaries/keywords with spreadsheet awareness.
  - **Unified dark UI** — the entire product (landing, auth, dashboard, platform) is a single token-driven dark theme: near-black olive canvas, jade/teal accent, dark sidebars, one page title per screen (body H1 + breadcrumb top bar). Brand is the inline-SVG Rekall-IQ "R" monogram. See `DESIGN.md`.
  - **Help center** — in-app `/help/user-guide` and `/help/admin-guide` with step-by-step instructions and visual aids.
  - **Accurate metering** — LLM token usage is read from the provider's real usage metadata (char estimate only as fallback), feeding workspace usage limits.

> Status: **beta-ready** for controlled testing. Open pre-launch items: legal review of policy pages, a real contact mailbox/domain (currently `hello@rekall-iq.com` placeholder), and live verification of chat scoping + file preview on real data. Post-beta roadmap: source connectors (Google Drive first), SSO/SCIM, document-level permissions, and retrieval upgrades (query transforms, structure-aware chunking).

## Database Migrations

SQL migrations live in `/sql/` and are applied in Supabase. Phase 6 added:

- `sql/phase6_atomic_rate_limit.sql` — atomic rate-limit RPC (the limiter calls this; until applied it fails open).
- `sql/phase6g_workspace_limits.sql` — per-workspace limits table (platform-admin RLS).
- `sql/phase6d_collections.sql` — `collections` table, `documents.collection_id`, seeds the 8 default departments per workspace.

## Architecture Diagram

```text
Browser
  -> Next.js App Router
  -> Supabase Auth + Postgres + Storage
  -> Inngest background jobs
  -> Parser router
  -> Voyage embeddings
  -> Qdrant vector index
  -> Voyage rerank
  -> Gemini answer streaming
  -> Workspace-scoped chat with sources
```

## Authentication

Rekall-IQ uses Supabase Auth. API routes validate bearer tokens server-side before reading workspace data. Service-role access is server-only and must never be exposed through `NEXT_PUBLIC` variables.

## Workspace Model

Every tenant has a workspace. Documents, chunks, chat messages, users, notifications, audit logs, and analytics are scoped by `workspace_id`.

Workspace isolation rules:

- Qdrant payload filters include `workspace_id`.
- Supabase reads and writes validate the authenticated profile workspace.
- Platform admin APIs expose operational metadata only.
- Tenant users cannot access other tenant data.

## Roles

- Platform Admin: manages workspaces, users, plans, audit logs, notifications, and lifecycle status.
- Workspace Admin: uploads documents, manages users, reviews analytics, and uses chat.
- Viewer: asks questions and reads workspace notifications.

Public signup must not create `platform_admin`.

## RAG Pipeline

Current question flow:

1. Classify query intent deterministically.
2. Embed query with Voyage.
3. Fetch workspace-filtered Qdrant candidates.
4. Add keyword search candidates for exact IDs, codes, model numbers, and phrases.
5. Merge and deduplicate candidates.
6. Optionally rerank with Voyage.
7. Compress grouped document context.
8. Stream Gemini answer in the selected answer mode.
9. Return citations, confidence, and follow-up suggestions.

## Document Pipeline

Upload flow:

1. Workspace admin uploads one or more files.
2. Supabase Storage stores the file in the `documents` bucket.
3. A document row is created as `processing`.
4. Inngest processes the file in the background.
5. Parser router extracts text and metadata.
6. Gemini generates document summary, keywords, and category.
7. Text is chunked and embedded with Voyage.
8. Qdrant receives workspace/document payload metadata.
9. Supabase stores chunks and document intelligence.
10. Document status becomes `ready`.

## Supported Formats

- PDF
- TXT
- DOCX
- CSV
- XLSX
- PPTX

Upload size is controlled by:

- `MAX_UPLOAD_MB=20`
- `NEXT_PUBLIC_MAX_UPLOAD_MB=20`

## Embedding Provider

Default embeddings use Voyage:

- `SPRINGVOX_EMBEDDING_PROVIDER=voyage`
- `VOYAGE_EMBEDDING_MODEL=voyage-4-lite`
- `SPRINGVOX_EMBEDDING_DIMENSIONS=1024`

Gemini embeddings remain available as a fallback provider. Changing embedding provider or dimensions requires reindexing documents into a compatible Qdrant collection.

## Qdrant Architecture

Default collection:

- `QDRANT_COLLECTION=springvox_knowledge_voyage`

Recommended payload indexes:

- `workspace_id`
- `document_id`

Qdrant payloads include workspace, document, filename, chunk, preview, category, keywords, and table metadata.

## Voyage Reranking

Phase 5A reranking:

- `RAG_RERANK_ENABLED=true`
- `RAG_QDRANT_FETCH_K=30`
- `RAG_RERANK_TOP_K=8`
- `VOYAGE_RERANK_MODEL=rerank-2-lite`

If reranking fails, Rekall-IQ falls back to vector and keyword ranking.

## LlamaParse Advanced Parsing

LlamaParse is optional and disabled by default:

- `LLAMAPARSE_ENABLED=false`
- `LLAMAPARSE_MODE=fallback`
- `LLAMAPARSE_COMPLEX_ONLY=true`

Recommended production mode is `fallback`: Rekall-IQ tries the local parser first, then uses LlamaParse only when extraction is weak or empty. `force` sends supported files to LlamaParse first and falls back locally if possible. If `LLAMAPARSE_API_KEY` is missing, the app logs a safe warning and continues with local parsers.

With `LLAMAPARSE_COMPLEX_ONLY=true`, LlamaParse is considered only for PDF, DOCX, PPTX, and XLSX. TXT and CSV stay local.

Privacy note: when enabled, supported uploaded documents may be sent to LlamaParse for extraction. Update customer-facing privacy/data handling documentation before enabling this in production.

## Hybrid Search

Hybrid search combines:

- semantic vector search
- keyword search over chunk text
- filename/category/keyword context during rerank

This improves retrieval for exact values such as model numbers, invoice IDs, extensions, contract codes, and spreadsheet fields.

## Answer Confidence

The chat API returns:

- `high`
- `medium`
- `low`

Confidence is based on retrieval scores, rerank scores, source coverage, context size, and no-answer state. It is a retrieval-quality indicator, not a legal or factual guarantee.

## Answer Modes

Chat supports:

- Summary
- Detailed
- Executive
- Technical

The selected mode changes answer style while preserving strict source-grounding.

## Answer Intelligence Layer

Rekall-IQ builds deterministic answer guidance before Gemini responds. It uses query intent, answer mode, document categories, source types, table metadata, and preliminary confidence to shape the response.

For spreadsheets and reports, answers prefer executive summaries, key findings, important numbers, risks, recommendations, and caveats. For manuals and technical guides, answers prefer direct answers, steps, relevant notes, caveats, and follow-ups. Low-confidence answers include what is missing and safer next questions instead of guessing.

## Document Intelligence

Documents store:

- `document_summary`
- `document_keywords`
- `document_category`

Suggested categories:

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

## Notifications

Platform admins can send in-app or email notifications to one workspace or all workspaces. Tenant users have `/dashboard/notifications` with read/unread state, badges, filters, and mark-as-read controls.

Email uses Resend when configured. Missing `RESEND_API_KEY` does not crash notification creation.

## Beta Safety And Operations

Phase 5B adds Supabase-backed beta safety controls:

- Rate limits for chat, uploads, signup, platform APIs, notifications, and document deletion.
- Usage metering in `workspace_usage_daily`.
- Platform usage dashboard at `/platform/usage`.
- Diagnostics dashboard at `/platform/diagnostics`.
- Workspace evaluation harness at `/dashboard/evaluations`.
- Workspace deletion lifecycle with scheduled deletion, cancellation, and force-delete event processing.

Rate limits return HTTP 429 with `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `Retry-After`.

Usage token counts are estimated from text length when exact provider token counts are unavailable.

## Trial System

New workspaces start on a 14-day trial. Trial expiry blocks tenant app usage until activation or payment handling. Platform admins can activate, suspend, expire, extend trials, mark past due, or convert to paid/active.

## Security

Controls include:

- Supabase Auth server-side token validation.
- RLS policies for tenant-facing tables.
- Service-role usage restricted to server modules.
- Workspace-scoped Qdrant filters.
- Upload MIME, extension, and size validation.
- LlamaParse disabled by default.
- RAG debug logs disabled by default.
- Supabase linter migrations for function `search_path` and SECURITY DEFINER execute exposure.

Manual Supabase action:

Supabase Dashboard -> Authentication -> Password Security -> Enable leaked password protection.

## Audit Logs

Workspace/user/platform operations write to `audit_logs`. Platform admins can review `/platform/audit-logs`.

## Environment Variables

Core:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=documents

QDRANT_URL=
QDRANT_API_KEY=
QDRANT_COLLECTION=springvox_knowledge_voyage

SPRINGVOX_CHAT_PROVIDER=gemini
SPRINGVOX_EMBEDDING_PROVIDER=voyage
SPRINGVOX_EMBEDDING_DIMENSIONS=1024

GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.0-flash

VOYAGE_API_KEY=
VOYAGE_EMBEDDING_MODEL=voyage-4-lite
VOYAGE_RERANK_MODEL=rerank-2-lite

RAG_DEBUG=false
RAG_MAX_CONTEXT_CHARACTERS=4500
RAG_RERANK_ENABLED=true
RAG_RERANK_TOP_K=8
RAG_QDRANT_FETCH_K=30

EMAIL_PROVIDER=resend
RESEND_API_KEY=
EMAIL_FROM="Rekall-IQ <no-reply@yourdomain.com>"
NEXT_PUBLIC_APP_URL=

MAX_UPLOAD_MB=20
NEXT_PUBLIC_MAX_UPLOAD_MB=20

LLAMAPARSE_API_KEY=
LLAMAPARSE_ENABLED=false
LLAMAPARSE_MODE=fallback
LLAMAPARSE_COMPLEX_ONLY=true
```

## SQL Migration Order

Run SQL files in order:

1. `sql/workspace_mvp.sql`
2. `sql/advanced_mvp_features.sql`
3. `sql/tenant_branding_invites_analytics_feedback.sql`
4. `sql/role_model_platform_tenant.sql`
5. `sql/organisation_onboarding.sql`
6. `sql/platform_admin_console.sql`
7. `sql/chat_sessions.sql`
8. `sql/inngest_document_status.sql`
9. `sql/document_parser_metadata.sql`
10. `sql/phase4_trial_user_status.sql`
11. `sql/phase4g_platform_notifications.sql`
12. `sql/phase4h_notification_reads.sql`
13. `sql/phase4h_security_linter_fixes.sql`
14. `sql/phase5a_document_intelligence.sql`
15. `sql/phase5b_beta_hardening.sql`

## Deployment

1. Install dependencies with `npm install`.
2. Configure environment variables.
3. Run Supabase migrations.
4. Create Supabase Storage bucket `documents`.
5. Create or verify Qdrant collection dimensions.
6. Start Inngest.
7. Run `npx tsc --noEmit`.
8. Run `npm run build`.
9. Promote a platform admin manually.

## Known Limitations

- OCR for scanned PDFs is not fully implemented.
- LlamaParse is optional and disabled by default. Scanned/image-heavy PDFs still depend on the configured LlamaParse plan and extraction quality.
- Answer intelligence is deterministic prompt guidance, not a second verifier. Confidence is based on retrieval quality.
- Evaluation scoring is deterministic and does not use an LLM judge yet.
- Beta rate limiting uses Supabase and is intended for controlled beta safety, not advanced bot mitigation.
- Workspace force deletion disables profiles but does not delete `auth.users` by default.
- `xlsx` has known audit advisories with no direct fixed version from npm audit output.
- Confidence scores are retrieval-quality indicators, not formal correctness guarantees.
- Billing checkout is not implemented.
- Provider/dimension changes require reindexing.

## Future Roadmap

- OCR and scanned document parsing.
- Plan-based advanced parsing controls.
- Workspace-level rerank/LLM settings.
- Read/unread notification preferences.
- Billing checkout integration.
- Central API rate limiting.
- Deeper table analytics and chart generation.
