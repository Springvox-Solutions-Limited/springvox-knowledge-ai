import { getRequestErrorStatus } from '@/src/lib/api-errors';
import { getTenantNotifications } from '@/src/lib/notifications-server';
import { getAuthenticatedUserWithProfile } from '@/src/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { user, profile } = await getAuthenticatedUserWithProfile(req);
    const { searchParams } = new URL(req.url);
    const limitValue = Number(searchParams.get('limit'));
    const limit = Number.isFinite(limitValue) && limitValue > 0 ? Math.min(limitValue, 100) : undefined;
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const type = searchParams.get('type');

    const result = await getTenantNotifications({
      userId: user.id,
      profile,
      type,
      limit,
      unreadOnly,
    });

    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected notifications error';
    return Response.json({ error: message }, { status: getRequestErrorStatus(message) });
  }
}
