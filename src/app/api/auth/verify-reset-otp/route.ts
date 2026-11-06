import { NextRequest } from "next/server";
import { forwardPost } from "@/lib/backendRoute";

/**
 * POST /api/auth/verify-reset-otp  →  backend POST /auth/verify-reset-otp
 * Body: { email, otp }  — step 2 of 3: returns { reset_token, expires_in_minutes } (single-use).
 */
export async function POST(req: NextRequest) {
  return forwardPost(req, "/auth/verify-reset-otp");
}
