import { NextRequest } from "next/server";
import { forwardPost } from "@/lib/backendRoute";

/**
 * POST /api/auth/register  →  backend POST /auth/register
 * Body: { full_name, email, password }
 * Reply (201): { success, message, data: { email, email_sent, otp_expires_in_minutes } }
 * No token yet: the recruiter is signed in after verifying the email with the emailed code.
 */
export async function POST(req: NextRequest) {
  return forwardPost(req, "/auth/register");
}
