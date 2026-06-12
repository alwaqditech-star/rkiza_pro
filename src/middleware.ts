import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { AUTH_COOKIE_NAME } from "@/lib/auth";
import { getJwtSecret } from "@/lib/jwt-secret";
import type { AuthSession } from "@/lib/types";
import {
  canAccessClientPath,
  getPathAccessLevel,
  permissionDeniedMessage,
} from "@/lib/client-permissions";

async function verifyRequestToken(
  token: string,
): Promise<AuthSession | null> {
  const secret = getJwtSecret();
  if (!secret) return null;

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
    );
    return payload as unknown as AuthSession;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");
  const isClientRoute = pathname.startsWith("/client");

  if (!isAdminRoute && !isClientRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const session = await verifyRequestToken(token);
  if (!session) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isAdminRoute && session.role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isClientRoute && session.role !== "client") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (
    isClientRoute &&
    session.role === "client" &&
    session.is_first_login &&
    !pathname.startsWith("/client/first-login")
  ) {
    return NextResponse.redirect(new URL("/client/first-login", request.url));
  }

  if (
    isClientRoute &&
    session.role === "client" &&
    !pathname.startsWith("/client/first-login") &&
    pathname !== "/client" &&
    !canAccessClientPath(session, pathname)
  ) {
    const level = getPathAccessLevel(pathname);
    const url = new URL("/client", request.url);
    url.searchParams.set("access", "denied");
    url.searchParams.set("level", level);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/client/:path*"],
};
