import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/authCookie";

/**
 * POST /api/auth/logout — removes the httpOnly session cookie.
 * The backend uses stateless JWTs, so there is nothing to call there.
 */
export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out successfully.", data: null });
  await clearAuthCookie(response);
  return response;
}
