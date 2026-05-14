import { requirePlatformAdminRequest, createPlatformErrorResponse } from '@/src/lib/platform-api';
import { getSupabaseAdmin } from '@/src/lib/supabase-server';
import { WORKSPACE_STATUSES } from '@/src/lib/workspace';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await requirePlatformAdminRequest(req);
    const { id } = await params;
    const body = await req.json();
    const status = typeof body.status === 'string' ? body.status : '';
    const suspensionReason =
      typeof body.suspension_reason === 'string' ? body.suspension_reason.trim() : null;

    if (!WORKSPACE_STATUSES.includes(status as (typeof WORKSPACE_STATUSES)[number])) {
      return Response.json({ error: 'Invalid workspace status' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();
    const payload = {
      status,
      suspension_reason: status === 'suspended' ? suspensionReason || null : null,
      suspended_at: status === 'suspended' ? now : null,
      suspended_by: status === 'suspended' ? user.id : null,
      updated_at: now,
    };

    const { error } = await supabase.from('workspaces').update(payload).eq('id', id);
    if (error) {
      throw error;
    }

    return Response.json({ success: true });
  } catch (error) {
    return createPlatformErrorResponse(error, 'Unexpected workspace status update error');
  }
}
