import { NextRequest } from "next/server";
import { forwardPost } from "@/lib/backendRoute";

/**
 * POST /api/auth/resend-otp  →  backend POST /auth/resend-otp
 * Body: { email }  — sends a new email-verification code (429 if asked again within 60 seconds).
 */
export async function POST(req: NextRequest) {
  return forwardPost(req, "/auth/resend-otp");
}
