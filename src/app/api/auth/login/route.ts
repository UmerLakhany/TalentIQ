import { NextRequest } from "next/server";
import { startSession } from "@/lib/sessionRoute";

/**
 * POST /api/auth/login  →  backend POST /auth/login
 * Body: { email, password, remember_me }
 * On success the token is stored in the httpOnly session cookie (30 days with remember_me),
 * and the reply contains { token_type, expires_in, user } without the token.
 */
export async function POST(req: NextRequest) {
  return startSession(req, "/auth/login", (body) => body.remember_me === true);
}
