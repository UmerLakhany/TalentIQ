import clientApi from "@/lib/clientApi";

/**
 * Auth API. Each function calls this app's /api/auth/* route handler, which forwards to the
 * backend (POST {NEXT_BASE_URL}/auth/*). Session tokens are kept in an httpOnly cookie by the
 * route handlers and never reach the browser.
 */

/** Backend reply envelope. */
export interface ApiResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface AuthUser {
  id: string;
  full_name: string;
  email: string;
  role: "admin" | "recruiter";
  is_email_verified: boolean;
  last_login_at: string | null;
}

/** Login / verify-email reply (the access token itself stays in the httpOnly cookie). */
export interface SessionData {
  token_type: "Bearer";
  expires_in: string;
  user: AuthUser;
}

// ---------- Register & email verification ----------

export function registerUser(payload: { full_name: string; email: string; password: string }) {
  return clientApi<ApiResponse<{ email: string; email_sent: boolean; otp_expires_in_minutes: number }>>(
    "auth/register",
    undefined,
    { method: "POST", body: payload }
  );
}

/** Verifies the email with the emailed code and signs the recruiter in. */
export function verifyEmail(payload: { email: string; otp: string }) {
  return clientApi<ApiResponse<SessionData>>("auth/verify-email", undefined, { method: "POST", body: payload });
}

/** Sends a new email-verification code (429 within 60 seconds of the previous one). */
export function resendOtp(payload: { email: string }) {
  return clientApi<ApiResponse<{ email: string; otp_expires_in_minutes: number }>>("auth/resend-otp", undefined, {
    method: "POST",
    body: payload,
  });
}

// ---------- Login & logout ----------

export function loginUser(payload: { email: string; password: string; remember_me: boolean }) {
  return clientApi<ApiResponse<SessionData>>("auth/login", undefined, { method: "POST", body: payload });
}

export function logoutUser() {
  return clientApi<ApiResponse<null>>("auth/logout", undefined, { method: "POST" });
}

// ---------- Forgot password (3 steps) ----------

/** Step 1: emails a reset code (same reply whether or not the email is registered). */
export function forgotPassword(payload: { email: string }) {
  return clientApi<ApiResponse<{ email: string; otp_expires_in_minutes: number }>>("auth/forgot-password", undefined, {
    method: "POST",
    body: payload,
  });
}

/** Step 2: exchanges the code for a single-use reset token. */
export function verifyResetOtp(payload: { email: string; otp: string }) {
  return clientApi<ApiResponse<{ reset_token: string; expires_in_minutes: number }>>("auth/verify-reset-otp", undefined, {
    method: "POST",
    body: payload,
  });
}

/** Step 3: sets the new password. */
export function resetPassword(payload: { reset_token: string; new_password: string; confirm_password: string }) {
  return clientApi<ApiResponse<Record<string, never>>>("auth/reset-password", undefined, {
    method: "POST",
    body: payload,
  });
}
