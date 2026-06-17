import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, verifyToken } from '@/lib/auth';
import { getUpstreamApiBase, isSameOriginRequest } from '@/lib/api-proxy';
import { isJwtSecretConfigured } from '@/lib/jwt-secret';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
};

async function verifyTokenViaApi(token: string): Promise<boolean> {
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

async function isTokenValid(token: string): Promise<boolean> {
  if (!isJwtSecretConfigured()) {
    return verifyTokenViaApi(token);
  }

  try {
    verifyToken(token);
    return true;
  } catch {
    return verifyTokenViaApi(token);
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { success: false, message: 'طلب غير مسموح' },
      { status: 403 },
    );
  }

  const body = (await request.json()) as { token?: string };
  const token = body.token?.trim();
  if (!token) {
    return NextResponse.json(
      { success: false, message: 'التوكن مطلوب' },
      { status: 400 },
    );
  }

  if (!(await isTokenValid(token))) {
    return NextResponse.json(
      { success: false, message: 'فشل التحقق من الجلسة — راجع JWT_SECRET على Vercel' },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(AUTH_COOKIE_NAME, token, cookieOptions);
  return response;
}

export async function DELETE(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { success: false, message: 'طلب غير مسموح' },
      { status: 403 },
    );
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(AUTH_COOKIE_NAME, '', { ...cookieOptions, maxAge: 0 });
  return response;
}
