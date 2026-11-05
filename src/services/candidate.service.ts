import fs from 'fs';
import { Request, Response } from 'express';
import asyncHandler from '../common/asyncHandler';
import CandidateRepository from '../repositories/candidate.repository';
import CvProcessingQueue from '../lib/classes/CvProcessingQueue';
import {
  CV_FIELD_NAME,
  RejectedFile,
  decodeFileName,
  getCvFileType,
  hasValidSignature,
  toStoragePath,
} from '../common/cvUpload';
import { Candidate, Job } from '../models';
import { CandidateCreationAttributes } from '../models/interfaces';

const apiPublicUrl = () => (process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 4000}/api/v1`).replace(/\/$/, '');

/** Public shape of a candidate (matches Candidate in the recruiter panel: src/data/candidates.ts). */
export const toCandidateResponse = (candidate: Candidate) => ({
  id: candidate.id,
  jobId: candidate.jobId,
  fileName: candidate.fileName,
  fileType: candidate.fileType,
  fileSizeKb: Math.round((candidate.fileSizeBytes / 1024) * 10) / 10,
  cvUrl: `${apiPublicUrl()}/candidates/${candidate.id}/cv`,
  status: candidate.status,
  ...(candidate.errorMessage && { errorMessage: candidate.errorMessage }),
  uploadedAt: candidate.createdAt.toISOString(),
  matchScore: candidate.matchScore,
  ...(candidate.profile && { profile: candidate.profile }),
  ...(candidate.evaluation && { evaluation: candidate.evaluation }),
});

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
}

export default CandidateService;
