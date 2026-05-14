import { requirePlatformAdminRequest, createPlatformErrorResponse } from '@/src/lib/platform-api';
import { getSupabaseAdmin } from '@/src/lib/supabase-server';
import { WORKSPACE_PLANS } from '@/src/lib/workspace';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requirePlatformAdminRequest(req);
    const { id } = await params;
    const body = await req.json();
    const plan = typeof body.plan === 'string' ? body.plan : '';

    if (!WORKSPACE_PLANS.includes(plan as (typeof WORKSPACE_PLANS)[number])) {
      return Response.json({ error: 'Invalid workspace plan' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('workspaces')
      .update({
        plan,
        plan_updated_at: now,
        updated_at: now,
      })
      .eq('id', id);

    if (error) {
      throw error;
    }

    return Response.json({ success: true });
  } catch (error) {
    return createPlatformErrorResponse(error, 'Unexpected workspace plan update error');
  }
}
