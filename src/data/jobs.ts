export type RequirementType = "mandatory" | "preferred" | "not_required";
export type RequirementCategory = "experience" | "skill" | "education" | "other";

export interface JobRequirement {
  id: string;
  category: RequirementCategory;
  name: string;
  type: RequirementType;
}

/** CV processing counts of a job, sent by the API with each job. */
export interface JobCvSummary {
  totalCvs: number;
  analyzed: number;
  /** Queued or processing */
  inProgress: number;
  failed: number;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  /** Minimum years of professional experience */
  minExperience: number;
  requirements: JobRequirement[];
  /** ISO date (YYYY-MM-DD) */
  createdAt: string;
  /** Present on jobs returned by the API (GET /jobs, GET /jobs/:id) */
  cvSummary?: JobCvSummary;
}

export const REQUIREMENT_TYPE_LABELS: Record<RequirementType, string> = {
  mandatory: "Mandatory",
  preferred: "Preferred",
  not_required: "Not required",
};

export const REQUIREMENT_CATEGORY_LABELS: Record<RequirementCategory, string> = {
  experience: "Experience",
  skill: "Technical skill",
  education: "Education",
  other: "Other",
};
