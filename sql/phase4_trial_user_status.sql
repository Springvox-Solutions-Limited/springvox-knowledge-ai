alter table public.workspaces
  add column if not exists trial_started_at timestamptz,
  add column if not exists trial_ends_at timestamptz,
  add column if not exists subscription_status text not null default 'trial',
  add column if not exists subscription_plan text not null default 'trial',
  add column if not exists billing_status text not null default 'trialing',
  add column if not exists payment_required_at timestamptz,
  add column if not exists suspended_reason text;

alter table public.profiles
  add column if not exists status text not null default 'active';

alter table public.workspaces
  drop constraint if exists workspaces_status_check;
alter table public.workspaces
  add constraint workspaces_status_check
  check (status in ('active', 'suspended', 'trial', 'inactive', 'past_due', 'expired'));

alter table public.workspaces
  drop constraint if exists workspaces_subscription_status_check;
alter table public.workspaces
  add constraint workspaces_subscription_status_check
  check (subscription_status in ('trial', 'active', 'past_due', 'expired', 'suspended'));

alter table public.workspaces
  drop constraint if exists workspaces_billing_status_check;
alter table public.workspaces
  add constraint workspaces_billing_status_check
  check (billing_status in ('trialing', 'active', 'past_due', 'expired', 'suspended'));

alter table public.profiles
  drop constraint if exists profiles_status_check;
alter table public.profiles
  add constraint profiles_status_check
  check (status in ('active', 'suspended', 'invited', 'disabled'));

update public.workspaces
set
  trial_started_at = coalesce(trial_started_at, created_at, now()),
  trial_ends_at = coalesce(trial_ends_at, coalesce(created_at, now()) + interval '14 days'),
  subscription_status = coalesce(subscription_status, 'trial'),
  subscription_plan = coalesce(subscription_plan, 'trial'),
  billing_status = coalesce(billing_status, 'trialing')
where trial_started_at is null
   or trial_ends_at is null
   or subscription_status is null
   or subscription_plan is null
   or billing_status is null;

update public.profiles
set status = 'active'
where status is null;

create index if not exists workspaces_subscription_trial_idx
  on public.workspaces (subscription_status, trial_ends_at);

create index if not exists profiles_workspace_status_idx
  on public.profiles (workspace_id, status);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  target_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_workspace_created_idx
  on public.audit_logs (workspace_id, created_at desc);

create index if not exists audit_logs_target_user_created_idx
  on public.audit_logs (target_user_id, created_at desc);

alter table public.audit_logs enable row level security;

drop policy if exists "audit_logs_select_workspace_admins" on public.audit_logs;
create policy "audit_logs_select_workspace_admins"
on public.audit_logs
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.workspace_id = audit_logs.workspace_id
      and p.role in ('tenant_admin', 'admin', 'content_manager', 'platform_admin')
  )
);

notify pgrst, 'reload schema';