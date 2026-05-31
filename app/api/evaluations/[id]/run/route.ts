import { getRequestErrorStatus } from '@/src/lib/api-errors';
import { getAuthenticatedUserWithProfile, getSupabaseAdmin } from '@/src/lib/supabase-server';
import { WORKSPACE_ADMIN_ROLES } from '@/src/lib/workspace';

export const dynamic = 'force-dynamic';

function includesAny(text: string, values: string[]) {
  const normalized = text.toLowerCase();
  return values.some((value) => normalized.includes(value.toLowerCase()));
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, profile } = await getAuthenticatedUserWithProfile(req, WORKSPACE_ADMIN_ROLES);
    const { id } = await params;
    const supabase = getSupabaseAdmin();

    const { data: evalSet, error: evalError } = await supabase
      .from('rag_eval_sets')
      .select('id')
      .eq('id', id)
      .eq('workspace_id', profile.workspace_id)
      .maybeSingle();

    if (evalError || !evalSet) throw evalError || new Error('Evaluation set not found');

    const { data: questions, error: questionError } = await supabase
      .from('rag_eval_questions')
      .select('id, question, expected_document_names, expected_keywords')
      .eq('eval_set_id', id);

    if (questionError) throw questionError;

    const { data: run, error: runError } = await supabase
      .from('rag_eval_runs')
      .insert({
        eval_set_id: id,
        run_by: user.id,
        status: 'running',
        total_questions: questions?.length || 0,
      })
      .select('id')
      .single();

    if (runError || !run) throw runError || new Error('Evaluation run could not be created');

    let passed = 0;
    let latencyTotal = 0;

    for (const question of questions || []) {
      const startedAt = Date.now();
      const terms = [...(question.expected_keywords || []), question.question]
        .join(' ')
        .split(/\s+/)
        .map((term) => term.replace(/[^\w.-]/g, '').trim())
        .filter((term) => term.length >= 4)
        .slice(0, 8);

      const { data: chunks } = await supabase
        .from('document_chunks')
        .select('chunk_text, documents!inner(filename)')
        .eq('workspace_id', profile.workspace_id)
        .or(terms.map((term) => `chunk_text.ilike.%${term}%`).join(','))
        .limit(8);

      const retrievedDocumentNames = Array.from(
        new Set(
          ((chunks || []) as any[])
            .map((chunk) => {
              const document = Array.isArray(chunk.documents) ? chunk.documents[0] : chunk.documents;
              return document?.filename;
            })
            .filter(Boolean),
        ),
      );
      const combinedText = ((chunks || []) as any[]).map((chunk) => chunk.chunk_text).join('\n');
      const matchedExpectedDocuments =
        !question.expected_document_names?.length ||
        question.expected_document_names.some((name: string) => includesAny(retrievedDocumentNames.join(' '), [name]));
      const matchedExpectedKeywords =
        !question.expected_keywords?.length || includesAny(combinedText, question.expected_keywords);
      const score = Number(matchedExpectedDocuments) * 0.5 + Number(matchedExpectedKeywords) * 0.5;
      if (score >= 0.5) passed += 1;
      const latencyMs = Date.now() - startedAt;
      latencyTotal += latencyMs;

      await supabase.from('rag_eval_results').insert({
        run_id: run.id,
        question_id: question.id,
        answer: combinedText.slice(0, 1200),
        confidence: score >= 1 ? 'high' : score >= 0.5 ? 'medium' : 'low',
        retrieved_document_names: retrievedDocumentNames,
        matched_expected_documents: matchedExpectedDocuments,
        matched_expected_keywords: matchedExpectedKeywords,
        latency_ms: latencyMs,
        score,
      });
    }

    const total = questions?.length || 0;
    const { error: updateError } = await supabase
      .from('rag_eval_runs')
      .update({
        status: 'completed',
        passed_questions: passed,
        average_latency_ms: total ? Math.round(latencyTotal / total) : 0,
        average_confidence: total ? passed / total : 0,
        completed_at: new Date().toISOString(),
      })
      .eq('id', run.id);

    if (updateError) throw updateError;
    return Response.json({ success: true, runId: run.id, passed, total });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected evaluation run error';
    return Response.json({ error: message }, { status: getRequestErrorStatus(message) });
  }
}
