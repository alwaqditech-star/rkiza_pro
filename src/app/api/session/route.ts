import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/lib/auth';
import {
  isSameOriginRequest,
  verifySessionToken,
} from '@/lib/session-verify';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
};

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

  const session = await verifySessionToken(token);
  if (!session) {
    return NextResponse.json(
      {
        success: false,
        message:
          'فشل التحقق من الجلسة — تأكد من تطابق JWT_SECRET بين الواجهة و rkiza-api على Vercel',
      },
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
