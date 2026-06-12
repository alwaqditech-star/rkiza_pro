import { ensureApiToken, getApiToken } from '@/lib/session-bridge';

/** مصدر البيانات — كل العمليات عبر هذا العنوان */
export const API_URL = 'https://rkiza-api.vercel.app';
export function getApiBaseUrl(): string {
  const fromEnv =
    (typeof window !== 'undefined'
      ? process.env.NEXT_PUBLIC_API_URL
      : process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL)?.trim();

  return (fromEnv || API_URL).replace(/\/$/, '');
}

/** يبني رابطاً كاملاً: /client/dashboard → https://rkiza-api.vercel.app/api/client/dashboard */
export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  let normalized = path.startsWith('/') ? path : `/${path}`;
  if (!normalized.startsWith('/api/')) {
    normalized = `/api${normalized}`;
  }
  return `${base}${normalized}`;
}

function readBearerToken(): string | null {
  return getApiToken();
}

/** طلب API موحّد — GET / POST / PUT / DELETE */
export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  if (typeof window !== 'undefined') {
    await ensureApiToken();
  }

  const headers = new Headers(init.headers);

  if (
    init.body &&
    !headers.has('Content-Type') &&
    typeof init.body === 'string'
  ) {
    headers.set('Content-Type', 'application/json');
  }

  const token = readBearerToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(apiUrl(path), {
    ...init,
    headers,
    credentials: 'include',
  });
}
