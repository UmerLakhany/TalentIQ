import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { route } from "@/constants/routes";
import { AUTH_COOKIE } from "@/lib/auth";

/**
 * Route guard (Next.js 16 "Proxy", formerly Middleware). Every page is protected by default.
 * - Logged out: only the /auth pages are reachable (login, register, verify email,
 *   forgot password, change password).
 * - Logged in: every page is reachable except the /auth pages.
 */
export function proxy(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const pathname = request.nextUrl.pathname;

  const isAuthRoute = pathname === "/auth" || pathname.startsWith("/auth/");

  // Logged-in user: hide the auth pages
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL(route.home, request.url));
  }

  // Logged-out user: every other page goes to login ("/auth" has no page of its own)
  if (!token && (!isAuthRoute || pathname === "/auth")) {
    return NextResponse.redirect(new URL(route.login, request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run on every page — skip API routes, Next.js internals and static files (anything with a file extension)
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
