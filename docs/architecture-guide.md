# Rekall-IQ Architecture Guide

A high-level map of how Rekall-IQ fits together. For the detailed backend design see
[backend-architecture.md](./backend-architecture.md); for UI see [frontend-design.md](./frontend-design.md).

Rekall-IQ is a multi-tenant SaaS: organisations upload approved documents, invite their team, and
ask questions in plain English. Every answer is grounded in the workspace's own documents, cites its
sources, and never crosses workspace boundaries.

## Stack at a glance

| Layer | Technology | Role |
|-------|-----------|------|
| Framework | Next.js (App Router) | UI + API route handlers, one deployment |
| Auth & data | Supabase (Postgres + Auth + Storage) | System of record, sessions, file storage, RLS |
| Vector store | Qdrant | Embedding search, filtered by `workspace_id` |
| Embeddings + rerank | Voyage (Gemini optional) | Chunk/query embeddings and reranking |
| Answer generation | Gemini | Constrained, grounded, streamed answers |
| Background jobs | Inngest | Asynchronous document ingestion |
| Document parsing | Local parsers + LlamaParse fallback | Text extraction for 6 file formats |
| Email | Resend | Invitations, trial + lifecycle mail |
| Hosting | Vercel | App + serverless functions |

## Surfaces

- **Public** — landing, auth, legal/help pages.
- **Tenant workspace** (`/dashboard`) — chat, documents, upload, analytics, evaluations, users, settings.
- **Platform console** (`/platform`) — operator-only oversight of companies, users, usage, and limits.

## Request flow

```
Browser → Next.js App Router → Supabase auth + profile → workspace/role guard → feature API
```

Every API authenticates the caller, loads their profile, and enforces role + workspace-operational
checks before doing work. The UI mirrors this with route guards in the dashboard/platform layouts.

## Document flow (ingestion)

```
Upload route → Supabase Storage → emit Inngest event → [worker] parser router (+ LlamaParse fallback)
  → chunk (1000/200) → Voyage embeddings (batched) → Qdrant vectors + Postgres chunks
  → document intelligence (summary/keywords/category) → status: ready
```

The upload request returns immediately; the heavy work runs asynchronously in Inngest so large files
never block the user. Failures clean up partial state and mark the document `failed` with a reason.

## Chat flow (RAG)

```
Question → Voyage query embedding (+ collection scope → document ids)
  → Qdrant vector search (fetch ~30)  +  Postgres keyword search   [both workspace-filtered]
  → merge + dedupe → Voyage rerank (top ~8) → context compression → answer-intelligence instructions
  → Gemini streaming answer → confidence + citations + follow-ups → persisted message + real token metering
```

If the documents don't support an answer, the assistant returns a fixed "I don't know" message and the
question is recorded as a **knowledge gap** for admins to close.

## Data stores

- **Postgres (Supabase)** — workspaces, profiles, documents, `document_chunks`, chat sessions/messages,
  feedback, collections, invitations, and the operational tables below. RLS + `workspace_id` scoping
  enforce tenant isolation on every query.
- **Qdrant** — one collection of chunk vectors; every point carries a `workspace_id` (and `document_id`)
  payload used as a mandatory search filter.
- **Supabase Storage** — the original uploaded files, streamed back through an authenticated,
  workspace-scoped endpoint for in-app preview.

### Operational tables

- `rate_limits` — atomic per-scope request throttling
- `workspace_usage_daily` — metered usage (questions, uploads, storage, embedding/LLM tokens)
- `workspace_limits` — per-workspace caps (platform-admin managed)
- `collections` — department grouping for documents + chat scoping
- `system_events` / `audit_logs` — diagnostics and an audit trail
- `rag_eval_*` — golden-question evaluation sets and runs
- `notifications` — workspace + platform notices

## Multi-tenancy invariants

1. Every row and vector is tagged with `workspace_id`; every query and search filters on it.
2. Roles: `platform_admin` > `tenant_admin` (Workspace Admin) > `viewer`.
3. Suspended/expired/deleted workspaces cannot perform write operations.
4. `/platform/*` is operator-only and never exposes tenant document contents or private chats.
5. Inngest events always carry `workspaceId` for tenant-scoped processing.
