import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, verifyToken } from '@/lib/auth';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { token?: string };
    const token = body.token?.trim();
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'التوكن مطلوب' },
        { status: 400 },
      );
    }

    verifyToken(token);

    const response = NextResponse.json({ success: true });
    response.cookies.set(AUTH_COOKIE_NAME, token, cookieOptions);
    return response;
  } catch {
    return NextResponse.json(
      { success: false, message: 'توكن غير صالح' },
      { status: 401 },
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(AUTH_COOKIE_NAME);
  return response;
}
