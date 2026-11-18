import { requirePlatformAdminRequest, createPlatformErrorResponse } from '@/src/lib/platform-api';
import { getPlatformPlans } from '@/src/lib/platform-server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await requirePlatformAdminRequest(req);
    const plans = await getPlatformPlans();
    return Response.json({ plans });
  } catch (error) {
    return createPlatformErrorResponse(error, 'Unexpected platform plans error');
  }
}
