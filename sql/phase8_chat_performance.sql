-- Phase 8: chat request performance baseline and observability.
--
-- One row per /api/chat request. Timings are wall-clock milliseconds for the
-- authenticated request; token counts are provider-reported when available.
-- This table is server-only: API routes write it with the service role, and the
-- browser must never query it directly.

create table if not exists public.chat_request_metrics (
  id uuid primary key default gen_random_uuid(),
  request_id text not null unique,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  session_id uuid references public.chat_sessions(id) on delete set null,
  status text not null check (status in (
    'completed', 'no_answer', 'small_talk', 'no_documents', 'aborted', 'error'
  )),
  total_ms integer not null default 0,
  auth_ms integer,
  retrieval_ms integer,
  rerank_ms integer,
  generation_ms integer,
  first_token_ms integer,
  llm_input_tokens integer,
  llm_output_tokens integer,
  chunk_count integer not null default 0,
  citation_count integer not null default 0,
  no_answer boolean not null default false,
  error_code text,
  created_at timestamptz not null default now()
);

create index if not exists chat_request_metrics_created_idx
  on public.chat_request_metrics (created_at desc);

create index if not exists chat_request_metrics_workspace_created_idx
  on public.chat_request_metrics (workspace_id, created_at desc);

create index if not exists chat_request_metrics_status_created_idx
  on public.chat_request_metrics (status, created_at desc);

alter table public.chat_request_metrics enable row level security;

-- No client policy by design. Reads are done by platform diagnostics through
-- the service role; writes happen only inside /api/chat.
revoke all on public.chat_request_metrics from anon, authenticated;
grant all on public.chat_request_metrics to service_role;
