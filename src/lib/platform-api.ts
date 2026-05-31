import 'server-only';

import { getRequestErrorStatus } from '@/src/lib/api-errors';
import { assertRateLimit, BETA_RATE_LIMITS, maybeRateLimitResponse } from '@/src/lib/rate-limit';
import { getAuthenticatedUserWithAnyProfile } from '@/src/lib/supabase-server';
import { isPlatformAdminRole } from '@/src/lib/workspace';

export async function requirePlatformAdminRequest(request: Request) {
  const auth = await getAuthenticatedUserWithAnyProfile(request);

  if (!isPlatformAdminRole(auth.profile.role)) {
    throw new Error('Forbidden');
  }

  await assertRateLimit({
    key: auth.user.id,
    scope: 'platform',
    ...BETA_RATE_LIMITS.platform,
    userId: auth.user.id,
    workspaceId: auth.profile.workspace_id,
  });

  return auth;
}

export function createPlatformErrorResponse(error: unknown, fallbackMessage: string) {
  const rateLimit = maybeRateLimitResponse(error);
  if (rateLimit) return rateLimit;

  const message = error instanceof Error ? error.message : fallbackMessage;
  return Response.json({ error: message }, { status: getRequestErrorStatus(message) });
}
