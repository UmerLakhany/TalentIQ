import { IsBoolean, IsOptional } from 'class-validator';
import CreateJobDTO from './CreateJob.dto';

/**
 * Body of PUT /api/v1/recruiter/jobs/:id: the full job form (same fields and rules as create).
 * `reanalyze` comes from the edit form ("re-run analysis for existing CVs"); it is accepted now
 * and will be used once CV analysis exists.
 */
export default class UpdateJobDTO extends CreateJobDTO {
  @IsOptional()
  @IsBoolean({ message: 'reanalyze must be true or false.' })
  reanalyze?: boolean;
}
