create extension if not exists pgcrypto;

create table if not exists public.knowledge_gaps (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  question text not null,
  normalized_question text not null,
  status text not null default 'open' check (status in ('open', 'reviewed', 'resolved', 'ignored')),
  occurrence_count integer not null default 1,
  last_asked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sample_answer text,
  notes text,
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz
);

create index if not exists profiles_workspace_role_email_idx
  on public.profiles (workspace_id, role, email);

create index if not exists knowledge_gaps_workspace_status_last_asked_idx
  on public.knowledge_gaps (workspace_id, status, last_asked_at desc);

create index if not exists knowledge_gaps_workspace_occurrence_idx
  on public.knowledge_gaps (workspace_id, occurrence_count desc, last_asked_at desc);

create unique index if not exists knowledge_gaps_workspace_normalized_question_uidx
  on public.knowledge_gaps (workspace_id, normalized_question);

create or replace function public.set_knowledge_gaps_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_knowledge_gaps_updated_at on public.knowledge_gaps;
create trigger set_knowledge_gaps_updated_at
before update on public.knowledge_gaps
for each row
execute function public.set_knowledge_gaps_updated_at();

alter table public.knowledge_gaps enable row level security;

drop policy if exists "knowledge_gaps_select_workspace_managers" on public.knowledge_gaps;
create policy "knowledge_gaps_select_workspace_managers"
on public.knowledge_gaps
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.workspace_id = knowledge_gaps.workspace_id
      and p.role in ('admin', 'content_manager')
  )
);

drop policy if exists "knowledge_gaps_update_workspace_managers" on public.knowledge_gaps;
create policy "knowledge_gaps_update_workspace_managers"
on public.knowledge_gaps
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.workspace_id = knowledge_gaps.workspace_id
      and p.role in ('admin', 'content_manager')
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.workspace_id = knowledge_gaps.workspace_id
      and p.role in ('admin', 'content_manager')
  )
);
