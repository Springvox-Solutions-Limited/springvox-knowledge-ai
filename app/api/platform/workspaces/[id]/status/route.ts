import { requirePlatformAdminRequest, createPlatformErrorResponse } from '@/src/lib/platform-api';
import { updatePlatformWorkspaceStatus } from '@/src/lib/platform-workspace-actions';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requirePlatformAdminRequest(req);
    const { id } = await params;
    const body = await req.json();
    const action = typeof body.action === 'string' ? body.action : '';
    const reason = typeof body.reason === 'string' ? body.reason.trim() : null;

    if (!['activate', 'suspend', 'expire'].includes(action)) {
      return Response.json({ error: 'Invalid workspace status action' }, { status: 400 });
    }

    await updatePlatformWorkspaceStatus({
      workspaceId: id,
      actorUserId: user.id,
      action: action as 'activate' | 'suspend' | 'expire',
      reason,
    });

    return Response.json({ success: true });
  } catch (error) {
    return createPlatformErrorResponse(error, 'Unexpected workspace status update error');
  }
}
