/* ---------- Types ---------- */
export type ProcessingStatus = "queued" | "processing" | "completed" | "failed";
export type Verdict = "met" | "partial" | "not_met" | "not_found";
export type CvFileType = "PDF" | "DOCX";

export interface WorkExperience {
  title: string;
  company: string;
  period: string;
}

export interface Education {
  degree: string;
  institution: string;
  year: string;
}

/** Information the AI extracted from the CV */
export interface CandidateProfile {
  name: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  currentRole: string;
  totalExperienceYears: number;
  skills: string[];
  workHistory: WorkExperience[];
  education: Education[];
}

/** AI verdict for one job requirement */
export interface RequirementEvaluation {
  requirementId: string;
  verdict: Verdict;
  /** Quote / reference from the CV, null when nothing was found */
  evidence: string | null;
  explanation: string;
}

export interface CandidateEvaluation {
  summary: string;
  strengths: string[];
  gaps: string[];
  /** Points the recruiter should verify manually */
  toVerify: string[];
  requirements: RequirementEvaluation[];
}

export interface Candidate {
  id: string;
  jobId: string;
  fileName: string;
  fileType: CvFileType;
  fileSizeKb: number;
  /** Original CV file (from the API: a signed link valid for 60 minutes) */
  cvUrl: string;
  status: ProcessingStatus;
  errorMessage?: string;
  /** ISO date-time */
  uploadedAt: string;
  profile?: CandidateProfile;
  evaluation?: CandidateEvaluation;
  /** From the API: score calculated by the backend (null until analyzed) */
  matchScore?: number | null;
  /** From the API: position by score among analyzed CVs of the job (1 = best) */
  rank?: number | null;
  /** From the API: ISO date-time the analysis finished */
  processedAt?: string | null;
}

export const PROCESSING_STATUS_LABELS: Record<ProcessingStatus, string> = {
  queued: "Queued",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
};

export const VERDICT_LABELS: Record<Verdict, string> = {
  met: "Met",
  partial: "Partially met",
  not_met: "Not met",
  not_found: "Not found in CV",
};

/* ---------- Match score bands (presentation only — configurable) ---------- */
export interface ScoreBand {
  label: string;
  min: number;
  /** Bootstrap colour name */
  tone: string;
}

export const MATCH_SCORE_BANDS: ScoreBand[] = [
  { label: "Strong Match", min: 85, tone: "success" },
  { label: "Good Match", min: 70, tone: "primary" },
  { label: "Partial Match", min: 50, tone: "warning" },
  { label: "Low Match", min: 0, tone: "danger" },
];

export const getScoreBand = (score: number): ScoreBand =>
  MATCH_SCORE_BANDS.find((band) => score >= band.min) ?? MATCH_SCORE_BANDS[MATCH_SCORE_BANDS.length - 1];
