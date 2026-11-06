// Server-only: used by app/dashboard/page.tsx.
import { getFromBackend } from "@/lib/serverFetch";

/** GET /dashboard — everything the Dashboard page shows, for the logged-in recruiter's jobs only. */

export interface DashboardStats {
  jobs: number;
  cvs: number;
  analyzed: number;
  /** null until at least one CV is analyzed */
  averageScore: number | null;
  /** Queued or processing */
  inProgress: number;
  failed: number;
  /** Analyzed candidates that fully meet every mandatory requirement of their job */
  allMandatoryMet: number;
}

export interface DashboardTopCandidate {
  id: string;
  name: string;
  currentRole: string;
  jobId: string;
  jobTitle: string;
  matchScore: number;
  mandatoryMet: number;
  mandatoryTotal: number;
}

export interface DashboardScoreBand {
  label: string;
  min: number;
  max: number;
  count: number;
}

export interface DashboardJob {
  id: string;
  title: string;
  /** YYYY-MM-DD */
  createdAt: string;
  mandatory: number;
  preferred: number;
  totalCvs: number;
  analyzed: number;
  inProgress: number;
  failed: number;
  averageScore: number | null;
  bestCandidate: { id: string; name: string; matchScore: number } | null;
}

export interface DashboardFailedCv {
  id: string;
  fileName: string;
  jobId: string;
  jobTitle: string;
  errorMessage: string | null;
  /** ISO date-time */
  uploadedAt: string;
}

export interface DashboardData {
  stats: DashboardStats;
  /** Top 5 by match score across all jobs */
  topCandidates: DashboardTopCandidate[];
  /** Strong 85+, Good 70–84, Partial 50–69, Low 0–49 */
  scoreDistribution: DashboardScoreBand[];
  processing: { queued: number; processing: number; completed: number; failed: number };
  /** Newest first */
  jobs: DashboardJob[];
  /** Latest failed CVs */
  needsAttention: DashboardFailedCv[];
  generatedAt: string;
}

/** Loads the dashboard (cached in Redis by the backend, refreshed whenever a CV finishes analysis). */
export async function getDashboardForPage(): Promise<DashboardData | null> {
  return getFromBackend<DashboardData>("/dashboard");
}
