import { createPlatformErrorResponse, requirePlatformAdminRequest } from '@/src/lib/platform-api';
import { getSupabaseAdmin } from '@/src/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await requirePlatformAdminRequest(req);
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('system_events')
      .select('id, workspace_id, user_id, event_type, severity, message, metadata, created_at, workspaces(name, slug)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    return Response.json({ events: data || [] });
  } catch (error) {
    return createPlatformErrorResponse(error, 'Unexpected diagnostics error');
  }
}
