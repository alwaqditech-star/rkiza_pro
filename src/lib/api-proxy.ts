export const API_PROXY_PREFIX = '/api/proxy';

const API_BASE = (
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://rkiza-api.vercel.app'
).replace(/\/$/, '');

const ALLOWED_API_ROOTS = new Set(['auth', 'client', 'admin', 'theme']);

const FORWARD_REQUEST_HEADERS = ['content-type', 'accept', 'accept-language'];

const FORWARD_RESPONSE_HEADERS = [
  'content-type',
  'content-disposition',
  'cache-control',
  'content-length',
];

export function getUpstreamApiBase(): string {
  return API_BASE;
}

export function buildProxyTarget(pathSegments: string[], search: string): string | null {
  if (!pathSegments.length) return null;
  if (pathSegments.some((segment) => segment.includes('..') || segment.includes('\\'))) {
    return null;
  }
  if (!ALLOWED_API_ROOTS.has(pathSegments[0])) return null;

  const url = new URL(`/api/${pathSegments.join('/')}`, API_BASE);
  url.search = search;
  return url.toString();
}

export function pickForwardRequestHeaders(request: Request): Headers {
  const headers = new Headers();
  for (const name of FORWARD_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  return headers;
}

export function pickForwardResponseHeaders(upstream: Headers): Headers {
  const headers = new Headers();
  for (const name of FORWARD_RESPONSE_HEADERS) {
    const value = upstream.get(name);
    if (value) headers.set(name, value);
  }
  return headers;
}

export function attachBearerToken(headers: Headers, token?: string): void {
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
}

export function isSameOriginRequest(request: Request): boolean {
  const host = request.headers.get('host');
  if (!host) return false;

  const origin = request.headers.get('origin');
  if (origin) {
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  }

  const referer = request.headers.get('referer');
  if (referer) {
    try {
      return new URL(referer).host === host;
    } catch {
      return false;
    }
  }

  return process.env.NODE_ENV !== 'production';
}

export { AUTH_COOKIE_NAME } from '@/lib/auth-constants';
