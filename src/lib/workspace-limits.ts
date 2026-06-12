import 'server-only';

import { getSupabaseAdmin } from '@/src/lib/supabase-server';

export type WorkspaceLimits = {
  monthly_question_limit: number | null;
  daily_upload_limit: number | null;
  storage_byte_limit: number | null;
  monthly_llm_token_limit: number | null;
};

export type LimitKind = 'questions' | 'uploads' | 'storage' | 'llm_tokens';

export class LimitExceededError extends Error {
  kind: LimitKind;
  limit: number;
  used: number;

  constructor(kind: LimitKind, limit: number, used: number, message: string) {
    super(message);
    this.name = 'LimitExceededError';
    this.kind = kind;
    this.limit = limit;
    this.used = used;
  }
}

function startOfMonthIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

export async function getWorkspaceLimits(workspaceId: string): Promise<WorkspaceLimits | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('workspace_limits')
    .select('monthly_question_limit, daily_upload_limit, storage_byte_limit, monthly_llm_token_limit')
    .eq('workspace_id', workspaceId)
    .maybeSingle();

  if (error || !data) return null;
  return data as WorkspaceLimits;
}

/**
 * Enforce a configured workspace limit. Fails open: if no limit is set, the row
 * is missing, or a query fails, the operation is allowed (never locks anyone out
 * due to a transient issue or unconfigured workspace).
 *
 * @param additionalBytes for the 'storage' kind, the size of the file about to be added.
 */
export async function assertWorkspaceLimit(
  workspaceId: string,
  kind: LimitKind,
  additionalBytes = 0,
): Promise<void> {
  try {
    const limits = await getWorkspaceLimits(workspaceId);
    if (!limits) return;

    const supabase = getSupabaseAdmin();

    if (kind === 'questions' && limits.monthly_question_limit != null) {
      const { data } = await supabase
        .from('workspace_usage_daily')
        .select('questions_count')
        .eq('workspace_id', workspaceId)
        .gte('usage_date', startOfMonthIso());
      const used = (data || []).reduce((sum, row) => sum + (row.questions_count || 0), 0);
      if (used >= limits.monthly_question_limit) {
        throw new LimitExceededError(
          kind,
          limits.monthly_question_limit,
          used,
          'This workspace has reached its monthly question limit. Contact your administrator to raise it.',
        );
      }
    }

    if (kind === 'uploads' && limits.daily_upload_limit != null) {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from('workspace_usage_daily')
        .select('uploads_count')
        .eq('workspace_id', workspaceId)
        .eq('usage_date', today)
        .maybeSingle();
      const used = data?.uploads_count || 0;
      if (used >= limits.daily_upload_limit) {
        throw new LimitExceededError(
          kind,
          limits.daily_upload_limit,
          used,
          'This workspace has reached its daily upload limit. Try again tomorrow or contact your administrator.',
        );
      }
    }

    if (kind === 'storage' && limits.storage_byte_limit != null) {
      const { data } = await supabase
        .from('workspace_usage_daily')
        .select('storage_bytes')
        .eq('workspace_id', workspaceId);
      const used = (data || []).reduce((sum, row) => sum + (row.storage_bytes || 0), 0);
      if (used + additionalBytes > limits.storage_byte_limit) {
        throw new LimitExceededError(
          kind,
          limits.storage_byte_limit,
          used,
          'This workspace has reached its storage limit. Contact your administrator to raise it.',
        );
      }
    }

    if (kind === 'llm_tokens' && limits.monthly_llm_token_limit != null) {
      const { data } = await supabase
        .from('workspace_usage_daily')
        .select('llm_input_tokens, llm_output_tokens')
        .eq('workspace_id', workspaceId)
        .gte('usage_date', startOfMonthIso());
      const used = (data || []).reduce(
        (sum, row) => sum + (row.llm_input_tokens || 0) + (row.llm_output_tokens || 0),
        0,
      );
      if (used >= limits.monthly_llm_token_limit) {
        throw new LimitExceededError(
          kind,
          limits.monthly_llm_token_limit,
          used,
          'This workspace has reached its monthly AI usage limit. Contact your administrator to raise it.',
        );
      }
    }
  } catch (error) {
    if (error instanceof LimitExceededError) throw error;
    // Any unexpected failure (DB, etc.) fails open.
    console.warn('[Limits] check skipped:', error instanceof Error ? error.message : error);
  }
}

export function maybeLimitResponse(error: unknown): Response | null {
  if (error instanceof LimitExceededError) {
    return Response.json({ error: error.message, code: 'limit_exceeded', kind: error.kind }, { status: 429 });
  }
  return null;
}
