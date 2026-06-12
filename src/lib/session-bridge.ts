const API_TOKEN_KEY = 'rikaz_api_token';

let hydratePromise: Promise<void> | null = null;

export function storeApiToken(token: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(API_TOKEN_KEY, token);
}

export function getApiToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(API_TOKEN_KEY);
}

export function clearApiToken(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(API_TOKEN_KEY);
  hydratePromise = null;
}

/** يحفظ التوكن في كوكي الواجهة (للـ middleware) وفي sessionStorage (لطلبات API) */
export async function syncSessionCookie(token: string): Promise<void> {
  storeApiToken(token);
  const res = await fetch('/api/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ token }),
  });
  if (!res.ok) {
    const json = (await res.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new Error(
      json?.message ||
        'فشل حفظ الجلسة — تأكد من تطابق JWT_SECRET بين rkiza-pro و rkiza-api على Vercel',
    );
  }
}

/** يستعيد التوكن من كوكي الواجهة بعد إعادة تحميل الصفحة */
export async function hydrateApiTokenFromSession(): Promise<void> {
  if (typeof window === 'undefined' || getApiToken()) return;

  const res = await fetch('/api/session/token', { credentials: 'same-origin' });
  if (!res.ok) return;

  const json = (await res.json()) as { token?: string };
  if (json.token) {
    storeApiToken(json.token);
  }
}

/** يضمن وجود التوكن قبل أي طلب cross-origin إلى rkiza-api */
export async function ensureApiToken(initialToken?: string | null): Promise<void> {
  if (typeof window === 'undefined') return;
  if (getApiToken()) return;

  if (initialToken) {
    storeApiToken(initialToken);
    return;
  }

  if (!hydratePromise) {
    hydratePromise = hydrateApiTokenFromSession().finally(() => {
      hydratePromise = null;
    });
  }

  await hydratePromise;
}

export async function clearSessionCookie(): Promise<void> {
  clearApiToken();
  await fetch('/api/session', { method: 'DELETE', credentials: 'same-origin' });
}
