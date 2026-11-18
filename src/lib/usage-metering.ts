import 'server-only';

import { getSupabaseAdmin } from '@/src/lib/supabase-server';

export type WorkspaceUsageIncrement = {
  questions_count?: number;
  uploads_count?: number;
  documents_count?: number;
  storage_bytes?: number;
  embedding_calls?: number;
  embedding_tokens?: number;
  rerank_calls?: number;
  llm_calls?: number;
  llm_input_tokens?: number;
  llm_output_tokens?: number;
};

export function estimateTokens(text: string) {
  return Math.max(1, Math.ceil(text.length / 4));
}

export async function incrementWorkspaceUsage(workspaceId: string, increment: WorkspaceUsageIncrement) {
  const supabase = getSupabaseAdmin();
  const usageDate = new Date().toISOString().slice(0, 10);
  const { error } = await supabase.rpc('increment_workspace_usage_daily', {
    p_workspace_id: workspaceId,
    p_usage_date: usageDate,
    p_questions_count: increment.questions_count || 0,
    p_uploads_count: increment.uploads_count || 0,
    p_documents_count: increment.documents_count || 0,
    p_storage_bytes: increment.storage_bytes || 0,
    p_embedding_calls: increment.embedding_calls || 0,
    p_embedding_tokens: increment.embedding_tokens || 0,
    p_rerank_calls: increment.rerank_calls || 0,
    p_llm_calls: increment.llm_calls || 0,
    p_llm_input_tokens: increment.llm_input_tokens || 0,
    p_llm_output_tokens: increment.llm_output_tokens || 0,
  });

  if (error) {
    console.warn('[Usage] metering write failed:', error.message);
  }
}
