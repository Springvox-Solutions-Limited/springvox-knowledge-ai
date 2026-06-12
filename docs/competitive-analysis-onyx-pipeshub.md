# Competitive Analysis: Onyx & PipesHub vs SpringVox Knowledge AI

**Date:** 2026-06-01
**Purpose:** Identify features, patterns, and code from two mature open-source enterprise RAG platforms that could make SpringVox more enterprise-grade.

---

## 1. What Each Product Is

| | **SpringVox** (yours) | **Onyx** (onyx-dot-app) | **PipesHub** |
|---|---|---|---|
| Positioning | Multi-tenant RAG SaaS — upload docs, ask questions | Open-source enterprise search + AI platform (self-host) | Open-source workplace AI execution layer (self-host) |
| Stack | Next.js 16, Supabase, Qdrant, Gemini/Voyage, Inngest | Python/FastAPI, Next.js 15, Vespa, Celery, Postgres/Redis | 4 Python FastAPI microservices + Node Express + Next.js, Qdrant + ArangoDB/Neo4j, Kafka, Redis |
| Maturity | Beta, pre-launch | Production, large community | Production, growing |
| License | Proprietary | MIT (core) + EE | Apache 2.0 |

**Key insight:** PipesHub's frontend is **Next.js + TypeScript** — the same family as SpringVox — so its frontend patterns are the most directly portable. Onyx's value is mostly in its *product feature ideas* and *chat UX*, not portable code (its backend is a different stack).

---

## 2. Feature Gap Matrix

Legend: ✅ has it · ⚠️ partial · ❌ missing

| Feature | SpringVox | Onyx | PipesHub | Portability to SpringVox |
|---|:---:|:---:|:---:|---|
| **Chat / RAG core** | ✅ | ✅ | ✅ | — |
| SSE streaming chat | ✅ | ✅ | ✅ | — |
| Source citations | ⚠️ text excerpt only | ✅ inline + doc | ✅ block-level + preview | **HIGH** |
| In-app file preview (PDF/DOCX/XLSX) | ❌ | ✅ | ✅ 10 renderers | **HIGH** — direct port |
| PDF citation highlighting (bounding box) | ❌ | ✅ | ✅ | MEDIUM |
| Regenerate / edit message | ❌ | ✅ | ✅ | **HIGH** |
| Multi-conversation streaming | ❌ | ✅ | ✅ | MEDIUM |
| Answer modes (summary/detailed/etc.) | ✅ | ⚠️ | ⚠️ | — (you're ahead) |
| Model selection per chat | ❌ | ✅ | ✅ | MEDIUM |
| **Knowledge ingestion** | | | | |
| Manual file upload | ✅ | ✅ | ✅ | — |
| Data-source connectors | ❌ | ✅ 50+ | ✅ 30+ | LOW (large effort) |
| Knowledge graph retrieval | ❌ | ❌ | ✅ | LOW (needs graph DB) |
| Folders / collections org | ❌ | ✅ | ✅ | **HIGH** |
| "All Records" unified view | ❌ | ✅ | ✅ | MEDIUM |
| **Agents** | | | | |
| Custom AI agents / personas | ❌ | ✅ | ✅ no-code builder | MEDIUM |
| Agent actions / tools (MCP) | ❌ | ✅ | ✅ | LOW |
| Deep research (multi-step) | ❌ | ✅ | ✅ | LOW |
| Web search | ❌ | ✅ | ✅ | MEDIUM |
| **Enterprise / auth** | | | | |
| Roles | ✅ 3 roles | ✅ RBAC | ✅ RBAC + groups | — |
| SSO (Google/OIDC/SAML) | ❌ | ✅ | ✅ | MEDIUM (Supabase supports) |
| SCIM user provisioning | ❌ | ✅ | ❌ | LOW |
| Groups / teams | ❌ | ✅ | ✅ | MEDIUM |
| Token rate-limit admin UI | ⚠️ backend only | ✅ | ✅ | **HIGH** |
| Query/audit history viewer | ⚠️ diagnostics | ✅ | ✅ | MEDIUM |
| Whitelabeling | ⚠️ basic branding | ✅ | ✅ | — (you have some) |
| **Platform / DX** | | | | |
| i18n (multi-language) | ❌ | ✅ | ✅ 4 langs | MEDIUM |
| Axios interceptor + token refresh | ❌ manual Bearer | ✅ | ✅ | **HIGH** |
| WebSocket notifications | ❌ poll only | ✅ | ✅ | MEDIUM |
| Public API + SDKs | ❌ | ✅ | ✅ Py/TS/Go | LOW |
| Desktop app (Electron) | ❌ | ✅ | ✅ | LOW |

---

## 3. High-Value, Portable Wins (ranked)

These respect SpringVox's fixed stack (Next.js + Supabase + Qdrant + Gemini/Voyage + Inngest) and deliver the biggest enterprise-feel jump.

### TIER 1 — Do these first (high impact, direct port from PipesHub)

#### 1. In-app file preview with specialized renderers
**Today:** SpringVox's `SourceDrawer` shows a plain text excerpt only. Clicking a citation never shows the actual document.
**Reference:** `pipeshub-ai-main/frontend/app/components/file-preview/renderers/` — 10 renderers (PDF, DOCX, XLSX, image, markdown, code, text, HTML, media, fallback).
**Port plan:**
- Add a `getRecordStream` style endpoint that returns the stored Supabase file as a blob (auth-checked, workspace-scoped).
- Build a `FilePreviewRenderer` that routes by MIME type. Reuse their library choices: `react-pdf-highlighter` (PDF + citation highlight), `docx-preview` (DOCX), `xlsx`/SheetJS (you already migrated to exceljs — adapt), `react-markdown`, `react-syntax-highlighter`.
- Blob-URL pattern with `URL.revokeObjectURL` cleanup (documented in their `file-preview.md`).
**Why:** This single feature is the difference between "demo" and "enterprise." Citations become *verifiable* — click → see the exact page.

#### 2. Centralized API client with token refresh
**Today:** Every fetch in SpringVox manually attaches `Authorization: Bearer <token>`; no refresh, no retry queue.
**Reference:** PipesHub `lib/api/axios-instance.ts` — request interceptor auto-attaches token; response interceptor handles 401 → refresh → replays queued requests → redirects to /login on failure.
**Port plan:** Create `src/lib/api-client.ts` wrapping fetch/axios with a Supabase-session interceptor. Replace the ~30 manual `getAccessToken()` + header blocks across pages.
**Why:** Removes repetitive boilerplate, fixes silent session-expiry failures, and is a prerequisite for everything else.

#### 3. Document folders / collections
**Today:** Documents are a flat list per workspace.
**Reference:** PipesHub knowledge-base "Collections" (`app/(main)/knowledge-base/`) — folder tree + WORKSPACE/SHARED/PRIVATE sections, query-param navigation (`?nodeType=kb&nodeId=xxx`).
**Port plan:** Add a `collections` table (workspace-scoped), nullable `collection_id` on `documents`, a folder-tree sidebar on the Documents page. Keep it simpler than theirs — no sharing in v1.
**Why:** Enterprises with 100s of docs need organization. Flat lists don't scale.

#### 4. Regenerate / edit-and-resend message
**Reference:** PipesHub `docs/features/chats/message-actions-flow.md` — a clean command-bus pattern; regenerate clears the answer and re-streams the same slot.
**Port plan:** Add ↻ Regenerate and ✏ Edit to your existing message toolbar. Regenerate re-POSTs the same question to `/api/chat`; edit pre-fills the input. You already have the streaming plumbing.
**Why:** Table-stakes chat UX users now expect from any AI product.

#### 5. Token rate-limit + usage admin UI
**Today:** You meter usage in the backend (`workspace_usage_daily`) and rate-limit, but platform admins can't configure limits from the UI.
**Reference:** Onyx `web/src/app/admin/token-rate-limits/`.
**Port plan:** Add a platform page to view/set per-workspace question & token caps, backed by your existing metering tables.
**Why:** You already have the data; this exposes it as a real ops control.

### TIER 2 — Strong enterprise signals (medium effort)

#### 6. SSO (Google / OIDC / SAML)
Supabase Auth natively supports OAuth and SAML SSO. Onyx's `auth/` routes (`oauth`, `oidc`, `saml`, `join`, `forgot-password`, `reset-password`) are a good UX reference. **Add at minimum "Sign in with Google" + a forgot-password flow** (you flagged the missing forgot-password in the earlier UI audit).

#### 7. Groups / teams within a workspace
Both products have sub-workspace groups for scoping document access. SpringVox has only workspace-level isolation. A `groups` table + group-scoped document visibility would unlock larger orgs.

#### 8. WebSocket / realtime notifications
SpringVox polls. Supabase Realtime can push notification + document-status updates (replacing the 3s polling on the documents page you flagged earlier). Reference: PipesHub `notifications/websocket-manager.ts`.

#### 9. Custom agents / personas
A lightweight version: let a workspace admin define named "assistants" with a custom system prompt, document-collection scope, and answer mode. Reference: Onyx `admin/agents/` + `app/app/agents/`. You already have `assistant_name` — this extends it into multiple configurable agents.

#### 10. i18n
PipesHub uses i18next with 4 languages. If SpringVox targets non-English enterprises (the demo data shows MTN Nigeria, etc.), wiring `next-intl` early is far cheaper than retrofitting.

### TIER 3 — Bigger bets (only if roadmap calls for it)

- **Connectors** (Google Drive, SharePoint, Slack, Confluence…). Both have factory patterns (`ConnectorFactory`). This is a large, ongoing effort — Onyx has 50+, each is real maintenance. Consider 2-3 high-demand ones via Inngest scheduled syncs rather than a framework.
- **Knowledge graph retrieval** (PipesHub) — needs a graph DB (Neo4j/ArangoDB), which is outside your stack contract. Skip unless retrieval quality plateaus.
- **Deep research** (multi-step agent) — Onyx and PipesHub both have orchestrator/critic/reflection graphs (`modules/agents/deep/`). High complexity; only worth it if customers ask for long-form reports.
- **Web search** — Serper/Brave/SearXNG integration. Contradicts your "answers only from approved documents" positioning — probably intentionally out of scope.

---

## 4. Concrete Patterns Worth Stealing (code-level)

| Pattern | Source | Apply to |
|---|---|---|
| Blob-URL file streaming + cleanup | PipesHub `file-preview.md` | New SpringVox source preview |
| MIME-routed renderer switch | PipesHub `file-preview-renderer.tsx` | Same |
| Axios request/response interceptor with refresh-queue | PipesHub `lib/api/axios-instance.ts` | `src/lib/api-client.ts` |
| Page-level co-location (`api.ts`/`store.ts`/`types.ts`/`components/`) | PipesHub CLAUDE.md | Refactor large pages (chat, platform) |
| Command-bus for cross-tree chat actions | PipesHub `message-actions-flow.md` | Regenerate/edit in chat |
| `OnyxError` + central error-code enum + global handler | Onyx CLAUDE.md error handling | SpringVox API routes (replace raw `Response.json({error})`) |
| Query-param navigation over dynamic routes | PipesHub CLAUDE.md | Documents/collections filtering |
| Thinking/timeline message blocks | Onyx `message/thinkingBox`, `message/timeline` | Chat answer "verifying sources" UX |

---

## 5. What NOT to Copy

- **Their backend architecture.** Microservices, Vespa, Kafka, ArangoDB, Celery are massive operational overhead. SpringVox's Supabase + Qdrant + Inngest stack is the right call for your scale — keep it.
- **50+ connectors as a framework.** Maintenance black hole. Add specific connectors on demand.
- **Electron desktop app.** No evidence of demand.
- **Web search.** Conflicts with your "approved-documents-only" trust positioning.

---

## 6. Recommended Sequence

1. **API client + token refresh** (unblocks everything, low risk)
2. **File preview with citation rendering** (biggest enterprise-feel jump)
3. **Regenerate/edit message** (cheap, high user value)
4. **Document collections/folders** (scales the core use case)
5. **SSO (Google) + forgot-password** (enterprise checkbox + fixes known gap)
6. **Token-limit admin UI** (you already have the data)
7. Then evaluate Tier 2/3 against actual customer demand.

---

*Analysis based on reading both codebases' READMEs, CLAUDE.md/AGENTS.md, frontend route maps, connector lists, RAG/agent module structure, and feature docs. No code from either project has been copied into SpringVox; this is a planning document.*
