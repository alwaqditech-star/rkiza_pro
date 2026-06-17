import { decodeJwt, jwtVerify } from 'jose';
import { getUpstreamApiBase } from '@/lib/api-proxy';
import { getJwtSecret } from '@/lib/jwt-secret';
import type { AuthSession } from '@/lib/types';

export async function verifyTokenViaApi(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${getUpstreamApiBase()}/api/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function verifySessionToken(
  token: string,
): Promise<AuthSession | null> {
  const secret = getJwtSecret();
  if (secret) {
    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(secret),
      );
      return payload as unknown as AuthSession;
    } catch {
      // fall through to API verification below
    }
  }

  if (!(await verifyTokenViaApi(token))) {
    return null;
  }

  try {
    return decodeJwt(token) as unknown as AuthSession;
  } catch {
    return null;
  }
}

export function isSameOriginRequest(request: Request): boolean {
  const host = request.headers.get('host');
  const forwardedHost = request.headers.get('x-forwarded-host');
  const expectedHost = (forwardedHost ?? host)?.split(',')[0]?.trim().toLowerCase();
  if (!expectedHost) {
    return process.env.NODE_ENV !== 'production';
  }

  const secFetchSite = request.headers.get('sec-fetch-site');
  if (secFetchSite === 'same-origin' || secFetchSite === 'same-site') {
    return true;
  }

  const origin = request.headers.get('origin');
  if (origin) {
    try {
      return new URL(origin).host.toLowerCase() === expectedHost;
    } catch {
      return false;
    }
  }

  const referer = request.headers.get('referer');
  if (referer) {
    try {
      return new URL(referer).host.toLowerCase() === expectedHost;
    } catch {
      return false;
    }
  }

  return process.env.NODE_ENV !== 'production';
}
