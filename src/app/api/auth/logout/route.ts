import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/authCookie";
import { route } from "@/constants/routes";

/**
 * POST /api/auth/logout — removes the httpOnly session cookie (the "Log out" button).
 * The backend uses stateless JWTs, so there is nothing to call there.
 */
export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out successfully.", data: null });
  await clearAuthCookie(response);
  return response;
}

/**
 * GET /api/auth/logout?redirect=1 — used by server components when the backend says the session
 * expired (401): clears the cookie and redirects to login. Server components can't change cookies
 * themselves, and without this the page guard would keep sending the user back with the old cookie.
 */
export async function GET(req: NextRequest) {
  const response = NextResponse.redirect(new URL(route.login, req.url));
  await clearAuthCookie(response);
  return response;
}
