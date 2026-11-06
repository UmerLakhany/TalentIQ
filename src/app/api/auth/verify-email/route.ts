import { NextRequest } from "next/server";
import { startSession } from "@/lib/sessionRoute";

/**
 * POST /api/auth/verify-email  →  backend POST /auth/verify-email
 * Body: { email, otp }
 * A correct code verifies the email and signs the recruiter in: the token is stored in the
 * httpOnly session cookie (until the browser closes) and the reply contains { user } without it.
 */
export async function POST(req: NextRequest) {
  return startSession(req, "/auth/verify-email", () => false);
}
