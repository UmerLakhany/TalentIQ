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

  /**
   * Updates the job and syncs its requirements in one transaction. A requirement with the same
   * category and name as before keeps its id (so existing AI verdicts still point at it); new ones
   * are created and removed ones deleted.
   * Returns the updated job and whether the evaluation criteria changed (anything the AI uses:
   * title, description, minimum experience, or any requirement added / removed / re-typed).
   */
  static async updateWithRequirements(
    job: Job,
    data: Pick<JobAttributes, 'title' | 'description' | 'minExperience'>,
    requirements: JobRequirementCreationAttributes[],
  ): Promise<{ job: Job; criteriaChanged: boolean }> {
    const keyOf = (r: { category: string; name: string }) => `${r.category}|${r.name.trim().toLowerCase()}`;
    const existing = new Map((job.requirements ?? []).map((r) => [keyOf(r), r]));

    let criteriaChanged =
      data.title !== job.title || data.description !== job.description || data.minExperience !== job.minExperience;

    await sequelize.transaction(async (transaction) => {
      await job.update(data, { transaction });

      const keep = new Set<string>();
      for (const requirement of requirements) {
        const match = existing.get(keyOf(requirement));
        if (match && !keep.has(match.id)) {
          keep.add(match.id);
          if (match.type !== requirement.type) criteriaChanged = true;
          await match.update(
            { name: requirement.name, type: requirement.type, sortOrder: requirement.sortOrder },
            { transaction },
          );
        } else {
          criteriaChanged = true;
          await JobRequirement.create({ ...requirement, jobId: job.id }, { transaction });
        }
      }

      const removed = (job.requirements ?? []).filter((r) => !keep.has(r.id)).map((r) => r.id);
      if (removed.length > 0) {
        criteriaChanged = true;
        await JobRequirement.destroy({ where: { id: removed }, transaction });
      }
    });

    return { job: (await JobRepository.findById(job.id))!, criteriaChanged };
  }

  /** Deletes the job; its requirements are removed by the ON DELETE CASCADE foreign key. */
  static async delete(job: Job): Promise<void> {
    await job.destroy();
  }
}

export default JobRepository;
