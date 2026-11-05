/** Shapes stored on the candidate; they match CandidateProfile / CandidateEvaluation in the recruiter panel. */

export type Verdict = 'met' | 'partial' | 'not_met' | 'not_found';
export const VERDICTS: Verdict[] = ['met', 'partial', 'not_met', 'not_found'];

export interface CandidateProfile {
  name: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  currentRole: string;
  totalExperienceYears: number;
  skills: string[];
  workHistory: { title: string; company: string; period: string }[];
  education: { degree: string; institution: string; year: string }[];
}

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

export interface CvAnalysisResult {
  profile: CandidateProfile;
  evaluation: CandidateEvaluation;
  matchScore: number;
  /** Which model produced the result, e.g. gemini:gemini-flash-latest */
  model: string;
}
