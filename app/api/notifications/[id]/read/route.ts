import { getRequestErrorStatus } from '@/src/lib/api-errors';
import { markTenantNotificationRead } from '@/src/lib/notifications-server';
import { getAuthenticatedUserWithProfile } from '@/src/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, profile } = await getAuthenticatedUserWithProfile(req);
    const { id } = await params;

    await markTenantNotificationRead({
      userId: user.id,
      profile,
      notificationId: id,
    });

    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected mark notification read error';
    return Response.json({ error: message }, { status: getRequestErrorStatus(message) });
  }
}
