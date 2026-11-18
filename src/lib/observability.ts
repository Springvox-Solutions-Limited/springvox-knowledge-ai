import 'server-only';

import { getSupabaseAdmin } from '@/src/lib/supabase-server';

export type ChatMetricStatus =
  | 'completed'
  | 'no_answer'
  | 'small_talk'
  | 'no_documents'
  | 'aborted'
  | 'error';

export type ChatRequestMetric = {
  requestId: string;
  workspaceId: string | null;
  userId: string | null;
  sessionId: string | null;
  status: ChatMetricStatus;
  totalMs: number;
  authMs: number | null;
  retrievalMs: number | null;
  rerankMs: number | null;
  generationMs: number | null;
  firstTokenMs: number | null;
  llmInputTokens: number | null;
  llmOutputTokens: number | null;
  chunkCount: number;
  citationCount: number;
  noAnswer: boolean;
  errorCode?: string | null;
};

/**
 * Correlation id for one API request. Always server-generated: a caller-supplied
 * id could collide with another request or poison the metrics table.
 */
export function getRequestId() {
  return crypto.randomUUID();
}

/**
 * Structured performance log. Keep this free of question text, document text,
 * tokens, and any user-identifying payload; use ids and counters only.
 */
export function logPerformance(event: string, data: Record<string, unknown>) {
  console.info(
    JSON.stringify({
      level: 'info',
      kind: 'performance',
      event,
      at: new Date().toISOString(),
      ...data,
    }),
  );
}

/**
 * Best-effort metric persistence. A missing migration or transient database
 * issue must never fail the user's answer, so failures are logged and dropped.
 */
export async function recordChatRequestMetric(metric: ChatRequestMetric) {
  if (process.env.PERF_METRICS_DISABLED === '1') return;

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('chat_request_metrics').insert({
      request_id: metric.requestId,
      workspace_id: metric.workspaceId,
      user_id: metric.userId,
      session_id: metric.sessionId,
      status: metric.status,
      total_ms: Math.max(0, Math.round(metric.totalMs)),
      auth_ms: metric.authMs === null ? null : Math.max(0, Math.round(metric.authMs)),
      retrieval_ms:
        metric.retrievalMs === null ? null : Math.max(0, Math.round(metric.retrievalMs)),
      rerank_ms: metric.rerankMs === null ? null : Math.max(0, Math.round(metric.rerankMs)),
      generation_ms:
        metric.generationMs === null ? null : Math.max(0, Math.round(metric.generationMs)),
      first_token_ms:
        metric.firstTokenMs === null ? null : Math.max(0, Math.round(metric.firstTokenMs)),
      llm_input_tokens: metric.llmInputTokens,
      llm_output_tokens: metric.llmOutputTokens,
      chunk_count: metric.chunkCount,
      citation_count: metric.citationCount,
      no_answer: metric.noAnswer,
      error_code: metric.errorCode || null,
    });

    if (error && error.code !== '23505') {
      console.warn('[Perf] chat metric write failed:', error.message);
    }
  } catch (error) {
    console.warn(
      '[Perf] chat metric unavailable:',
      error instanceof Error ? error.message : 'Unknown error',
    );
  }
}
