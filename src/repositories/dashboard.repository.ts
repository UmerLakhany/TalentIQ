import { Candidate, Job, JobRequirement } from '../models';

class DashboardRepository {
  /** All jobs of a recruiter with requirement types (to check "all mandatory met"). */
  static async jobsForRecruiter(recruiterId: string): Promise<Job[]> {
    return Job.findAll({
      where: { recruiterId },
      include: [{ model: JobRequirement, as: 'requirements', attributes: ['id', 'type'] }],
      order: [['createdAt', 'DESC']],
    });
  }

  /** All CVs of the given jobs, without the file-storage details. */
  static async candidatesForJobs(jobIds: string[]): Promise<Candidate[]> {
    if (jobIds.length === 0) return [];
    return Candidate.findAll({
      where: { jobId: jobIds },
      attributes: ['id', 'jobId', 'fileName', 'status', 'matchScore', 'errorMessage', 'profile', 'evaluation', 'createdAt', 'processedAt'],
    });
  }
}

export default DashboardRepository;
