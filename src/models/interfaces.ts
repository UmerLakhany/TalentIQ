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

export interface PageParams {
  pageNumber?: number;
  pageSize?: number;
}
