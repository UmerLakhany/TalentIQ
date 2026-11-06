import { NextRequest } from "next/server";
import { forwardPost } from "@/lib/backendRoute";

/**
 * POST /api/auth/reset-password  →  backend POST /auth/reset-password
 * Body: { reset_token, new_password, confirm_password }  — step 3 of 3: sets the new password.
 */
export async function POST(req: NextRequest) {
  return forwardPost(req, "/auth/reset-password");
}
