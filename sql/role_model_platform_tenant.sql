create extension if not exists pgcrypto;

do $$
declare
  default_workspace_id uuid;
  old_constraint record;
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

  update public.profiles
  set workspace_id = coalesce(workspace_id, default_workspace_id),
      updated_at = now()
  where workspace_id is null;

  for old_constraint in
    select conname
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%role%'
  loop
    execute format('alter table public.profiles drop constraint if exists %I', old_constraint.conname);
  end loop;

  for old_constraint in
    select conname
    from pg_constraint
    where conrelid = 'public.invitations'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%role%'
  loop
    execute format('alter table public.invitations drop constraint if exists %I', old_constraint.conname);
  end loop;
end $$;

alter table public.profiles
  alter column role set default 'viewer';

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.invitations
  drop constraint if exists invitations_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('platform_admin', 'tenant_admin', 'viewer', 'admin', 'content_manager'));

alter table public.invitations
  add constraint invitations_role_check
  check (role in ('tenant_admin', 'viewer', 'admin', 'content_manager'));

update public.profiles
set role = 'tenant_admin',
    updated_at = now()
where role in ('admin', 'content_manager');

update public.invitations
set role = 'tenant_admin',
    updated_at = now()
where role in ('admin', 'content_manager');

-- Manual platform admin promotion:
-- update public.profiles
-- set role = 'platform_admin'
-- where email = 'MY_EMAIL_HERE';

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('platform_admin', 'tenant_admin', 'viewer'));

alter table public.invitations
  drop constraint if exists invitations_role_check;

alter table public.invitations
  add constraint invitations_role_check
  check (role in ('tenant_admin', 'viewer'));

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
        full_name = coalesce(public.profiles.full_name, excluded.full_name),
        workspace_id = coalesce(public.profiles.workspace_id, excluded.workspace_id),
        updated_at = now();

  return new;
end;
$$;

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
      and p.role in ('platform_admin', 'tenant_admin')
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
      and p.role in ('platform_admin', 'tenant_admin')
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
      and p.role in ('platform_admin', 'tenant_admin')
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.workspace_id = documents.workspace_id
      and p.role in ('platform_admin', 'tenant_admin')
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
      and p.role in ('platform_admin', 'tenant_admin')
  )
);

drop policy if exists "document_chunks_select_workspace_members" on public.document_chunks;
create policy "document_chunks_select_workspace_members"
on public.document_chunks
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.workspace_id = document_chunks.workspace_id
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
      and p.role in ('platform_admin', 'tenant_admin')
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
      and p.role in ('platform_admin', 'tenant_admin')
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
);

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
      and p.role in ('platform_admin', 'tenant_admin')
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
      and p.role in ('platform_admin', 'tenant_admin')
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.workspace_id = knowledge_gaps.workspace_id
      and p.role in ('platform_admin', 'tenant_admin')
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
      and p.role in ('platform_admin', 'tenant_admin')
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
      and p.role in ('platform_admin', 'tenant_admin')
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
      and p.role in ('platform_admin', 'tenant_admin')
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.workspace_id = invitations.workspace_id
      and p.role in ('platform_admin', 'tenant_admin')
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
      and p.role in ('platform_admin', 'tenant_admin')
  )
);

comment on table public.profiles is
'Role model: platform_admin is manually assigned by the SpringVox owner only. Public signup should create tenant_admin for the first workspace user and viewer for invited staff.';
