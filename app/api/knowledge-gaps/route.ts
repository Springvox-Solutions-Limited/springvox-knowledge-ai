import { getAuthenticatedUserWithProfile, getSupabaseAdmin } from '@/src/lib/supabase-server';
import { KNOWLEDGE_GAP_STATUSES } from '@/src/lib/knowledge-gaps';
import { WORKSPACE_ADMIN_ROLES } from '@/src/lib/workspace';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { profile } = await getAuthenticatedUserWithProfile(req, WORKSPACE_ADMIN_ROLES);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('knowledge_gaps')
      .select('*')
      .eq('workspace_id', profile.workspace_id)
      .order('occurrence_count', { ascending: false })
      .order('last_asked_at', { ascending: false });

    if (error) {
      throw error;
    }

    return Response.json({ knowledgeGaps: data || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected knowledge gap error';
    const status =
      message === 'Unauthorized' || message === 'Missing bearer token'
        ? 401
        : message === 'Forbidden'
          ? 403
          : 500;

    console.error('Knowledge gaps GET error:', error);
    return Response.json({ error: message }, { status });
  }
}

export async function PATCH(req: Request) {
  try {
    const { user, profile } = await getAuthenticatedUserWithProfile(req, WORKSPACE_ADMIN_ROLES);
    const body = await req.json();
    const gapId = typeof body.id === 'string' ? body.id : '';
    const status = typeof body.status === 'string' ? body.status : '';
    const notes = typeof body.notes === 'string' ? body.notes.trim() : undefined;

    if (!gapId || !KNOWLEDGE_GAP_STATUSES.includes(status as (typeof KNOWLEDGE_GAP_STATUSES)[number])) {
      return Response.json({ error: 'Invalid knowledge gap update request' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const updatePayload: Record<string, string | null> = {
      status,
    };

    if (notes !== undefined) {
      updatePayload.notes = notes || null;
    }

    if (status === 'resolved') {
      updatePayload.resolved_at = new Date().toISOString();
      updatePayload.resolved_by = user.id;
    } else {
      updatePayload.resolved_at = null;
      updatePayload.resolved_by = null;
    }

    const { error } = await supabase
      .from('knowledge_gaps')
      .update(updatePayload)
      .eq('id', gapId)
      .eq('workspace_id', profile.workspace_id);

    if (error) {
      throw error;
    }

    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected knowledge gap update error';
    const status =
      message === 'Unauthorized' || message === 'Missing bearer token'
        ? 401
        : message === 'Forbidden'
          ? 403
          : 500;

    console.error('Knowledge gaps PATCH error:', error);
    return Response.json({ error: message }, { status });
  }
}
