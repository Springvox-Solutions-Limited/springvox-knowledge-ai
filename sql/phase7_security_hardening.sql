-- Phase 7: explicit client-access denial for server-only tables.
--
-- These tables are written and read through the service-role client in API
-- routes, cron jobs, and platform diagnostics. RLS is enabled, and there is no
-- client policy because no browser code should read or write them directly.
-- The REVOKEs make that boundary explicit and protect against future accidental
-- policy additions or permissive defaults.

alter table public.rate_limits enable row level security;
alter table public.workspace_usage_daily enable row level security;
alter table public.system_events enable row level security;
alter table public.rag_eval_sets enable row level security;
alter table public.rag_eval_questions enable row level security;
alter table public.rag_eval_runs enable row level security;
alter table public.rag_eval_results enable row level security;

revoke all on public.rate_limits from anon, authenticated;
revoke all on public.workspace_usage_daily from anon, authenticated;
revoke all on public.system_events from anon, authenticated;
revoke all on public.rag_eval_sets from anon, authenticated;
revoke all on public.rag_eval_questions from anon, authenticated;
revoke all on public.rag_eval_runs from anon, authenticated;
revoke all on public.rag_eval_results from anon, authenticated;

-- Keep service_role access intact. API routes, Inngest functions, and platform
-- diagnostics use the service-role client.
grant all on public.rate_limits to service_role;
grant all on public.workspace_usage_daily to service_role;
grant all on public.system_events to service_role;
grant all on public.rag_eval_sets to service_role;
grant all on public.rag_eval_questions to service_role;
grant all on public.rag_eval_runs to service_role;
grant all on public.rag_eval_results to service_role;

-- The documents bucket is accessed only through authenticated server routes
-- (`/api/documents/upload`, `/api/documents/[id]/stream`, deletion jobs), which
-- use the service role. Remove broad client storage policies if any were added
-- manually in the Supabase dashboard. Do not add a public bucket policy.
