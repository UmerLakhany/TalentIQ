import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { route } from "@/constants/routes";
import { AUTH_COOKIE } from "@/lib/auth";

/**
 * Every page is protected by default.
 * - Logged out: only login and forgot password are reachable.
 * - Logged in: every page is reachable except login and forgot password.
 */
export function middleware(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const pathname = request.nextUrl.pathname;

  const isAuthRoute = pathname === "/auth" || pathname.startsWith("/auth/");

  // Logged-in user: hide login & forgot password
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
