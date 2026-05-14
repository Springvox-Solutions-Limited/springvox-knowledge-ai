do $$
declare
  existing_constraint record;
begin
  alter table public.workspaces
    add column if not exists status text not null default 'active',
    add column if not exists plan text not null default 'pilot',
    add column if not exists suspension_reason text,
    add column if not exists suspended_at timestamptz,
    add column if not exists suspended_by uuid references auth.users(id) on delete set null,
    add column if not exists plan_updated_at timestamptz,
    add column if not exists internal_notes text;

  update public.workspaces
  set status = coalesce(nullif(status, ''), 'active'),
      plan = coalesce(nullif(plan, ''), 'pilot');

  for existing_constraint in
    select conname
    from pg_constraint
    where conrelid = 'public.workspaces'::regclass
      and contype = 'c'
      and (
        pg_get_constraintdef(oid) ilike '%status in%'
        or pg_get_constraintdef(oid) ilike '%plan in%'
      )
  loop
    execute format('alter table public.workspaces drop constraint if exists %I', existing_constraint.conname);
  end loop;
end $$;

alter table public.workspaces
  drop constraint if exists workspaces_status_check;

alter table public.workspaces
  add constraint workspaces_status_check
  check (status in ('active', 'suspended', 'trial', 'inactive'));

alter table public.workspaces
  drop constraint if exists workspaces_plan_check;

alter table public.workspaces
  add constraint workspaces_plan_check
  check (plan in ('pilot', 'starter', 'business', 'enterprise'));

create index if not exists workspaces_status_idx
  on public.workspaces (status);

create index if not exists workspaces_plan_idx
  on public.workspaces (plan);

create index if not exists workspaces_created_at_idx
  on public.workspaces (created_at desc);
