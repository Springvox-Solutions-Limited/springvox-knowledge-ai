-- Phase 6D: Department collections (folders) for documents.
-- v1 scope: workspace-level access only (no per-group permissions yet).
-- Documents belong to at most one collection. Chat scoping is wired separately.

create extension if not exists pgcrypto;

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  slug text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  unique (workspace_id, slug)
);

create index if not exists collections_workspace_idx on public.collections (workspace_id);

alter table public.documents
  add column if not exists collection_id uuid references public.collections(id) on delete set null;

create index if not exists documents_collection_idx on public.documents (collection_id);

-- Seed the default department set for a workspace (idempotent).
create or replace function public.seed_default_collections(p_workspace_id uuid)
returns void
language plpgsql
set search_path = public
as $$
declare
  dept record;
begin
  for dept in
    select * from (values
      ('General', 'general'),
      ('HR', 'hr'),
      ('Finance', 'finance'),
      ('Legal', 'legal'),
      ('Operations', 'operations'),
      ('Sales', 'sales'),
      ('Support', 'support'),
      ('IT', 'it')
    ) as t(name, slug)
  loop
    insert into public.collections (workspace_id, name, slug, is_default)
    values (p_workspace_id, dept.name, dept.slug, true)
    on conflict (workspace_id, slug) do nothing;
  end loop;
end;
$$;

-- Backfill: seed defaults for every existing workspace.
do $$
declare
  ws record;
begin
  for ws in select id from public.workspaces loop
    perform public.seed_default_collections(ws.id);
  end loop;
end $$;

alter table public.collections enable row level security;

-- Workspace members can read their workspace's collections.
drop policy if exists "collections_select_workspace" on public.collections;
create policy "collections_select_workspace"
on public.collections
for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.workspace_id = collections.workspace_id
  )
);

-- Workspace admins (platform_admin / tenant_admin) can manage collections.
drop policy if exists "collections_write_workspace_admins" on public.collections;
create policy "collections_write_workspace_admins"
on public.collections
for all
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.workspace_id = collections.workspace_id
      and p.role in ('platform_admin', 'tenant_admin')
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.workspace_id = collections.workspace_id
      and p.role in ('platform_admin', 'tenant_admin')
  )
);

notify pgrst, 'reload schema';
