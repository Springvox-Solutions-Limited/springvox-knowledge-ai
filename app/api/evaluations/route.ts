import { getRequestErrorStatus } from '@/src/lib/api-errors';
import { getAuthenticatedUserWithProfile, getSupabaseAdmin } from '@/src/lib/supabase-server';
import { WORKSPACE_ADMIN_ROLES } from '@/src/lib/workspace';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { profile } = await getAuthenticatedUserWithProfile(req, WORKSPACE_ADMIN_ROLES);
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('rag_eval_sets')
      .select('id, name, description, created_at, rag_eval_questions(id), rag_eval_runs(id, status, passed_questions, total_questions, average_confidence, average_latency_ms, created_at)')
      .eq('workspace_id', profile.workspace_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return Response.json({ evalSets: data || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected evaluations error';
    return Response.json({ error: message }, { status: getRequestErrorStatus(message) });
  }
}

export async function POST(req: Request) {
  try {
    const { user, profile } = await getAuthenticatedUserWithProfile(req, WORKSPACE_ADMIN_ROLES);
    const body = await req.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';

    if (!name) {
      return Response.json({ error: 'Evaluation name is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('rag_eval_sets')
      .insert({
        workspace_id: profile.workspace_id,
        name,
        description: description || null,
        created_by: user.id,
      })
      .select('id')
      .single();

    if (error || !data) throw error || new Error('Evaluation set could not be created');
    return Response.json({ success: true, id: data.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected evaluations error';
    return Response.json({ error: message }, { status: getRequestErrorStatus(message) });
  }
}
