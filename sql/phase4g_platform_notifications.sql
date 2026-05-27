create table if not exists public.platform_notifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  type text not null check (type in ('maintenance','billing_reminder','announcement','trial_notice','security_notice')),
  title text not null,
  message text not null,
  channel text not null default 'in_app' check (channel in ('in_app','email','both')),
  status text not null default 'queued' check (status in ('queued','sent','failed','cancelled')),
  scheduled_for timestamptz,
  sent_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists platform_notifications_workspace_created_idx
  on public.platform_notifications (workspace_id, created_at desc);

create index if not exists platform_notifications_status_scheduled_idx
  on public.platform_notifications (status, scheduled_for);

alter table public.platform_notifications enable row level security;

drop policy if exists "platform_notifications_select_workspace" on public.platform_notifications;
create policy "platform_notifications_select_workspace"
on public.platform_notifications
for select
to authenticated
using (
  workspace_id is null
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.workspace_id = platform_notifications.workspace_id
  )
);

drop policy if exists "platform_notifications_platform_admin_all" on public.platform_notifications;
create policy "platform_notifications_platform_admin_all"
on public.platform_notifications
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'platform_admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'platform_admin'
  )
);

notify pgrst, 'reload schema';
