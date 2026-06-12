# Backend Design Architecture

## Overview

Rekall-IQ uses a server-backed SaaS architecture built around:

- Next.js route handlers for application APIs
- Supabase for authentication, relational data, storage, and row-level security
- Qdrant for vector retrieval
- Gemini for embeddings and answer generation

The backend is designed for a multi-tenant, workspace-scoped knowledge assistant where tenant users only access their own workspace data and viewer chat history stays private to the individual user.

## Architecture Goals

- Enforce strong tenant isolation
- Keep platform administration separate from tenant content access
- Support retrieval-augmented generation from approved documents
- Record operational metadata for analytics, feedback, and knowledge gaps
- Keep the implementation simple enough for rapid product iteration

## High-Level System Diagram

```text
Browser / Next.js client
        |
        v
Next.js route handlers (/app/api/*)
        |
        +--> Supabase Auth verification
        +--> Supabase Postgres tables
        +--> Supabase Storage (document files)
        +--> Qdrant vector search
        +--> Gemini embeddings + answer generation
```

## Backend Layers

### 1. Client Boundary

The browser uses:

- Supabase client auth session handling
- internal `/api/*` endpoints for protected operations

Client code does not talk directly to Gemini or Qdrant. Those integrations are intentionally server-only.

Relevant files:

- [src/lib/supabase.ts](/home/water/Downloads/springvox-knowledge-ai/src/lib/supabase.ts)
- [src/lib/auth-client.ts](/home/water/Downloads/springvox-knowledge-ai/src/lib/auth-client.ts)

### 2. API Layer

The primary application backend lives in Next.js route handlers under `app/api`.

Important route groups:

- chat
- chat sessions
- document upload and deletion
- analytics
- feedback
- invitations
- workspace creation and settings
- platform company, user, plan, and analytics routes

This keeps the backend deployment model simple: one application runtime owning both UI and business APIs.

### 3. Service/Library Layer

Shared server logic lives in `src/lib`. This layer contains:

- auth helpers
- platform authorization helpers
- workspace access validation
- chat session helpers
- document chunking utilities
- onboarding validation
- knowledge gap logic
- Gemini integration
- Qdrant integration

This is the main boundary preventing route handlers from becoming large, duplicated scripts.

### 4. Data Layer

The data layer spans three storage systems:

- Supabase Postgres for canonical relational records
- Supabase Storage for raw uploaded files
- Qdrant for embeddings and similarity search

## Identity, Auth, And Authorization

### Authentication Model

Authentication is handled by Supabase Auth.

Server-side request authentication pattern:

1. Client obtains Supabase access token
2. Token is sent in `Authorization: Bearer <token>`
3. Server verifies token with Supabase
4. Server loads the user profile from `profiles`
5. Role and workspace checks are applied

Relevant file:

- [src/lib/supabase-server.ts](/home/water/Downloads/springvox-knowledge-ai/src/lib/supabase-server.ts)

Key server helpers:

- `getAuthenticatedUser`
- `getAuthenticatedUserWithProfile`
- `getAuthenticatedUserWithAnyProfile`
- `getUserProfileById`

### Role Model

Current role model in [src/lib/workspace.ts](/home/water/Downloads/springvox-knowledge-ai/src/lib/workspace.ts):

- `platform_admin`
- `tenant_admin`
- `viewer`

Legacy roles are still normalized for compatibility:

- `admin`
- `content_manager`

### Authorization Strategy

Authorization is enforced in layers:

1. API routes validate the authenticated user and allowed roles
2. Workspace operational status is checked before protected actions
3. Supabase row-level security policies protect database reads and writes
4. Platform-only routes require explicit platform admin checks

Relevant helpers:

- [src/lib/platform-api.ts](/home/water/Downloads/springvox-knowledge-ai/src/lib/platform-api.ts)
- [src/lib/workspace-access.ts](/home/water/Downloads/springvox-knowledge-ai/src/lib/workspace-access.ts)

## Multi-Tenancy Model

The core tenant boundary is `workspace_id`.

Most domain tables are workspace-scoped, including:

- `profiles`
- `documents`
- `document_chunks`
- `chat_messages`
- `chat_sessions`
- `knowledge_gaps`
- `answer_feedback`
- `invitations`

Important implications:

- Tenant admins operate within one workspace
- Viewers operate within one workspace and only see their own private chat history
- Platform admins operate across workspaces for metadata and operations, but not by default for private content

## Database Architecture

### Migration Structure

The schema is composed through ordered SQL files in `sql/`.

Current migration order from the project README:

1. `workspace_mvp.sql`
2. `advanced_mvp_features.sql`
3. `tenant_branding_invites_analytics_feedback.sql`
4. `role_model_platform_tenant.sql`
5. `organisation_onboarding.sql`
6. `platform_admin_console.sql`
7. `chat_sessions.sql`

### Major Domain Areas

#### Workspace And Identity

- `workspaces`
- `profiles`

These define tenant ownership, branding, role assignment, operational status, and plan information.

#### Knowledge Content

- `documents`
- `document_chunks`

Documents are the canonical uploaded source objects. Chunks represent extracted text segments that are embedded and indexed.

#### AI Interaction

- `chat_messages`
- `chat_sessions`

`chat_sessions` groups private user conversations by workspace and user. `chat_messages` stores question, answer, citations, and links back to the session.

Representative schema:

- [sql/chat_sessions.sql](/home/water/Downloads/springvox-knowledge-ai/sql/chat_sessions.sql)

#### Product Learning Loops

- `knowledge_gaps`
- `answer_feedback`

These tables help the product track unanswered questions and answer quality.

#### Growth And Governance

- `invitations`
- plan/status fields on `workspaces`
- platform admin support tables and metadata

## Row-Level Security

Supabase RLS is a critical protection layer, especially for chat privacy.

Recent chat-session protections in [sql/chat_sessions.sql](/home/water/Downloads/springvox-knowledge-ai/sql/chat_sessions.sql) enforce:

- users can only select, insert, update, and delete their own `chat_sessions`
- `chat_messages` reads and writes are constrained to the authenticated user in the matching workspace
- if a message has a `session_id`, that session must belong to the same authenticated user

This is especially important because the product requirement is that platform admins do not casually browse private tenant chat history.

## Document Ingestion Pipeline

The upload pipeline is implemented in [app/api/documents/upload/route.ts](/home/water/Downloads/springvox-knowledge-ai/app/api/documents/upload/route.ts).

### Ingestion Flow

Ingestion is split between a fast synchronous upload route and an asynchronous **Inngest** worker, so large files never block the request.

**Upload route** ([app/api/documents/upload/route.ts](/home/water/Downloads/springvox-knowledge-ai/app/api/documents/upload/route.ts)):

1. Authenticate and require workspace-admin privileges
2. Verify workspace operational status (`assertWorkspaceOperational`)
3. Enforce rate limits and configured workspace limits (daily uploads, storage bytes)
4. Validate file type and size; optionally bind a target collection
5. Create a `documents` row with `processing` status
6. Upload the raw file to Supabase Storage
7. Emit the `document/process.started` Inngest event and return immediately

**Inngest worker** ([src/lib/inngest/functions.ts](/home/water/Downloads/springvox-knowledge-ai/src/lib/inngest/functions.ts)):

8. Parse text via the parser router (PDF/DOCX/PPTX/XLSX/CSV/TXT), with **LlamaParse** as a quality fallback for complex files
9. Chunk the extracted text (1000 chars / 200 overlap)
10. Embed chunks in batches with **Voyage** (Gemini optional via env)
11. Insert chunk rows into `document_chunks` and upsert vectors + payloads into Qdrant
12. Generate **document intelligence** (summary, keywords, category) so files are findable by meaning
13. Mark the document `ready` (or `failed` with an error message)

On failure the worker/route clean up `document_chunks`, Qdrant vectors, the Storage file, and set the document to `failed` with the reason.

### Document Utility Rules

Document constraints are defined in [src/lib/documents.ts](/home/water/Downloads/springvox-knowledge-ai/src/lib/documents.ts):

- supported types: PDF, DOCX, PPTX, XLSX, CSV, TXT
- maximum size: configurable via env (default ~20 MB) — see `getMaxUploadMb` / `getMaxUploadBytes`
- chunk size: 1000 characters; overlap: 200 characters
- complex files (scanned PDFs, dense tables) fall back to LlamaParse when local extraction is weak

The XLSX parser uses `exceljs` (the `xlsx`/SheetJS package was removed for a HIGH-severity CVE).

## Retrieval-Augmented Generation Flow

The core chat pipeline is implemented in [app/api/chat/route.ts](/home/water/Downloads/springvox-knowledge-ai/app/api/chat/route.ts).

### Request Flow

1. Authenticate the request and load the user profile
2. Check that the workspace is operational; enforce monthly question + LLM-token limits
3. Resolve or create the user's owned chat session
4. Embed the question (Voyage by default) and resolve any collection scope to document ids
5. Retrieve in parallel — Qdrant vector search (fetch ~30) **and** Postgres keyword search — both filtered by `workspace_id`
6. Merge + dedupe candidates, then **rerank with Voyage** down to the top ~8
7. Build a compressed context bundle and stream a grounded Gemini answer
8. Compute answer **confidence** (high/medium/low) and generate follow-up suggestions
9. Persist the message with citations; meter **real** LLM token usage from the provider
10. If unsupported, record or increment a knowledge-gap entry

### Retrieval Controls

Retrieval is tuned through environment variables ([src/lib/rag/retrieval.ts](/home/water/Downloads/springvox-knowledge-ai/src/lib/rag/retrieval.ts)):

- `RAG_QDRANT_FETCH_K` — candidates pulled from Qdrant before rerank (default 30)
- `RAG_RERANK_TOP_K` — chunks kept after rerank (default 8)
- `RAG_RERANK_ENABLED` — set `false` to skip reranking (falls back to vector/keyword order)

Qdrant search uses:

- collection: `springvox_knowledge` (env `QDRANT_COLLECTION`)
- vector size: matches the embedding provider (Voyage default; 3072 for Gemini)
- distance: cosine
- a mandatory `workspace_id` payload filter (tenant isolation), plus an optional `document_id` filter for collection scope

Relevant integrations:

- [src/lib/qdrant.ts](/home/water/Downloads/springvox-knowledge-ai/src/lib/qdrant.ts) — vector store
- [src/lib/ai/providers/voyage.ts](/home/water/Downloads/springvox-knowledge-ai/src/lib/ai/providers/voyage.ts) — embeddings + rerank (degrades gracefully if rerank is unavailable)

### LLM Safety Posture

Gemini integration in [src/lib/ai/providers/gemini.ts](/home/water/Downloads/springvox-knowledge-ai/src/lib/ai/providers/gemini.ts) uses a strict system prompt that tells the model to:

- answer only from provided context
- avoid outside knowledge
- return a fixed fallback if support is insufficient
- format answers in Markdown
- avoid fake or overloaded citation formatting

The fallback answer is:

`I don't know based on the uploaded documents.`

This is one of the most important product guarantees in the system.

## Chat Session Architecture

Chat session support is implemented across:

- [src/lib/chat-sessions.ts](/home/water/Downloads/springvox-knowledge-ai/src/lib/chat-sessions.ts)
- [app/api/chat/sessions/route.ts](/home/water/Downloads/springvox-knowledge-ai/app/api/chat/sessions/route.ts)
- [app/api/chat/sessions/[id]/route.ts](/home/water/Downloads/springvox-knowledge-ai/app/api/chat/sessions/[id]/route.ts)
- [sql/chat_sessions.sql](/home/water/Downloads/springvox-knowledge-ai/sql/chat_sessions.sql)

### Session Rules

- sessions are private to one user within one workspace
- a session can be created explicitly or lazily during chat
- first-question logic renames the default `"New chat"` title
- message history is loaded only after ownership checks
- deleting a session cascades to associated messages

This design keeps the UX simple while preserving privacy and ownership boundaries.

## Feedback And Knowledge Gap Loop

The backend includes an explicit product-improvement loop.

### Answer Feedback

Route:

- [app/api/feedback/route.ts](/home/water/Downloads/springvox-knowledge-ai/app/api/feedback/route.ts)

Behavior:

- users can rate their own answers
- feedback is upserted per user and chat message
- workspace admins can review recent feedback

### Knowledge Gaps

Logic:

- [src/lib/knowledge-gaps.ts](/home/water/Downloads/springvox-knowledge-ai/src/lib/knowledge-gaps.ts)

Behavior:

- unsupported questions are normalized and tracked
- repeated unanswered questions increase occurrence counts
- last asked time is updated

This turns model failure into backlog insight for document improvement.

## Workspace Lifecycle And Operational Controls

Workspace status enforcement is centralized through [src/lib/workspace-access.ts](/home/water/Downloads/springvox-knowledge-ai/src/lib/workspace-access.ts).

Current statuses:

- `active`
- `trial`
- `suspended`
- `inactive`

Protected routes call `assertWorkspaceOperational`, which blocks usage for restricted workspaces before business logic runs.

Platform admins can update workspace status through routes such as:

- [app/api/platform/companies/[id]/status/route.ts](/home/water/Downloads/springvox-knowledge-ai/app/api/platform/companies/[id]/status/route.ts)

This is a good example of governance being handled at the application API layer while tenant reads remain governed by database and profile boundaries.

## Platform Admin Architecture

Platform administration uses dedicated route handlers plus shared aggregation helpers.

Representative file:

- [src/lib/platform-server.ts](/home/water/Downloads/springvox-knowledge-ai/src/lib/platform-server.ts)

Responsibilities include:

- loading workspace-level operational metadata
- aggregating usage summaries
- exposing company, user, and analytics views
- handling plan and status updates
- supporting platform-only notes

An important product choice here is metadata-first visibility. The platform layer is designed around company operations, not unrestricted tenant content browsing.

## Environment And Secret Boundaries

Important environment variables from the README:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `QDRANT_URL`
- `QDRANT_API_KEY`
- `QDRANT_COLLECTION`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `EMBEDDING_MODEL`
- `RAG_TOP_K`
- `RAG_SCORE_THRESHOLD`

Secrets that must remain server-only:

- `SUPABASE_SERVICE_ROLE_KEY`
- `QDRANT_API_KEY`
- `GEMINI_API_KEY`

The code correctly keeps Gemini, Qdrant, and admin Supabase usage inside server-only modules.

## Strengths Of The Current Backend

- Clear multi-tenant workspace boundary
- Reasonable separation between routes and shared server logic
- Strong use of Supabase for both auth and relational enforcement
- Practical RAG pipeline with clear fallback behavior
- Good cleanup behavior in the document ingestion path
- Product learning loops are built into the architecture, not bolted on later
- Platform admin operations are distinct from workspace-user flows

## Current Risks Or Constraints

- Ingestion runs on Inngest with batched/concurrent Voyage embeddings, but very large bulk uploads can still queue behind one another under default concurrency.
- The app relies on route handlers as the main orchestration layer, so very large future feature growth may require more explicit service boundaries.
- Platform aggregation reads broad datasets into memory for summary building, which is acceptable at current scale but should move to database-side aggregation as workspace counts grow.
- Chat generation is single-provider (Gemini); there is no automatic model fallback if Gemini is unavailable.
- Document access is workspace-scoped only — there is no per-document/source-permission model yet.

## Recommended Next Backend Evolutions

- **Source connectors** (Google Drive first) with scheduled incremental sync through Inngest, reusing the `document/process.started` pipeline.
- **Enterprise identity** — SAML/OIDC SSO and SCIM provisioning.
- **Document-level permissions** mirrored from source systems, enforced as an extra Qdrant payload filter.
- **Retrieval upgrades** — query transformation (multi-query/HyDE), conversational query rewriting, and structure-aware chunking.
- Move platform summary aggregation database-side; add observability around retrieval quality and model latency.
- Multi-provider chat with automatic fallback.

## Summary

The backend architecture is a solid applied SaaS RAG design for a workspace-scoped enterprise assistant:

- Supabase is the system of record and auth authority
- Inngest runs asynchronous document ingestion
- Voyage provides embeddings and reranking (Gemini embeddings optional via env)
- Qdrant is the vector retrieval engine, paired with Postgres keyword search (hybrid)
- Gemini provides constrained, grounded answer generation
- Next.js route handlers orchestrate business workflows
- RLS and role checks preserve tenant and user privacy

That combination matches the current product well and leaves a clean path for connectors, identity, retrieval quality, and operational scale improvements.
