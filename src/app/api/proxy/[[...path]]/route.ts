import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import {
  attachBearerToken,
  buildProxyTarget,
  pickForwardRequestHeaders,
  pickForwardResponseHeaders,
} from '@/lib/api-proxy';
import { AUTH_COOKIE_NAME } from '@/lib/auth-constants';

interface RouteContext {
  params: Promise<{ path?: string[] }>;
}

async function proxyRequest(
  request: NextRequest,
  context: RouteContext,
  method: string,
): Promise<NextResponse> {
  const { path } = await context.params;
  const target = buildProxyTarget(path ?? [], request.nextUrl.search);
  if (!target) {
    return NextResponse.json(
      { success: false, message: 'مسار API غير مسموح' },
      { status: 403 },
    );
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const headers = pickForwardRequestHeaders(request);
  attachBearerToken(headers, token);

  const hasBody = method !== 'GET' && method !== 'HEAD';
  const body = hasBody ? await request.arrayBuffer() : undefined;

  const upstream = await fetch(target, {
    method,
    headers,
    body: hasBody && body?.byteLength ? body : undefined,
    cache: 'no-store',
  });

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: pickForwardResponseHeaders(upstream.headers),
  });
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context, 'GET');
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context, 'POST');
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context, 'PUT');
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context, 'PATCH');
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context, 'DELETE');
}
