const PRODUCTION_FALLBACK = 'https://rekalliq.springvoxsl.com';

/**
 * Resolve the public app URL for emails and redirects.
 *
 * Priority: explicit NEXT_PUBLIC_APP_URL, Vercel's production URL, the
 * request origin, then the canonical production domain. Never returns
 * localhost in a deployed runtime unless it was explicitly configured.
 */
export function getAppUrl(request?: Request) {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '');
  if (configured) return configured;

  const vercelHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL;
  if (vercelHost) {
    return `https://${vercelHost.trim().replace(/\/$/, '')}`;
  }

  if (request) {
    try {
      return new URL(request.url).origin.replace(/\/$/, '');
    } catch {
      // Fall through to the canonical production domain.
    }
  }

  return PRODUCTION_FALLBACK;
}
