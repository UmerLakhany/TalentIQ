import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { RequestHandler, Request } from 'express';
import multer from 'multer';
import { CvFileType } from '../models/interfaces';

/** Limits match the recruiter panel's CvUploader (MAX_FILES_PER_BATCH, MAX_FILE_SIZE_MB). */
export const CV_MAX_FILES = Number(process.env.CV_MAX_FILES) || 15;
export const CV_MAX_FILE_SIZE_MB = Number(process.env.CV_MAX_FILE_SIZE_MB) || 5;
/** Form-data field name the files must be sent in. */
export const CV_FIELD_NAME = 'files';

export { UPLOAD_ROOT, jobUploadDir, toStoragePath, fromStoragePath } from './storage';
import { jobUploadDir } from './storage';

const ALLOWED_TYPES: Record<string, { type: CvFileType; mimeTypes: string[] }> = {
  '.pdf': { type: 'PDF', mimeTypes: ['application/pdf'] },
  '.docx': {
    type: 'DOCX',
    mimeTypes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
};
// Some clients send this for any file; the real content is checked afterwards (hasValidSignature).
const GENERIC_MIME = 'application/octet-stream';

export interface RejectedFile {
  fileName: string;
  reason: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    rejectedFiles?: RejectedFile[];
  }
}

/**
 * Multer reads non-ASCII file names as latin1. Re-decode them as UTF-8, unless that produces
 * invalid characters (meaning the name was already decoded correctly).
 */
export const decodeFileName = (name: string) => {
  const decoded = Buffer.from(name, 'latin1').toString('utf8');
  const fileName = decoded.includes('�') ? name : decoded;
  return path.basename(fileName).slice(0, 255);
};

export const getCvFileType = (fileName: string): CvFileType | null =>
  ALLOWED_TYPES[path.extname(fileName).toLowerCase()]?.type ?? null;

/** Checks the file really is a PDF (starts with %PDF) or DOCX (a ZIP archive: starts with PK\x03\x04). */
export const hasValidSignature = async (filePath: string, type: CvFileType): Promise<boolean> => {
  const handle = await fs.promises.open(filePath, 'r');
  try {
    const buffer = Buffer.alloc(4);
    await handle.read(buffer, 0, 4, 0);
    return type === 'PDF'
      ? buffer.toString('latin1') === '%PDF'
      : buffer.equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
  } finally {
    await handle.close();
  }
};

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const dir = jobUploadDir(String(req.params.id));
    fs.mkdir(dir, { recursive: true }, (err) => cb(err ?? null, dir));
  },
  // Stored under a random name; the original name is kept in the database.
  filename: (_req, file, cb) => {
    cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const fileName = decodeFileName(file.originalname);
  const allowed = ALLOWED_TYPES[path.extname(fileName).toLowerCase()];

  if (!allowed) {
    req.rejectedFiles!.push({ fileName, reason: 'Only PDF and DOCX files are supported.' });
    return cb(null, false);
  }
  if (!allowed.mimeTypes.includes(file.mimetype) && file.mimetype !== GENERIC_MIME) {
    req.rejectedFiles!.push({ fileName, reason: `File type does not match its .${allowed.type.toLowerCase()} extension.` });
    return cb(null, false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: CV_MAX_FILE_SIZE_MB * 1024 * 1024,
    files: CV_MAX_FILES,
    fields: 10,
  },
}).array(CV_FIELD_NAME, CV_MAX_FILES);

const MULTER_ERROR_MESSAGES: Partial<Record<multer.ErrorCode, string>> = {
  LIMIT_FILE_SIZE: `Each file must be ${CV_MAX_FILE_SIZE_MB} MB or smaller.`,
  LIMIT_FILE_COUNT: `You can upload up to ${CV_MAX_FILES} CVs at a time.`,
  LIMIT_FIELD_COUNT: 'Too many form fields.',
};

/**
 * Receives CVs from multipart/form-data field "files". Unsupported files are skipped and listed in
 * req.rejectedFiles; batch-level problems (too many files, a file too large) reject the request.
 * On error multer removes any files it already saved.
 */
export const uploadCvFiles: RequestHandler = (req, res, next) => {
  req.rejectedFiles = [];

  if (!req.is('multipart/form-data')) {
    return res.generalError(`Send the CVs as form-data in the "${CV_FIELD_NAME}" field.`, {}, 400);
  }

  upload(req, res, (err: unknown) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      let message = MULTER_ERROR_MESSAGES[err.code];
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        message = err.field === CV_FIELD_NAME
          ? `You can upload up to ${CV_MAX_FILES} CVs at a time.`
          : `Unexpected field "${err.field}". Send the CVs in the "${CV_FIELD_NAME}" field.`;
      }
      return res.generalError(message || err.message, {}, 400);
    }
    next(err);
  });
};
