import { Op, Order, WhereOptions } from 'sequelize';
import SequelizeClass from '../../settings/orm/sequelize';
import { Job, JobRequirement } from '../models';
import { JobAttributes, JobCreationAttributes, JobRequirementCreationAttributes } from '../models/interfaces';

const sequelize = SequelizeClass.getInstance().sequelize;

const requirementsInclude = {
  model: JobRequirement,
  as: 'requirements',
};

const requirementsOrder: Order = [[{ model: JobRequirement, as: 'requirements' }, 'sortOrder', 'ASC']];

export type JobSort = 'newest' | 'oldest' | 'title_asc' | 'title_desc';

const SORT_ORDER: Record<JobSort, Order> = {
  newest: [['createdAt', 'DESC']],
  oldest: [['createdAt', 'ASC']],
  title_asc: [['title', 'ASC']],
  title_desc: [['title', 'DESC']],
};

export interface JobListParams {
  recruiterId: string;
  page: number;
  limit: number;
  search?: string;
  sort: JobSort;
}

/** Escapes LIKE wildcards so a search for "100%" matches literally. */
const escapeLike = (value: string) => value.replace(/[\\%_]/g, (char) => `\\${char}`);

class JobRepository {
  /** Creates the job and all its requirements in one transaction (all or nothing). */
  static async createWithRequirements(
    data: JobCreationAttributes,
    requirements: JobRequirementCreationAttributes[],
  ): Promise<Job> {
    const jobId = await sequelize.transaction(async (transaction) => {
      const job = await Job.create(data, { transaction });
      await JobRequirement.bulkCreate(
        requirements.map((requirement) => ({ ...requirement, jobId: job.id })),
        { transaction },
      );
      return job.id;
    });

    return (await JobRepository.findById(jobId))!;
  }

  static async findById(id: string): Promise<Job | null> {
    return Job.findByPk(id, {
      include: [requirementsInclude],
      order: requirementsOrder,
    });
  }

  /** Finds a job only if it belongs to the recruiter. */
  static async findByIdForRecruiter(id: string, recruiterId: string): Promise<Job | null> {
    return Job.findOne({
      where: { id, recruiterId },
      include: [requirementsInclude],
      order: requirementsOrder,
    });
  }

  static async listForRecruiter(params: JobListParams): Promise<{ rows: Job[]; count: number }> {
    const where: WhereOptions<JobAttributes> = { recruiterId: params.recruiterId };
    if (params.search) {
      (where as any).title = { [Op.iLike]: `%${escapeLike(params.search)}%` };
    }

    return Job.findAndCountAll({
      where,
      include: [requirementsInclude],
      order: [...(SORT_ORDER[params.sort] as any[]), ...(requirementsOrder as any[])],
      limit: params.limit,
      offset: (params.page - 1) * params.limit,
      distinct: true, // count jobs, not job+requirement rows
    });
  }

  /** Updates the job and replaces its requirements in one transaction. */
  static async updateWithRequirements(
    job: Job,
    data: Pick<JobAttributes, 'title' | 'description' | 'minExperience'>,
    requirements: JobRequirementCreationAttributes[],
  ): Promise<Job> {
    await sequelize.transaction(async (transaction) => {
      await job.update(data, { transaction });
      await JobRequirement.destroy({ where: { jobId: job.id }, transaction });
      await JobRequirement.bulkCreate(
        requirements.map((requirement) => ({ ...requirement, jobId: job.id })),
        { transaction },
      );
    });

    return (await JobRepository.findById(job.id))!;
  }

  /** Deletes the job; its requirements are removed by the ON DELETE CASCADE foreign key. */
  static async delete(job: Job): Promise<void> {
    await job.destroy();
  }
}

export default JobRepository;
