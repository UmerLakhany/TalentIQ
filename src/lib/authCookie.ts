// Server-only helpers: used by the /api/auth/* route handlers.
import { cookies } from "next/headers";
import { AUTH_COOKIE, REMEMBER_ME_MAX_AGE_SECONDS } from "@/lib/auth";

interface AuthCookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "lax" | "strict" | "none";
  path?: string;
  maxAge?: number;
  expires?: Date;
}

type ResponseWithCookies = { cookies: { set: (name: string, value: string, options?: AuthCookieOptions) => void } };

/**
 * Stores the backend access token in an httpOnly cookie (JavaScript can't read it).
 * With "remember me" it lasts 30 days, otherwise it is removed when the browser closes.
 */
export async function setAuthCookie(response: ResponseWithCookies, token: string, remember = false): Promise<void> {
  response.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: remember ? REMEMBER_ME_MAX_AGE_SECONDS : undefined,
  });
}

/** Removes the session cookie (logout / expired session). */
export async function clearAuthCookie(response?: ResponseWithCookies): Promise<void> {
  const options: AuthCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  };
  if (response) {
    response.cookies.set(AUTH_COOKIE, "", options);
    return;
  }
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, "", options);
}

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE)?.value ?? null;
}
