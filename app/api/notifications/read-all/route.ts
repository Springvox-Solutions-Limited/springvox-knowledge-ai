import { getRequestErrorStatus } from '@/src/lib/api-errors';
import { markAllTenantNotificationsRead } from '@/src/lib/notifications-server';
import { getAuthenticatedUserWithProfile } from '@/src/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { user, profile } = await getAuthenticatedUserWithProfile(req);
    const body = await req.json().catch(() => ({}));
    const type = typeof body.type === 'string' ? body.type : null;
    const result = await markAllTenantNotificationsRead({
      userId: user.id,
      profile,
      type,
    });

    return Response.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected mark all notifications read error';
    return Response.json({ error: message }, { status: getRequestErrorStatus(message) });
  }
}
