# SpringVox Knowledge AI

SpringVox Knowledge AI helps organisations upload approved documents so staff can ask questions and get answers from that information.

The product is designed to be easy for non-technical teams to understand. A company admin creates a workspace, uploads approved documents, invites staff, and gives the team a shared assistant that answers from the company’s own information and shows sources when available.

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
- Show sources for answers
- Track unanswered questions
- Review feedback
- View usage and question activity
- Manage users and roles
- Customise company workspace name and assistant message

## Role Model

### Platform Admin

- SpringVox owner
- manages the platform
- manually assigned
- not created through signup
- reserved for platform-level access

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
6. any later slug/security hardening SQL if added

Migration files:

- [workspace_mvp.sql](/home/water/Downloads/springvox-knowledge-ai/sql/workspace_mvp.sql)
- [advanced_mvp_features.sql](/home/water/Downloads/springvox-knowledge-ai/sql/advanced_mvp_features.sql)
- [tenant_branding_invites_analytics_feedback.sql](/home/water/Downloads/springvox-knowledge-ai/sql/tenant_branding_invites_analytics_feedback.sql)
- [role_model_platform_tenant.sql](/home/water/Downloads/springvox-knowledge-ai/sql/role_model_platform_tenant.sql)
- [organisation_onboarding.sql](/home/water/Downloads/springvox-knowledge-ai/sql/organisation_onboarding.sql)

## Manual Platform Admin Promotion

Promote the SpringVox owner manually:

```sql
update public.profiles
set role = 'platform_admin'
where email = 'MY_EMAIL_HERE';
```

`platform_admin` is not created through public signup.

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
QDRANT_COLLECTION=springvox_knowledge

GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
EMBEDDING_MODEL=gemini-embedding-001

RAG_TOP_K=3
RAG_SCORE_THRESHOLD=0.55

NEXT_PUBLIC_APP_URL=
```

Do not expose these to the frontend:

- `SUPABASE_SERVICE_ROLE_KEY`
- `QDRANT_API_KEY`
- `GEMINI_API_KEY`

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

## Permissions Summary

### Platform Admin

- can access everything tenant admins can access
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

### Viewer

- Ask Questions only
- own chat history
- sources for their workspace answers
- feedback submission

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
- no automated email sending yet
- invite links are manual
- PDF and TXT support only for now
- scanned PDFs and OCR are not yet supported
- background processing is not yet added
- voice, TTS, and STT are not yet added
- no full platform admin dashboard yet
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
- the app uses Gemini for chat and document search embeddings

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
