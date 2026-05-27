import { requirePlatformAdminRequest, createPlatformErrorResponse } from '@/src/lib/platform-api';
import { extendPlatformWorkspaceTrial } from '@/src/lib/platform-workspace-actions';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requirePlatformAdminRequest(req);
    const { id } = await params;
    const body = await req.json();
    const days = Number(body.days);

    if (days !== 7 && days !== 14) {
      return Response.json({ error: 'Trial extension must be 7 or 14 days' }, { status: 400 });
    }

    await extendPlatformWorkspaceTrial({
      workspaceId: id,
      actorUserId: user.id,
      days,
    });

    return Response.json({ success: true });
  } catch (error) {
    return createPlatformErrorResponse(error, 'Unexpected trial update error');
  }
}
