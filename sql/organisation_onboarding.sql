create extension if not exists pgcrypto;

create or replace function public.is_reserved_workspace_slug(slug text)
returns boolean
language sql
immutable
set search_path = public, pg_catalog
as $$
  select coalesce(lower(slug), '') = any (array[
    'admin',
    'api',
    'auth',
    'dashboard',
    'login',
    'platform',
    'register',
    'springvox',
    'www'
  ]);
$$;

create unique index if not exists workspaces_slug_lower_uidx
  on public.workspaces (lower(slug));

alter table public.workspaces
  drop constraint if exists workspaces_slug_format_check;

alter table public.workspaces
  add constraint workspaces_slug_format_check
  check (
    slug = lower(slug)
    and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    and char_length(slug) between 3 and 48
    and not public.is_reserved_workspace_slug(slug)
  );

create index if not exists profiles_email_lower_idx
  on public.profiles (lower(email));

comment on function public.is_reserved_workspace_slug(text) is
'Reserved workspace slugs blocked during organisation onboarding. Public signup should never create platform-level namespaces.';
