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

export interface PageParams {
  pageNumber?: number;
  pageSize?: number;
}
