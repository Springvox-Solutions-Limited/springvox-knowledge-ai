import { getRequestErrorStatus } from '@/src/lib/api-errors';
import { getAuthenticatedUserWithProfile, getSupabaseAdmin } from '@/src/lib/supabase-server';
import { WORKSPACE_ADMIN_ROLES } from '@/src/lib/workspace';

export const dynamic = 'force-dynamic';

async function assertEvalSet(workspaceId: string, evalSetId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('rag_eval_sets')
    .select('id')
    .eq('id', evalSetId)
    .eq('workspace_id', workspaceId)
    .maybeSingle();

  if (error || !data) throw error || new Error('Evaluation set not found');
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { profile } = await getAuthenticatedUserWithProfile(req, WORKSPACE_ADMIN_ROLES);
    const { id } = await params;
    await assertEvalSet(profile.workspace_id!, id);
    const body = await req.json();
    const question = typeof body.question === 'string' ? body.question.trim() : '';

    if (!question) {
      return Response.json({ error: 'Question is required' }, { status: 400 });
    }

    const toArray = (value: unknown) =>
      Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : [];

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('rag_eval_questions').insert({
      eval_set_id: id,
      question,
      expected_answer_notes:
        typeof body.expectedAnswerNotes === 'string' ? body.expectedAnswerNotes.trim() || null : null,
      expected_document_names: toArray(body.expectedDocumentNames),
      expected_keywords: toArray(body.expectedKeywords),
    });

    if (error) throw error;
    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected evaluation question error';
    return Response.json({ error: message }, { status: getRequestErrorStatus(message) });
  }
}
