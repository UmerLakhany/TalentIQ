import path from 'path';

/**
 * Where uploaded files live on disk. Kept free of Express code so the worker can use it too.
 * Paths are stored in the database relative to UPLOAD_ROOT (with forward slashes), so the folder
 * can be moved or mounted elsewhere (e.g. a Docker volume) without changing data.
 */
export const UPLOAD_ROOT = path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads');

/** Folder that holds one job's CVs. */
export const jobUploadDir = (jobId: string) => path.join(UPLOAD_ROOT, 'cvs', jobId);

/** Absolute path -> path stored in the database. */
export const toStoragePath = (absolutePath: string) =>
  path.relative(UPLOAD_ROOT, absolutePath).split(path.sep).join('/');

/** Path stored in the database -> absolute path. */
export const fromStoragePath = (storagePath: string) => path.join(UPLOAD_ROOT, ...storagePath.split('/'));
