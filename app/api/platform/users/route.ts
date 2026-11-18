import { requirePlatformAdminRequest, createPlatformErrorResponse } from '@/src/lib/platform-api';
import { getPlatformUsers } from '@/src/lib/platform-server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await requirePlatformAdminRequest(req);
    const { searchParams } = new URL(req.url);
    const users = await getPlatformUsers({
      search: searchParams.get('search') || undefined,
      role: searchParams.get('role') || undefined,
      workspaceId: searchParams.get('workspaceId') || undefined,
      status: searchParams.get('status') || undefined,
    });

    return Response.json({ users });
  } catch (error) {
    return createPlatformErrorResponse(error, 'Unexpected platform users error');
  }
}
