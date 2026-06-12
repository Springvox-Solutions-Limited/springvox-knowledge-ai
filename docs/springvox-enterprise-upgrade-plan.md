# SpringVox Enterprise Upgrade Plan (Phase 6)

**Date:** 2026-06-01
**Status:** IN PROGRESS — security audit + Phases 6B, 6E, 6G implemented & build-verified. 6D/6C/6F/6A pending.
**Source of ideas:** `docs/competitive-analysis-onyx-pipeshub.md` (Onyx + PipesHub study)

## Implementation Status (2026-06-01)

| Item | Status | Notes |
|---|---|---|
| **Security audit fixes** | ✅ Done | HIGH-1 privilege escalation, HIGH-2 atomic rate limiter, HIGH-3 xlsx→exceljs, HIGH-4 chat length cap, MED-1 security headers, LOW-3 reserved slugs |
| **6B — API client** | ✅ Done | `src/lib/api-client.ts` + `api-error.ts`; platform client delegates to it (all platform pages get token refresh) |
| **6E — Chat regenerate/edit** | ✅ Done | Regenerate on answers, Edit on questions; reuses existing streaming |
| **6G — Workspace limits** | ✅ Done | `workspace_limits` table + `/limits` API + admin panel on company detail page. *Enforcement wiring into rate-limit hot path is a follow-up.* |
| **6D — Collections** | ⏳ Pending | Touches RAG/Qdrant payload — needs DB migration + re-index backfill + runtime test |
| **6C — File preview** | ⏳ Pending | Needs `react-pdf`/`docx-preview` deps + PDF.js worker config + runtime test |
| **6F — Doc intelligence** | ⏳ Pending | Backend RAG; needs re-ingestion + runtime test |
| **6A — UI polish sweep** | ⏳ Pending | Presentational; partially covered by earlier UI passes |

**⚠️ Required before the DB-backed features work:** run the new SQL migrations in Supabase —
`sql/phase6_atomic_rate_limit.sql` (rate limiter now calls this RPC) and
`sql/phase6g_workspace_limits.sql` (limits table). Until `phase6_atomic_rate_limit.sql` is applied,
the rate limiter fails open (logs a warning, allows the request).

**Deferred phases rationale:** 6D/6C/6F each modify core flows (RAG retrieval, chat citations, ingestion)
that require running the app + DB to verify safely. They are specced below and should each be done as a
focused, runtime-tested change rather than shipped unverified.

---

## Guardrails (apply to every phase)

**Stack is fixed — do not change:**
Next.js 16 · Supabase (Postgres + Auth + Storage) · Qdrant · Gemini/Voyage · Inngest · Vercel · Tailwind + shadcn/ui

**Hard constraints:**
- Do NOT migrate backend architecture. No Vespa, Kafka, ArangoDB, Celery, microservices.
- Do NOT add web search (conflicts with "approved-documents-only" positioning).
- Do NOT break workspace isolation, RLS, auth, uploads, chat, or RAG.
- Every new table has RLS enabled + workspace-scoped policies.
- Every Qdrant query keeps its `workspace_id` filter.
- Every write keeps `assertWorkspaceOperational`.
- Follow `DESIGN.md` (navy sidebar, teal/cyan accent, Inter). No new UI framework.
- Run `npx tsc --noEmit`, `npm run build`, `npm run lint` after each phase.

---

## Phase Sequence & Dependencies

```
6B (API client) ──┬─> 6C (file preview) ──> 6E (chat UX)
                  └─> 6D (collections)  ──> 6E
6A (UI overhaul) runs alongside; touches presentation only
6F (doc intelligence) is backend/RAG; independent
6G (rate-limit admin) depends on 6B for the admin fetch layer
```

**Recommended build order:** 6B → 6A → 6C → 6E → 6D → 6F → 6G
(6B first because it unblocks clean data-fetching for everything else; 6A can interleave since it's presentational.)

---

## Phase 6B — Centralized API Client *(do first)*

**Goal:** One client that attaches the Supabase token, refreshes on 401, and removes ~30 hand-written `getAccessToken()` + header blocks.

**Pattern borrowed:** PipesHub `lib/api/axios-instance.ts` (request interceptor attaches token; response interceptor refreshes on 401, queues + replays in-flight requests, redirects to `/login` on hard failure). We reimplement on `fetch` (no axios dependency needed).

**New files:**
- `src/lib/api-client.ts` — `apiFetch(path, opts)` wrapper:
  - Reads session via `supabase.auth.getSession()`, attaches `Authorization: Bearer`.
  - On 401: call `supabase.auth.refreshSession()`, retry once; queue concurrent calls during refresh.
  - On refresh failure: `supabase.auth.signOut()` + redirect to `/login`.
  - Returns typed JSON; throws a normalized `ApiError { status, code, message }`.
- `src/lib/api-error.ts` — `ApiError` type + `toApiError()` helper.

**Refactor (incremental, page by page):**
Replace manual fetch blocks in: chat, documents, upload, users, knowledge-gaps, evaluations, notifications, settings, analytics, all `platform/*` pages, `platform-client.ts`.

**Database changes:** none.

**UI changes:** none visible — pure plumbing. Session-expiry now redirects cleanly instead of silent failures.

**Risks:**
- Refresh-loop if refresh token is also invalid → guard with a single-retry flag.
- SSE chat stream uses native `fetch` with a ReadableStream; the client must support streaming responses (don't JSON-parse the chat route). Keep a `stream: true` branch.

**Test plan:** unit test for the refresh-queue; manual: let a session expire, confirm one silent refresh then success; confirm chat streaming still works.

---

## Phase 6A — Premium UI Overhaul

**Goal:** Make every dashboard/platform screen feel like Glean/PipesHub-grade SaaS. Presentation only — no data-flow or business-logic changes.

**Scope (screen by screen):**
- **Consistency pass:** every KPI uses `StatCard`; every filter uses shadcn `Select`; every loading state uses the `skeleton-card` components (built in the prior UI pass); every empty state uses `EmptyState`.
- **Spacing/typography:** standardize page header rhythm, card padding, table density against `DESIGN.md`.
- **Tables:** consistent column alignment, row hover, sticky headers, mobile card fallback (the `MobileCardList` pattern already exists).
- **Remove clutter:** any remaining oversized hero cards, placeholder copy, demo-style badges (the "ONLINE" / "All systems operational" indicators were already removed — sweep for stragglers).
- **Mobile:** verify every platform table collapses to cards; sidebar sheet works on all pages.

**Reference (inspiration, not copy):** PipesHub's `components/data-display/` (DataTable, empty/error/loading states) and page-level co-location.

**Database changes:** none.

**UI changes:** every screen — but visual only.

**Risks:** scope creep / regressions. Mitigate by doing it screen-by-screen with a tsc+build check between each, and never touching fetch/handlers in this phase.

**Test plan:** visual review per screen at 375px / 1280px / 1920px; build must stay green.

---

## Phase 6C — In-App File Preview + Real Citations

**Goal:** Clicking a citation opens the **actual document**, not just a text excerpt. This is the single biggest "enterprise vs demo" jump.

**Pattern borrowed:** PipesHub `file-preview/renderers/` (MIME-routed renderer switch) + blob-URL streaming with `URL.revokeObjectURL` cleanup (`frontend/docs/features/file-preview.md`).

**New API endpoint:**
- `GET /api/documents/[id]/stream` — returns the stored Supabase Storage file as a binary stream.
  - Auth: `getAuthenticatedUserWithProfile`.
  - **Workspace check:** the document's `workspace_id` must equal the caller's. Reject cross-tenant.
  - Generate a short-lived Supabase Storage signed URL server-side OR proxy the bytes (proxy preferred so the storage path never reaches the client).

**New components:**
- `src/components/file-preview/FilePreviewRenderer.tsx` — routes by MIME/extension.
- Renderers (use libraries already sane for Vercel):
  - PDF → `react-pdf` (or `react-pdf-highlighter` if we want citation bounding boxes later).
  - DOCX → `docx-preview`.
  - XLSX/CSV → reuse `exceljs` → render to an HTML table with sheet tabs.
  - Markdown → existing `react-markdown`.
  - TXT/code → `react-syntax-highlighter`.
  - Image → native `<img>`.
  - Fallback → download button.
- `src/components/file-preview/FilePreviewDrawer.tsx` — shadcn Sheet/Dialog wrapper; blob-URL lifecycle + cleanup.

**Chat integration:** the existing `SourceDrawer` in `app/dashboard/chat/page.tsx` currently shows excerpt text. Extend it: keep the excerpt tab, add a "View document" action that opens `FilePreviewDrawer` for that `document_id`, scrolled to the cited section where the renderer supports it.

**Database changes:** none required for v1. (Optional later: store per-chunk page/offset in `document_chunks` to enable exact PDF highlight — defer.)

**Dependencies added:** `react-pdf`, `docx-preview`, `react-syntax-highlighter` (+ types). All client-side, Vercel-safe.

**Risks:**
- PDF.js worker config on Next.js/Vercel — needs the worker served correctly (known setup, documented).
- Large files → stream + lazy-render; cap preview size, fall back to download.
- DOCX/XLSX rendering fidelity is imperfect — acceptable; download is always available.
- Bundle size — load renderers with dynamic `import()` so the chat bundle stays small.

**Test plan:** preview each supported type; confirm a user from workspace B gets 403 streaming workspace A's document; confirm blob URLs are revoked on close (no memory leak).

---

## Phase 6D — Department Collections / Folders

**Goal:** Organize documents into department collections and let chat scope retrieval to all docs / one collection / selected docs.

**Default collections (seeded per workspace):** General, HR, Finance, Legal, Operations, Sales, Support, IT.

**Database changes (new migration in `/sql/`):**
```sql
create table public.collections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  slug text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  unique (workspace_id, slug)
);
alter table public.documents add column collection_id uuid references public.collections(id) on delete set null;
-- RLS: workspace-scoped select/insert/update/delete mirroring documents policies.
-- Seed the 8 defaults on workspace creation (extend the create-workspace flow + a backfill for existing workspaces).
```

**Qdrant:** add `collection_id` to each chunk's payload at ingestion. Retrieval adds an **optional** `collection_id` filter alongside the **mandatory** `workspace_id` filter. Selected-documents mode adds a `document_id` `in` filter. Workspace filter is never removed.

**API changes:**
- `documents/upload` accepts optional `collectionId`.
- `chat` accepts optional `collectionId` or `documentIds[]` retrieval scope.
- New `collections` CRUD route (tenant_admin only for create/rename/delete; default collections non-deletable).

**UI changes:**
- Documents page: collection sidebar/filter (query-param nav, e.g. `?collection=hr`).
- Upload: collection picker.
- Chat: a scope selector near the answer-mode chips — "All documents ▾ / HR / Finance / … / Selected files".

**Permissions:** v1 = workspace-level only. **Do NOT build per-group document permissions yet.**

**Risks:**
- Backfill: existing documents get `collection_id = General`.
- Re-indexing existing chunks to add `collection_id` payload — run as an Inngest backfill job; until then, treat missing `collection_id` as "uncategorized / matches all".

**Test plan:** upload into HR, confirm chat scoped to Finance does not retrieve it; confirm "all" still returns it; confirm workspace isolation holds across both.

---

## Phase 6E — Chat UX Improvements

**Goal:** Make chat feel premium and enterprise-ready.

**Pattern borrowed:** PipesHub `docs/features/chats/message-actions-flow.md` (command-bus for regenerate/edit), Onyx `message/` components (thinking/timeline blocks).

**Features:**
- **Regenerate response** — ↻ on the answer toolbar re-POSTs the same question to `/api/chat`, clears + re-streams that message.
- **Edit question & resend** — ✏ on a user message pre-fills the input with the original text; submitting creates a new exchange.
- **Better source display** — integrate the 6C file preview; show document category/collection badge on each citation; group citations by document.
- **Better confidence display** — clearer high/medium/low treatment with a one-line "why" (e.g., "based on 3 sources in HR").
- **Better follow-up chips** — visual polish, keyboard-selectable.
- **Better streaming/loading** — refine the staged status messages ("Searching… Reviewing… Verifying sources…") and the thinking indicator.

**Database changes:** none (regenerate/edit reuse existing `chat_messages`).

**UI changes:** chat page only.

**Risks:** must not regress the existing SSE stream + abort handling. Reuse the current stream plumbing; add actions on top, don't rewrite the stream.

**Test plan:** regenerate produces a fresh answer; edit creates a new turn; abort still works; citations open previews.

---

## Phase 6F — Better Document Intelligence

**Goal:** Improve retrieval and parsing quality for both simple and complex documents.

**Scope (backend/RAG, within current stack):**
- **LlamaParse fallback hardening:** clearer triggering for complex/scanned PDFs; better error → retry → fallback path; record which parser was used (already partially in `parser_metadata`).
- **Table & spreadsheet understanding:** richer `table_metadata`; generate per-sheet/per-table natural-language summaries at ingestion so tabular data is retrievable by meaning, not just cell text.
- **Document summaries/categories/keywords:** improve the Gemini `generateDocumentIntelligence` prompt; ensure category aligns with the 6D collections taxonomy where possible.
- **Citations + chunks + preview alignment:** ensure chunk → document → preview linkage is consistent so 6C/6E can deep-link.

**Pattern borrowed (ideas only):** PipesHub `modules/parsers`, `modules/transformers`, `modules/reranker` approaches — reimplemented on Gemini/Voyage/Qdrant, not their stack.

**Database changes:** possibly extend `document_chunks.table_metadata` and `documents` intelligence columns; migration if so.

**Risks:** re-ingestion needed to benefit existing docs → Inngest backfill. Cost: more LLM calls at ingestion → meter via existing `incrementWorkspaceUsage`.

**Test plan:** ingest a complex PDF + a spreadsheet; confirm table summaries are retrievable; confirm parser fallback fires and is recorded.

---

## Phase 6G — Usage + Rate-Limit Admin UI

**Goal:** Platform admins view and configure per-workspace limits from the UI, using existing metering tables.

**Pattern borrowed:** Onyx `admin/token-rate-limits/`.

**Database changes:**
```sql
create table public.workspace_limits (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  monthly_question_limit integer,
  daily_upload_limit integer,
  storage_byte_limit bigint,
  monthly_llm_token_limit bigint,
  updated_at timestamptz not null default now()
);
-- RLS: platform_admin read/write only.
```
Reuse existing `workspace_usage_daily` for current consumption. The rate limiter (`src/lib/rate-limit.ts`) reads these limits instead of env-only constants.

**API changes:** `platform/workspaces/[id]/limits` GET/PATCH (platform_admin only).

**UI changes:** a "Limits" panel on the platform workspace detail page (or the Usage page): show consumption vs limit (progress bars) + editable caps. Reuse the dropdown/dialog patterns from the workspaces redesign.

**Risks:** limits must fail safe — if no row exists, fall back to current env defaults (don't lock anyone out).

**Test plan:** set a low question limit, confirm enforcement + clear "limit reached" UX; confirm non-platform-admins can't read/write limits.

---

## Required Database Changes — Summary

| Phase | Migration | Tables/Columns | RLS |
|---|---|---|---|
| 6B | none | — | — |
| 6A | none | — | — |
| 6C | none (v1) | (optional later: chunk page/offset) | — |
| 6D | yes | `collections` table; `documents.collection_id`; Qdrant payload `collection_id` | workspace-scoped |
| 6E | none | — | — |
| 6F | maybe | extend `table_metadata` / intelligence cols | inherit |
| 6G | yes | `workspace_limits` table | platform_admin only |

All migrations land as files in `/sql/` and are applied via the normal flow. RLS enabled on every new table.

---

## Risks (cross-cutting)

1. **Re-indexing burden** (6D, 6F): new Qdrant payload fields and richer parsing only help existing docs after a backfill. Mitigate with Inngest backfill jobs + "treat missing as match-all" fallbacks.
2. **Bundle size** (6C): document renderers are heavy. Mitigate with dynamic imports so chat/upload bundles stay lean.
3. **PDF.js on Vercel** (6C): worker setup needs care; it's a known, documented configuration.
4. **Refresh loops** (6B): guard single-retry; never loop on an invalid refresh token.
5. **Scope creep** (6A): visual-only discipline; build check between screens.
6. **Cost** (6F): more ingestion-time LLM calls; meter through existing usage system.
7. **Workspace isolation** (6C, 6D): the new stream endpoint and collection filters are the two highest-risk spots for a tenant-isolation bug — explicit cross-tenant tests required.

---

## What NOT to Copy from Onyx / PipesHub

- **Backend architecture:** microservices, Vespa, Kafka, ArangoDB/Neo4j, Celery, etcd. Keep Supabase + Qdrant + Inngest.
- **50+ connector framework:** maintenance black hole. (Connectors are explicitly out of Phase 6.)
- **Knowledge graph retrieval:** needs a graph DB outside our stack.
- **Deep research / multi-agent orchestrator:** high complexity, not requested.
- **Web search:** conflicts with approved-documents-only positioning — excluded by constraint.
- **Electron desktop app:** no demand.
- **Their exact styling systems:** PipesHub uses Radix Themes (no Tailwind); Onyx has its own. We take *layout/UX ideas only* and implement in our Tailwind + shadcn + `DESIGN.md` system.

---

## Approval Gate

No Phase 6 code is written yet. Proposed order to implement, each as a separate approved step:
**6B → 6A → 6C → 6E → 6D → 6F → 6G.**

> ⚠️ Build-exclusion note: `.gitignore` now ignores the reference folders from git, but **`.gitignore` does not exclude them from `tsc`/`next build`**. To stop them breaking the build, `tsconfig.json` `exclude` must also list `onyx-main`, `pipeshub-ai-main`, etc. That one-line config change is recommended before building again — flagged for separate approval since this task was scoped to `.gitignore` + planning only.
