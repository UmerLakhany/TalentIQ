import { RequirementType } from '../../models/interfaces';
import { Verdict } from './types';

/**
 * Same formula as the recruiter panel (src/utils/scoring.ts), so the stored score and the
 * score shown in the UI always agree:
 *   score = mandatory share x 70 + preferred share x 30   (a group with no requirements gives its weight to the other)
 *   share = average credit, where met = 1, partial = 0.5, not_met / not_found = 0
 *   not_required requirements are ignored.
 */
export const SCORE_WEIGHTS = { mandatory: 70, preferred: 30 };

const VERDICT_CREDIT: Record<Verdict, number> = { met: 1, partial: 0.5, not_met: 0, not_found: 0 };

export const calculateMatchScore = (rows: { type: RequirementType; verdict: Verdict }[]): number => {
  const mandatory = rows.filter((row) => row.type === 'mandatory');
  const preferred = rows.filter((row) => row.type === 'preferred');

  const mandatoryWeight = preferred.length === 0 ? 100 : mandatory.length === 0 ? 0 : SCORE_WEIGHTS.mandatory;
  const preferredWeight = 100 - mandatoryWeight;

  const share = (group: typeof rows) =>
    group.length === 0 ? 0 : group.reduce((sum, row) => sum + VERDICT_CREDIT[row.verdict], 0) / group.length;

  return Math.round(share(mandatory) * mandatoryWeight + share(preferred) * preferredWeight);
};
