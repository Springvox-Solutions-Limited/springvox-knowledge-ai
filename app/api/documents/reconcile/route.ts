import { getRequestErrorStatus } from '@/src/lib/api-errors';
import { getAuthenticatedUserWithProfile, getSupabaseAdmin } from '@/src/lib/supabase-server';
import { WORKSPACE_ADMIN_ROLES } from '@/src/lib/workspace';

export const dynamic = 'force-dynamic';

// Documents normally finish processing within a few minutes. If one is still
// "processing" well past that, the background worker likely never ran (e.g.
// Inngest not connected) — so we fail it with a clear message instead of
// leaving it stuck forever. The admin can then simply re-upload.
const STUCK_AFTER_MS = 10 * 60 * 1000;

export async function POST(req: Request) {
  try {
    const { profile } = await getAuthenticatedUserWithProfile(req, WORKSPACE_ADMIN_ROLES);
    const supabase = getSupabaseAdmin();
    const cutoff = new Date(Date.now() - STUCK_AFTER_MS).toISOString();

    const { data, error } = await supabase
      .from('documents')
      .update({
        status: 'failed',
        error_message: 'Processing timed out. Please re-upload this document.',
      })
      .eq('workspace_id', profile.workspace_id)
      .eq('status', 'processing')
      .lt('created_at', cutoff)
      .select('id');

    if (error) throw error;

    return Response.json({ success: true, reconciled: data?.length ?? 0 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected reconcile error';
    return Response.json({ error: message }, { status: getRequestErrorStatus(message) });
  }
}
