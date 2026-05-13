create extension if not exists pgcrypto;

alter table public.workspaces
  add column if not exists logo_url text,
  add column if not exists primary_color text,
  add column if not exists welcome_message text,
  add column if not exists assistant_name text,
  add column if not exists support_email text,
  add column if not exists industry text,
  add column if not exists website text,
  add column if not exists updated_at timestamptz not null default now();

update public.workspaces
set
  primary_color = coalesce(primary_color, '#FF6B00'),
  assistant_name = coalesce(assistant_name, 'SpringVox Knowledge AI'),
  welcome_message = coalesce(welcome_message, 'Ask questions from your approved company documents.'),
  updated_at = now()
where slug = 'default';

create or replace function public.set_workspaces_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_workspaces_updated_at on public.workspaces;
create trigger set_workspaces_updated_at
before update on public.workspaces
for each row
execute function public.set_workspaces_updated_at();

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'content_manager', 'viewer')),
  token text not null unique,
  invited_by uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists invitations_workspace_id_idx
  on public.invitations (workspace_id);

create index if not exists invitations_email_idx
  on public.invitations (email);

create index if not exists invitations_token_idx
  on public.invitations (token);

create index if not exists invitations_status_idx
  on public.invitations (status);

create or replace function public.set_invitations_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_invitations_updated_at on public.invitations;
create trigger set_invitations_updated_at
before update on public.invitations
for each row
execute function public.set_invitations_updated_at();

create table if not exists public.answer_feedback (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  chat_message_id uuid references public.chat_messages(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  rating text not null check (rating in ('helpful', 'not_helpful', 'wrong', 'outdated', 'needs_more_detail')),
  comment text,
  created_at timestamptz not null default now()
);

create index if not exists answer_feedback_workspace_id_idx
  on public.answer_feedback (workspace_id);

create index if not exists answer_feedback_chat_message_id_idx
  on public.answer_feedback (chat_message_id);

create index if not exists answer_feedback_rating_idx
  on public.answer_feedback (rating);

create index if not exists answer_feedback_created_at_idx
  on public.answer_feedback (created_at desc);

create unique index if not exists answer_feedback_workspace_chat_user_uidx
  on public.answer_feedback (workspace_id, chat_message_id, user_id);

alter table public.invitations enable row level security;
alter table public.answer_feedback enable row level security;

drop policy if exists "workspaces_select_own" on public.workspaces;
create policy "workspaces_select_own"
on public.workspaces
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.workspace_id = workspaces.id
  )
);

drop policy if exists "invitations_select_workspace_admins" on public.invitations;
create policy "invitations_select_workspace_admins"
on public.invitations
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.workspace_id = invitations.workspace_id
      and p.role = 'admin'
  )
);

drop policy if exists "invitations_insert_workspace_admins" on public.invitations;
create policy "invitations_insert_workspace_admins"
on public.invitations
for insert
to authenticated
with check (
  invited_by = auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.workspace_id = invitations.workspace_id
      and p.role = 'admin'
  )
);

drop policy if exists "invitations_update_workspace_admins" on public.invitations;
create policy "invitations_update_workspace_admins"
on public.invitations
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.workspace_id = invitations.workspace_id
      and p.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.workspace_id = invitations.workspace_id
      and p.role = 'admin'
  )
);

drop policy if exists "answer_feedback_insert_workspace_users" on public.answer_feedback;
create policy "answer_feedback_insert_workspace_users"
on public.answer_feedback
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.workspace_id = answer_feedback.workspace_id
  )
);

drop policy if exists "answer_feedback_select_workspace_managers" on public.answer_feedback;
create policy "answer_feedback_select_workspace_managers"
on public.answer_feedback
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.workspace_id = answer_feedback.workspace_id
      and p.role in ('admin', 'content_manager')
  )
);
