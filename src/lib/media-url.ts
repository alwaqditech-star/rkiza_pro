import { API_PROXY_PREFIX } from '@/lib/api-proxy';
import { getApiBaseUrl } from '@/lib/api-client';

/** Turn API-relative upload paths into URLs for <img src>. */
export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('blob:') || url.startsWith('data:')) return url;

  let path = url;
  if (/^https?:\/\//i.test(url)) {
    try {
      const parsed = new URL(url);
      path = `${parsed.pathname}${parsed.search}`;
    } catch {
      return url;
    }
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (normalizedPath.startsWith('/api/media/')) {
    if (typeof window !== 'undefined') {
      return `${API_PROXY_PREFIX}${normalizedPath.slice(4)}`;
    }
    return `${getApiBaseUrl()}${normalizedPath}`;
  }

  if (normalizedPath.startsWith('/uploads/')) {
    const base = getApiBaseUrl();
    return `${base}${normalizedPath}`;
  }

  return normalizedPath;
}
