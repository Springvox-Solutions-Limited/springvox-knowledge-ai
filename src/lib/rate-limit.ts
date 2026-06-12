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

  // Best-effort, non-blocking cleanup of expired rows (~5% of calls) so the
  // table stays small without adding a delete to every hot-path request.
  if (Math.random() < 0.05) {
    void supabase
      .from('rate_limits')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .then(({ error }) => {
        if (error) console.warn('[RateLimit] cleanup failed:', error.message);
      });
  }

  // Atomic increment via SQL upsert (see sql/phase6_atomic_rate_limit.sql).
  // This avoids the TOCTOU race where two concurrent requests both read the
  // same count and each believe they are under the limit.
  const { data: countData, error: rpcError } = await supabase.rpc('check_and_increment_rate_limit', {
    p_key: key,
    p_scope: scope,
    p_window_start: windowStartIso,
    p_expires_at: expiresAtIso,
  });

  if (rpcError) {
    console.warn('[RateLimit] atomic increment failed:', rpcError.message);
    // Fail open so a transient DB issue never locks legitimate users out.
    return { allowed: true, limit, remaining: limit - 1, retryAfter: windowSeconds };
  }

  const nextCount = typeof countData === 'number' ? countData : 1;

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
