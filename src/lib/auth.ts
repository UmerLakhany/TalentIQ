/**
 * Cookie holding the session token. It is httpOnly (set by the /api/auth/* route handlers, see
 * lib/authCookie.ts), so browser JavaScript can't read it; `src/proxy.ts` reads it to guard pages.
 */
export const AUTH_COOKIE = "hf_token";

/** "Remember me" keeps the session for 30 days (same as the backend's remember-me token). */
export const REMEMBER_ME_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
