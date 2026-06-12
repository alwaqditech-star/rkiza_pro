import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, verifyToken } from '@/lib/auth';

const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_BASE_URL ||
    'https://rkiza-api.vercel.app').replace(/\/$/, '');

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
};

async function verifyTokenViaApi(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function isTokenValid(token: string): Promise<boolean> {
  try {
    verifyToken(token);
    return true;
  } catch {
    return verifyTokenViaApi(token);
  }
}

export async function POST(request: Request) {
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

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(AUTH_COOKIE_NAME);
  return response;
}
