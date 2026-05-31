import 'server-only';

import { getSupabaseAdmin } from '@/src/lib/supabase-server';
import { logSystemEvent } from '@/src/lib/system-events';

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfter: number;
};

export class RateLimitError extends Error {
  result: RateLimitResult;

  constructor(result: RateLimitResult) {
    super('Rate limit exceeded. Please try again later.');
    this.name = 'RateLimitError';
    this.result = result;
  }
}

export const BETA_RATE_LIMITS = {
  chat: { limit: 30, windowSeconds: 10 * 60 },
  upload: { limit: 20, windowSeconds: 60 * 60 },
  signup: { limit: 5, windowSeconds: 60 * 60 },
  notifications: { limit: 20, windowSeconds: 60 * 60 },
  platform: { limit: 120, windowSeconds: 10 * 60 },
  document_delete: { limit: 30, windowSeconds: 60 * 60 },
} as const;

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return (
    forwardedFor ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'
  );
}

function getWindowStart(windowSeconds: number) {
  const now = Math.floor(Date.now() / 1000);
  return new Date(Math.floor(now / windowSeconds) * windowSeconds * 1000);
}

export async function checkRateLimit({
  key,
  scope,
  limit,
  windowSeconds,
  workspaceId,
  userId,
}: {
  key: string;
  scope: string;
  limit: number;
  windowSeconds: number;
  workspaceId?: string | null;
  userId?: string | null;
}): Promise<RateLimitResult> {
  const supabase = getSupabaseAdmin();
  const windowStart = getWindowStart(windowSeconds);
  const expiresAt = new Date(windowStart.getTime() + windowSeconds * 1000);
  const windowStartIso = windowStart.toISOString();
  const expiresAtIso = expiresAt.toISOString();

  await supabase.from('rate_limits').delete().lt('expires_at', new Date().toISOString());

  const { data: existing, error: selectError } = await supabase
    .from('rate_limits')
    .select('id, count')
    .eq('key', key)
    .eq('scope', scope)
    .eq('window_start', windowStartIso)
    .maybeSingle();

  if (selectError) {
    console.warn('[RateLimit] select failed:', selectError.message);
    return { allowed: true, limit, remaining: limit - 1, retryAfter: windowSeconds };
  }

  const nextCount = (existing?.count || 0) + 1;

  if (existing) {
    const { error } = await supabase
      .from('rate_limits')
      .update({ count: nextCount, expires_at: expiresAtIso })
      .eq('id', existing.id);

    if (error) {
      console.warn('[RateLimit] update failed:', error.message);
    }
  } else {
    const { error } = await supabase.from('rate_limits').insert({
      key,
      scope,
      count: nextCount,
      window_start: windowStartIso,
      expires_at: expiresAtIso,
    });

    if (error) {
      console.warn('[RateLimit] insert failed:', error.message);
    }
  }

  const retryAfter = Math.max(1, Math.ceil((expiresAt.getTime() - Date.now()) / 1000));
  const result = {
    allowed: nextCount <= limit,
    limit,
    remaining: Math.max(0, limit - nextCount),
    retryAfter,
  };

  if (!result.allowed) {
    await logSystemEvent({
      workspaceId,
      userId,
      eventType: 'rate_limit.exceeded',
      severity: 'warning',
      message: `Rate limit exceeded for ${scope}.`,
      metadata: { scope, limit, retry_after: retryAfter },
    });
  }

  return result;
}

export async function assertRateLimit(options: Parameters<typeof checkRateLimit>[0]) {
  const result = await checkRateLimit(options);

  if (!result.allowed) {
    throw new RateLimitError(result);
  }

  return result;
}

export function rateLimitHeaders(result: RateLimitResult) {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'Retry-After': String(result.retryAfter),
  };
}

export function rateLimitResponse(error: RateLimitError) {
  return Response.json(
    { error: error.message },
    {
      status: 429,
      headers: rateLimitHeaders(error.result),
    },
  );
}

export function maybeRateLimitResponse(error: unknown) {
  return error instanceof RateLimitError ? rateLimitResponse(error) : null;
}
