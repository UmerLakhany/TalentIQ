// Server-only: used by server components (app/jobs/[id]/page.tsx, app/candidates/[id]/page.tsx).
import { cache } from "react";
import { getFromBackend } from "@/lib/serverFetch";
import type { CandidateDetails, JobCandidates } from "@/services/candidateService";

/** Loads every CV of a job (status, score, rank, evaluation) for the first render of the job page. */
export async function getJobCandidatesForPage(jobId: string): Promise<JobCandidates | null> {
  return getFromBackend<JobCandidates>(`/jobs/${encodeURIComponent(jobId)}/candidates`);
}

/**
 * Loads one candidate with its job. Null if missing or another recruiter's (→ notFound()).
 * Wrapped in React `cache` so generateMetadata and the page share one request.
 */
export const getCandidateForPage = cache((id: string) =>
  getFromBackend<CandidateDetails>(`/candidates/${encodeURIComponent(id)}`)
);
