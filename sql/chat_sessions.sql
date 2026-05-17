create extension if not exists pgcrypto;

create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.chat_messages
  add column if not exists session_id uuid references public.chat_sessions(id) on delete cascade;

create index if not exists chat_sessions_workspace_user_updated_idx
  on public.chat_sessions (workspace_id, user_id, updated_at desc);

create index if not exists chat_sessions_workspace_idx
  on public.chat_sessions (workspace_id);

create index if not exists chat_sessions_user_idx
  on public.chat_sessions (user_id);

create index if not exists chat_messages_session_created_idx
  on public.chat_messages (session_id, created_at asc);

create or replace function public.set_chat_sessions_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_chat_sessions_updated_at on public.chat_sessions;
create trigger set_chat_sessions_updated_at
before update on public.chat_sessions
for each row
execute function public.set_chat_sessions_updated_at();

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'chat_messages'
      and column_name = 'workspace_id'
  ) and exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'chat_messages'
      and column_name = 'user_id'
  ) then
    insert into public.chat_sessions (workspace_id, user_id, title, created_at, updated_at)
    select
      cm.workspace_id,
      cm.user_id,
      'Earlier chat',
      min(cm.created_at),
      max(cm.created_at)
    from public.chat_messages cm
    where cm.session_id is null
      and cm.workspace_id is not null
      and cm.user_id is not null
      and not exists (
        select 1
        from public.chat_sessions cs
        where cs.workspace_id = cm.workspace_id
          and cs.user_id = cm.user_id
          and cs.title = 'Earlier chat'
      )
    group by cm.workspace_id, cm.user_id;

    update public.chat_messages cm
    set session_id = cs.id
    from public.chat_sessions cs
    where cm.session_id is null
      and cm.workspace_id = cs.workspace_id
      and cm.user_id = cs.user_id
      and cs.title = 'Earlier chat';
  end if;
end $$;

alter table public.chat_sessions enable row level security;

drop policy if exists "chat_sessions_select_own" on public.chat_sessions;
create policy "chat_sessions_select_own"
on public.chat_sessions
for select
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.workspace_id = chat_sessions.workspace_id
  )
);

drop policy if exists "chat_sessions_insert_own" on public.chat_sessions;
create policy "chat_sessions_insert_own"
on public.chat_sessions
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.workspace_id = chat_sessions.workspace_id
  )
);

drop policy if exists "chat_sessions_update_own" on public.chat_sessions;
create policy "chat_sessions_update_own"
on public.chat_sessions
for update
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.workspace_id = chat_sessions.workspace_id
  )
)
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.workspace_id = chat_sessions.workspace_id
  )
);

drop policy if exists "chat_sessions_delete_own" on public.chat_sessions;
create policy "chat_sessions_delete_own"
on public.chat_sessions
for delete
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.workspace_id = chat_sessions.workspace_id
  )
);

drop policy if exists "chat_messages_select_workspace_members" on public.chat_messages;
create policy "chat_messages_select_workspace_members"
on public.chat_messages
for select
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.workspace_id = chat_messages.workspace_id
  )
  and (
    session_id is null
    or exists (
      select 1
      from public.chat_sessions cs
      where cs.id = chat_messages.session_id
        and cs.user_id = auth.uid()
        and cs.workspace_id = chat_messages.workspace_id
    )
  )
);

drop policy if exists "chat_messages_insert_workspace_members" on public.chat_messages;
create policy "chat_messages_insert_workspace_members"
on public.chat_messages
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.workspace_id = chat_messages.workspace_id
  )
  and (
    session_id is null
    or exists (
      select 1
      from public.chat_sessions cs
      where cs.id = chat_messages.session_id
        and cs.user_id = auth.uid()
        and cs.workspace_id = chat_messages.workspace_id
    )
  )
);
