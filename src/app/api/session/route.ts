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
  } catch (error) {
    const message = error instanceof Error ? error.message : 'توكن غير صالح';
    if (message.includes('JWT_SECRET')) {
      return NextResponse.json(
        {
          success: false,
          message:
            'JWT_SECRET غير مضبوط على rkiza-pro — انسخ نفس القيمة من مشروع rkiza-api على Vercel',
        },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { success: false, message: 'توكن غير صالح — JWT_SECRET على rkiza-pro لا يطابق rkiza-api' },
      { status: 401 },
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(AUTH_COOKIE_NAME);
  return response;
}
