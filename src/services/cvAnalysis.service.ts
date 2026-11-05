import { Candidate } from '../models';
import JobRepository from '../repositories/job.repository';
import { fromStoragePath } from '../common/storage';
import { extractCvText } from '../lib/cv/extractText';
import { analyzeCv } from '../lib/analysis/cvAnalyzer';
import { CvAnalysisResult } from '../lib/analysis/types';
import { AnalysisError } from '../lib/errors';
import { CvProcessingMessage } from '../lib/classes/CvProcessingQueue';
import Cache from '../lib/classes/Cache';

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

    // A newer analysis was requested (retry / job edited) after this message was queued.
    const version = typeof message.analysisVersion === 'number' ? message.analysisVersion : candidate.analysisVersion;
    if (version !== candidate.analysisVersion) {
      log(candidateId, `skipped: outdated message (v${version}, current v${candidate.analysisVersion})`);
      return;
    }
    if (candidate.status === 'completed') {
      log(candidateId, 'skipped: already analysed');
      return;
    }

    const job = await JobRepository.findById(candidate.jobId);
    if (!job) {
      log(candidateId, 'skipped: job no longer exists');
      return;
    }

    /**
     * Saves only if no newer analysis was requested meanwhile, then clears the cached ranking and
     * dashboard so the next API call shows the new status. Returns false if the result was outdated.
     */
    const save = async (values: Partial<Record<string, unknown>>): Promise<boolean> => {
      const [updated] = await Candidate.update(values, { where: { id: candidateId, analysisVersion: version } });
      await Cache.invalidateJob(job.id, job.recruiterId);
      return updated > 0;
    };

    if (candidate.attempts >= MAX_ATTEMPTS) {
      await save({ status: 'failed', errorMessage: `Analysis failed after ${MAX_ATTEMPTS} attempts. Please retry.` });
      log(candidateId, `failed: reached ${MAX_ATTEMPTS} attempts`);
      return;
    }

    const attempt = candidate.attempts + 1;
    if (!(await save({ status: 'processing', attempts: attempt, errorMessage: null }))) {
      log(candidateId, 'skipped: a newer analysis was requested');
      return;
    }
    log(candidateId, `processing "${candidate.fileName}" (attempt ${attempt}, v${version})`);
    const startedAt = Date.now();

    try {
      const text = await extractCvText(fromStoragePath(candidate.storagePath), candidate.fileType);
      const result = await analyzeWithRetries(candidateId, () => analyzeCv(job, text));

      const saved = await save({
        status: 'completed',
        profile: result.profile,
        evaluation: result.evaluation,
        matchScore: result.matchScore,
        processedAt: new Date(),
        errorMessage: null,
      });
      const seconds = Math.round((Date.now() - startedAt) / 1000);
      log(candidateId, saved
        ? `completed: score ${result.matchScore} (${result.model}, ${seconds}s)`
        : 'discarded result: the job changed during analysis (newer analysis queued)');
    } catch (err: any) {
      if (!(err instanceof AnalysisError)) {
        // Programming error or database problem: keep the CV queued and let RabbitMQ redeliver it.
        await save({ status: 'queued' }).catch(() => undefined);
        throw err;
      }
      await save({ status: 'failed', errorMessage: err.userMessage });
      log(candidateId, `failed: ${err.message}`);
    }
  }
}

export default CvAnalysisService;
