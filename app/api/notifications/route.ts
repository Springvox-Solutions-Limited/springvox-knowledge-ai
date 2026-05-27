import { getRequestErrorStatus } from '@/src/lib/api-errors';
import { getAuthenticatedUserWithProfile, getSupabaseAdmin } from '@/src/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { profile } = await getAuthenticatedUserWithProfile(req);
    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('platform_notifications')
      .select('id, type, title, message, channel, created_at')
      .or(`workspace_id.is.null,workspace_id.eq.${profile.workspace_id}`)
      .in('channel', ['in_app', 'both'])
      .eq('status', 'sent')
      .or(`scheduled_for.is.null,scheduled_for.lte.${now}`)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;
    return Response.json({ notifications: data || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected notifications error';
    return Response.json({ error: message }, { status: getRequestErrorStatus(message) });
  }
}
