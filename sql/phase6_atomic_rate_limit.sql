-- Phase 6 security hardening: atomic rate-limit increment.
-- Replaces the non-atomic SELECT-then-UPDATE/INSERT pattern (TOCTOU race)
-- with a single atomic upsert that returns the post-increment count.

create or replace function public.check_and_increment_rate_limit(
  p_key text,
  p_scope text,
  p_window_start timestamptz,
  p_expires_at timestamptz
)
returns integer
language plpgsql
set search_path = public
as $$
declare
  v_count integer;
begin
  insert into public.rate_limits (key, scope, count, window_start, expires_at)
  values (p_key, p_scope, 1, p_window_start, p_expires_at)
  on conflict (key, scope, window_start)
  do update set
    count = public.rate_limits.count + 1,
    expires_at = excluded.expires_at
  returning count into v_count;

  return v_count;
end;
$$;

notify pgrst, 'reload schema';
