import clientApi from "@/lib/clientApi";
import type { ApiResponse } from "@/services/authService";
import type { Job } from "@/data/jobs";
import type { JobFormValues } from "@/containers/JobForm/schema";

/**
 * Jobs API for client components. Each function calls this app's /api/jobs route handlers, which
 * forward to the backend with the session cookie as Bearer token.
 */

export type JobSort = "newest" | "oldest" | "title_asc" | "title_desc";

export interface JobListParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: JobSort;
}

export interface JobList {
  jobs: Job[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

/** Body of POST /jobs and PUT /jobs/:id (the job form fields). */
export type JobPayload = Omit<JobFormValues, "reanalyze">;

/** PUT /jobs/:id also reports what happened to the job's existing CVs. */
export interface UpdatedJob extends Job {
  reanalysis: { criteriaChanged: boolean; requeued: number; rescored: number };
}

const toQuery = (params: JobListParams): Record<string, string> =>
  Object.fromEntries(
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== "")
      .map(([key, value]) => [key, String(value)])
  );

export function listJobs(params: JobListParams = {}) {
  return clientApi<ApiResponse<JobList>>("jobs", toQuery(params));
}

export function getJob(id: string) {
  return clientApi<ApiResponse<Job>>(`jobs/${encodeURIComponent(id)}`);
}

export function createJob(payload: JobPayload) {
  return clientApi<ApiResponse<Job>>("jobs", undefined, { method: "POST", body: payload });
}

/** `reanalyze`: queue the job's CVs again if the criteria changed (default in the edit form). */
export function updateJob(id: string, payload: JobPayload & { reanalyze: boolean }) {
  return clientApi<ApiResponse<UpdatedJob>>(`jobs/${encodeURIComponent(id)}`, undefined, { method: "PUT", body: payload });
}

export function deleteJob(id: string) {
  return clientApi<ApiResponse<{ id: string }>>(`jobs/${encodeURIComponent(id)}`, undefined, { method: "DELETE" });
}
