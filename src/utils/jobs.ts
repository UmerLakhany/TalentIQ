import type { Candidate } from "@/data/candidates";
import type { Job } from "@/data/jobs";

export interface JobSummary {
  mandatory: number;
  preferred: number;
  totalCvs: number;
  analyzed: number;
  inProgress: number;
  failed: number;
}

/** Requirement counts plus the CV counts the API sends with the job (`cvSummary`). */
export function getJobSummaryFromApi(job: Job): JobSummary {
  return {
    mandatory: job.requirements.filter((r) => r.type === "mandatory").length,
    preferred: job.requirements.filter((r) => r.type === "preferred").length,
    totalCvs: job.cvSummary?.totalCvs ?? 0,
    analyzed: job.cvSummary?.analyzed ?? 0,
    inProgress: job.cvSummary?.inProgress ?? 0,
    failed: job.cvSummary?.failed ?? 0,
  };
}

/** Requirement counts and CV processing counts for one job, calculated from a candidate list. */
export function getJobSummary(job: Job, candidates: Candidate[]): JobSummary {
  const cvs = candidates.filter((c) => c.jobId === job.id);
  return {
    mandatory: job.requirements.filter((r) => r.type === "mandatory").length,
    preferred: job.requirements.filter((r) => r.type === "preferred").length,
    totalCvs: cvs.length,
    analyzed: cvs.filter((c) => c.status === "completed").length,
    inProgress: cvs.filter((c) => c.status === "queued" || c.status === "processing").length,
    failed: cvs.filter((c) => c.status === "failed").length,
  };
}
