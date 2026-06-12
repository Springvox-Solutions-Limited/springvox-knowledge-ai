import { supabase } from '@/src/lib/supabase';
import { ApiError } from '@/src/lib/api-error';

/**
 * Centralized browser API client for Rekall-IQ.
 *
 * - Attaches the current Supabase access token to every request.
 * - On a 401, refreshes the session once and retries; concurrent calls that
 *   hit a 401 during a refresh wait for the single in-flight refresh rather
 *   than each firing their own.
 * - On a hard auth failure, signs out and redirects to /login.
 *
 * Replaces the repeated `getAccessToken()` + manual `Authorization` header
 * blocks scattered across pages.
 */

let refreshPromise: Promise<string | null> | null = null;

async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function refreshToken(): Promise<string | null> {
  // Collapse concurrent refreshes into one.
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const { data, error } = await supabase.auth.refreshSession();
        if (error) return null;
        return data.session?.access_token ?? null;
      } catch {
        return null;
      } finally {
        // Allow the next refresh after this settles.
        setTimeout(() => {
          refreshPromise = null;
        }, 0);
      }
    })();
  }
  return refreshPromise;
}

function redirectToLogin() {
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    window.location.href = '/login';
  }
}

function buildHeaders(init: RequestInit | undefined, token: string | null): Headers {
  const headers = new Headers(init?.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init?.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return headers;
}

export interface ApiFetchOptions extends RequestInit {
  /** When true, returns the raw Response (for streaming endpoints like chat). */
  raw?: boolean;
}

/**
 * Fetch JSON from a Rekall-IQ API route with auth + refresh handling.
 * Throws {@link ApiError} on a non-OK response.
 */
export async function apiFetch<T = unknown>(input: string, init?: ApiFetchOptions): Promise<T> {
  const response = await apiFetchRaw(input, init);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      (data as { error?: string }).error || 'Request failed',
      response.status,
      (data as { code?: string }).code,
    );
  }

  return data as T;
}

/**
 * Lower-level variant that returns the raw Response (use for SSE / streaming
 * routes such as /api/chat where the body must not be JSON-parsed).
 */
export async function apiFetchRaw(input: string, init?: ApiFetchOptions): Promise<Response> {
  let token = await getToken();

  let response = await fetch(input, { ...init, headers: buildHeaders(init, token) });

  if (response.status === 401) {
    token = await refreshToken();
    if (!token) {
      redirectToLogin();
      throw new ApiError('Your session has expired. Please sign in again.', 401);
    }
    response = await fetch(input, { ...init, headers: buildHeaders(init, token) });
    if (response.status === 401) {
      redirectToLogin();
      throw new ApiError('Your session has expired. Please sign in again.', 401);
    }
  }

  return response;
}
