import fs from 'fs';
import { NextFunction, Request, Response } from 'express';
import { isUUID } from 'class-validator';
import asyncHandler from '../common/asyncHandler';
import AuthMiddleware from '../auth/jwt';
import CandidateRepository from '../repositories/candidate.repository';
import CvProcessingQueue from '../lib/classes/CvProcessingQueue';
import CvAccessToken from '../lib/classes/CvAccessToken';
import {
  CV_FIELD_NAME,
  RejectedFile,
  decodeFileName,
  fromStoragePath,
  getCvFileType,
  hasValidSignature,
  toStoragePath,
} from '../common/cvUpload';
import { toJobResponse } from './job.service';
import { Candidate, Job } from '../models';
import { CandidateCreationAttributes, PROCESSING_STATUSES, ProcessingStatus } from '../models/interfaces';

const apiPublicUrl = () => (process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 4000}/api/v1`).replace(/\/$/, '');

/** Public shape of a candidate (matches Candidate in the recruiter panel: src/data/candidates.ts). */
export const toCandidateResponse = (candidate: Candidate) => ({
  id: candidate.id,
  jobId: candidate.jobId,
  fileName: candidate.fileName,
  fileType: candidate.fileType,
  fileSizeKb: Math.round((candidate.fileSizeBytes / 1024) * 10) / 10,
  // Signed, short-lived link so it works directly in <a href> / <iframe> without an auth header.
  cvUrl: `${apiPublicUrl()}/candidates/${candidate.id}/cv?token=${CvAccessToken.create(candidate.id)}`,
  status: candidate.status,
  ...(candidate.errorMessage && { errorMessage: candidate.errorMessage }),
  uploadedAt: candidate.createdAt.toISOString(),
  processedAt: candidate.processedAt ? candidate.processedAt.toISOString() : null,
  matchScore: candidate.matchScore,
  ...(candidate.profile && { profile: candidate.profile }),
  ...(candidate.evaluation && { evaluation: candidate.evaluation }),
});

const CV_MIME_TYPES = {
  PDF: 'application/pdf',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
} as const;

type CandidateSort = 'score' | 'name' | 'experience' | 'uploaded';
const CANDIDATE_SORTS: CandidateSort[] = ['score', 'name', 'experience', 'uploaded'];

/** Queued and processing CVs are listed after analysed ones, then failed ones last. */
const STATUS_ORDER: Record<ProcessingStatus, number> = { completed: 0, processing: 1, queued: 2, failed: 3 };

const profileName = (c: Candidate) => String(c.profile?.name || c.fileName);
const experienceYears = (c: Candidate) => Number(c.profile?.totalExperienceYears) || 0;

const byScore = (a: Candidate, b: Candidate) =>
  (b.matchScore ?? -1) - (a.matchScore ?? -1) || profileName(a).localeCompare(profileName(b));

const SORTERS: Record<CandidateSort, (a: Candidate, b: Candidate) => number> = {
  score: byScore,
  name: (a, b) => profileName(a).localeCompare(profileName(b)),
  experience: (a, b) => experienceYears(b) - experienceYears(a) || byScore(a, b),
  uploaded: (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
};

/**
 * Loads :id for the logged-in recruiter (with its job). Sends 404 and returns null when the id is
 * malformed, missing, or belongs to another recruiter's job.
 */
const loadOwnCandidate = async (req: Request, res: Response): Promise<Candidate | null> => {
  const id = String(req.params.id);
  const candidate = isUUID(id) ? await CandidateRepository.findByIdForRecruiter(id, req.user!.id) : null;
  if (!candidate) res.generalError('Candidate not found.', {}, 404);
  return candidate;
};

const removeStoredFile = (candidate: Candidate) =>
  fs.promises.unlink(fromStoragePath(candidate.storagePath)).catch(() => undefined);

const removeFiles = (files: Express.Multer.File[]) =>
  Promise.all(files.map((file) => fs.promises.unlink(file.path).catch(() => undefined)));

const QUEUE_FAILED_MESSAGE = 'Could not queue the CV for analysis. Please retry.';

class CandidateService {
  /**
   * POST /api/v1/recruiter/jobs/:id/cvs  (multipart/form-data, field "files")
   * Stores the CVs, creates a queued candidate for each, and publishes one RabbitMQ message per CV.
   * Invalid files are skipped and reported in `rejected`; the rest are still accepted.
   */
  static uploadCvs = asyncHandler(async (req: Request, res: Response) => {
    const job = res.locals.job as Job;
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    const rejected: RejectedFile[] = [...(req.rejectedFiles ?? [])];

    // Check the real file content, not just the extension.
    const accepted: { file: Express.Multer.File; data: CandidateCreationAttributes }[] = [];
    for (const file of files) {
      const fileName = decodeFileName(file.originalname);
      const fileType = getCvFileType(fileName)!;

      if (file.size === 0) {
        rejected.push({ fileName, reason: 'File is empty.' });
        await removeFiles([file]);
        continue;
      }
      if (!(await hasValidSignature(file.path, fileType))) {
        rejected.push({ fileName, reason: `File content is not a valid ${fileType}.` });
        await removeFiles([file]);
        continue;
      }

      accepted.push({
        file,
        data: {
          jobId: job.id,
          fileName,
          fileType,
          mimeType: file.mimetype,
          fileSizeBytes: file.size,
          storagePath: toStoragePath(file.path),
        },
      });
    }

    if (accepted.length === 0) {
      const errors = rejected.length > 0
        ? rejected.map((r) => `${r.fileName}: ${r.reason}`)
        : [`Attach at least one PDF or DOCX file in the "${CV_FIELD_NAME}" field.`];
      return res.generalError('No valid CV files were uploaded.', { errors }, 400);
    }

    let candidates: Candidate[];
    try {
      candidates = await CandidateRepository.bulkCreate(accepted.map((a) => a.data));
    } catch (err) {
      await removeFiles(accepted.map((a) => a.file));
      throw err;
    }

    // Queue each CV. A CV that can't be queued is marked failed so it shows up for retry.
    let queued = 0;
    for (const candidate of candidates) {
      try {
        await CvProcessingQueue.enqueue({ candidateId: candidate.id, jobId: job.id });
        queued += 1;
      } catch (err: any) {
        console.error(`Failed to queue candidate ${candidate.id}:`, err?.message || err);
        await CandidateRepository.markFailed(candidate, QUEUE_FAILED_MESSAGE);
      }
    }

    const message = queued === candidates.length
      ? `${queued} CV(s) uploaded and queued for analysis.`
      : `${candidates.length} CV(s) uploaded; ${candidates.length - queued} could not be queued for analysis.`;

    return res.generalResponse(message, {
      jobId: job.id,
      uploaded: candidates.length,
      queued,
      candidates: candidates.map(toCandidateResponse),
      rejected,
    }, 201);
  });

  /**
   * GET /api/v1/recruiter/jobs/:id/candidates?sort=score&status=completed
   * All CVs of a job with a progress summary. Analysed candidates get a `rank` by match score
   * (1 = best), whatever the display sort; queued / processing / failed CVs have rank null.
   */
  static listForJob = asyncHandler(async (req: Request, res: Response) => {
    const job = res.locals.job as Job;
    const sort = CANDIDATE_SORTS.includes(req.query.sort as CandidateSort) ? (req.query.sort as CandidateSort) : 'score';
    const statusFilter = PROCESSING_STATUSES.includes(req.query.status as ProcessingStatus)
      ? (req.query.status as ProcessingStatus)
      : undefined;

    const all = await CandidateRepository.findAllForJob(job.id);

    const rankById = new Map(
      all
        .filter((c) => c.status === 'completed')
        .sort(byScore)
        .map((c, index) => [c.id, index + 1]),
    );

    const listed = all
      .filter((c) => !statusFilter || c.status === statusFilter)
      .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || SORTERS[sort](a, b));

    const count = (status: ProcessingStatus) => all.filter((c) => c.status === status).length;
    const scores = all.filter((c) => c.status === 'completed' && c.matchScore !== null).map((c) => c.matchScore!);
    const requirements = job.requirements ?? [];

    return res.generalResponse('Candidates fetched successfully.', {
      job: { id: job.id, title: job.title },
      summary: {
        totalCvs: all.length,
        analyzed: count('completed'),
        queued: count('queued'),
        processing: count('processing'),
        inProgress: count('queued') + count('processing'),
        failed: count('failed'),
        averageScore: scores.length ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length) : null,
        topScore: scores.length ? Math.max(...scores) : null,
        mandatory: requirements.filter((r) => r.type === 'mandatory').length,
        preferred: requirements.filter((r) => r.type === 'preferred').length,
      },
      candidates: listed.map((c) => ({ ...toCandidateResponse(c), rank: rankById.get(c.id) ?? null })),
    }, 200);
  });

  /** GET /api/v1/recruiter/candidates/:id: full profile + evaluation, with the job and its requirements. */
  static getCandidate = asyncHandler(async (req: Request, res: Response) => {
    const candidate = await loadOwnCandidate(req, res);
    if (!candidate) return;

    const job = (candidate as Candidate & { job: Job }).job;
    return res.generalResponse('Candidate fetched successfully.', {
      ...toCandidateResponse(candidate),
      rank: await CandidateRepository.getRank(candidate),
      job: toJobResponse(job),
    }, 200);
  });

  /**
   * Access check for GET /candidates/:id/cv. Accepts either the signed ?token= from cvUrl, or a
   * normal Authorization: Bearer token (then the CV must belong to the recruiter's job).
   */
  static cvAccess = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const id = String(req.params.id);
    const token = typeof req.query.token === 'string' ? req.query.token : '';

    if (token) {
      if (!isUUID(id) || !CvAccessToken.verify(token, id)) {
        return res.generalError('This CV link is invalid or has expired. Reload the page to get a new link.', {}, 401);
      }
      res.locals.candidate = await CandidateRepository.findById(id);
      if (!res.locals.candidate) return res.generalError('Candidate not found.', {}, 404);
      return next();
    }

    await AuthMiddleware.auth(req, res, async (authError?: unknown) => {
      if (authError) return next(authError);
      try {
        const candidate = await loadOwnCandidate(req, res);
        if (!candidate) return;
        res.locals.candidate = candidate;
        next();
      } catch (err) {
        next(err);
      }
    });
  });

  /**
   * GET /api/v1/recruiter/candidates/:id/cv            -> shows the file in the browser
   * GET /api/v1/recruiter/candidates/:id/cv?download=1 -> downloads it with the original file name
   */
  static serveCv = asyncHandler(async (req: Request, res: Response) => {
    const candidate = res.locals.candidate as Candidate;
    const filePath = fromStoragePath(candidate.storagePath);

    if (!fs.existsSync(filePath)) {
      return res.generalError('The CV file is no longer available.', {}, 404);
    }

    const download = req.query.download === '1' || req.query.download === 'true';
    const safeAscii = candidate.fileName.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_');
    res.setHeader('Content-Type', CV_MIME_TYPES[candidate.fileType]);
    res.setHeader(
      'Content-Disposition',
      `${download ? 'attachment' : 'inline'}; filename="${safeAscii}"; filename*=UTF-8''${encodeURIComponent(candidate.fileName)}`,
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, max-age=300');

    res.sendFile(filePath, (err) => {
      if (err && !res.headersSent) res.generalError('Could not send the CV file.', {}, 500);
    });
  });

  /** POST /api/v1/recruiter/candidates/:id/retry: re-queues a failed CV for analysis. */
  static retry = asyncHandler(async (req: Request, res: Response) => {
    const candidate = await loadOwnCandidate(req, res);
    if (!candidate) return;

    if (candidate.status !== 'failed') {
      return res.generalError(`Only failed CVs can be retried (this CV is ${candidate.status}).`, {}, 409);
    }
    if (!fs.existsSync(fromStoragePath(candidate.storagePath))) {
      return res.generalError('The CV file is no longer available. Please upload it again.', {}, 409);
    }

    await CandidateRepository.resetForRetry(candidate);
    try {
      await CvProcessingQueue.enqueue({ candidateId: candidate.id, jobId: candidate.jobId });
    } catch (err: any) {
      console.error(`Failed to re-queue candidate ${candidate.id}:`, err?.message || err);
      await CandidateRepository.markFailed(candidate, QUEUE_FAILED_MESSAGE);
      return res.generalError('Could not queue the CV for analysis. Please try again.', {}, 502);
    }

    return res.generalResponse('CV queued for analysis again.', toCandidateResponse(candidate), 200);
  });

  /** DELETE /api/v1/recruiter/candidates/:id: removes the candidate and its CV file. */
  static deleteCandidate = asyncHandler(async (req: Request, res: Response) => {
    const candidate = await loadOwnCandidate(req, res);
    if (!candidate) return;

    await CandidateRepository.delete(candidate);
    await removeStoredFile(candidate);

    return res.generalResponse('Candidate deleted successfully.', { id: candidate.id }, 200);
  });
}

export default CandidateService;
