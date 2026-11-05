import { Op } from 'sequelize';
import { Candidate, Job, JobRequirement } from '../models';
import { CandidateCreationAttributes, ProcessingStatus } from '../models/interfaces';

const jobWithRequirements = (where: Record<string, unknown> = {}) => ({
  model: Job,
  as: 'job',
  where,
  include: [{ model: JobRequirement, as: 'requirements' }],
});

class CandidateRepository {
  static async bulkCreate(data: CandidateCreationAttributes[]): Promise<Candidate[]> {
    return Candidate.bulkCreate(data, { returning: true });
  }

  static async markFailed(candidate: Candidate, errorMessage: string): Promise<Candidate> {
    return candidate.update({ status: 'failed', errorMessage });
  }

  static async findAllForJob(jobId: string, status?: ProcessingStatus): Promise<Candidate[]> {
    return Candidate.findAll({
      where: { jobId, ...(status && { status }) },
      order: [['createdAt', 'ASC']],
    });
  }

  /** Finds a candidate only if its job belongs to the recruiter; includes the job and its requirements. */
  static async findByIdForRecruiter(id: string, recruiterId: string): Promise<Candidate | null> {
    return Candidate.findOne({
      where: { id },
      include: [jobWithRequirements({ recruiterId })],
      order: [[{ model: Job, as: 'job' }, { model: JobRequirement, as: 'requirements' }, 'sortOrder', 'ASC']],
    });
  }

  static async findById(id: string): Promise<Candidate | null> {
    return Candidate.findByPk(id);
  }

  /** 1 + the number of analysed candidates in the same job with a higher score. */
  static async getRank(candidate: Candidate): Promise<number | null> {
    if (candidate.status !== 'completed' || candidate.matchScore === null) return null;
    const higher = await Candidate.count({
      where: { jobId: candidate.jobId, status: 'completed', matchScore: { [Op.gt]: candidate.matchScore } },
    });
    return higher + 1;
  }

  /**
   * Clears previous results and bumps analysisVersion so the CV is analysed again from scratch.
   * Any older queued message or in-flight result for this CV is then ignored by the worker.
   */
  static async resetForRetry(candidate: Candidate): Promise<Candidate> {
    return candidate.update({
      status: 'queued',
      errorMessage: null,
      attempts: 0,
      profile: null,
      evaluation: null,
      matchScore: null,
      processedAt: null,
      analysisVersion: candidate.analysisVersion + 1,
    });
  }

  /**
   * Re-analysis after a job edit: queues every CV of the job again (keeping the previous result
   * visible until the new one arrives would mix old and new requirements, so results are cleared).
   * Returns the updated candidates, each with its new analysisVersion.
   */
  static async resetAllForJob(jobId: string): Promise<Candidate[]> {
    await Candidate.update(
      {
        status: 'queued',
        errorMessage: null,
        attempts: 0,
        profile: null,
        evaluation: null,
        matchScore: null,
        processedAt: null,
        analysisVersion: Candidate.sequelize!.literal('analysis_version + 1') as unknown as number,
      },
      { where: { jobId } },
    );
    return Candidate.findAll({ where: { jobId } });
  }

  static async delete(candidate: Candidate): Promise<void> {
    await candidate.destroy();
  }
}

export default CandidateRepository;
