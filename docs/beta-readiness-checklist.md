# Rekall-IQ — Beta Readiness & State of the App

_Last reviewed: 2026-06-14. This is the canonical pre-launch status doc._

## Verdict
**Ready for controlled beta.** The core product (secure multi-tenant RAG), the operator console, metering/limits, evaluations, lifecycle emails, and reliability tooling are all built and build-verified. Remaining items are configuration/ops and post-beta roadmap, not missing core functionality.

---

## ✅ Done — core product
- [x] Multi-tenant workspaces with strict `workspace_id` isolation + RLS
- [x] Roles: `platform_admin` > `tenant_admin` (Workspace Admin) > `viewer`
- [x] Document ingestion (PDF/DOCX/PPTX/XLSX/CSV/TXT) via Inngest, LlamaParse fallback, document intelligence (summary/keywords/category)
- [x] Hybrid RAG: Qdrant vector + Postgres keyword → Voyage rerank → grounded Gemini answer with citations, confidence, follow-ups, answer modes
- [x] Collections + chat scoping; in-app file preview
- [x] Evaluations (golden questions) + knowledge-gap tracking
- [x] Usage metering with **real** provider token counts + per-workspace limits (questions/uploads/storage/LLM tokens)
- [x] Friendly small-talk replies (greetings no longer hit "I don't know")

## ✅ Done — operator console & ops
- [x] Platform console: companies, workspaces, users, usage, analytics, plans, audit logs
- [x] Diagnostics **health panel** (Resend / email sender / Inngest / app URL / stuck documents)
- [x] Workspace lifecycle: schedule (soft) → cancel → force (permanent) delete
- [x] **Permanent deletion erases PII** (Supabase auth users + profiles), purges data, hides tombstone from lists
- [x] Stuck-document guard (auto-fail processing > 10 min)
- [x] Platform notification create + **delete**; broadcasts date-scoped so new workspaces don't inherit old notices

## ✅ Done — email (Resend)
- [x] Transactional emails sent **inline** (off Inngest): welcome, trial-started, invitation, member-welcome, account suspend/reactivate, workspace suspend/reactivate, workspace-deleted
- [x] Scheduled trial reminders + broadcast fan-out on Inngest (correct async use)
- [x] Branded HTML templates; sender always shows "Rekall-IQ"
- [x] Supabase auth emails via Resend SMTP (confirm/reset/magic) — templates provided

## ✅ Done — UI / brand
- [x] Unified dark theme (token-driven), responsive
- [x] Rekall-IQ "R" monogram everywhere (nav, favicon, AI avatar)
- [x] One title per page (body H1 + breadcrumb top bar)
- [x] Accurate landing pricing aligned to real plan tiers; honest feature lists
- [x] In-app Help: User Guide + Admin Guide (with figures, knowledge-gaps + evaluations explained)

---

## ⚙️ Operational checklist (you / dashboards — do before inviting testers)
- [ ] **Inngest connected in prod** — keys in Vercel + app synced (Vercel↔Inngest integration recommended). Required for: document processing, workspace deletion, trial reminders, broadcast emails. Confirm via Diagnostics → Inngest chip.
- [ ] `NEXT_PUBLIC_APP_URL=https://rekalliq.springvoxsl.com` set in Vercel (invite/email links).
- [ ] `EMAIL_FROM=Rekall-IQ <no-reply@rekalliq.springvoxsl.com>` on verified Resend domain; Supabase SMTP sender name = "Rekall-IQ".
- [ ] Confirm `@springvoxsl.com` contact mailboxes (support/privacy/security/hello) are real.
- [ ] Run all SQL migrations in `/sql/`; confirm Qdrant collection dimensions match the embedding provider.
- [ ] Rotate credentials before public launch (Supabase service role, Gemini, Qdrant, Voyage, LlamaParse).
- [ ] Enable Supabase leaked-password protection.
- [ ] Legal review of policy pages (privacy/terms/acceptable-use/data-handling).

## 🧪 Live smoke test (on real data)
- [ ] Sign up → welcome + trial emails arrive (check Resend logs)
- [ ] Upload each file type → reaches "Ready"; ask questions → grounded answers with sources; "I don't know" on off-doc questions
- [ ] Collection scoping limits retrieval; file preview opens
- [ ] Invite a user → invite email → accept → member-welcome email
- [ ] Suspend/reactivate a user and a workspace → emails fire
- [ ] Force-delete a disposable workspace → `delete-workspace-data` runs → users gone from platform + Supabase

## 🗺️ Post-beta roadmap (not blockers)
- Source connectors (Google Drive first) with scheduled incremental sync
- SSO / SCIM; document-level permissions
- Billing (Stripe) + in-app plan selection/upgrade
- Retrieval upgrades: query transforms, conversational rewriting, structure-aware chunking
- Email verification gate for self-signup (Confirm-email + "verify your inbox" screen)
- Multi-LLM provider with automatic fallback
