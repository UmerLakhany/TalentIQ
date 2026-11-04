export interface Recruiter {
  id: string;
  fullName: string;
  email: string;
  jobTitle: string;
  avatarUrl?: string | null;
}

// Mock signed-in recruiter — replace with the auth API response later.
export const mockCurrentUser: Recruiter = {
  id: "rec-001",
  fullName: "Sarah Mitchell",
  email: "sarah.mitchell@hireflow.ai",
  jobTitle: "Senior Technical Recruiter",
  avatarUrl: null,
};
