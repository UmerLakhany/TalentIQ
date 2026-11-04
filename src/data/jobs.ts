export type RequirementType = "mandatory" | "preferred" | "not_required";
export type RequirementCategory = "experience" | "skill" | "education" | "other";

export interface JobRequirement {
  id: string;
  category: RequirementCategory;
  name: string;
  type: RequirementType;
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

// Static mock jobs — replace with GET /jobs later.
export const mockJobs: Job[] = [
  {
    id: "job-101",
    title: "Full-Stack Developer",
    description: "Build and scale our recruitment platform end-to-end, from NestJS APIs to React/Next.js interfaces.",
    minExperience: 3,
    createdAt: "2026-10-28",
    requirements: [
      { id: "r101-exp", category: "experience", name: "Minimum 3 years of professional experience", type: "mandatory" },
      { id: "r101-js", category: "skill", name: "JavaScript", type: "mandatory" },
      { id: "r101-ts", category: "skill", name: "TypeScript", type: "mandatory" },
      { id: "r101-node", category: "skill", name: "Node.js", type: "mandatory" },
      { id: "r101-nest", category: "skill", name: "NestJS", type: "mandatory" },
      { id: "r101-react", category: "skill", name: "React.js or Next.js", type: "preferred" },
      { id: "r101-pg", category: "skill", name: "PostgreSQL", type: "mandatory" },
      { id: "r101-python", category: "skill", name: "Python", type: "not_required" },
      { id: "r101-edu", category: "education", name: "Bachelor's degree in Computer Science or related field", type: "preferred" },
      { id: "r101-scale", category: "other", name: "Experience building scalable applications", type: "preferred" },
    ],
  },
  {
    id: "job-102",
    title: "Frontend Developer (React)",
    description: "Own the recruiter-facing UI: fast, accessible, responsive interfaces in React and Next.js.",
    minExperience: 2,
    createdAt: "2026-11-01",
    requirements: [
      { id: "r102-exp", category: "experience", name: "Minimum 2 years of professional experience", type: "mandatory" },
      { id: "r102-react", category: "skill", name: "React.js", type: "mandatory" },
      { id: "r102-ts", category: "skill", name: "TypeScript", type: "mandatory" },
      { id: "r102-next", category: "skill", name: "Next.js", type: "preferred" },
      { id: "r102-test", category: "skill", name: "Jest / React Testing Library", type: "preferred" },
      { id: "r102-edu", category: "education", name: "Degree in Computer Science or equivalent experience", type: "preferred" },
      { id: "r102-a11y", category: "other", name: "Experience with responsive and accessible UI", type: "preferred" },
    ],
  },
  {
    id: "job-103",
    title: "Data Analyst",
    description: "Turn recruitment data into dashboards and insights for hiring managers.",
    minExperience: 2,
    createdAt: "2026-10-15",
    requirements: [
      { id: "r103-exp", category: "experience", name: "Minimum 2 years of professional experience", type: "mandatory" },
      { id: "r103-sql", category: "skill", name: "SQL", type: "mandatory" },
      { id: "r103-bi", category: "skill", name: "Power BI or Tableau", type: "mandatory" },
      { id: "r103-python", category: "skill", name: "Python", type: "preferred" },
      { id: "r103-edu", category: "education", name: "Bachelor's degree in Statistics, Mathematics or related field", type: "mandatory" },
    ],
  },
];

export const getJobById = (id: string) => mockJobs.find((job) => job.id === id);
