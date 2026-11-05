import fs from 'fs';
import { NextFunction, Request, Response } from 'express';
import asyncHandler from '../common/asyncHandler';
import { jobUploadDir } from '../common/storage';
import CandidateRepository from '../repositories/candidate.repository';
import CvProcessingQueue from '../lib/classes/CvProcessingQueue';
import Cache from '../lib/classes/Cache';
import { calculateMatchScore } from '../lib/analysis/scoring';
import { Verdict } from '../lib/analysis/types';
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
  /**
   * Middleware: loads :id for the logged-in recruiter into res.locals.job, or responds 404.
   * Used before file uploads so nothing is stored for a job the recruiter doesn't own.
   */
  static requireOwnJob = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const job = await loadOwnJob(req, res);
    if (!job) return;
    res.locals.job = job;
    next();
  });

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

    await Cache.invalidateJob(job.id, job.recruiterId); // the dashboard counts jobs
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

  /**
   * PUT /api/v1/recruiter/jobs/:id (full update: same body as create).
   * If the evaluation criteria changed and `reanalyze` is true (the default, as in the edit form),
   * every CV of the job is queued again so all candidates are scored against the new criteria.
   * With `reanalyze: false`, existing verdicts are kept and scores are recalculated from them
   * (new requirements stay unassessed until the next analysis).
   */
  static updateJob = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as UpdateJobDTO;

    const duplicateErrors = duplicateSkillsError(body);
    if (duplicateErrors) {
      return res.generalError('Validation Error!', duplicateErrors, 400);
    }

    const job = await loadOwnJob(req, res);
    if (!job) return;

    const { job: updated, criteriaChanged } = await JobRepository.updateWithRequirements(
      job,
      jobFields(body),
      buildRequirements(body),
    );

    const reanalyze = body.reanalyze !== false;
    let reanalysis: { criteriaChanged: boolean; requeued: number; rescored: number } = {
      criteriaChanged,
      requeued: 0,
      rescored: 0,
    };

    if (criteriaChanged && reanalyze) {
      reanalysis.requeued = await JobService.requeueAllCvs(updated);
    } else if (criteriaChanged) {
      reanalysis.rescored = await JobService.rescoreFromExistingVerdicts(updated);
    }
    await Cache.invalidateJob(updated.id, updated.recruiterId);

    const message = reanalysis.requeued > 0
      ? `Job updated successfully. ${reanalysis.requeued} CV(s) queued for re-analysis.`
      : 'Job updated successfully.';
    return res.generalResponse(message, { ...toJobResponse(updated), reanalysis }, 200);
  });

  /** DELETE /api/v1/recruiter/jobs/:id (also deletes its requirements) */
  static deleteJob = asyncHandler(async (req: Request, res: Response) => {
    const job = await loadOwnJob(req, res);
    if (!job) return;

    await JobRepository.delete(job);
    // Candidates are removed by the database cascade; remove their uploaded CV files too.
    await fs.promises
      .rm(jobUploadDir(job.id), { recursive: true, force: true })
      .catch((err) => console.error(`Failed to remove uploads for job ${job.id}:`, err?.message || err));
    await Cache.invalidateJob(job.id, job.recruiterId);

    return res.generalResponse('Job deleted successfully.', { id: job.id }, 200);
  });

  /** Queues every CV of the job again with a new analysisVersion. Returns how many were queued. */
  private static async requeueAllCvs(job: Job): Promise<number> {
    const candidates = await CandidateRepository.resetAllForJob(job.id);
    let queued = 0;
    for (const candidate of candidates) {
      try {
        await CvProcessingQueue.enqueue({
          candidateId: candidate.id,
          jobId: job.id,
          analysisVersion: candidate.analysisVersion,
        });
        queued += 1;
      } catch (err: any) {
        console.error(`Failed to re-queue candidate ${candidate.id}:`, err?.message || err);
        await CandidateRepository.markFailed(candidate, 'Could not queue the CV for re-analysis. Please retry.');
      }
    }
    return queued;
  }

  /**
   * Recalculates stored scores of analysed CVs from their existing verdicts, using the job's current
   * requirement types. Verdicts for removed requirements are ignored. Returns how many were updated.
   */
  private static async rescoreFromExistingVerdicts(job: Job): Promise<number> {
    const typeById = new Map((job.requirements ?? []).map((r) => [r.id, r.type]));
    const candidates = await CandidateRepository.findAllForJob(job.id, 'completed');

    for (const candidate of candidates) {
      const rows = ((candidate.evaluation?.requirements ?? []) as { requirementId: string; verdict: Verdict }[])
        .filter((row) => typeById.has(row.requirementId) && typeById.get(row.requirementId) !== 'not_required')
        .map((row) => ({ type: typeById.get(row.requirementId)!, verdict: row.verdict }));
      await candidate.update({ matchScore: calculateMatchScore(rows) });
    }
    return candidates.length;
  }
}

export default JobService;
