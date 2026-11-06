// Server-only: used by server components (app/jobs/[id]/page.tsx, app/jobs/[id]/edit/page.tsx).
import { cache } from "react";
import { getFromBackend } from "@/lib/serverFetch";
import type { Job } from "@/data/jobs";

/**
 * Loads one job straight from the backend with the session cookie.
 * Returns null when it doesn't exist or belongs to another recruiter (→ notFound()).
 * Wrapped in React `cache` so generateMetadata and the page share one request.
 */
export const getJobForPage = cache((id: string) => getFromBackend<Job>(`/jobs/${encodeURIComponent(id)}`));
