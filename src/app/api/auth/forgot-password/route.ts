import { NextRequest } from "next/server";
import { forwardPost } from "@/lib/backendRoute";

/**
 * POST /api/auth/forgot-password  →  backend POST /auth/forgot-password
 * Body: { email }  — step 1 of 3: emails a password reset code. Same reply whether or not the
 * email is registered (429 if asked again within 60 seconds).
 */
export async function POST(req: NextRequest) {
  return forwardPost(req, "/auth/forgot-password");
}
