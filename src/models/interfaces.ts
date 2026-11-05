export type RecruiterRole = 'admin' | 'recruiter';

export interface RecruiterAttributes {
  id: string;
  fullName: string;
  email: string;
  password: string;
  role: RecruiterRole;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type RecruiterCreationAttributes = Pick<RecruiterAttributes, 'fullName' | 'email' | 'password'> &
  Partial<Pick<RecruiterAttributes, 'role' | 'isActive'>>;

// ----- Jobs (match Job / JobRequirement in the recruiter panel: src/data/jobs.ts) -----

export type RequirementCategory = 'experience' | 'skill' | 'education' | 'other';
export type RequirementType = 'mandatory' | 'preferred' | 'not_required';

export const REQUIREMENT_CATEGORIES: RequirementCategory[] = ['experience', 'skill', 'education', 'other'];
export const REQUIREMENT_TYPES: RequirementType[] = ['mandatory', 'preferred', 'not_required'];

export interface JobAttributes {
  id: string;
  recruiterId: string;
  title: string;
  description: string;
  minExperience: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type JobCreationAttributes = Omit<JobAttributes, 'id' | 'createdAt' | 'updatedAt'>;

export interface JobRequirementAttributes {
  id: string;
  jobId: string;
  category: RequirementCategory;
  name: string;
  type: RequirementType;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type JobRequirementCreationAttributes = Omit<JobRequirementAttributes, 'id' | 'jobId' | 'createdAt' | 'updatedAt'> &
  Partial<Pick<JobRequirementAttributes, 'jobId'>>;

// ----- Candidates (match Candidate in the recruiter panel: src/data/candidates.ts) -----

export type ProcessingStatus = 'queued' | 'processing' | 'completed' | 'failed';
export type CvFileType = 'PDF' | 'DOCX';

export const PROCESSING_STATUSES: ProcessingStatus[] = ['queued', 'processing', 'completed', 'failed'];
export const CV_FILE_TYPES: CvFileType[] = ['PDF', 'DOCX'];

export interface CandidateAttributes {
  id: string;
  jobId: string;
  fileName: string;
  fileType: CvFileType;
  mimeType: string;
  fileSizeBytes: number;
  /** Path relative to UPLOAD_DIR, e.g. cvs/<jobId>/<uuid>.pdf */
  storagePath: string;
  status: ProcessingStatus;
  errorMessage: string | null;
  /** Information the AI extracted from the CV (CandidateProfile in the panel) */
  profile: Record<string, any> | null;
  /** AI evaluation against the job requirements (CandidateEvaluation in the panel) */
  evaluation: Record<string, any> | null;
  matchScore: number | null;
  attempts: number;
  processedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type CandidateCreationAttributes = Pick<
  CandidateAttributes,
  'jobId' | 'fileName' | 'fileType' | 'mimeType' | 'fileSizeBytes' | 'storagePath'
> & Partial<Pick<CandidateAttributes, 'status' | 'errorMessage'>>;

export interface PageParams {
  pageNumber?: number;
  pageSize?: number;
}
