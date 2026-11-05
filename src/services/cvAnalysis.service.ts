import { Candidate } from '../models';
import JobRepository from '../repositories/job.repository';
import { fromStoragePath } from '../common/storage';
import { extractCvText } from '../lib/cv/extractText';
import { analyzeCv } from '../lib/analysis/cvAnalyzer';
import { CvAnalysisResult } from '../lib/analysis/types';
import { AnalysisError } from '../lib/errors';
import { CvProcessingMessage } from '../lib/classes/CvProcessingQueue';

/** How many times one CV may be picked up (e.g. after a worker crash) before it is marked failed. */
const MAX_ATTEMPTS = Number(process.env.CV_MAX_ATTEMPTS) || 3;
/** Retries of the LLM call within one attempt, for rate limits / timeouts. */
const LLM_MAX_RETRIES = Number(process.env.LLM_MAX_RETRIES) || 3;
const MAX_RETRY_DELAY_MS = 60000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const log = (candidateId: string, message: string) =>
  console.log(`[${new Date().toISOString()}] [cv ${candidateId.slice(0, 8)}] ${message}`);

/** Calls the LLM, retrying retryable errors with exponential backoff (or the delay the API asks for). */
const analyzeWithRetries = async (candidateId: string, run: () => Promise<CvAnalysisResult>) => {
  for (let attempt = 1; ; attempt++) {
    try {
      return await run();
    } catch (err) {
      const retryable = err instanceof AnalysisError && err.retryable;
      if (!retryable || attempt > LLM_MAX_RETRIES) throw err;

      // Overload / rate-limit errors need a real pause (15s, 30s, 60s); other errors retry sooner.
      const baseMs = err.httpStatus === 503 || err.httpStatus === 429 ? 15000 : 3000;
      const backoff = baseMs * 2 ** (attempt - 1) + Math.floor(Math.random() * 1000);
      const delay = Math.min(err.retryAfterMs ?? backoff, MAX_RETRY_DELAY_MS);
      log(candidateId, `${err.message}; retry ${attempt}/${LLM_MAX_RETRIES} in ${Math.round(delay / 1000)}s`);
      await sleep(delay);
    }
  }
};

class CvAnalysisService {
  /**
   * Processes one queued CV: extract text -> AI evaluation -> score -> save.
   * Expected failures (unreadable file, AI errors after retries) mark the candidate "failed" and
   * return normally, so the message is acknowledged. Only unexpected errors (e.g. database down)
   * are thrown, which puts the message back on the queue.
   */
  static async processMessage(message: CvProcessingMessage): Promise<void> {
    const candidateId = message?.candidateId;
    if (typeof candidateId !== 'string') {
      console.error('Skipping message without candidateId:', message);
      return;
    }

    const candidate = await Candidate.findByPk(candidateId);
    if (!candidate) {
      log(candidateId, 'skipped: candidate no longer exists (job or CV deleted)');
      return;
    }
    if (candidate.status === 'completed') {
      log(candidateId, 'skipped: already analysed');
      return;
    }
    if (candidate.attempts >= MAX_ATTEMPTS) {
      await candidate.update({ status: 'failed', errorMessage: `Analysis failed after ${MAX_ATTEMPTS} attempts. Please retry.` });
      log(candidateId, `failed: reached ${MAX_ATTEMPTS} attempts`);
      return;
    }

    await candidate.update({ status: 'processing', attempts: candidate.attempts + 1, errorMessage: null });
    log(candidateId, `processing "${candidate.fileName}" (attempt ${candidate.attempts})`);
    const startedAt = Date.now();

    const job = await JobRepository.findById(candidate.jobId);
    if (!job) {
      log(candidateId, 'skipped: job no longer exists');
      return;
    }

    try {
      const text = await extractCvText(fromStoragePath(candidate.storagePath), candidate.fileType);
      const result = await analyzeWithRetries(candidateId, () => analyzeCv(job, text));

      await candidate.update({
        status: 'completed',
        profile: result.profile as unknown as Record<string, any>,
        evaluation: result.evaluation as unknown as Record<string, any>,
        matchScore: result.matchScore,
        processedAt: new Date(),
        errorMessage: null,
      });
      log(candidateId, `completed: score ${result.matchScore} (${result.model}, ${Math.round((Date.now() - startedAt) / 1000)}s)`);
    } catch (err: any) {
      if (!(err instanceof AnalysisError)) {
        // Programming error or database problem: keep the CV queued and let RabbitMQ redeliver it.
        await candidate.update({ status: 'queued' }).catch(() => undefined);
        throw err;
      }
      await candidate.update({ status: 'failed', errorMessage: err.userMessage });
      log(candidateId, `failed: ${err.message}`);
    }
  }
}

export default CvAnalysisService;
