export type JobStatus = "Draft" | "Active" | "Paused" | "Closed";
export type EmploymentType = "Full-time" | "Part-time" | "Contract" | "Internship";
export type WorkplaceType = "Onsite" | "Remote" | "Hybrid";

export interface Job {
  id: string;
  title: string;
  department: string;
  employmentType: EmploymentType;
  location: string;
  workplaceType: WorkplaceType;
  applicants: number;
  processing: number;
  shortlisted: number;
  status: JobStatus;
  /** ISO date (YYYY-MM-DD) */
  createdAt: string;
}

export const JOB_STATUSES: JobStatus[] = ["Active", "Draft", "Paused", "Closed"];

export const DEPARTMENTS = [
  "Engineering",
  "Design",
  "Data & Analytics",
  "Marketing",
  "Sales",
  "Human Resources",
  "Customer Success",
];

// Static mock jobs — replace with the jobs API later.
export const mockJobs: Job[] = [
  {
    id: "job-101",
    title: "Senior Backend Engineer",
    department: "Engineering",
    employmentType: "Full-time",
    location: "Karachi, PK",
    workplaceType: "Hybrid",
    applicants: 48,
    processing: 0,
    shortlisted: 6,
    status: "Active",
    createdAt: "2026-10-28",
  },
  {
    id: "job-102",
    title: "Product Designer",
    department: "Design",
    employmentType: "Full-time",
    location: "Lahore, PK",
    workplaceType: "Onsite",
    applicants: 32,
    processing: 0,
    shortlisted: 4,
    status: "Active",
    createdAt: "2026-10-22",
  },
  {
    id: "job-103",
    title: "Frontend Developer (React)",
    department: "Engineering",
    employmentType: "Full-time",
    location: "Remote",
    workplaceType: "Remote",
    applicants: 27,
    processing: 5,
    shortlisted: 2,
    status: "Active",
    createdAt: "2026-11-03",
  },
  {
    id: "job-104",
    title: "DevOps Engineer",
    department: "Engineering",
    employmentType: "Contract",
    location: "Remote",
    workplaceType: "Remote",
    applicants: 15,
    processing: 3,
    shortlisted: 1,
    status: "Active",
    createdAt: "2026-10-30",
  },
  {
    id: "job-105",
    title: "Data Analyst",
    department: "Data & Analytics",
    employmentType: "Full-time",
    location: "Karachi, PK",
    workplaceType: "Onsite",
    applicants: 21,
    processing: 0,
    shortlisted: 3,
    status: "Paused",
    createdAt: "2026-10-12",
  },
  {
    id: "job-106",
    title: "HR Business Partner",
    department: "Human Resources",
    employmentType: "Full-time",
    location: "Dubai, UAE",
    workplaceType: "Hybrid",
    applicants: 0,
    processing: 0,
    shortlisted: 0,
    status: "Draft",
    createdAt: "2026-11-02",
  },
  {
    id: "job-107",
    title: "Digital Marketing Specialist",
    department: "Marketing",
    employmentType: "Part-time",
    location: "Lahore, PK",
    workplaceType: "Remote",
    applicants: 18,
    processing: 0,
    shortlisted: 2,
    status: "Closed",
    createdAt: "2026-09-18",
  },
  {
    id: "job-108",
    title: "Machine Learning Engineer",
    department: "Data & Analytics",
    employmentType: "Full-time",
    location: "Remote",
    workplaceType: "Remote",
    applicants: 36,
    processing: 8,
    shortlisted: 5,
    status: "Active",
    createdAt: "2026-10-25",
  },
  {
    id: "job-109",
    title: "Customer Success Manager",
    department: "Customer Success",
    employmentType: "Full-time",
    location: "London, UK",
    workplaceType: "Hybrid",
    applicants: 12,
    processing: 0,
    shortlisted: 1,
    status: "Paused",
    createdAt: "2026-10-05",
  },
  {
    id: "job-110",
    title: "QA Automation Engineer",
    department: "Engineering",
    employmentType: "Internship",
    location: "Islamabad, PK",
    workplaceType: "Onsite",
    applicants: 0,
    processing: 0,
    shortlisted: 0,
    status: "Draft",
    createdAt: "2026-11-01",
  },
  {
    id: "job-111",
    title: "Sales Executive",
    department: "Sales",
    employmentType: "Full-time",
    location: "Karachi, PK",
    workplaceType: "Onsite",
    applicants: 44,
    processing: 0,
    shortlisted: 7,
    status: "Closed",
    createdAt: "2026-09-02",
  },
];
