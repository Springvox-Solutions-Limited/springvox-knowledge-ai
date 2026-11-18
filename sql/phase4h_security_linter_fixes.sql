-- Supabase security linter fixes for mutable search_path and public SECURITY DEFINER execution.
-- These trigger functions keep their existing behavior but pin search_path so object lookup is deterministic.

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_knowledge_gaps_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_workspaces_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_invitations_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Keep the auth.users trigger function SECURITY DEFINER so signup/profile creation still works.
-- Revoke direct role execution; triggers can still invoke the function as part of the auth.users insert.
-- The pinned search_path prevents SECURITY DEFINER object-hijacking through a mutable path.
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  default_workspace_id uuid;
begin
  select id
  into default_workspace_id
  from public.workspaces
  where slug = 'default'
  limit 1;

  if default_workspace_id is null then
    insert into public.workspaces (name, slug)
    values ('Default Workspace', 'default')
    returning id into default_workspace_id;
  end if;

  insert into public.profiles (id, workspace_id, email, full_name, role)
  values (
    new.id,
    default_workspace_id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'viewer'
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(public.profiles.full_name, excluded.full_name),
        workspace_id = coalesce(public.profiles.workspace_id, excluded.workspace_id),
        updated_at = now();

  return new;
end;
$$;

revoke all on function public.handle_new_user_profile() from PUBLIC;
revoke all on function public.handle_new_user_profile() from anon;
revoke all on function public.handle_new_user_profile() from authenticated;

notify pgrst, 'reload schema';
