/** Cookie holding the session token. Read by `src/proxy.ts` to guard pages. */
export const AUTH_COOKIE = "hf_token";

const THIRTY_DAYS_IN_SECONDS = 60 * 60 * 24 * 30;

/**
 * Stores the token in a cookie (browser only).
 * With "remember me" it lasts 30 days, otherwise it is cleared when the browser closes.
 */
export function setAuthToken(token: string, rememberMe: boolean) {
  const parts = [`${AUTH_COOKIE}=${encodeURIComponent(token)}`, "path=/", "SameSite=Lax"];
  if (rememberMe) parts.push(`max-age=${THIRTY_DAYS_IN_SECONDS}`);
  if (window.location.protocol === "https:") parts.push("Secure");
  document.cookie = parts.join("; ");
}

/** Removes the token cookie (browser only). */
export function clearAuthToken() {
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}
