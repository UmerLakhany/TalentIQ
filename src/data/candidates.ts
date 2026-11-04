export type ApplicationStatus = "New" | "Under Review" | "Shortlisted" | "Rejected";
export type AnalysisStatus = "Completed" | "Processing" | "Queued" | "Failed";

export interface Candidate {
  id: string;
  name: string;
  email: string;
  location: string;
  jobId: string;
  jobTitle: string;
  /** null until the CV has been analyzed */
  experienceYears: number | null;
  skills: string[];
  /** Weighted AI match score 0–100, null until analyzed */
  matchScore: number | null;
  /** Mandatory criteria are evaluated separately from the weighted score */
  mandatoryPassed: number | null;
  mandatoryTotal: number | null;
  applicationStatus: ApplicationStatus;
  analysisStatus: AnalysisStatus;
  /** ISO date (YYYY-MM-DD) */
  addedAt: string;
}

export const APPLICATION_STATUSES: ApplicationStatus[] = ["New", "Under Review", "Shortlisted", "Rejected"];
export const ANALYSIS_STATUSES: AnalysisStatus[] = ["Completed", "Processing", "Queued", "Failed"];

/* ---------- Match score bands (presentation only — configurable) ---------- */
export type ScoreBandKey = "strong" | "good" | "partial" | "low";

export interface ScoreBand {
  key: ScoreBandKey;
  label: string;
  min: number;
  /** Bootstrap colour name */
  tone: string;
}

export const MATCH_SCORE_BANDS: ScoreBand[] = [
  { key: "strong", label: "Strong Match", min: 85, tone: "success" },
  { key: "good", label: "Good Match", min: 70, tone: "primary" },
  { key: "partial", label: "Partial Match", min: 50, tone: "warning" },
  { key: "low", label: "Low Match", min: 0, tone: "danger" },
];

export const getScoreBand = (score: number): ScoreBand =>
  MATCH_SCORE_BANDS.find((band) => score >= band.min) ?? MATCH_SCORE_BANDS[MATCH_SCORE_BANDS.length - 1];

/* ---------- Static mock candidates — replace with the candidates API later ---------- */
const email = (name: string) => `${name.toLowerCase().replace(/\s+/g, ".")}@email.com`;

type Seed = Omit<Candidate, "email">;

const seeds: Seed[] = [
  { id: "cand-201", name: "Ahmed Raza", location: "Karachi, PK", jobId: "job-101", jobTitle: "Senior Backend Engineer", experienceYears: 7, skills: ["Node.js", "TypeScript", "NestJS", "PostgreSQL", "Docker", "AWS"], matchScore: 92, mandatoryPassed: 5, mandatoryTotal: 5, applicationStatus: "Shortlisted", analysisStatus: "Completed", addedAt: "2026-10-29" },
  { id: "cand-202", name: "Ayesha Khan", location: "Lahore, PK", jobId: "job-101", jobTitle: "Senior Backend Engineer", experienceYears: 5, skills: ["Node.js", "JavaScript", "Express", "MongoDB", "Redis"], matchScore: 78, mandatoryPassed: 4, mandatoryTotal: 5, applicationStatus: "Under Review", analysisStatus: "Completed", addedAt: "2026-10-29" },
  { id: "cand-203", name: "Daniel Brooks", location: "London, UK", jobId: "job-101", jobTitle: "Senior Backend Engineer", experienceYears: 9, skills: ["Java", "Spring Boot", "PostgreSQL", "Kafka", "TypeScript"], matchScore: 74, mandatoryPassed: 3, mandatoryTotal: 5, applicationStatus: "New", analysisStatus: "Completed", addedAt: "2026-10-30" },
  { id: "cand-204", name: "Fatima Noor", location: "Karachi, PK", jobId: "job-101", jobTitle: "Senior Backend Engineer", experienceYears: 3, skills: ["Node.js", "TypeScript", "PostgreSQL", "React.js"], matchScore: 66, mandatoryPassed: 4, mandatoryTotal: 5, applicationStatus: "New", analysisStatus: "Completed", addedAt: "2026-10-30" },
  { id: "cand-205", name: "Bilal Hussain", location: "Islamabad, PK", jobId: "job-101", jobTitle: "Senior Backend Engineer", experienceYears: 2, skills: ["JavaScript", "Node.js", "MySQL"], matchScore: 41, mandatoryPassed: 2, mandatoryTotal: 5, applicationStatus: "Rejected", analysisStatus: "Completed", addedAt: "2026-10-30" },
  { id: "cand-225", name: "Hassan Raza", location: "Karachi, PK", jobId: "job-101", jobTitle: "Senior Backend Engineer", experienceYears: null, skills: [], matchScore: null, mandatoryPassed: null, mandatoryTotal: null, applicationStatus: "New", analysisStatus: "Queued", addedAt: "2026-11-04" },
  { id: "cand-206", name: "Maria Gonzalez", location: "Remote", jobId: "job-102", jobTitle: "Product Designer", experienceYears: 6, skills: ["Figma", "Design Systems", "User Research", "Prototyping"], matchScore: 88, mandatoryPassed: 4, mandatoryTotal: 4, applicationStatus: "Shortlisted", analysisStatus: "Completed", addedAt: "2026-10-23" },
  { id: "cand-207", name: "Hamza Siddiqui", location: "Lahore, PK", jobId: "job-102", jobTitle: "Product Designer", experienceYears: 4, skills: ["Figma", "Adobe XD", "Wireframing", "UI Design"], matchScore: 71, mandatoryPassed: 3, mandatoryTotal: 4, applicationStatus: "Under Review", analysisStatus: "Completed", addedAt: "2026-10-24" },
  { id: "cand-208", name: "Sophie Turner", location: "Manchester, UK", jobId: "job-102", jobTitle: "Product Designer", experienceYears: 2, skills: ["Figma", "Sketch", "Illustrator"], matchScore: 55, mandatoryPassed: 2, mandatoryTotal: 4, applicationStatus: "New", analysisStatus: "Completed", addedAt: "2026-10-25" },
  { id: "cand-209", name: "Usman Tariq", location: "Karachi, PK", jobId: "job-103", jobTitle: "Frontend Developer (React)", experienceYears: 4, skills: ["React.js", "Next.js", "TypeScript", "Redux", "Bootstrap"], matchScore: 86, mandatoryPassed: 4, mandatoryTotal: 4, applicationStatus: "Under Review", analysisStatus: "Completed", addedAt: "2026-11-03" },
  { id: "cand-210", name: "Emily Chen", location: "Toronto, CA", jobId: "job-103", jobTitle: "Frontend Developer (React)", experienceYears: 6, skills: ["React.js", "TypeScript", "GraphQL", "Jest"], matchScore: 90, mandatoryPassed: 4, mandatoryTotal: 4, applicationStatus: "New", analysisStatus: "Completed", addedAt: "2026-11-03" },
  { id: "cand-211", name: "Zain Ali", location: "Lahore, PK", jobId: "job-103", jobTitle: "Frontend Developer (React)", experienceYears: null, skills: [], matchScore: null, mandatoryPassed: null, mandatoryTotal: null, applicationStatus: "New", analysisStatus: "Processing", addedAt: "2026-11-04" },
  { id: "cand-212", name: "Hira Saeed", location: "Karachi, PK", jobId: "job-103", jobTitle: "Frontend Developer (React)", experienceYears: null, skills: [], matchScore: null, mandatoryPassed: null, mandatoryTotal: null, applicationStatus: "New", analysisStatus: "Queued", addedAt: "2026-11-04" },
  { id: "cand-213", name: "Omar Farooq", location: "Islamabad, PK", jobId: "job-103", jobTitle: "Frontend Developer (React)", experienceYears: null, skills: [], matchScore: null, mandatoryPassed: null, mandatoryTotal: null, applicationStatus: "New", analysisStatus: "Failed", addedAt: "2026-11-04" },
  { id: "cand-214", name: "Kevin Patel", location: "Remote", jobId: "job-104", jobTitle: "DevOps Engineer", experienceYears: 8, skills: ["Kubernetes", "Terraform", "AWS", "Docker", "CI/CD"], matchScore: 83, mandatoryPassed: 4, mandatoryTotal: 4, applicationStatus: "Shortlisted", analysisStatus: "Completed", addedAt: "2026-10-31" },
  { id: "cand-215", name: "Sana Mirza", location: "Karachi, PK", jobId: "job-104", jobTitle: "DevOps Engineer", experienceYears: 3, skills: ["Docker", "Jenkins", "Linux", "Azure"], matchScore: 62, mandatoryPassed: 2, mandatoryTotal: 4, applicationStatus: "New", analysisStatus: "Completed", addedAt: "2026-10-31" },
  { id: "cand-216", name: "Ali Haider", location: "Lahore, PK", jobId: "job-104", jobTitle: "DevOps Engineer", experienceYears: null, skills: [], matchScore: null, mandatoryPassed: null, mandatoryTotal: null, applicationStatus: "New", analysisStatus: "Processing", addedAt: "2026-11-04" },
  { id: "cand-217", name: "Mehwish Iqbal", location: "Karachi, PK", jobId: "job-105", jobTitle: "Data Analyst", experienceYears: 4, skills: ["SQL", "Power BI", "Python", "Excel"], matchScore: 81, mandatoryPassed: 3, mandatoryTotal: 3, applicationStatus: "Shortlisted", analysisStatus: "Completed", addedAt: "2026-10-14" },
  { id: "cand-218", name: "James Wilson", location: "Dubai, UAE", jobId: "job-105", jobTitle: "Data Analyst", experienceYears: 2, skills: ["Excel", "Tableau", "SQL"], matchScore: 58, mandatoryPassed: 2, mandatoryTotal: 3, applicationStatus: "Rejected", analysisStatus: "Completed", addedAt: "2026-10-15" },
  { id: "cand-219", name: "Nida Rehman", location: "Remote", jobId: "job-108", jobTitle: "Machine Learning Engineer", experienceYears: 5, skills: ["Python", "PyTorch", "TensorFlow", "MLOps", "SQL"], matchScore: 94, mandatoryPassed: 5, mandatoryTotal: 5, applicationStatus: "Shortlisted", analysisStatus: "Completed", addedAt: "2026-10-27" },
  { id: "cand-220", name: "Arjun Mehta", location: "Dubai, UAE", jobId: "job-108", jobTitle: "Machine Learning Engineer", experienceYears: 7, skills: ["Python", "Scikit-learn", "Spark", "AWS"], matchScore: 79, mandatoryPassed: 4, mandatoryTotal: 5, applicationStatus: "Under Review", analysisStatus: "Completed", addedAt: "2026-10-27" },
  { id: "cand-221", name: "Saad Qureshi", location: "Islamabad, PK", jobId: "job-108", jobTitle: "Machine Learning Engineer", experienceYears: 2, skills: ["Python", "Pandas", "Keras"], matchScore: 48, mandatoryPassed: 2, mandatoryTotal: 5, applicationStatus: "New", analysisStatus: "Completed", addedAt: "2026-10-28" },
  { id: "cand-222", name: "Rachel Adams", location: "London, UK", jobId: "job-109", jobTitle: "Customer Success Manager", experienceYears: 6, skills: ["Salesforce", "Account Management", "Onboarding"], matchScore: 76, mandatoryPassed: 3, mandatoryTotal: 3, applicationStatus: "New", analysisStatus: "Completed", addedAt: "2026-10-07" },
  { id: "cand-223", name: "Faisal Javed", location: "Karachi, PK", jobId: "job-111", jobTitle: "Sales Executive", experienceYears: 5, skills: ["B2B Sales", "CRM", "Negotiation"], matchScore: 84, mandatoryPassed: 3, mandatoryTotal: 3, applicationStatus: "Shortlisted", analysisStatus: "Completed", addedAt: "2026-09-05" },
  { id: "cand-224", name: "Laiba Shah", location: "Karachi, PK", jobId: "job-111", jobTitle: "Sales Executive", experienceYears: 1, skills: ["Cold Calling", "CRM"], matchScore: 39, mandatoryPassed: 1, mandatoryTotal: 3, applicationStatus: "Rejected", analysisStatus: "Completed", addedAt: "2026-09-06" },
];

export const mockCandidates: Candidate[] = seeds.map((seed) => ({ ...seed, email: email(seed.name) }));
