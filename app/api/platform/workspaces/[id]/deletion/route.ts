import { createPlatformErrorResponse, requirePlatformAdminRequest } from '@/src/lib/platform-api';
import {
  cancelWorkspaceDeletion,
  forceWorkspaceDeletion,
  scheduleWorkspaceDeletion,
} from '@/src/lib/platform-workspace-actions';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requirePlatformAdminRequest(req);
    const { id } = await params;
    const body = await req.json();
    const action = typeof body.action === 'string' ? body.action : '';

    if (action === 'schedule') {
      await scheduleWorkspaceDeletion({
        workspaceId: id,
        actorUserId: user.id,
        reason: typeof body.reason === 'string' ? body.reason : null,
      });
      return Response.json({ success: true });
    }

    if (action === 'cancel') {
      await cancelWorkspaceDeletion({ workspaceId: id, actorUserId: user.id });
      return Response.json({ success: true });
    }

    if (action === 'force') {
      await forceWorkspaceDeletion({
        workspaceId: id,
        actorUserId: user.id,
        confirmation: typeof body.confirmation === 'string' ? body.confirmation : '',
      });
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid deletion action' }, { status: 400 });
  } catch (error) {
    return createPlatformErrorResponse(error, 'Unexpected workspace deletion error');
  }
}
