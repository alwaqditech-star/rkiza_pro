import { getApiBaseUrl } from '@/lib/api-client';

/** Turn API-relative upload paths into absolute URLs for <img src>. */
export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('blob:') || url.startsWith('data:')) return url;
  if (/^https?:\/\//i.test(url)) return url;
  const base = getApiBaseUrl();
  return `${base}${url.startsWith('/') ? url : `/${url}`}`;
}
