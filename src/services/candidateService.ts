import clientApi from "@/lib/clientApi";
import type { ApiResponse } from "@/services/authService";
import type { Candidate, ProcessingStatus } from "@/data/candidates";
import type { Job } from "@/data/jobs";

/**
 * CV / candidate API for client components. Each function calls this app's /api/jobs/:id/...
 * route handlers, which forward to the backend with the session cookie as Bearer token.
 */

/** A file the backend refused (wrong type, not a real PDF / DOCX, empty...). */
export interface RejectedFile {
  fileName: string;
  reason: string;
}

export interface UploadCvsResult {
  jobId: string;
  /** CVs stored */
  uploaded: number;
  /** CVs queued for AI analysis (a CV that couldn't be queued is saved as "failed") */
  queued: number;
  candidates: Candidate[];
  rejected: RejectedFile[];
}

export interface JobCandidatesSummary {
  totalCvs: number;
  analyzed: number;
  queued: number;
  processing: number;
  inProgress: number;
  failed: number;
  averageScore: number | null;
  topScore: number | null;
  mandatory: number;
  preferred: number;
}

export interface JobCandidates {
  job: { id: string; title: string };
  summary: JobCandidatesSummary;
  candidates: Candidate[];
}

export type CandidateSort = "score" | "name" | "experience" | "uploaded";

/** Form-data field the backend reads the CVs from. */
const CV_FIELD = "files";

/** POST /jobs/:id/cvs — uploads up to 15 PDF / DOCX CVs (5 MB each) and queues them for analysis. */
export function uploadCvs(jobId: string, files: File[]) {
  const form = new FormData();
  files.forEach((file) => form.append(CV_FIELD, file, file.name));
  return clientApi<ApiResponse<UploadCvsResult>>(`jobs/${encodeURIComponent(jobId)}/cvs`, undefined, {
    method: "POST",
    body: form,
  });
}

/** GET /candidates/:id response: the candidate, its rank and its job (with requirements). */
export type CandidateDetails = Candidate & { rank: number | null; job: Job };

/** GET /candidates/:id — profile, AI evaluation, score, rank and the job's requirements. */
export function getCandidate(id: string) {
  return clientApi<ApiResponse<CandidateDetails>>(`candidates/${encodeURIComponent(id)}`);
}

/** POST /candidates/:id/retry — re-queues a failed CV for AI analysis. */
export function retryCandidate(id: string) {
  return clientApi<ApiResponse<Candidate>>(`candidates/${encodeURIComponent(id)}/retry`, undefined, { method: "POST" });
}

/** DELETE /candidates/:id — removes the candidate and its CV file. */
export function deleteCandidate(id: string) {
  return clientApi<ApiResponse<{ id: string }>>(`candidates/${encodeURIComponent(id)}`, undefined, { method: "DELETE" });
}

/**
 * Link to the original CV through this app (/api/candidates/:id/cv), usable in <iframe> and <a>.
 * `download: true` makes the browser save it with its original file name.
 */
export function candidateCvUrl(id: string, { download = false } = {}) {
  return `/api/candidates/${encodeURIComponent(id)}/cv${download ? "?download=1" : ""}`;
}

/** GET /jobs/:id/candidates — every CV of the job with its status, score, rank and evaluation. */
export function getJobCandidates(jobId: string, params: { sort?: CandidateSort; status?: ProcessingStatus } = {}) {
  const query = Object.fromEntries(Object.entries(params).filter(([, value]) => value)) as Record<string, string>;
  return clientApi<ApiResponse<JobCandidates>>(`jobs/${encodeURIComponent(jobId)}/candidates`, query);
}
