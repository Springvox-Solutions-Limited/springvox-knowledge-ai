import { requirePlatformAdminRequest, createPlatformErrorResponse } from '@/src/lib/platform-api';
import { getSupabaseAdmin } from '@/src/lib/supabase-server';

export const dynamic = 'force-dynamic';

type MetricRow = {
  request_id: string;
  workspace_id: string | null;
  status: string;
  total_ms: number;
  auth_ms: number | null;
  retrieval_ms: number | null;
  rerank_ms: number | null;
  generation_ms: number | null;
  first_token_ms: number | null;
  llm_input_tokens: number | null;
  llm_output_tokens: number | null;
  chunk_count: number;
  citation_count: number;
  no_answer: boolean;
  created_at: string;
};

function percentile(values: number[], p: number) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index];
}

function summarize(values: Array<number | null>) {
  const present = values.filter((value): value is number => typeof value === 'number');
  if (present.length === 0) {
    return { count: 0, p50: null, p95: null, min: null, max: null, average: null };
  }
  return {
    count: present.length,
    p50: percentile(present, 50),
    p95: percentile(present, 95),
    min: Math.min(...present),
    max: Math.max(...present),
    average: Math.round(present.reduce((sum, value) => sum + value, 0) / present.length),
  };
}

export async function GET(req: Request) {
  try {
    await requirePlatformAdminRequest(req);
    const { searchParams } = new URL(req.url);
    const requestedDays = Number(searchParams.get('days') || 7);
    const days = Number.isFinite(requestedDays)
      ? Math.min(30, Math.max(1, Math.floor(requestedDays)))
      : 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('chat_request_metrics')
      .select(
        'request_id, workspace_id, status, total_ms, auth_ms, retrieval_ms, rerank_ms, generation_ms, first_token_ms, llm_input_tokens, llm_output_tokens, chunk_count, citation_count, no_answer, created_at',
      )
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) throw error;

    const rows = (data || []) as MetricRow[];
    const statusCounts = rows.reduce<Record<string, number>>((counts, row) => {
      counts[row.status] = (counts[row.status] || 0) + 1;
      return counts;
    }, {});

    return Response.json({
      windowDays: days,
      sampleSize: rows.length,
      truncated: rows.length === 1000,
      percentiles: {
        totalMs: summarize(rows.map((row) => row.total_ms)),
        authMs: summarize(rows.map((row) => row.auth_ms)),
        retrievalMs: summarize(rows.map((row) => row.retrieval_ms)),
        rerankMs: summarize(rows.map((row) => row.rerank_ms)),
        generationMs: summarize(rows.map((row) => row.generation_ms)),
        firstTokenMs: summarize(rows.map((row) => row.first_token_ms)),
      },
      averageTokens: {
        input: summarize(rows.map((row) => row.llm_input_tokens)).average,
        output: summarize(rows.map((row) => row.llm_output_tokens)).average,
      },
      statusCounts,
      noAnswerRate:
        rows.length === 0 ? null : Number((rows.filter((row) => row.no_answer).length / rows.length).toFixed(3)),
      recent: rows.slice(0, 25).map((row) => ({
        requestId: row.request_id,
        workspaceId: row.workspace_id,
        status: row.status,
        totalMs: row.total_ms,
        retrievalMs: row.retrieval_ms,
        rerankMs: row.rerank_ms,
        generationMs: row.generation_ms,
        firstTokenMs: row.first_token_ms,
        chunkCount: row.chunk_count,
        citationCount: row.citation_count,
        noAnswer: row.no_answer,
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    return createPlatformErrorResponse(error, 'Unexpected performance metrics error');
  }
}
