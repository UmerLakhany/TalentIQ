// Server-only: GET requests from server components (pages) straight to the backend.
import { isAxiosError } from "axios";
import { redirect } from "next/navigation";
import serverApi from "@/lib/serverApi";

/** Clears the expired session cookie (only a route handler can) and goes to login. */
const SESSION_EXPIRED_URL = "/api/auth/logout?redirect=1";

/**
 * GETs `path` from the backend with the session cookie and returns `data` from the
 * { success, message, data } envelope.
 * - 404 (missing, or another recruiter's) → null, so the page can call notFound()
 * - 401 (session expired / invalid) → clears the cookie and redirects to login
 */
export async function getFromBackend<T>(path: string, params?: Record<string, string>): Promise<T | null> {
  try {
    const server = await serverApi();
    const res = await server.get<{ data: T }>(path, { params });
    return res.data.data;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) return null;
    if (isAxiosError(error) && error.response?.status === 401) redirect(SESSION_EXPIRED_URL);
    throw error;
  }
}
