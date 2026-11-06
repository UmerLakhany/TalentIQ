// Server-only: used by server components (app/jobs/[id]/page.tsx).
import { getFromBackend } from "@/lib/serverFetch";
import type { JobCandidates } from "@/services/candidateService";

/** Loads every CV of a job (status, score, rank, evaluation) for the first render of the job page. */
export async function getJobCandidatesForPage(jobId: string): Promise<JobCandidates | null> {
  return getFromBackend<JobCandidates>(`/jobs/${encodeURIComponent(jobId)}/candidates`);
}
