create extension if not exists pgcrypto;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Default Workspace',
  slug text not null unique default 'default',
  created_at timestamptz not null default now()
);

insert into public.workspaces (name, slug)
values ('Default Workspace', 'default')
on conflict (slug) do nothing;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'viewer' check (role in ('admin', 'content_manager', 'viewer')),
  workspace_id uuid references public.workspaces(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.documents
  add column if not exists workspace_id uuid references public.workspaces(id) on delete set null;

alter table public.document_chunks
  add column if not exists workspace_id uuid references public.workspaces(id) on delete set null;

alter table public.chat_messages
  add column if not exists workspace_id uuid references public.workspaces(id) on delete set null;

create index if not exists documents_workspace_id_created_at_idx
  on public.documents (workspace_id, created_at desc);

create index if not exists document_chunks_workspace_id_document_id_idx
  on public.document_chunks (workspace_id, document_id, chunk_index);

create index if not exists chat_messages_workspace_id_created_at_idx
  on public.chat_messages (workspace_id, created_at desc);

do $$
declare
  default_workspace_id uuid;
begin
  select id into default_workspace_id
  from public.workspaces
  where slug = 'default'
  limit 1;

  insert into public.profiles (id, email, full_name, role, workspace_id)
  select
    u.id,
    u.email,
    coalesce(u.raw_user_meta_data ->> 'full_name', ''),
    'viewer',
    default_workspace_id
  from auth.users u
  on conflict (id) do update
    set email = excluded.email,
        workspace_id = coalesce(public.profiles.workspace_id, excluded.workspace_id),
        updated_at = now();

  update public.profiles
  set workspace_id = default_workspace_id,
      updated_at = now()
  where workspace_id is null;

  update public.documents d
  set workspace_id = p.workspace_id
  from public.profiles p
  where d.workspace_id is null
    and d.user_id = p.id;

  update public.documents
  set workspace_id = default_workspace_id
  where workspace_id is null;

  update public.document_chunks dc
  set workspace_id = d.workspace_id
  from public.documents d
  where dc.workspace_id is null
    and dc.document_id = d.id;

  update public.document_chunks
  set workspace_id = default_workspace_id
  where workspace_id is null;

  update public.chat_messages cm
  set workspace_id = p.workspace_id
  from public.profiles p
  where cm.workspace_id is null
    and cm.user_id = p.id;

  update public.chat_messages
  set workspace_id = default_workspace_id
  where workspace_id is null;
end $$;

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_profiles_updated_at();

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  default_workspace_id uuid;
begin
  select id into default_workspace_id
  from public.workspaces
  where slug = 'default'
  limit 1;

  if default_workspace_id is null then
    insert into public.workspaces (name, slug)
    values ('Default Workspace', 'default')
    returning id into default_workspace_id;
  end if;

  insert into public.profiles (id, email, full_name, role, workspace_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'viewer',
    default_workspace_id
  )
  on conflict (id) do update
    set email = excluded.email,
        workspace_id = coalesce(public.profiles.workspace_id, excluded.workspace_id),
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user_profile();

alter table public.workspaces enable row level security;
alter table public.profiles enable row level security;
alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;
alter table public.chat_messages enable row level security;

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

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "documents_select_workspace_managers" on public.documents;
create policy "documents_select_workspace_managers"
on public.documents
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.workspace_id = documents.workspace_id
      and p.role in ('admin', 'content_manager')
  )
);

drop policy if exists "documents_insert_workspace_managers" on public.documents;
create policy "documents_insert_workspace_managers"
on public.documents
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.workspace_id = documents.workspace_id
      and p.role in ('admin', 'content_manager')
  )
);

drop policy if exists "documents_update_workspace_managers" on public.documents;
create policy "documents_update_workspace_managers"
on public.documents
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.workspace_id = documents.workspace_id
      and p.role in ('admin', 'content_manager')
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.workspace_id = documents.workspace_id
      and p.role in ('admin', 'content_manager')
  )
);

drop policy if exists "documents_delete_workspace_managers" on public.documents;
create policy "documents_delete_workspace_managers"
on public.documents
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.workspace_id = documents.workspace_id
      and p.role in ('admin', 'content_manager')
  )
);

drop policy if exists "document_chunks_select_workspace_managers" on public.document_chunks;
create policy "document_chunks_select_workspace_managers"
on public.document_chunks
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.workspace_id = document_chunks.workspace_id
      and p.role in ('admin', 'content_manager')
  )
);

drop policy if exists "document_chunks_insert_workspace_managers" on public.document_chunks;
create policy "document_chunks_insert_workspace_managers"
on public.document_chunks
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.workspace_id = document_chunks.workspace_id
      and p.role in ('admin', 'content_manager')
  )
);

drop policy if exists "document_chunks_update_workspace_managers" on public.document_chunks;
create policy "document_chunks_update_workspace_managers"
on public.document_chunks
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.workspace_id = document_chunks.workspace_id
      and p.role in ('admin', 'content_manager')
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.workspace_id = document_chunks.workspace_id
      and p.role in ('admin', 'content_manager')
  )
);

drop policy if exists "document_chunks_delete_workspace_managers" on public.document_chunks;
create policy "document_chunks_delete_workspace_managers"
on public.document_chunks
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.workspace_id = document_chunks.workspace_id
      and p.role in ('admin', 'content_manager')
  )
);

drop policy if exists "chat_messages_select_own" on public.chat_messages;
create policy "chat_messages_select_own"
on public.chat_messages
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "chat_messages_insert_own" on public.chat_messages;
create policy "chat_messages_insert_own"
on public.chat_messages
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.workspace_id = chat_messages.workspace_id
  )
);

drop policy if exists "chat_messages_delete_own" on public.chat_messages;
create policy "chat_messages_delete_own"
on public.chat_messages
for delete
to authenticated
using (auth.uid() = user_id);
