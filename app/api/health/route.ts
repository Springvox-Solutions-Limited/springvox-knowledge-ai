import { getSupabaseAdmin } from '@/src/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * Public liveness/readiness endpoint for uptime monitors. It never returns
 * provider errors, keys, or tenant data.
 */
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('workspaces')
      .select('id', { head: true, count: 'exact' })
      .limit(1);

    if (error) {
      return Response.json({ status: 'degraded' }, { status: 503 });
    }

    return Response.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  } catch {
    return Response.json({ status: 'degraded' }, { status: 503 });
  }
}
