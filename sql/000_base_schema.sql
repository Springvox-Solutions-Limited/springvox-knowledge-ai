-- 000_base_schema.sql
--
-- Baseline tables that the later migrations ALTER (never CREATE).
--
-- Before this file existed, `sql/workspace_mvp.sql` assumed `documents`,
-- `document_chunks`, and `chat_messages` were already present in the Supabase
-- project, so a fresh project could not be provisioned from this repo alone.
-- This migration restores that missing baseline and must run FIRST.
--
-- Scope discipline: this file defines only the columns that pre-date the
-- migration series. Every column added later is deliberately omitted so the
-- owning migration still executes its `ALTER TABLE ... ADD COLUMN` and, more
-- importantly, still attaches its foreign key. (`ADD COLUMN IF NOT EXISTS`
-- skips the whole clause when the column already exists, FK included.)
--
-- Column provenance:
--   * documents.file_type / file_path / total_chunks / user_id -> written by
--     app/api/documents/upload/route.ts and src/lib/inngest/functions.ts;
--     no migration creates them.
--   * document_chunks.chunk_text / chunk_index / qdrant_point_id / user_id ->
--     inserted by src/lib/inngest/functions.ts; only workspace_id (0001) and
--     table_metadata (0014) are added later.
--   * chat_messages.question / answer / citations -> written by
--     app/api/chat/route.ts; workspace_id (0001) and session_id (0007) are
--     added later.
--
-- Idempotent: safe to re-run on an existing project. `CREATE TABLE IF NOT
-- EXISTS` never rewrites a table that already exists, and the FKs on
-- user_id fail closed to SET NULL / CASCADE rather than blocking user removal.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- documents: one row per uploaded file
-- ---------------------------------------------------------------------------
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  -- Rekall-IQ workspaces own documents and organisational knowledge; individual users do not. Deleting a user must not delete workspace documents (SET NULL). Deleting a workspace deletes its documents through the workspace deletion lifecycle in phase5b_beta_hardening.sql, not through the user FK. Chat history is personal and cascades with the user (CASCADE). Audit integrity must be preserved independently of chat message records.
  user_id uuid references auth.users(id) on delete set null,
  filename text not null,
  file_path text,
  file_type text,
  total_chunks integer not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- document_chunks: extracted text units, one row per embedded Qdrant point
-- ---------------------------------------------------------------------------
create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  chunk_index integer not null,
  chunk_text text not null,
  qdrant_point_id uuid,
  created_at timestamptz not null default now()
);

-- Chunk lookups are always by parent document (delete, preview, reconcile).
create index if not exists document_chunks_document_id_idx
  on public.document_chunks (document_id);

-- ---------------------------------------------------------------------------
-- chat_messages: one row per question/answer exchange
-- ---------------------------------------------------------------------------
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  question text not null,
  answer text,
  citations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- Personal chat history is read newest-first per user/workspace.
create index if not exists chat_messages_user_created_idx
  on public.chat_messages (user_id, created_at desc);

notify pgrst, 'reload schema';
