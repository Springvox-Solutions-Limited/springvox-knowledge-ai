-- Phase 6G: per-workspace operational limits, configurable by platform admins.
-- Consumption is read from the existing workspace_usage_daily table; this table
-- only stores the caps. NULL = "use the system default" (never locks anyone out).

create table if not exists public.workspace_limits (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  monthly_question_limit integer,
  daily_upload_limit integer,
  storage_byte_limit bigint,
  monthly_llm_token_limit bigint,
  updated_at timestamptz not null default now()
);

alter table public.workspace_limits enable row level security;

-- Only platform admins may read or write limits. Tenants never see this table.
drop policy if exists "workspace_limits_platform_admin_all" on public.workspace_limits;
create policy "workspace_limits_platform_admin_all"
on public.workspace_limits
for all
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'platform_admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'platform_admin'
  )
);

notify pgrst, 'reload schema';
