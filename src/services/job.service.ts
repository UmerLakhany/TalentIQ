import { Request, Response } from 'express';
import asyncHandler from '../common/asyncHandler';
import { isUUID } from 'class-validator';
import JobRepository, { JobSort } from '../repositories/job.repository';
import CreateJobDTO from '../dto/classes/CreateJob.dto';
import UpdateJobDTO from '../dto/classes/UpdateJob.dto';
import { Job } from '../models';
import { JobRequirementCreationAttributes } from '../models/interfaces';

/** Public shape of a job (matches Job in the recruiter panel: src/data/jobs.ts). */
export const toJobResponse = (job: Job) => ({
  id: job.id,
  title: job.title,
  description: job.description,
  minExperience: job.minExperience,
  requirements: (job.requirements || []).map((requirement) => ({
    id: requirement.id,
    category: requirement.category,
    name: requirement.name,
    type: requirement.type,
  })),
  createdAt: job.createdAt.toISOString().slice(0, 10), // YYYY-MM-DD
});

/**
 * Turns the form fields into the stored requirement list, in display order:
 * experience, skills, education, other.
 */
const buildRequirements = (body: CreateJobDTO): JobRequirementCreationAttributes[] => {
  const requirements: Omit<JobRequirementCreationAttributes, 'sortOrder'>[] = [];

  if (body.minExperience > 0) {
    const years = body.minExperience === 1 ? 'year' : 'years';
    requirements.push({
      category: 'experience',
      name: `Minimum ${body.minExperience} ${years} of professional experience`,
      type: body.experienceType,
    });
  }

  body.skills.forEach((skill) => {
    requirements.push({ category: 'skill', name: skill.name.trim(), type: skill.type });
  });

  const education = body.education?.name?.trim();
  if (education) {
    requirements.push({ category: 'education', name: education, type: body.education!.type });
  }

  (body.otherRequirements || []).forEach((other) => {
    requirements.push({ category: 'other', name: other.name.trim(), type: other.type });
  });

  return requirements.map((requirement, index) => ({ ...requirement, sortOrder: index }));
};

/** Names of skills listed more than once (case-insensitive), as the form also rejects. */
const findDuplicateSkills = (skills: CreateJobDTO['skills']): string[] => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  skills.forEach((skill) => {
    const key = skill.name.trim().toLowerCase();
    if (seen.has(key)) duplicates.add(skill.name.trim());
    seen.add(key);
  });
  return [...duplicates];
};

const duplicateSkillsError = (body: CreateJobDTO) => {
  const duplicates = findDuplicateSkills(body.skills);
  return duplicates.length > 0
    ? { errors: duplicates.map((name) => `Skill "${name}" is already listed.`) }
    : null;
};

const jobFields = (body: CreateJobDTO) => ({
  title: body.title.trim(),
  description: body.description?.trim() || '',
  minExperience: body.minExperience,
});

const JOB_SORTS: JobSort[] = ['newest', 'oldest', 'title_asc', 'title_desc'];
const MAX_PAGE_SIZE = 100;

/** Reads a positive whole number from the query string, falling back to the default. */
const positiveInt = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

/**
 * Loads :id for the logged-in recruiter. Sends 404 (and returns null) when the id is malformed,
 * missing, or belongs to another recruiter, so other recruiters' jobs can't be detected.
 */
const loadOwnJob = async (req: Request, res: Response): Promise<Job | null> => {
  const id = String(req.params.id);
  const job = isUUID(id) ? await JobRepository.findByIdForRecruiter(id, req.user!.id) : null;
  if (!job) res.generalError('Job not found.', {}, 404);
  return job;
};

class JobService {
  /** POST /api/v1/recruiter/jobs (also served at /api/v1/jobs for the recruiter panel) */
  static createJob = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as CreateJobDTO;

    const duplicateErrors = duplicateSkillsError(body);
    if (duplicateErrors) {
      return res.generalError('Validation Error!', duplicateErrors, 400);
    }

    const job = await JobRepository.createWithRequirements(
      { recruiterId: req.user!.id, ...jobFields(body) },
      buildRequirements(body),
    );

    return res.generalResponse('Job created successfully.', toJobResponse(job), 201);
  });

  /** GET /api/v1/recruiter/jobs?page=1&limit=10&search=developer&sort=newest */
  static listJobs = asyncHandler(async (req: Request, res: Response) => {
    const page = positiveInt(req.query.page, 1);
    const limit = Math.min(positiveInt(req.query.limit, 10), MAX_PAGE_SIZE);
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const sort = JOB_SORTS.includes(req.query.sort as JobSort) ? (req.query.sort as JobSort) : 'newest';

    const { rows, count } = await JobRepository.listForRecruiter({
      recruiterId: req.user!.id,
      page,
      limit,
      search: search || undefined,
      sort,
    });

    return res.generalResponse('Jobs fetched successfully.', {
      jobs: rows.map(toJobResponse),
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    }, 200);
  });

  /** GET /api/v1/recruiter/jobs/:id */
  static getJob = asyncHandler(async (req: Request, res: Response) => {
    const job = await loadOwnJob(req, res);
    if (!job) return;

    return res.generalResponse('Job fetched successfully.', toJobResponse(job), 200);
  });

  /** PUT /api/v1/recruiter/jobs/:id (full update: same body as create; requirements are replaced) */
  static updateJob = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as UpdateJobDTO;

    const duplicateErrors = duplicateSkillsError(body);
    if (duplicateErrors) {
      return res.generalError('Validation Error!', duplicateErrors, 400);
    }

    const job = await loadOwnJob(req, res);
    if (!job) return;

    const updated = await JobRepository.updateWithRequirements(job, jobFields(body), buildRequirements(body));

    return res.generalResponse('Job updated successfully.', toJobResponse(updated), 200);
  });

  /** DELETE /api/v1/recruiter/jobs/:id (also deletes its requirements) */
  static deleteJob = asyncHandler(async (req: Request, res: Response) => {
    const job = await loadOwnJob(req, res);
    if (!job) return;

    await JobRepository.delete(job);

    return res.generalResponse('Job deleted successfully.', { id: job.id }, 200);
  });
}

export default JobService;
