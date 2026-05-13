import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

export const KNOWLEDGE_GAP_STATUSES = ['open', 'reviewed', 'resolved', 'ignored'] as const;

export type KnowledgeGapStatus = (typeof KNOWLEDGE_GAP_STATUSES)[number];

export function normalizeQuestionForGap(question: string) {
  return question
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, '')
    .replace(/\s+/g, ' ');
}

export async function upsertKnowledgeGap({
  supabase,
  workspaceId,
  userId,
  question,
  sampleAnswer,
}: {
  supabase: SupabaseClient;
  workspaceId: string;
  userId: string | null;
  question: string;
  sampleAnswer?: string | null;
}) {
  const normalizedQuestion = normalizeQuestionForGap(question);

  if (!normalizedQuestion) {
    return;
  }

  const { data: existingGap, error: lookupError } = await supabase
    .from('knowledge_gaps')
    .select('id, occurrence_count')
    .eq('workspace_id', workspaceId)
    .eq('normalized_question', normalizedQuestion)
    .maybeSingle();

  if (lookupError) {
    throw lookupError;
  }

  if (existingGap) {
    const { error: updateError } = await supabase
      .from('knowledge_gaps')
      .update({
        occurrence_count: Number(existingGap.occurrence_count || 0) + 1,
        last_asked_at: new Date().toISOString(),
        sample_answer: sampleAnswer || null,
      })
      .eq('id', existingGap.id);

    if (updateError) {
      throw updateError;
    }

    return;
  }

  const { error: insertError } = await supabase.from('knowledge_gaps').insert({
    workspace_id: workspaceId,
    user_id: userId,
    question: question.trim(),
    normalized_question: normalizedQuestion,
    status: 'open',
    occurrence_count: 1,
    sample_answer: sampleAnswer || null,
  });

  if (insertError) {
    throw insertError;
  }
}
