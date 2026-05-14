import { requirePlatformAdminRequest, createPlatformErrorResponse } from '@/src/lib/platform-api';
import { getPlatformCompanyDetail } from '@/src/lib/platform-server';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requirePlatformAdminRequest(req);
    const { id } = await params;
    const company = await getPlatformCompanyDetail(id);
    return Response.json(company);
  } catch (error) {
    return createPlatformErrorResponse(error, 'Unexpected platform company detail error');
  }
}
