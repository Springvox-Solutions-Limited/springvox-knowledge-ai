create table if not exists public.user_notification_reads (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.platform_notifications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  read_at timestamptz not null default now(),
  unique (notification_id, user_id)
);

create index if not exists user_notification_reads_user_read_idx
  on public.user_notification_reads (user_id, read_at desc);

create index if not exists user_notification_reads_notification_idx
  on public.user_notification_reads (notification_id);

alter table public.user_notification_reads enable row level security;

drop policy if exists "user_notification_reads_select_own" on public.user_notification_reads;
create policy "user_notification_reads_select_own"
on public.user_notification_reads
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "user_notification_reads_insert_own" on public.user_notification_reads;
create policy "user_notification_reads_insert_own"
on public.user_notification_reads
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "user_notification_reads_update_own" on public.user_notification_reads;
create policy "user_notification_reads_update_own"
on public.user_notification_reads
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

notify pgrst, 'reload schema';
