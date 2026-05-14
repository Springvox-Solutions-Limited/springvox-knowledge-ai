import 'server-only';

import { getRequestErrorStatus } from '@/src/lib/api-errors';
import { getAuthenticatedUserWithAnyProfile } from '@/src/lib/supabase-server';
import { isPlatformAdminRole } from '@/src/lib/workspace';

export async function requirePlatformAdminRequest(request: Request) {
  const auth = await getAuthenticatedUserWithAnyProfile(request);

  if (!isPlatformAdminRole(auth.profile.role)) {
    throw new Error('Forbidden');
  }

  return auth;
}

export function createPlatformErrorResponse(error: unknown, fallbackMessage: string) {
  const message = error instanceof Error ? error.message : fallbackMessage;
  return Response.json({ error: message }, { status: getRequestErrorStatus(message) });
}
