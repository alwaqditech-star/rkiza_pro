import { invalidateCacheForMutation } from '@/lib/api-cache';
import { API_PROXY_PREFIX } from '@/lib/api-proxy';

/** مصدر البيانات — كل العمليات عبر هذا العنوان */
export const API_URL = 'https://rkiza-api.vercel.app';

export function getApiBaseUrl(): string {
  const fromEnv =
    (typeof window !== 'undefined'
      ? process.env.NEXT_PUBLIC_API_URL
      : process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL)?.trim();

  return (fromEnv || API_URL).replace(/\/$/, '');
}

function normalizeApiPath(path: string): string {
  let normalized = path.startsWith('/') ? path : `/${path}`;
  if (!normalized.startsWith('/api/')) {
    normalized = `/api${normalized}`;
  }
  return normalized;
}

/**
 * في المتصفح: طلبات عبر BFF (/api/proxy) — التوكن يبقى في httpOnly cookie فقط.
 * على الخادم: اتصال مباشر بـ API الخارجي.
 */
export function apiUrl(path: string): string {
  const normalized = normalizeApiPath(path);

  if (typeof window !== 'undefined') {
    return `${API_PROXY_PREFIX}${normalized.slice(4)}`;
  }

  return `${getApiBaseUrl()}${normalized}`;
}

/** طلب API موحّد — GET / POST / PUT / DELETE */
export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);

  if (
    init.body &&
    !headers.has('Content-Type') &&
    typeof init.body === 'string'
  ) {
    headers.set('Content-Type', 'application/json');
  }

  const method = (init.method ?? 'GET').toUpperCase();
  const response = await fetch(apiUrl(path), {
    ...init,
    headers,
    credentials: 'same-origin',
  });

  if (method !== 'GET' && method !== 'HEAD' && response.ok) {
    invalidateCacheForMutation(path);
  }

  if (response.status === 401 && typeof window !== 'undefined') {
    const { clearSessionCookie } = await import('@/lib/session-bridge');
    await clearSessionCookie().catch(() => undefined);
    window.location.assign('/');
  }

  return response;
}
