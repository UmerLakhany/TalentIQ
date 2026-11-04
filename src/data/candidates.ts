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
  /** Original CV file (static sample until the API serves real files) */
  cvUrl: string;
  status: ProcessingStatus;
  errorMessage?: string;
  /** ISO date-time */
  uploadedAt: string;
  profile?: CandidateProfile;
  evaluation?: CandidateEvaluation;
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

/* ---------- Static mock candidates — replace with GET /jobs/:id/candidates later ---------- */
const SAMPLE_CV = "/samples/sample-cv.pdf";

export const mockCandidates: Candidate[] = [
  /* ===== job-101 · Full-Stack Developer ===== */
  {
    id: "cand-209",
    jobId: "job-101",
    fileName: "Zara_Ahmed_CV.pdf",
    fileType: "PDF",
    fileSizeKb: 214,
    cvUrl: SAMPLE_CV,
    status: "completed",
    uploadedAt: "2026-11-03T10:12:00Z",
    profile: {
      name: "Zara Ahmed",
      email: "zara.ahmed@email.com",
      phone: "+92 300 1234567",
      location: "Karachi, PK",
      summary: "Full-stack engineer with 4+ years building TypeScript services in NestJS and product UIs in Next.js.",
      currentRole: "Software Engineer II at Finly",
      totalExperienceYears: 4.5,
      skills: ["JavaScript", "TypeScript", "Node.js", "NestJS", "Next.js", "React.js", "PostgreSQL", "Redis", "Docker", "AWS"],
      workHistory: [
        { title: "Software Engineer II", company: "Finly", period: "Jan 2024 – Present" },
        { title: "Software Engineer", company: "CodeNest", period: "Jun 2021 – Dec 2023" },
      ],
      education: [{ degree: "BS Computer Science", institution: "FAST-NUCES Karachi", year: "2021" }],
    },
    evaluation: {
      summary:
        "Zara meets every mandatory requirement with clear, recent evidence: 4.5 years of professional TypeScript work, NestJS microservices on PostgreSQL, and Next.js front-ends. Preferred requirements are also covered, including a documented scaling project. This is a strong, well-evidenced match.",
      strengths: [
        "Led a NestJS + PostgreSQL payments service handling 2M+ transactions/month",
        "Production Next.js experience on the customer dashboard",
        "Relevant CS degree",
      ],
      gaps: ["No major gaps against the stated criteria"],
      toVerify: ["Depth of PostgreSQL performance tuning (mentioned briefly)"],
      requirements: [
        { requirementId: "r101-exp", verdict: "met", evidence: "Software Engineer at CodeNest (Jun 2021 – Dec 2023), Finly (Jan 2024 – Present)", explanation: "About 4.5 years of continuous professional experience, above the 3-year minimum." },
        { requirementId: "r101-js", verdict: "met", evidence: "“Built customer dashboard in Next.js and modern JavaScript (ES2022)”", explanation: "JavaScript is used across both roles." },
        { requirementId: "r101-ts", verdict: "met", evidence: "“All backend and frontend code written in strict TypeScript”", explanation: "TypeScript is the primary language in her current role." },
        { requirementId: "r101-node", verdict: "met", evidence: "“Node.js microservices for payments and notifications”", explanation: "Production Node.js services described with scale figures." },
        { requirementId: "r101-nest", verdict: "met", evidence: "“Designed NestJS modules with guards, interceptors and CQRS”", explanation: "Shows framework-specific depth, not just a keyword mention." },
        { requirementId: "r101-react", verdict: "met", evidence: "“Next.js 14 App Router dashboard used by 40k users”", explanation: "Satisfies the React.js or Next.js preference." },
        { requirementId: "r101-pg", verdict: "met", evidence: "“PostgreSQL schema design, indexing and migrations with TypeORM”", explanation: "Hands-on schema and migration work." },
        { requirementId: "r101-edu", verdict: "met", evidence: "BS Computer Science, FAST-NUCES (2021)", explanation: "Relevant degree." },
        { requirementId: "r101-scale", verdict: "met", evidence: "“Scaled payments service to 2M+ transactions/month with queues and caching”", explanation: "Concrete evidence of building for scale." },
      ],
    },
  },
  {
    id: "cand-201",
    jobId: "job-101",
    fileName: "Ahmed_Raza_Resume.pdf",
    fileType: "PDF",
    fileSizeKb: 186,
    cvUrl: SAMPLE_CV,
    status: "completed",
    uploadedAt: "2026-11-03T10:12:00Z",
    profile: {
      name: "Ahmed Raza",
      email: "ahmed.raza@email.com",
      phone: "+92 321 7654321",
      location: "Lahore, PK",
      summary: "Backend-leaning engineer with 6 years in Node.js and NestJS, some React experience.",
      currentRole: "Senior Backend Engineer at Tradeo",
      totalExperienceYears: 6,
      skills: ["JavaScript", "TypeScript", "Node.js", "NestJS", "PostgreSQL", "RabbitMQ", "React.js", "Docker"],
      workHistory: [
        { title: "Senior Backend Engineer", company: "Tradeo", period: "Mar 2023 – Present" },
        { title: "Backend Engineer", company: "Systems Ltd", period: "Aug 2020 – Feb 2023" },
      ],
      education: [{ degree: "BS Software Engineering", institution: "UET Lahore", year: "2020" }],
    },
    evaluation: {
      summary:
        "Ahmed meets all mandatory requirements, with strong NestJS and PostgreSQL evidence. React use is limited to internal admin tools, so the React/Next.js preference is only partly met. His scaling experience is stated but not quantified.",
      strengths: ["6 years of Node.js, 3 of them with NestJS", "Event-driven architecture with RabbitMQ", "PostgreSQL query optimisation"],
      gaps: ["Limited frontend exposure (internal React admin panel only)"],
      toVerify: ["Scale of the systems he built (no traffic or volume figures given)"],
      requirements: [
        { requirementId: "r101-exp", verdict: "met", evidence: "Backend Engineer (Aug 2020) → Senior Backend Engineer (Present)", explanation: "About 6 years of professional experience." },
        { requirementId: "r101-js", verdict: "met", evidence: "“JavaScript/TypeScript across all services”", explanation: "Daily JavaScript use." },
        { requirementId: "r101-ts", verdict: "met", evidence: "“Migrated 12 services from JavaScript to TypeScript”", explanation: "Strong TypeScript evidence." },
        { requirementId: "r101-node", verdict: "met", evidence: "“Node.js order-matching service”", explanation: "Core Node.js work." },
        { requirementId: "r101-nest", verdict: "met", evidence: "“NestJS monorepo with 9 modules”", explanation: "Framework-level experience." },
        { requirementId: "r101-react", verdict: "partial", evidence: "“Built internal admin panel in React”", explanation: "React use is limited to one internal tool, with no production customer-facing UI." },
        { requirementId: "r101-pg", verdict: "met", evidence: "“Optimised PostgreSQL queries, cutting p95 latency by 40%”", explanation: "Performance-level PostgreSQL work." },
        { requirementId: "r101-edu", verdict: "met", evidence: "BS Software Engineering, UET Lahore (2020)", explanation: "Related degree." },
        { requirementId: "r101-scale", verdict: "partial", evidence: "“Worked on high-traffic trading APIs”", explanation: "Claims high traffic but gives no figures. Treated as partial until verified." },
      ],
    },
  },
  {
    id: "cand-202",
    jobId: "job-101",
    fileName: "Ayesha-Khan-CV.docx",
    fileType: "DOCX",
    fileSizeKb: 98,
    cvUrl: "/samples/sample-cv.docx",
    status: "completed",
    uploadedAt: "2026-11-03T10:12:00Z",
    profile: {
      name: "Ayesha Khan",
      email: "ayesha.khan@email.com",
      phone: "+92 333 4455667",
      location: "Islamabad, PK",
      summary: "Full-stack JavaScript developer focused on Express APIs and React front-ends.",
      currentRole: "Full-Stack Developer at Cloudly",
      totalExperienceYears: 5,
      skills: ["JavaScript", "TypeScript", "Node.js", "Express", "React.js", "PostgreSQL", "MongoDB"],
      workHistory: [
        { title: "Full-Stack Developer", company: "Cloudly", period: "Feb 2022 – Present" },
        { title: "Junior Developer", company: "Webverse", period: "Oct 2019 – Jan 2022" },
      ],
      education: [{ degree: "BS Computer Science", institution: "COMSATS Islamabad", year: "2019" }],
    },
    evaluation: {
      summary:
        "Ayesha has solid experience in Node.js, TypeScript, React and PostgreSQL, but her CV shows Express, not NestJS. NestJS is mandatory, so she does not meet all mandatory criteria despite a good overall score. Express experience may transfer, but this should be checked in an interview.",
      strengths: ["5 years of full-stack JavaScript", "Production React applications", "PostgreSQL and MongoDB experience"],
      gaps: ["No NestJS experience mentioned (mandatory)"],
      toVerify: ["Whether she has used NestJS outside the roles listed"],
      requirements: [
        { requirementId: "r101-exp", verdict: "met", evidence: "Oct 2019 – Present across two roles", explanation: "About 5 years of experience." },
        { requirementId: "r101-js", verdict: "met", evidence: "“JavaScript (ES6+) on frontend and backend”", explanation: "Daily JavaScript use." },
        { requirementId: "r101-ts", verdict: "met", evidence: "“Introduced TypeScript to the Express codebase”", explanation: "Uses TypeScript in her current role." },
        { requirementId: "r101-node", verdict: "met", evidence: "“REST APIs in Node.js/Express”", explanation: "Production Node.js." },
        { requirementId: "r101-nest", verdict: "not_found", evidence: null, explanation: "NestJS is not mentioned anywhere in the CV. This is missing information, not proof she lacks the skill." },
        { requirementId: "r101-react", verdict: "met", evidence: "“React SPA for 15k monthly users”", explanation: "Customer-facing React work." },
        { requirementId: "r101-pg", verdict: "met", evidence: "“PostgreSQL with Prisma ORM”", explanation: "Hands-on PostgreSQL." },
        { requirementId: "r101-edu", verdict: "met", evidence: "BS Computer Science, COMSATS (2019)", explanation: "Relevant degree." },
        { requirementId: "r101-scale", verdict: "partial", evidence: "“Added caching layer to reduce API load”", explanation: "Some scalability work, but limited in scope." },
      ],
    },
  },
  {
    id: "cand-203",
    jobId: "job-101",
    fileName: "Daniel_Brooks_CV.pdf",
    fileType: "PDF",
    fileSizeKb: 241,
    cvUrl: SAMPLE_CV,
    status: "completed",
    uploadedAt: "2026-11-03T10:12:00Z",
    profile: {
      name: "Daniel Brooks",
      email: "daniel.brooks@email.com",
      phone: "+44 7700 900123",
      location: "London, UK",
      summary: "Senior Java engineer with 9 years in Spring Boot microservices, recently moving into TypeScript.",
      currentRole: "Lead Engineer at Brightpay",
      totalExperienceYears: 9,
      skills: ["Java", "Spring Boot", "JavaScript", "TypeScript", "Node.js", "PostgreSQL", "Kafka", "Kubernetes"],
      workHistory: [
        { title: "Lead Engineer", company: "Brightpay", period: "2021 – Present" },
        { title: "Software Engineer", company: "Finserve", period: "2017 – 2021" },
      ],
      education: [{ degree: "BSc Computer Science", institution: "University of Leeds", year: "2017" }],
    },
    evaluation: {
      summary:
        "Daniel is a very experienced engineer with strong scalability and PostgreSQL credentials, but his main stack is Java/Spring Boot. Node.js and TypeScript appear only in a recent side project, and NestJS is not mentioned. Despite his seniority, several mandatory requirements are only partly met or missing.",
      strengths: ["9 years of experience with large-scale distributed systems", "Deep PostgreSQL and Kafka knowledge"],
      gaps: ["NestJS not mentioned (mandatory)", "Node.js/TypeScript limited to a side project", "No React/Next.js experience"],
      toVerify: ["Current level of TypeScript and Node.js proficiency"],
      requirements: [
        { requirementId: "r101-exp", verdict: "met", evidence: "2017 – Present", explanation: "About 9 years, well above the minimum." },
        { requirementId: "r101-js", verdict: "met", evidence: "“Maintained JavaScript tooling for internal dashboards”", explanation: "Uses JavaScript, though it is not his main language." },
        { requirementId: "r101-ts", verdict: "partial", evidence: "“Side project: TypeScript CLI tool”", explanation: "TypeScript appears only in a personal project." },
        { requirementId: "r101-node", verdict: "partial", evidence: "“Prototype Node.js gateway (2025)”", explanation: "Limited, recent Node.js exposure." },
        { requirementId: "r101-nest", verdict: "not_found", evidence: null, explanation: "No NestJS mention. His Spring Boot background is conceptually similar, but not the same framework." },
        { requirementId: "r101-react", verdict: "not_found", evidence: null, explanation: "No frontend framework experience listed." },
        { requirementId: "r101-pg", verdict: "met", evidence: "“PostgreSQL sharding for 50M-row ledger”", explanation: "Advanced PostgreSQL work." },
        { requirementId: "r101-edu", verdict: "met", evidence: "BSc Computer Science, University of Leeds", explanation: "Relevant degree." },
        { requirementId: "r101-scale", verdict: "met", evidence: "“Microservices processing 10k events/sec”", explanation: "Strong evidence of building at scale." },
      ],
    },
  },
  {
    id: "cand-204",
    jobId: "job-101",
    fileName: "Fatima_Noor_Resume.pdf",
    fileType: "PDF",
    fileSizeKb: 152,
    cvUrl: SAMPLE_CV,
    status: "completed",
    uploadedAt: "2026-11-03T10:12:00Z",
    profile: {
      name: "Fatima Noor",
      email: "fatima.noor@email.com",
      phone: "+92 345 1122334",
      location: "Karachi, PK",
      summary: "Full-stack developer working with NestJS and Next.js, with 2 years of professional experience.",
      currentRole: "Full-Stack Developer at Shopsy",
      totalExperienceYears: 2,
      skills: ["JavaScript", "TypeScript", "Node.js", "NestJS", "Next.js", "PostgreSQL", "Tailwind CSS"],
      workHistory: [
        { title: "Full-Stack Developer", company: "Shopsy", period: "Nov 2024 – Present" },
        { title: "Associate Developer", company: "Devsinc", period: "Nov 2023 – Oct 2024" },
      ],
      education: [{ degree: "BS Computer Science", institution: "NED University", year: "2023" }],
    },
    evaluation: {
      summary:
        "Fatima's technical stack matches the role closely (NestJS, Next.js, PostgreSQL, TypeScript), but she has about 2 years of professional experience, below the mandatory 3-year minimum. Her skills fit well, but the experience requirement is not met.",
      strengths: ["Exact stack match: NestJS + Next.js + PostgreSQL", "Relevant CS degree"],
      gaps: ["About 2 years of experience, below the 3-year mandatory minimum"],
      toVerify: ["Whether internships or freelance work should count towards experience"],
      requirements: [
        { requirementId: "r101-exp", verdict: "not_met", evidence: "Nov 2023 – Present (about 2 years)", explanation: "Professional experience is below the required 3 years." },
        { requirementId: "r101-js", verdict: "met", evidence: "“JavaScript/TypeScript full-stack development”", explanation: "Daily use." },
        { requirementId: "r101-ts", verdict: "met", evidence: "“TypeScript across NestJS and Next.js apps”", explanation: "Primary language." },
        { requirementId: "r101-node", verdict: "met", evidence: "“Node.js REST and GraphQL APIs”", explanation: "Production Node.js." },
        { requirementId: "r101-nest", verdict: "met", evidence: "“Built order service in NestJS”", explanation: "Direct NestJS experience." },
        { requirementId: "r101-react", verdict: "met", evidence: "“Next.js storefront with SSR”", explanation: "Meets the preference." },
        { requirementId: "r101-pg", verdict: "met", evidence: "“PostgreSQL with TypeORM”", explanation: "Hands-on PostgreSQL." },
        { requirementId: "r101-edu", verdict: "met", evidence: "BS Computer Science, NED University (2023)", explanation: "Relevant degree." },
        { requirementId: "r101-scale", verdict: "not_found", evidence: null, explanation: "No scalability work described." },
      ],
    },
  },
  {
    id: "cand-205",
    jobId: "job-101",
    fileName: "Bilal_Hussain_CV.pdf",
    fileType: "PDF",
    fileSizeKb: 120,
    cvUrl: SAMPLE_CV,
    status: "completed",
    uploadedAt: "2026-11-03T10:12:00Z",
    profile: {
      name: "Bilal Hussain",
      email: "bilal.hussain@email.com",
      phone: "+92 312 9988776",
      location: "Peshawar, PK",
      summary: "Junior web developer building React sites and simple Express APIs with MySQL.",
      currentRole: "Web Developer at PixelHub",
      totalExperienceYears: 1.5,
      skills: ["JavaScript", "React.js", "Node.js", "Express", "MySQL", "HTML", "CSS"],
      workHistory: [{ title: "Web Developer", company: "PixelHub", period: "May 2025 – Present" }],
      education: [{ degree: "Diploma in Information Technology", institution: "Govt. College of Technology", year: "2024" }],
    },
    evaluation: {
      summary:
        "Bilal is early in his career, with about 1.5 years of experience in JavaScript, React and basic Node.js. TypeScript, NestJS and PostgreSQL are not evidenced in the CV. He does not currently meet most mandatory requirements for this role.",
      strengths: ["Production React websites", "Basic Node.js/Express APIs"],
      gaps: ["Below minimum experience", "No TypeScript, NestJS or PostgreSQL evidence"],
      toVerify: ["Database experience beyond MySQL"],
      requirements: [
        { requirementId: "r101-exp", verdict: "not_met", evidence: "May 2025 – Present (about 1.5 years)", explanation: "Below the 3-year minimum." },
        { requirementId: "r101-js", verdict: "met", evidence: "“JavaScript, HTML, CSS for client websites”", explanation: "Uses JavaScript." },
        { requirementId: "r101-ts", verdict: "not_found", evidence: null, explanation: "TypeScript is not mentioned." },
        { requirementId: "r101-node", verdict: "partial", evidence: "“Simple Express APIs for contact forms”", explanation: "Basic Node.js only." },
        { requirementId: "r101-nest", verdict: "not_found", evidence: null, explanation: "NestJS is not mentioned." },
        { requirementId: "r101-react", verdict: "met", evidence: "“Built 8 client websites in React”", explanation: "Meets the React preference." },
        { requirementId: "r101-pg", verdict: "not_found", evidence: null, explanation: "Only MySQL is listed. Relational knowledge may transfer, but PostgreSQL is not evidenced." },
        { requirementId: "r101-edu", verdict: "partial", evidence: "Diploma in Information Technology (2024)", explanation: "A related diploma, not a bachelor's degree." },
        { requirementId: "r101-scale", verdict: "not_found", evidence: null, explanation: "No scalability work described." },
      ],
    },
  },
  { id: "cand-206", jobId: "job-101", fileName: "Sara_Malik_CV.pdf", fileType: "PDF", fileSizeKb: 176, cvUrl: SAMPLE_CV, status: "processing", uploadedAt: "2026-11-04T09:40:00Z" },
  { id: "cand-207", jobId: "job-101", fileName: "Hassan-Raza-Resume.docx", fileType: "DOCX", fileSizeKb: 88, cvUrl: "/samples/sample-cv.docx", status: "queued", uploadedAt: "2026-11-04T09:40:00Z" },
  { id: "cand-208", jobId: "job-101", fileName: "Omar_Farooq_CV.pdf", fileType: "PDF", fileSizeKb: 305, cvUrl: SAMPLE_CV, status: "failed", errorMessage: "Text could not be extracted: the PDF is password-protected.", uploadedAt: "2026-11-04T09:40:00Z" },
  { id: "cand-210", jobId: "job-101", fileName: "Kamran_Shah_CV.docx", fileType: "DOCX", fileSizeKb: 12, cvUrl: "/samples/sample-cv.docx", status: "failed", errorMessage: "The DOCX file is corrupted and could not be opened.", uploadedAt: "2026-11-04T09:40:00Z" },

  /* ===== job-102 · Frontend Developer (React) ===== */
  {
    id: "cand-211",
    jobId: "job-102",
    fileName: "Emily_Chen_CV.pdf",
    fileType: "PDF",
    fileSizeKb: 198,
    cvUrl: SAMPLE_CV,
    status: "completed",
    uploadedAt: "2026-11-02T14:05:00Z",
    profile: {
      name: "Emily Chen",
      email: "emily.chen@email.com",
      phone: "+1 416 555 0182",
      location: "Toronto, CA",
      summary: "Frontend engineer with 6 years building accessible React and Next.js applications.",
      currentRole: "Senior Frontend Engineer at Northlane",
      totalExperienceYears: 6,
      skills: ["React.js", "Next.js", "TypeScript", "Jest", "React Testing Library", "GraphQL", "Accessibility"],
      workHistory: [
        { title: "Senior Frontend Engineer", company: "Northlane", period: "2022 – Present" },
        { title: "Frontend Developer", company: "Pixelwise", period: "2020 – 2022" },
      ],
      education: [{ degree: "BSc Computer Science", institution: "University of Toronto", year: "2020" }],
    },
    evaluation: {
      summary:
        "Emily meets every mandatory and preferred requirement with specific evidence, including Next.js, testing and WCAG accessibility work. She is a strong match.",
      strengths: ["6 years of React + TypeScript", "Led WCAG 2.1 AA accessibility audit", "Testing culture (90% coverage)"],
      gaps: ["No significant gaps"],
      toVerify: [],
      requirements: [
        { requirementId: "r102-exp", verdict: "met", evidence: "2020 – Present", explanation: "About 6 years." },
        { requirementId: "r102-react", verdict: "met", evidence: "“Led React design-system rebuild”", explanation: "Deep React experience." },
        { requirementId: "r102-ts", verdict: "met", evidence: "“Strict TypeScript across 3 apps”", explanation: "Primary language." },
        { requirementId: "r102-next", verdict: "met", evidence: "“Migrated marketing site to Next.js”", explanation: "Production Next.js." },
        { requirementId: "r102-test", verdict: "met", evidence: "“Jest + RTL, 90% coverage”", explanation: "Strong testing evidence." },
        { requirementId: "r102-edu", verdict: "met", evidence: "BSc Computer Science, University of Toronto", explanation: "Relevant degree." },
        { requirementId: "r102-a11y", verdict: "met", evidence: "“Led WCAG 2.1 AA audit and fixes”", explanation: "Clear accessibility work." },
      ],
    },
  },
  {
    id: "cand-212",
    jobId: "job-102",
    fileName: "Usman_Tariq_Resume.pdf",
    fileType: "PDF",
    fileSizeKb: 143,
    cvUrl: SAMPLE_CV,
    status: "completed",
    uploadedAt: "2026-11-02T14:05:00Z",
    profile: {
      name: "Usman Tariq",
      email: "usman.tariq@email.com",
      phone: "+92 301 5566778",
      location: "Karachi, PK",
      summary: "React developer with 3 years of experience building dashboards in TypeScript.",
      currentRole: "Frontend Developer at Datawise",
      totalExperienceYears: 3,
      skills: ["React.js", "TypeScript", "Redux", "Bootstrap", "REST APIs"],
      workHistory: [{ title: "Frontend Developer", company: "Datawise", period: "2023 – Present" }],
      education: [{ degree: "BS Software Engineering", institution: "SZABIST Karachi", year: "2023" }],
    },
    evaluation: {
      summary:
        "Usman meets the mandatory requirements (React, TypeScript, experience). Next.js and automated testing are not mentioned in the CV, which lowers his preferred-requirements score.",
      strengths: ["3 years of React + TypeScript dashboards", "Responsive Bootstrap layouts"],
      gaps: ["No Next.js mentioned", "No testing experience mentioned"],
      toVerify: ["Testing practices (not stated)"],
      requirements: [
        { requirementId: "r102-exp", verdict: "met", evidence: "2023 – Present", explanation: "About 3 years, above the 2-year minimum." },
        { requirementId: "r102-react", verdict: "met", evidence: "“React analytics dashboards”", explanation: "Production React." },
        { requirementId: "r102-ts", verdict: "met", evidence: "“TypeScript + Redux Toolkit”", explanation: "Uses TypeScript." },
        { requirementId: "r102-next", verdict: "not_found", evidence: null, explanation: "Next.js is not mentioned." },
        { requirementId: "r102-test", verdict: "not_found", evidence: null, explanation: "No testing tools are mentioned. This should be verified rather than assumed missing." },
        { requirementId: "r102-edu", verdict: "met", evidence: "BS Software Engineering, SZABIST", explanation: "Related degree." },
        { requirementId: "r102-a11y", verdict: "partial", evidence: "“Responsive layouts with Bootstrap”", explanation: "Responsive work is evidenced; accessibility is not mentioned." },
      ],
    },
  },
  { id: "cand-213", jobId: "job-102", fileName: "Zain_Ali_CV.pdf", fileType: "PDF", fileSizeKb: 167, cvUrl: SAMPLE_CV, status: "processing", uploadedAt: "2026-11-04T08:15:00Z" },

  /* ===== job-103 · Data Analyst ===== */
  {
    id: "cand-214",
    jobId: "job-103",
    fileName: "Mehwish_Iqbal_CV.pdf",
    fileType: "PDF",
    fileSizeKb: 132,
    cvUrl: SAMPLE_CV,
    status: "completed",
    uploadedAt: "2026-10-16T11:30:00Z",
    profile: {
      name: "Mehwish Iqbal",
      email: "mehwish.iqbal@email.com",
      phone: "+92 322 6677889",
      location: "Karachi, PK",
      summary: "Data analyst with 4 years of experience in SQL, Power BI and Python.",
      currentRole: "Data Analyst at RetailCo",
      totalExperienceYears: 4,
      skills: ["SQL", "Power BI", "Python", "Pandas", "Excel"],
      workHistory: [{ title: "Data Analyst", company: "RetailCo", period: "2022 – Present" }],
      education: [{ degree: "BS Statistics", institution: "University of Karachi", year: "2022" }],
    },
    evaluation: {
      summary: "Mehwish meets all mandatory and preferred requirements, with clear evidence of SQL, Power BI and Python in her current role.",
      strengths: ["Built 20+ Power BI dashboards", "Python automation of reporting"],
      gaps: [],
      toVerify: [],
      requirements: [
        { requirementId: "r103-exp", verdict: "met", evidence: "2022 – Present", explanation: "About 4 years." },
        { requirementId: "r103-sql", verdict: "met", evidence: "“Complex SQL on 100M-row sales warehouse”", explanation: "Strong SQL." },
        { requirementId: "r103-bi", verdict: "met", evidence: "“20+ Power BI dashboards”", explanation: "Meets the requirement." },
        { requirementId: "r103-python", verdict: "met", evidence: "“Pandas scripts to automate weekly reports”", explanation: "Practical Python." },
        { requirementId: "r103-edu", verdict: "met", evidence: "BS Statistics, University of Karachi", explanation: "Matching degree." },
      ],
    },
  },
  {
    id: "cand-215",
    jobId: "job-103",
    fileName: "James_Wilson_CV.pdf",
    fileType: "PDF",
    fileSizeKb: 109,
    cvUrl: SAMPLE_CV,
    status: "completed",
    uploadedAt: "2026-10-16T11:30:00Z",
    profile: {
      name: "James Wilson",
      email: "james.wilson@email.com",
      phone: "+971 50 123 4567",
      location: "Dubai, UAE",
      summary: "Business analyst with 3 years of experience in Excel and Tableau reporting.",
      currentRole: "Business Analyst at Gulfmart",
      totalExperienceYears: 3,
      skills: ["Excel", "Tableau", "SQL"],
      workHistory: [{ title: "Business Analyst", company: "Gulfmart", period: "2023 – Present" }],
      education: [{ degree: "BA Business Administration", institution: "Heriot-Watt Dubai", year: "2023" }],
    },
    evaluation: {
      summary:
        "James has the required experience along with Tableau and SQL skills, but his degree is in Business Administration, while a Statistics/Mathematics degree is mandatory for this role.",
      strengths: ["Tableau reporting for leadership", "SQL for ad-hoc analysis"],
      gaps: ["Degree does not match the mandatory field", "No Python"],
      toVerify: ["Depth of SQL (only basic queries described)"],
      requirements: [
        { requirementId: "r103-exp", verdict: "met", evidence: "2023 – Present", explanation: "About 3 years." },
        { requirementId: "r103-sql", verdict: "partial", evidence: "“Ad-hoc SQL queries for monthly reports”", explanation: "Basic SQL only." },
        { requirementId: "r103-bi", verdict: "met", evidence: "“Tableau dashboards for leadership”", explanation: "Meets the Tableau option." },
        { requirementId: "r103-python", verdict: "not_found", evidence: null, explanation: "Python is not mentioned." },
        { requirementId: "r103-edu", verdict: "not_met", evidence: "BA Business Administration", explanation: "The degree is not in Statistics, Mathematics or a related quantitative field." },
      ],
    },
  },
];

export const getCandidateById = (id: string) => mockCandidates.find((c) => c.id === id);
export const getCandidatesByJob = (jobId: string) => mockCandidates.filter((c) => c.jobId === jobId);
