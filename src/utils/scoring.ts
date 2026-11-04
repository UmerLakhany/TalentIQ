import type { Candidate, Verdict } from "@/data/candidates";
import type { Job, JobRequirement } from "@/data/jobs";

/**
 * Match score = weighted share of mandatory + preferred requirements.
 * The AI decides each verdict from CV evidence; this formula turns verdicts into a number.
 * (The backend will own this calculation once connected.)
 */
export const SCORE_WEIGHTS = { mandatory: 70, preferred: 30 };

const VERDICT_CREDIT: Record<Verdict, number> = { met: 1, partial: 0.5, not_met: 0, not_found: 0 };

export interface ScoreBreakdown {
  score: number;
  mandatoryPoints: number;
  mandatoryWeight: number;
  preferredPoints: number;
  preferredWeight: number;
  mandatoryMet: number;
  mandatoryTotal: number;
  /** Mandatory requirements that are not fully met */
  unmetMandatory: JobRequirement[];
}

export function calculateScore(job: Job, candidate: Candidate): ScoreBreakdown | null {
  if (!candidate.evaluation) return null;

  const rows = candidate.evaluation.requirements
    .map((row) => ({ requirement: job.requirements.find((r) => r.id === row.requirementId), verdict: row.verdict }))
    .filter((row): row is { requirement: JobRequirement; verdict: Verdict } =>
      Boolean(row.requirement && row.requirement.type !== "not_required")
    );

  const mandatory = rows.filter((row) => row.requirement.type === "mandatory");
  const preferred = rows.filter((row) => row.requirement.type === "preferred");

  // If one group is empty, the other takes the full 100%
  const mandatoryWeight = preferred.length === 0 ? 100 : mandatory.length === 0 ? 0 : SCORE_WEIGHTS.mandatory;
  const preferredWeight = 100 - mandatoryWeight;

  const share = (group: typeof rows) =>
    group.length === 0 ? 0 : group.reduce((sum, row) => sum + VERDICT_CREDIT[row.verdict], 0) / group.length;

  const mandatoryPoints = share(mandatory) * mandatoryWeight;
  const preferredPoints = share(preferred) * preferredWeight;

  return {
    score: Math.round(mandatoryPoints + preferredPoints),
    mandatoryPoints: Math.round(mandatoryPoints * 10) / 10,
    mandatoryWeight,
    preferredPoints: Math.round(preferredPoints * 10) / 10,
    preferredWeight,
    mandatoryMet: mandatory.filter((row) => row.verdict === "met").length,
    mandatoryTotal: mandatory.length,
    unmetMandatory: mandatory.filter((row) => row.verdict !== "met").map((row) => row.requirement),
  };
}
