import fs from 'fs';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import { CvFileType } from '../../models/interfaces';
import { AnalysisError } from '../errors';

/** Text shorter than this is treated as "no readable text" (e.g. a scanned image PDF). */
const MIN_TEXT_LENGTH = 80;
/** Long CVs are cut to keep the LLM request fast and cheap. */
export const MAX_CV_TEXT_LENGTH = 40000;

const normalise = (text: string) =>
  text
    .replace(/^-- \d+ of \d+ --$/gm, '') // page markers added by pdf-parse
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const extractPdf = async (buffer: Buffer): Promise<string> => {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy().catch(() => undefined);
  }
};

const extractDocx = async (buffer: Buffer): Promise<string> => {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
};

/** Reads a stored CV and returns its plain text. Throws a non-retryable AnalysisError if unreadable. */
export const extractCvText = async (absolutePath: string, fileType: CvFileType): Promise<string> => {
  let buffer: Buffer;
  try {
    buffer = await fs.promises.readFile(absolutePath);
  } catch {
    throw new AnalysisError('The CV file could not be found. Please upload it again.', false);
  }

  let raw: string;
  try {
    raw = fileType === 'PDF' ? await extractPdf(buffer) : await extractDocx(buffer);
  } catch (err: any) {
    const passwordProtected = err?.name === 'PasswordException';
    throw new AnalysisError(
      passwordProtected
        ? 'The PDF is password-protected. Please upload an unprotected copy.'
        : `The ${fileType} file could not be read. It may be corrupted.`,
      false,
      undefined,
      err?.message,
    );
  }

  const text = normalise(raw);
  if (text.length < MIN_TEXT_LENGTH) {
    throw new AnalysisError(
      'No readable text was found in the CV. It may be a scanned image; please upload a text-based PDF or DOCX.',
      false,
    );
  }

  return text.length > MAX_CV_TEXT_LENGTH ? text.slice(0, MAX_CV_TEXT_LENGTH) : text;
};
