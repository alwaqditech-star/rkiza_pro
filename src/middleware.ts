import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth-constants";
import { verifySessionToken } from "@/lib/session-verify";
import {
  canAccessClientPath,
  getPathAccessLevel,
} from "@/lib/client-permissions";

function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  return response;
}

function redirectToLogin(request: NextRequest, clearSession = false): NextResponse {
  const response = NextResponse.redirect(new URL("/", request.url));
  if (clearSession) {
    response.cookies.set(AUTH_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });
  }
  return applySecurityHeaders(response);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");
  const isClientRoute = pathname.startsWith("/client");

  if (!isAdminRoute && !isClientRoute) {
    return applySecurityHeaders(NextResponse.next());
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return redirectToLogin(request);
  }

  const session = await verifySessionToken(token);
  if (!session) {
    return redirectToLogin(request, true);
  }

  if (isAdminRoute && session.role !== "admin") {
    return redirectToLogin(request, true);
  }

  if (isClientRoute && session.role !== "client") {
    return redirectToLogin(request, true);
  }

  if (
    isClientRoute &&
    session.role === "client" &&
    session.is_first_login &&
    !pathname.startsWith("/client/first-login")
  ) {
    return applySecurityHeaders(
      NextResponse.redirect(new URL("/client/first-login", request.url)),
    );
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
    return applySecurityHeaders(NextResponse.redirect(url));
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/admin/:path*", "/client/:path*"],
};
