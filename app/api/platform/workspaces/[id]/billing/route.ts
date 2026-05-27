import { requirePlatformAdminRequest, createPlatformErrorResponse } from '@/src/lib/platform-api';
import { updatePlatformWorkspaceBilling } from '@/src/lib/platform-workspace-actions';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requirePlatformAdminRequest(req);
    const { id } = await params;
    const body = await req.json();
    const action = typeof body.action === 'string' ? body.action : '';

    if (!['paid_active', 'past_due'].includes(action)) {
      return Response.json({ error: 'Invalid billing action' }, { status: 400 });
    }

    await updatePlatformWorkspaceBilling({
      workspaceId: id,
      actorUserId: user.id,
      action: action as 'paid_active' | 'past_due',
    });

    return Response.json({ success: true });
  } catch (error) {
    return createPlatformErrorResponse(error, 'Unexpected billing update error');
  }
}
