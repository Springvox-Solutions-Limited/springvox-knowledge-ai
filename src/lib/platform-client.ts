import { apiFetch } from '@/src/lib/api-client';

/**
 * Thin wrapper kept for backwards compatibility with existing platform pages.
 * Delegates to the centralized {@link apiFetch} client (auth + token refresh).
 */
export async function fetchPlatformJson<T>(input: string, init?: RequestInit): Promise<T> {
  return apiFetch<T>(input, init);
}
