import { getAccessToken } from '@/src/lib/auth-client';

export async function fetchPlatformJson<T>(input: string, init?: RequestInit): Promise<T> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new Error('Authentication session expired');
  }

  const headers = new Headers(init?.headers);
  headers.set('Authorization', `Bearer ${accessToken}`);

  if (init?.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(input, {
    ...init,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data as T;
}
