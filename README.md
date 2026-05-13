# SpringVox Knowledge AI

SpringVox Knowledge AI is a private RAG workspace built with Next.js, Supabase, Qdrant, and Google Gemini. Admins and content managers upload shared documents into a workspace, and viewers ask questions from those shared documents.

If the answer is not clearly supported by retrieved document context, the app returns:

`I don't know based on the uploaded documents.`

## Current MVP Model

This MVP uses a simple shared workspace model.

Roles:

- `admin`
- `content_manager`
- `viewer`

Permissions:

- `admin`
  - upload documents
  - view documents
  - delete documents
  - access dashboard
  - ask questions
- `content_manager`
  - upload documents
  - view documents
  - delete documents
  - access dashboard
  - ask questions
- `viewer`
  - access chat only
  - ask questions from shared workspace documents
  - cannot access dashboard, documents, or upload pages
  - cannot upload or delete documents

## Architecture

- Next.js App Router UI and serverless API routes
- Supabase Auth for authentication
- Supabase Postgres for:
  - `workspaces`
  - `profiles`
  - `documents`
  - `document_chunks`
  - `chat_messages`
  - `knowledge_gaps`
  - `invitations`
  - `answer_feedback`
- Supabase Storage private bucket named `documents`
- Qdrant Cloud collection: `springvox_knowledge`
- Gemini `gemini-embedding-001` for embeddings
- Gemini `gemini-2.5-flash` for strict RAG answers

## Environment Variables

Use these values in `.env.local`:

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
```

Secrets that must remain server-side only:

- `SUPABASE_SERVICE_ROLE_KEY`
- `QDRANT_API_KEY`
- `GEMINI_API_KEY`

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example`.

3. Run the SQL migration from:

```text
sql/workspace_mvp.sql
```

Then run:

```text
sql/advanced_mvp_features.sql
```

Then run:

```text
sql/tenant_branding_invites_analytics_feedback.sql
```

4. Start the app:

```bash
npm run dev
```

5. Open:

```text
http://localhost:3000
```

## SQL Migration

The workspace/role migration is in:

- [sql/workspace_mvp.sql](/home/water/Downloads/springvox-knowledge-ai/sql/workspace_mvp.sql)
- [sql/advanced_mvp_features.sql](/home/water/Downloads/springvox-knowledge-ai/sql/advanced_mvp_features.sql)
- [sql/tenant_branding_invites_analytics_feedback.sql](/home/water/Downloads/springvox-knowledge-ai/sql/tenant_branding_invites_analytics_feedback.sql)

What it does:

- creates `workspaces`
- creates `profiles`
- adds `workspace_id` to:
  - `documents`
  - `document_chunks`
  - `chat_messages`
- creates a default workspace with slug `default`
- backfills existing users into `profiles`
- backfills existing records into the default workspace
- creates a trigger so every new auth user gets:
  - `role = 'viewer'`
  - `workspace_id = default workspace`
  - `email = auth.users.email`
- updates RLS policies for the workspace model

The advanced MVP migration:

- creates `knowledge_gaps`
- adds indexes for workspace lookup and repeated unanswered questions
- enables manager-only RLS for knowledge gaps
- keeps existing data intact

The tenant branding / invites / analytics / feedback migration:

- adds workspace branding fields such as:
  - `logo_url`
  - `primary_color`
  - `welcome_message`
  - `assistant_name`
  - `support_email`
  - `industry`
  - `website`
  - `updated_at`
- creates `invitations`
- creates `answer_feedback`
- keeps invite and feedback tables workspace-scoped with RLS
- keeps existing workspace data intact and backfills sensible defaults

Recommended migration order:

1. `sql/workspace_mvp.sql`
2. `sql/advanced_mvp_features.sql`
3. `sql/tenant_branding_invites_analytics_feedback.sql`

## Promote A User To Admin

Run this SQL after the migration:

```sql
update public.profiles
set role = 'admin'
where email = 'MY_EMAIL_HERE';
```

You can also assign a content manager:

```sql
update public.profiles
set role = 'content_manager'
where email = 'MANAGER_EMAIL_HERE';
```

## How Viewer Accounts Work

- Every new user gets a `profiles` row automatically.
- Default role is `viewer`.
- Viewers are assigned to the default workspace unless you move them to another one manually.
- Viewers can ask questions from workspace documents uploaded by admins/content managers.
- Viewers only see chat in the app shell.
- Viewers can see their own chat history in chat.
- Admins and content managers can review workspace-level question activity and knowledge gaps to improve the knowledge base.

## Workspace Branding

- Each workspace can store company branding and assistant messaging.
- Admins can update branding at `/dashboard/settings`.
- The dashboard sidebar, chat empty state, and assistant messaging can reflect:
  - workspace / company name
  - assistant name
  - welcome message
  - support email
  - website
  - industry
  - primary color
  - logo URL

## Admin User Management

- Admins can manage users at `/dashboard/users`.
- Admins can promote or demote users between:
  - `viewer`
  - `content_manager`
  - `admin`
- Only admins can use the user management APIs.
- Content managers cannot manage users.
- Viewers cannot access the users page.
- Self-demotion requires confirmation in the UI.

## Company Settings

- Admin-only page: `/dashboard/settings`
- Used for company / workspace settings, not model settings
- Admin can update:
  - workspace name
  - assistant name
  - welcome message
  - support email
  - website
  - industry
  - primary color
  - logo URL

## Invitations

- Admins can create invitations from `/dashboard/users`.
- No email provider is connected yet.
- SpringVox generates a manual invite link that the admin can copy and share.
- Invite links use:

```text
/invite/[token]
```

- Acceptance rules:
  - user must sign in with the invited email
  - invitation must still be `pending`
  - revoked / expired / accepted invites cannot be reused
  - accepting the invite assigns the user to the workspace and invited role
- Optional:
  - set `NEXT_PUBLIC_APP_URL` in production if you want generated invite links to point to your deployed domain

## Supabase Storage

Use a private bucket named:

```text
documents
```

Uploaded file path format remains:

```text
user_id/document_id/filename
```

This is still compatible with storage policies like:

```sql
(storage.foldername(name))[1] = auth.uid()::text
```

The bucket should remain private.

## Qdrant Configuration

Collection:

```text
springvox_knowledge
```

Vector settings:

- vector size: `3072`
- distance: `Cosine`

Required payload fields:

- `workspace_id`
- `document_id`
- `uploaded_by`
- `filename`
- `chunk_index`
- `chunk_text`
- `preview`

Recommended Qdrant payload indexes:

- `workspace_id` keyword
- `document_id` keyword

The app now filters search and delete by `workspace_id`, and document delete also filters by `document_id`.

Deployment checklist for Qdrant:

1. Collection name: `springvox_knowledge`
2. Vector size: `3072`
3. Distance: `Cosine`
4. Payload indexes:
   - `workspace_id` keyword
   - `document_id` keyword

## Chat Experience

- Chat now streams answers progressively in the UI.
- The frontend uses a small typing buffer so streamed answers reveal smoothly instead of dumping large chunks all at once.
- Safe status messages appear while SpringVox prepares the answer.
- The app does not expose private model reasoning or chain-of-thought.
- Sources remain attached after the answer completes.
- The final chat message is saved after answer generation completes successfully.
- Users can see their own recent chat history in the chat interface.

## Source Viewer

- Source cards open a right-side source drawer.
- Viewers see simple source labels and excerpts.
- Admins and content managers can see extra metadata such as:
  - `document_id`
  - `uploaded_by`
  - `chunk_index`
- Source lookup stays scoped to the authenticated user workspace.

## Knowledge Gaps

- When SpringVox returns:
  - `I don't know based on the uploaded documents.`
- the app records or updates a `knowledge_gaps` entry for that workspace.
- Questions are normalized and deduplicated by workspace.
- Repeated unsupported questions increase `occurrence_count`.
- Admins and content managers can review gaps at `/dashboard/knowledge-gaps`.
- Knowledge gaps help show what users are asking that the current document set does not answer yet.

## Analytics

- Admins and content managers can open `/dashboard/analytics`.
- Metrics are calculated from real workspace data only.
- Current analytics include:
  - total documents
  - completed documents
  - failed documents
  - total sections / chunks
  - total questions asked
  - questions asked in the last 7 days
  - open knowledge gaps
  - total users
  - viewers
  - content managers
  - admins
  - pending invitations
  - feedback totals
- Analytics also includes:
  - recent questions
  - recent knowledge gaps
  - recent negative feedback
  - daily question counts for the last 7 days

## Feedback Buttons

- Users can submit feedback on answers:
  - `helpful`
  - `not_helpful`
  - `wrong`
  - `outdated`
  - `needs_more_detail`
- Feedback is workspace-scoped and tied to the saved chat message.
- Admins and content managers can review feedback through analytics.

## Important Re-upload Note

Yes, existing documents should be re-uploaded after this workspace change.

Reason:

- older Qdrant points were stored with `user_id`
- the new search/delete path uses `workspace_id`
- old vectors do not have the new `workspace_id` payload

Simplest path:

1. delete old uploaded documents
2. clear or recreate the Qdrant collection if needed
3. re-upload documents as an `admin` or `content_manager`

## Secure Request Flow

- Browser authenticates with Supabase Auth.
- Frontend sends the Supabase access token to SpringVox API routes.
- API routes derive the authenticated user from the bearer token.
- API routes load the user profile server-side.
- Role checks happen server-side.
- Upload/delete are limited to `admin` and `content_manager`.
- Chat is allowed for `admin`, `content_manager`, and `viewer`.
- Qdrant search is filtered by `workspace_id`.

The frontend never sends a trusted `user_id`, `role`, or `workspace_id`.

## Local Verification

Run:

```bash
npx tsc --noEmit
npm run dev
```

Optional production verification:

```bash
npm run build
```

## GitHub And Vercel Deployment

Before pushing:

1. Confirm `.env`, `.env.local`, `.next`, and `node_modules` are not committed.
2. Confirm `.env.example` contains placeholders only.
3. Run:

```bash
npx tsc --noEmit
npm run build
```

Vercel deployment checklist:

1. Push the repository to GitHub.
2. Import the project into Vercel.
3. Add environment variables:
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
4. Optional:
   - `NEXT_PUBLIC_APP_URL` for production invite links
5. Run SQL migrations in order:
   - `sql/workspace_mvp.sql`
   - `sql/advanced_mvp_features.sql`
   - `sql/tenant_branding_invites_analytics_feedback.sql`
6. Create the private Supabase storage bucket:
   - `documents`
7. Confirm Qdrant collection settings:
   - `springvox_knowledge`
   - vector size `3072`
   - distance `Cosine`
   - payload indexes for `workspace_id` and `document_id`
8. Deploy.

## Manual Test Flow

1. Login as admin.
2. Confirm admin can see:
   - Dashboard
   - Documents
   - Upload
   - Chat
3. Upload a document as admin.
4. Ask a question as admin.
5. Register another user.
6. Leave that user as default `viewer`, or set:

```sql
update public.profiles
set role = 'viewer'
where email = 'VIEWER_EMAIL_HERE';
```

7. Login as viewer.
8. Confirm viewer only sees chat.
9. Confirm viewer cannot access:
   - `/dashboard`
   - `/dashboard/documents`
   - `/dashboard/upload`
10. Ask a question as viewer and confirm answers come from admin-uploaded workspace documents.
11. Confirm viewer cannot upload or delete documents.

## Advanced MVP Test Flow

1. Ask a question in chat and confirm the answer streams into the UI.
2. Confirm safe status messages appear while the answer is being prepared.
3. Confirm sources appear after the answer finishes.
4. Login as admin and open `/dashboard/users`.
5. Change a viewer to `content_manager` and confirm they can upload.
6. Change that user back to `viewer` and confirm they cannot upload.
7. Open `/dashboard/knowledge-gaps` as admin or content manager.
8. Ask an unsupported question in chat.
9. Confirm the fallback answer appears and the question shows up in knowledge gaps.
10. Ask the same unsupported question again and confirm `occurrence_count` increases.
11. Click a source card in chat and confirm the source drawer opens.

## Managed Tenant Pilot Test Flow

1. Login as admin.
2. Open `/dashboard/settings` and update workspace name, assistant name, and welcome message.
3. Confirm sidebar and viewer chat empty state reflect the new branding.
4. Open `/dashboard/users` and create a new invitation.
5. Copy the invite link and open `/invite/[token]`.
6. Sign in with the invited email and accept the invitation.
7. Confirm the invited user lands in the workspace with the invited role.
8. Open `/dashboard/analytics` as admin or content manager and confirm the metrics use real workspace data.
9. Ask a question in chat and submit answer feedback.
10. Confirm feedback appears in analytics summary.
11. Confirm viewer cannot access:
  - `/dashboard/settings`
  - `/dashboard/analytics`
  - `/dashboard/users`
  - `/dashboard/upload`
  - `/dashboard/documents`

## Notes

- Supported upload types are PDF and TXT only.
- Max upload size is 4MB.
- Viewers use the same shared workspace documents as managers.
- Verified source cards are separate from the answer body.
- No actual email sending is connected yet.
- Invite links are copied manually by admins.
- Billing is not included yet.
- Subdomain routing and custom domains are not included yet.
