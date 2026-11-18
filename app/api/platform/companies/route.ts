import { requirePlatformAdminRequest, createPlatformErrorResponse } from '@/src/lib/platform-api';
import { getPlatformCompanies } from '@/src/lib/platform-server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await requirePlatformAdminRequest(req);
    const { searchParams } = new URL(req.url);
    const companies = await getPlatformCompanies({
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      plan: searchParams.get('plan') || undefined,
    });

    return Response.json({ companies });
  } catch (error) {
    return createPlatformErrorResponse(error, 'Unexpected platform companies error');
  }
}
