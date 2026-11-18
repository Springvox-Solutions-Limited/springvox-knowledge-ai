create extension if not exists pgcrypto;

create table if not exists public.rate_limits (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  scope text not null,
  count integer not null default 1,
  window_start timestamptz not null default now(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique(key, scope, window_start)
);

create index if not exists rate_limits_expires_idx on public.rate_limits (expires_at);

create table if not exists public.workspace_usage_daily (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  usage_date date not null,
  questions_count integer not null default 0,
  uploads_count integer not null default 0,
  documents_count integer not null default 0,
  storage_bytes bigint not null default 0,
  embedding_calls integer not null default 0,
  embedding_tokens integer not null default 0,
  rerank_calls integer not null default 0,
  llm_calls integer not null default 0,
  llm_input_tokens integer not null default 0,
  llm_output_tokens integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id, usage_date)
);

create index if not exists workspace_usage_daily_workspace_date_idx
  on public.workspace_usage_daily (workspace_id, usage_date desc);

create table if not exists public.system_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  severity text not null default 'info' check (severity in ('info','warning','error','critical')),
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists system_events_created_idx on public.system_events (created_at desc);
create index if not exists system_events_workspace_created_idx on public.system_events (workspace_id, created_at desc);
create index if not exists system_events_severity_idx on public.system_events (severity);

create table if not exists public.rag_eval_sets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  name text not null,
  description text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.rag_eval_questions (
  id uuid primary key default gen_random_uuid(),
  eval_set_id uuid references public.rag_eval_sets(id) on delete cascade,
  question text not null,
  expected_answer_notes text,
  expected_document_names text[] not null default '{}',
  expected_keywords text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.rag_eval_runs (
  id uuid primary key default gen_random_uuid(),
  eval_set_id uuid references public.rag_eval_sets(id) on delete cascade,
  run_by uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','running','completed','failed')),
  total_questions integer not null default 0,
  passed_questions integer not null default 0,
  average_confidence numeric,
  average_latency_ms integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.rag_eval_results (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.rag_eval_runs(id) on delete cascade,
  question_id uuid references public.rag_eval_questions(id) on delete cascade,
  answer text,
  confidence text,
  retrieved_document_names text[] not null default '{}',
  matched_expected_documents boolean not null default false,
  matched_expected_keywords boolean not null default false,
  latency_ms integer,
  score numeric,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.workspaces
  add column if not exists deletion_status text not null default 'none'
    check (deletion_status in ('none','scheduled','deleting','deleted','cancelled')),
  add column if not exists deletion_requested_at timestamptz,
  add column if not exists deletion_scheduled_for timestamptz,
  add column if not exists deleted_at timestamptz,
  add column if not exists deletion_reason text;

create or replace function public.increment_workspace_usage_daily(
  p_workspace_id uuid,
  p_usage_date date,
  p_questions_count integer default 0,
  p_uploads_count integer default 0,
  p_documents_count integer default 0,
  p_storage_bytes bigint default 0,
  p_embedding_calls integer default 0,
  p_embedding_tokens integer default 0,
  p_rerank_calls integer default 0,
  p_llm_calls integer default 0,
  p_llm_input_tokens integer default 0,
  p_llm_output_tokens integer default 0
)
returns void
language plpgsql
set search_path = public
as $$
begin
  insert into public.workspace_usage_daily (
    workspace_id,
    usage_date,
    questions_count,
    uploads_count,
    documents_count,
    storage_bytes,
    embedding_calls,
    embedding_tokens,
    rerank_calls,
    llm_calls,
    llm_input_tokens,
    llm_output_tokens
  )
  values (
    p_workspace_id,
    p_usage_date,
    p_questions_count,
    p_uploads_count,
    p_documents_count,
    p_storage_bytes,
    p_embedding_calls,
    p_embedding_tokens,
    p_rerank_calls,
    p_llm_calls,
    p_llm_input_tokens,
    p_llm_output_tokens
  )
  on conflict (workspace_id, usage_date)
  do update set
    questions_count = public.workspace_usage_daily.questions_count + excluded.questions_count,
    uploads_count = public.workspace_usage_daily.uploads_count + excluded.uploads_count,
    documents_count = public.workspace_usage_daily.documents_count + excluded.documents_count,
    storage_bytes = public.workspace_usage_daily.storage_bytes + excluded.storage_bytes,
    embedding_calls = public.workspace_usage_daily.embedding_calls + excluded.embedding_calls,
    embedding_tokens = public.workspace_usage_daily.embedding_tokens + excluded.embedding_tokens,
    rerank_calls = public.workspace_usage_daily.rerank_calls + excluded.rerank_calls,
    llm_calls = public.workspace_usage_daily.llm_calls + excluded.llm_calls,
    llm_input_tokens = public.workspace_usage_daily.llm_input_tokens + excluded.llm_input_tokens,
    llm_output_tokens = public.workspace_usage_daily.llm_output_tokens + excluded.llm_output_tokens,
    updated_at = now();
end;
$$;

alter table public.rate_limits enable row level security;
alter table public.workspace_usage_daily enable row level security;
alter table public.system_events enable row level security;
alter table public.rag_eval_sets enable row level security;
alter table public.rag_eval_questions enable row level security;
alter table public.rag_eval_runs enable row level security;
alter table public.rag_eval_results enable row level security;

notify pgrst, 'reload schema';
