import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { route } from "@/constants/routes";
import { AUTH_COOKIE } from "@/lib/auth";

export function middleware(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const pathname = request.nextUrl.pathname;

  const isAuthRoute = pathname.startsWith("/auth");
  const protectedRoutes = ["/dashboard", "/jobs", "/candidates"];
  const isProtectedRoute =
    pathname === "/" || protectedRoutes.some((protectedRoute) => pathname.startsWith(protectedRoute));

  // Redirect logged-in user away from auth pages
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL(route.home, request.url));
  }

  // Redirect unauthenticated user away from protected pages
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL(route.login, request.url));
  }

  // "/auth" has no page of its own
  if (pathname === "/auth") {
    return NextResponse.redirect(new URL(route.login, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/auth/:path*", "/auth", "/dashboard/:path*", "/jobs/:path*", "/candidates/:path*"],
};
