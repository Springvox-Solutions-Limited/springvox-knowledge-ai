import { requirePlatformAdminRequest, createPlatformErrorResponse } from '@/src/lib/platform-api';
import { getSupabaseAdmin } from '@/src/lib/supabase-server';
import { getPlatformSummary } from '@/src/lib/platform-server';

export const dynamic = 'force-dynamic';

type AiMetricRow = {
  status: string;
  total_ms: number;
  first_token_ms: number | null;
  no_answer: boolean;
};

function percentile(values: number[], p: number) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index];
}

export async function GET(req: Request) {
  try {
    await requirePlatformAdminRequest(req);
    const { searchParams } = new URL(req.url);
    const requestedDays = Number(searchParams.get('days') || 30);
    const days = Number.isFinite(requestedDays)
      ? Math.min(90, Math.max(1, Math.floor(requestedDays)))
      : 30;
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase.rpc('get_platform_insights', { p_days: days });
    let insights: Record<string, unknown> | null = data as Record<string, unknown> | null;
    let fallback = false;

    if (error) {
      console.warn('[PlatformInsights] aggregate RPC unavailable; using summary fallback:', error.message);
      const summary = await getPlatformSummary();
      fallback = true;
      insights = {
        windowDays: days,
        totals: {
          ...summary.totals,
          openKnowledgeGaps: summary.totals.totalUnansweredQuestions,
          newCompanies: summary.totals.newCompaniesLast7Days,
          questionsPeriod: summary.totals.questionsLast7Days,
          activeUsersPeriod: 0,
          documentsPeriod: 0,
        },
        daily: [],
        hourly: [],
        status: [
          { status: 'active', count: summary.totals.activeWorkspaces },
          { status: 'trial', count: summary.totals.trialWorkspaces },
          { status: 'suspended', count: summary.totals.suspendedWorkspaces },
        ],
        plans: [],
        topCompanies: summary.topCompaniesByQuestions.map((company) => ({
          ...company,
          questions: company.totalQuestions,
        })),
        funnel: {
          companies: summary.totals.totalWorkspaces,
          withDocuments: 0,
          withQuestions: 0,
          activeLast7: 0,
        },
        fallback: true,
      };
    }

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    let ai = null;
    const { data: aiRows, error: aiError } = await supabase
      .from('chat_request_metrics')
      .select('status, total_ms, first_token_ms, no_answer')
      .gte('created_at', since)
      .limit(1000);

    if (!aiError) {
      const rows = (aiRows || []) as AiMetricRow[];
      const firstTokens = rows
        .map((row) => row.first_token_ms)
        .filter((value): value is number => typeof value === 'number');
      const totals = rows.map((row) => row.total_ms);
      ai = {
        requests: rows.length,
        errors: rows.filter((row) => row.status === 'error').length,
        noAnswers: rows.filter((row) => row.no_answer).length,
        errorRate: rows.length ? Number((rows.filter((row) => row.status === 'error').length / rows.length).toFixed(3)) : null,
        noAnswerRate: rows.length ? Number((rows.filter((row) => row.no_answer).length / rows.length).toFixed(3)) : null,
        firstTokenP50: percentile(firstTokens, 50),
        firstTokenP95: percentile(firstTokens, 95),
        totalP50: percentile(totals, 50),
        totalP95: percentile(totals, 95),
      };
    } else {
      console.warn('[PlatformInsights] AI metrics unavailable:', aiError.message);
    }

    return Response.json({ ...(insights || {}), ai, fallback });
  } catch (error) {
    return createPlatformErrorResponse(error, 'Unexpected platform insights error');
  }
}
