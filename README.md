# SpringVox Knowledge AI

SpringVox Knowledge AI helps organisations upload approved documents so staff can ask questions and get answers from that information.

The product is designed to be easy for non-technical teams to understand. A company admin creates a workspace, uploads approved documents, invites staff, and gives the team a shared assistant that answers from the company’s own information and shows sources when available.

The product now uses one unified SpringVox enterprise design system across public, tenant, and platform areas. The visual language is business-friendly, non-technical, and consistent, while platform operations remain clearly separate from tenant workspace usage.
The frontend now uses `shadcn/ui` as the reusable UI primitive foundation, while SpringVox keeps its own branded layouts, spacing, and navy/teal/cyan enterprise styling.

If an answer is not clearly supported by uploaded documents, the app returns:

`I don't know based on the uploaded documents.`

## Product Overview

SpringVox Knowledge AI helps organisations turn approved documents into a simple question-and-answer assistant for their teams.

Typical flow:

1. Create a company workspace
2. Upload approved documents
3. Invite users
4. Let staff ask questions in plain English
5. Review unanswered questions and improve the document library over time

## Current Product Features

- Create a company workspace
- Upload approved documents
- Invite users
- Let staff ask questions
- Start a new chat and reopen recent private conversations
- Show sources for answers
- Track unanswered questions
- Review feedback
- View usage and question activity
- Manage users and roles
- Customise company workspace name and assistant message
- Platform Admin Console for platform-wide operations
- Manual demo plan assignment by workspace
- Workspace status controls for suspend, reactivate, trial, and inactive states

## Role Model

### Platform Admin

- SpringVox owner
- manages the platform
- manually assigned
- not created through signup
- reserved for platform-level access
- can access the Platform Console at `/platform`
- can view company and user metadata across the platform
- can suspend or reactivate workspaces
- can manually assign demo plans
- does not read tenant document contents by default
- does not view full private chat conversations by default

### Tenant Admin / Workspace Admin

- organisation admin
- created when a company workspace is created
- uploads documents
- invites users
- manages users
- views analytics, feedback, and unanswered questions
- updates company settings
- uses chat

### Viewer / Staff User

- asks questions only
- sees simple answers and sources
- can submit feedback
- sees only their own private chat history
- cannot upload or manage documents

Public signup must never create `platform_admin`.

## Current Clean-Slate Setup

- Supabase database is aligned to the current workspace-based SaaS structure
- Qdrant collection should be:
  - `springvox_knowledge`
  - vector size `3072`
  - distance `cosine`
- Recommended Qdrant payload indexes:
  - `workspace_id`
  - `document_id`
- A platform admin must exist manually

## SQL Migration Order

Run these in order:

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
12. any later slug/security hardening SQL if added

Migration files:

- [workspace_mvp.sql](/home/water/Downloads/springvox-knowledge-ai/sql/workspace_mvp.sql)
- [advanced_mvp_features.sql](/home/water/Downloads/springvox-knowledge-ai/sql/advanced_mvp_features.sql)
- [tenant_branding_invites_analytics_feedback.sql](/home/water/Downloads/springvox-knowledge-ai/sql/tenant_branding_invites_analytics_feedback.sql)
- [role_model_platform_tenant.sql](/home/water/Downloads/springvox-knowledge-ai/sql/role_model_platform_tenant.sql)
- [organisation_onboarding.sql](/home/water/Downloads/springvox-knowledge-ai/sql/organisation_onboarding.sql)
- [platform_admin_console.sql](/home/water/Downloads/springvox-knowledge-ai/sql/platform_admin_console.sql)
- [chat_sessions.sql](/home/water/Downloads/springvox-knowledge-ai/sql/chat_sessions.sql)
- [inngest_document_status.sql](/home/water/Downloads/springvox-knowledge-ai/sql/inngest_document_status.sql)
- [document_parser_metadata.sql](/home/water/Downloads/springvox-knowledge-ai/sql/document_parser_metadata.sql)
- [phase4_trial_user_status.sql](/home/water/Downloads/springvox-knowledge-ai/sql/phase4_trial_user_status.sql)
- [phase4g_platform_notifications.sql](/home/water/Downloads/springvox-knowledge-ai/sql/phase4g_platform_notifications.sql)

## Manual Platform Admin Promotion

Promote the SpringVox owner manually:

```sql
update public.profiles
set role = 'platform_admin'
where email = 'MY_EMAIL_HERE';
```

`platform_admin` is not created through public signup.

## Platform Admin Console

Platform Admin Console is for platform operations, not normal tenant usage.

Routes:

- `/platform`
- `/platform/companies`
- `/platform/companies/[id]`
- `/platform/workspaces`
- `/platform/users`
- `/platform/audit-logs`
- `/platform/notifications`
- `/platform/analytics`
- `/platform/plans`

Platform admin capabilities:

- view all companies and workspaces
- view platform-wide analytics and company usage summaries
- review user lists per workspace
- suspend, reactivate, expire, extend trial, mark past due, or convert a workspace to paid/active
- suspend, activate, or disable users
- manually assign or change demo plans
- add platform-only internal notes
- review document metadata only
- review audit logs for platform actions
- send in-app or email notifications to one workspace or all workspaces

All workspace, billing, user status, and notification actions run server-side, require `platform_admin`, and write audit log entries. Platform APIs may use the Supabase service role on the server only; service-role keys must never be exposed to the browser.

Platform notifications are stored in `platform_notifications`. In-app notifications appear in tenant dashboards for the target workspace, or globally when `workspace_id` is null. Email delivery uses the existing email abstraction and Inngest. If `RESEND_API_KEY` is missing, notification creation still succeeds and email delivery is marked as skipped or left queued without crashing the app.

Platform admin privacy constraints:

- does not view uploaded document text or chunk contents through the platform console
- does not view full private chat answers or conversations through the platform console
- does not view private user chat session history
- does not upload documents for tenants in this phase
- does not use payment processing or billing checkout in this phase
- does not add subdomains or custom domains in this phase

## Chat History

- each user now has private workspace-scoped chat sessions
- `/dashboard/chat` supports `New Chat` and `Recent Chats`
- chat history is visible only to the authenticated user who created it
- platform admin does not see private tenant chat conversations through the platform console

## Document Parsing

SpringVox supports local document parsing for these upload formats:

- PDF
- TXT
- DOCX
- CSV
- XLSX
- PPTX

Document ingestion remains asynchronous through Inngest:

1. upload stores the file in the private Supabase Storage `documents` bucket
2. upload creates a `documents` row with `processing` status
3. upload sends the `document/process.started` Inngest event
4. Inngest downloads the file
5. the parser router selects a parser by extension and MIME type
6. extracted text is chunked, embedded through the configured embedding provider, and indexed in Qdrant
7. the document status becomes `ready`, or `failed` with an `error_message`

Workspace admins can upload multiple documents at once from `/dashboard/upload`.
Bulk upload uses the same single-file upload API for each file, with safe client-side
concurrency instead of sending every file at once. Each file is tracked independently
through waiting, uploading, processing, completed, or failed states. If one file fails,
the rest of the queue continues and the failed file can be retried without restarting
the whole batch.

Parser router files live under `src/lib/document-parsers/`.

## AI Providers

SpringVox uses a small provider abstraction under `src/lib/ai/`.

- Chat generation uses Gemini by default through `SPRINGVOX_CHAT_PROVIDER=gemini`.
- Document and query embeddings use Voyage AI by default through `SPRINGVOX_EMBEDDING_PROVIDER=voyage`.
- Gemini embedding support remains available by setting `SPRINGVOX_EMBEDDING_PROVIDER=gemini`, but changing embedding providers requires a fresh Qdrant collection or full document reindex.

Voyage embeddings are batched for ingestion stability:

- default batch size: 20 text chunks per request
- maximum concurrent embedding requests: 2
- delay between batches: 500ms
- retry handling for HTTP 429 and temporary network failures
- ingestion logs include provider, total chunks, total batches, retry count, and batch size

Qdrant is still required because it stores and searches document chunk vectors with workspace metadata. This is what allows SpringVox to retrieve relevant company document sections while preserving workspace filtering and source citations.

Embedding provider warning: Voyage and Gemini use different vector dimensions. Qdrant collections cannot safely mix dimensions. If you change `SPRINGVOX_EMBEDDING_PROVIDER`, `SPRINGVOX_EMBEDDING_DIMENSIONS`, or embedding models with different dimensions, create a new Qdrant collection or delete and reindex existing documents.

Current local parser strategy:

- PDF uses the existing `pdf-parse` parser
- TXT is decoded as UTF-8
- DOCX uses `mammoth`
- CSV uses `papaparse`
- XLSX uses `xlsx`
- PPTX uses `officeparser`

Optional advanced parsing is available through LlamaParse and is disabled by default. Local parsers remain the normal path for PDF, TXT, DOCX, CSV, XLSX, and PPTX.

LlamaParse is intended for:

- scanned or image-heavy PDFs
- complex tables and forms
- difficult layouts where local extraction is weak
- complex DOCX, XLSX, and PPTX files

Environment variables:

```env
LLAMAPARSE_API_KEY=
LLAMAPARSE_ENABLED=false
LLAMAPARSE_MODE=fallback
```

Supported modes:

- `off`: never use LlamaParse.
- `fallback`: use the local parser first, then send supported files to LlamaParse only when local text is empty or weak.
- `force`: try LlamaParse first for supported files, then fall back to the local parser if LlamaParse fails.

LlamaParse is only considered for PDF, DOCX, XLSX, and PPTX. TXT and CSV stay local in normal operation.

Privacy note: LlamaParse is an external document processor. When enabled, uploaded documents may be sent to LlamaParse for text extraction. Keep it disabled unless the customer has approved external processing. TODO before production enablement: update privacy and data handling notices for customers that use LlamaParse.

Future advanced parsers still planned:

- OCR for scanned PDFs and image-heavy documents
- Google Drive and SharePoint file import parsers

## Workspace Signup And Invites

Public onboarding supports two paths:

1. Create a company workspace
2. Join with invitation

### Create A Company Workspace

The form collects:

- company name
- workspace slug
- full name
- work email
- password
- optional industry
- optional website

After creation:

- the first user becomes `tenant_admin`
- workspace branding defaults are created
- the user is redirected to the dashboard

Workspace defaults:

- `name = company name`
- `slug = validated unique slug`
- `assistant_name = "{Company Name} AI Assistant"`
- `welcome_message = "Ask questions from {Company Name}'s approved documents."`
- `industry = provided industry if available`
- `website = provided website if available`

### Join With Invitation

- the invited user joins the invitation workspace
- the invite role comes from the invitation
- the default invite role is `viewer`
- the invited email must match the authenticated email
- public signup should never silently place invited users into a default or unrelated workspace

## Workspace Slugs

Workspace slugs must be:

- lowercase only
- letters, numbers, and hyphens only
- between 3 and 48 characters

Reserved platform words are blocked, including:

- `admin`
- `api`
- `auth`
- `dashboard`
- `login`
- `platform`
- `register`
- `springvox`
- `www`

## Environment Variables

Use placeholders only:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

QDRANT_URL=
QDRANT_API_KEY=
QDRANT_COLLECTION=springvox_knowledge_voyage

SUPABASE_STORAGE_BUCKET=documents
MAX_UPLOAD_MB=20
NEXT_PUBLIC_MAX_UPLOAD_MB=20

SPRINGVOX_CHAT_PROVIDER=gemini
SPRINGVOX_EMBEDDING_PROVIDER=voyage
SPRINGVOX_EMBEDDING_DIMENSIONS=1024

GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.0-flash
EMBEDDING_MODEL=gemini-embedding-001

VOYAGE_API_KEY=
VOYAGE_EMBEDDING_MODEL=voyage-4-lite

EMAIL_PROVIDER=resend
RESEND_API_KEY=
EMAIL_FROM="SpringVox <no-reply@yourdomain.com>"

RAG_DEBUG=false
RAG_MAX_CONTEXT_CHARACTERS=4500

NEXT_PUBLIC_APP_URL=
```

`MAX_UPLOAD_MB` controls the server-side document upload limit per file. It defaults to `20` when omitted. `NEXT_PUBLIC_MAX_UPLOAD_MB` mirrors the same value in the upload UI copy and client-side dropzone validation. Bulk upload applies this limit to each selected file individually. Larger values can help with image-heavy PDFs and advanced parsing, but they also increase parsing time, embedding work, Supabase Storage usage, and possible LlamaParse costs when advanced parsing is enabled.

### RAG retrieval settings

SpringVox uses deterministic retrieval intelligence before calling Gemini:

- Query intent is classified locally as factual lookup, summarization, comparison, troubleshooting, analytics, recommendation, cross-document reasoning, or unclear.
- Retrieval settings adapt by intent, including top K, score threshold, final chunk count, and context size.
- Retrieved excerpts are grouped by document before being sent to Gemini so unrelated documents are not silently merged.
- Final context is compressed to `RAG_MAX_CONTEXT_CHARACTERS` characters by default to reduce latency and prompt size.
- Follow-up suggestions are generated deterministically from the retrieved documents and answer intent, without an extra LLM call.

`RAG_DEBUG=false` keeps detailed retrieval logs off by default. Set `RAG_DEBUG=true` locally when debugging retrieval. Detailed logs can include user questions and document metadata, so do not leave verbose debug logging enabled in production unless your logging policy allows it.

### Trials and lifecycle email

New workspaces start on a 14-day trial. Workspace access is blocked after the trial expires unless the workspace is activated by a platform admin.

Trial lifecycle emails use the email provider abstraction in `src/lib/email/`:

- `EMAIL_PROVIDER=resend`
- `RESEND_API_KEY`
- `EMAIL_FROM`

Email jobs are queued through Inngest after workspace creation. Missing `RESEND_API_KEY` does not block workspace creation; the email sender logs a warning and skips delivery.

Platform notification emails use the same provider settings. Workspace-specific notifications are sent to active workspace admins. Global notifications are sent to active admins across workspaces. Scheduled platform notifications are checked by Inngest and dispatched when due.

Do not expose these to the frontend:

- `SUPABASE_SERVICE_ROLE_KEY`
- `QDRANT_API_KEY`
- `GEMINI_API_KEY`
- `VOYAGE_API_KEY`
- `RESEND_API_KEY`

Do not use `NEXT_PUBLIC_GEMINI_API_KEY`.

## Local Development

```bash
npm install
npm run dev
npx tsc --noEmit
npm run build
```

## Deployment Checklist

- push to GitHub
- set Vercel environment variables
- run Supabase migrations
- create the Supabase bucket `documents`
- create the Qdrant collection `springvox_knowledge`
- create Qdrant payload indexes for `workspace_id` and `document_id`
- rotate exposed keys before production
- test the signup, upload, chat, and invite flow
- test the platform console and workspace suspension flow

## Permissions Summary

### Platform Admin

- Platform Console
- metadata-only company management
- workspace status and plan controls
- user role management for tenant_admin and viewer
- is reserved for the SpringVox owner
- is assigned manually only

### Tenant Admin

- Overview
- Documents
- Upload Documents
- Ask Questions
- Analytics
- Users
- Company Settings
- Unanswered Questions
- own workspace only
- blocked when workspace status is `suspended` or `inactive`

### Viewer

- Ask Questions only
- own chat history
- sources for their workspace answers
- feedback submission
- own workspace only
- blocked when workspace status is `suspended` or `inactive`

## Demo Plans

Plans are manual and informational only in this phase:

- `pilot`
- `starter`
- `business`
- `enterprise`

Current plan system notes:

- no Stripe
- no Paystack
- no Flutterwave
- no checkout
- no invoices
- no payment enforcement yet
- no hard plan limits enforced yet

Suggested plan guidance shown in the UI:

- `pilot`: 20 documents, 25 users, 1,000 monthly questions
- `starter`: 50 documents, 50 users, 3,000 monthly questions
- `business`: 200 documents, 250 users, 15,000 monthly questions
- `enterprise`: custom

## Workspace Status

Workspace statuses:

- `active`
- `trial`
- `suspended`
- `inactive`

Behavior:

- `active` and `trial` work normally
- `suspended` blocks tenant uploads, chat, invites, settings updates, and document management
- `inactive` blocks tenant usage in the same way
- suspension is reversible and does not delete tenant data

## Analytics

Analytics are real and workspace-scoped. No fake metrics are created.

Current analytics include:

- total questions
- recent questions
- questions by day for the last 7 days
- answers with sources
- questions with no answer
- recent unanswered questions
- feedback totals

If there is no data, the UI should show `0` or an empty state.

## Current Limitations

- no billing yet
- no subdomains yet
- no custom domains yet
- invite links are manual
- scanned PDFs and OCR are not yet supported
- complex PPTX layouts may need future parser upgrades for higher fidelity
- `platform_admin` is still assigned manually

## Technical Architecture

This section is intentionally later in the README so the product can be understood first in plain language.

### Frontend

- Next.js

### Auth / Database / Storage

- Supabase

### Search Index

- Qdrant
- collection: `springvox_knowledge`

### AI

- Gemini

### Deployment

- Vercel

## Technical Notes

- documents are stored in Supabase Storage
- document search uses Qdrant with workspace filtering
- answers stream from the server
- chat remains workspace-scoped
- the app uses Gemini for chat generation
- the app uses Voyage AI by default for batched document and query embeddings

## Verification

Run:

```bash
npx tsc --noEmit
npm run build
```

If `npm run build` fails only because of the known local Turbopack sandbox issue around creating a process or binding to a port, treat that as an environment limitation rather than an application logic failure.

## Manual Testing Checklist

1. Confirm the landing page is understandable to non-technical users.
2. Confirm the create company workspace CTA is clear.
3. Confirm the SpringVox owner account is `platform_admin`.
4. Confirm public signup cannot create `platform_admin`.
5. Create a company workspace.
6. Confirm the first user becomes `tenant_admin`.
7. Confirm tenant admins can upload documents, invite users, manage users, review analytics, update settings, review unanswered questions, and use chat.
8. Invite a viewer.
9. Confirm viewers only see `Ask Questions`.
10. Confirm viewer chat shows no technical terms.
11. Confirm the upload page is clear to non-technical admins.
12. Confirm analytics labels are easy to understand.
13. Confirm the source drawer uses section/source language instead of chunk language.
14. Confirm viewers cannot access admin routes directly.
15. Confirm analytics remain workspace-scoped.

## Recent Changes

### Blog Page (May 2026)
- Added `/blog` — blog listing page with responsive grid (3col → 2col → 1col)
- Added `/blog/[slug]` — individual blog post page with prose-styled content
- 5 initial posts covering RAG, AI search, workspace security, onboarding, and Voyage embeddings
- `src/lib/blog.ts` — blog data layer with types and getter functions
- `src/components/blog/BlogCard.tsx` — reusable card component
- Blog link added to `LandingNavbar`, `PremiumNavbar`, and `LandingFooter`

### Landing Page Improvements
- **Hero**: Title "Your Company Knowledge. AI-Powered Answers.", benefit-focused subheading, pain points with metrics (3+ hrs/week, 30% slower, compliance risk), trust badge "Trusted by 200+ enterprise teams"
- **Features**: Smart Document Parsing, Never Wait, Complete Privacy — described as benefits
- **Pricing**: Shows amounts ($0/month, $299/month, Custom) with supporting CTA text
- **StatsSection**: 250+ Customers, 5M+ Questions, 98% Uptime, 4.8/5 Rating — responsive 2col/4col grid
- **FAQSection**: 5 accordion Q&As with smooth open/close animation
- **Testimonials**: 35% faster response time, 100% source transparency, 5000+ questions answered
- **Pricing comparison table**: 6 features × 3 tiers (Free, Business, Enterprise)
- **Mobile responsiveness**: Hamburger menu <768px, CTAs stack vertically, all grids collapse properly, no horizontal scroll
- **Section anchor IDs**: Added `#how-it-works`, `#features`, `#use-cases` for cross-page navigation

### Navigation Fixes
- LandingNavbar hash links updated with `/` prefix (e.g. `/#features`) so they work from blog and legal pages
- LandingFooter hash links updated with `/` prefix
- PremiumNavbar "Workflow" link now scrolls to correct section

### SEO
- Enhanced meta description
- OpenGraph tags with title, description, URL
- Schema.org JSON-LD (SoftwareApplication with Free/Business pricing)
- Per-page metadata for blog and legal pages

### Code Quality
- Removed unused `AudioLines` import
- All TypeScript checks pass (`npx tsc --noEmit`)
