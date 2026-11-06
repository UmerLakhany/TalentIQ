// Server-only: used by server components (app/jobs/[id]/page.tsx, app/jobs/[id]/edit/page.tsx).
import { cache } from "react";
import { isAxiosError } from "axios";
import { redirect } from "next/navigation";
import serverApi from "@/lib/serverApi";
import type { Job } from "@/data/jobs";
import type { ApiResponse } from "@/services/authService";

/** Clears the expired session cookie (only a route handler can) and goes to login. */
const SESSION_EXPIRED_URL = "/api/auth/logout?redirect=1";

/**
 * Loads one job straight from the backend with the session cookie.
 * Returns null when it doesn't exist or belongs to another recruiter (→ notFound()).
 * Wrapped in React `cache` so generateMetadata and the page share one request.
 */
export const getJobForPage = cache(async (id: string): Promise<Job | null> => {
  try {
    const server = await serverApi();
    const res = await server.get<ApiResponse<Job>>(`/jobs/${encodeURIComponent(id)}`);
    return res.data.data;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) return null;
    if (isAxiosError(error) && error.response?.status === 401) redirect(SESSION_EXPIRED_URL);
    throw error;
  }
});
