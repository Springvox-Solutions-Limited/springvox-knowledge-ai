-- Phase 9: aggregated platform insights for the mission-control dashboard.
--
-- The platform console should not load raw tenant rows to draw charts. This
-- function returns bounded aggregates for a 1-90 day window.

create or replace function public.get_platform_insights(p_days integer default 30)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
with params as (
  select
    greatest(1, least(90, coalesce(p_days, 30))) as days,
    (current_date - (greatest(1, least(90, coalesce(p_days, 30))) - 1))::date as since
),
days as (
  select generate_series((select since from params), current_date, interval '1 day')::date as day
),
questions_daily as (
  select created_at::date as day, count(*)::int as questions,
         count(distinct user_id)::int as active_users
  from public.chat_messages
  where created_at >= (select since from params)::timestamptz
  group by 1
),
companies_daily as (
  select created_at::date as day, count(*)::int as companies
  from public.workspaces
  where deleted_at is null
    and created_at >= (select since from params)::timestamptz
  group by 1
),
documents_daily as (
  select created_at::date as day, count(*)::int as documents
  from public.documents
  where created_at >= (select since from params)::timestamptz
  group by 1
),
daily as (
  select
    days.day,
    coalesce(questions_daily.questions, 0) as questions,
    coalesce(questions_daily.active_users, 0) as active_users,
    coalesce(companies_daily.companies, 0) as companies,
    coalesce(documents_daily.documents, 0) as documents
  from days
  left join questions_daily on questions_daily.day = days.day
  left join companies_daily on companies_daily.day = days.day
  left join documents_daily on documents_daily.day = days.day
),
hourly as (
  select extract(hour from created_at)::int as hour, count(*)::int as questions
  from public.chat_messages
  where created_at >= (select since from params)::timestamptz
  group by 1
),
status_counts as (
  select status, count(*)::int as count
  from public.workspaces
  where deleted_at is null
  group by 1
),
plan_counts as (
  select plan, count(*)::int as count
  from public.workspaces
  where deleted_at is null
  group by 1
),
company_questions as (
  select w.id, w.name, w.slug, w.plan, w.status,
         count(cm.id)::int as questions
  from public.workspaces w
  left join public.chat_messages cm
    on cm.workspace_id = w.id
   and cm.created_at >= (select since from params)::timestamptz
  where w.deleted_at is null
  group by w.id, w.name, w.slug, w.plan, w.status
  order by questions desc, w.created_at desc
  limit 8
),
totals as (
  select
    (select count(*)::int from public.workspaces where deleted_at is null) as total_workspaces,
    (select count(*)::int from public.workspaces where deleted_at is null and status = 'active') as active_workspaces,
    (select count(*)::int from public.workspaces where deleted_at is null and status = 'suspended') as suspended_workspaces,
    (select count(*)::int from public.workspaces where deleted_at is null and status = 'trial') as trial_workspaces,
    (select count(*)::int from public.profiles) as total_users,
    (select count(*)::int from public.documents) as total_documents,
    (select count(*)::int from public.chat_messages) as total_questions,
    (select count(*)::int from public.knowledge_gaps where status = 'open') as open_gaps,
    (select count(*)::int from public.answer_feedback) as total_feedback,
    (select count(*)::int from public.workspaces where deleted_at is null and created_at >= (select since from params)::timestamptz) as new_companies,
    (select count(*)::int from public.chat_messages where created_at >= (select since from params)::timestamptz) as questions_period,
    (select count(distinct user_id)::int from public.chat_messages where created_at >= (select since from params)::timestamptz) as active_users_period,
    (select count(*)::int from public.documents where created_at >= (select since from params)::timestamptz) as documents_period
),
funnel as (
  select
    (select count(*)::int from public.workspaces where deleted_at is null) as companies,
    (select count(distinct w.id)::int from public.workspaces w join public.documents d on d.workspace_id = w.id where w.deleted_at is null) as with_documents,
    (select count(distinct w.id)::int from public.workspaces w join public.chat_messages cm on cm.workspace_id = w.id where w.deleted_at is null) as with_questions,
    (select count(distinct w.id)::int from public.workspaces w join public.chat_messages cm on cm.workspace_id = w.id where w.deleted_at is null and cm.created_at >= now() - interval '7 days') as active_last_7
)
select jsonb_build_object(
  'windowDays', (select days from params),
  'totals', jsonb_build_object(
    'totalWorkspaces', totals.total_workspaces,
    'activeWorkspaces', totals.active_workspaces,
    'suspendedWorkspaces', totals.suspended_workspaces,
    'trialWorkspaces', totals.trial_workspaces,
    'totalUsers', totals.total_users,
    'totalDocuments', totals.total_documents,
    'totalQuestions', totals.total_questions,
    'openKnowledgeGaps', totals.open_gaps,
    'totalFeedback', totals.total_feedback,
    'newCompanies', totals.new_companies,
    'questionsPeriod', totals.questions_period,
    'activeUsersPeriod', totals.active_users_period,
    'documentsPeriod', totals.documents_period
  ),
  'daily', coalesce((
    select jsonb_agg(jsonb_build_object(
      'date', daily.day,
      'questions', daily.questions,
      'activeUsers', daily.active_users,
      'companies', daily.companies,
      'documents', daily.documents
    ) order by daily.day)
    from daily
  ), '[]'::jsonb),
  'hourly', coalesce((
    select jsonb_agg(jsonb_build_object('hour', hourly.hour, 'questions', hourly.questions) order by hourly.hour)
    from hourly
  ), '[]'::jsonb),
  'status', coalesce((
    select jsonb_agg(jsonb_build_object('status', status_counts.status, 'count', status_counts.count) order by status_counts.count desc)
    from status_counts
  ), '[]'::jsonb),
  'plans', coalesce((
    select jsonb_agg(jsonb_build_object('plan', plan_counts.plan, 'count', plan_counts.count) order by plan_counts.count desc)
    from plan_counts
  ), '[]'::jsonb),
  'topCompanies', coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', company_questions.id,
      'name', company_questions.name,
      'slug', company_questions.slug,
      'plan', company_questions.plan,
      'status', company_questions.status,
      'questions', company_questions.questions
    ) order by company_questions.questions desc)
    from company_questions
  ), '[]'::jsonb),
  'funnel', jsonb_build_object(
    'companies', funnel.companies,
    'withDocuments', funnel.with_documents,
    'withQuestions', funnel.with_questions,
    'activeLast7', funnel.active_last_7
  )
)
from totals, funnel;
$$;

revoke all on function public.get_platform_insights(integer) from public, anon, authenticated;
grant execute on function public.get_platform_insights(integer) to service_role;
