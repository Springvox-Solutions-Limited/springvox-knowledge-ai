import { requirePlatformAdminRequest, createPlatformErrorResponse } from '@/src/lib/platform-api';
import { getPlatformSummary } from '@/src/lib/platform-server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await requirePlatformAdminRequest(req);
    const analytics = await getPlatformSummary();
    return Response.json(analytics);
  } catch (error) {
    return createPlatformErrorResponse(error, 'Unexpected platform analytics error');
  }
}
