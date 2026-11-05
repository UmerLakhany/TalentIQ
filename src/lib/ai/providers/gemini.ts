import { AnalysisError } from '../../errors';
import { JsonRequest, JsonResponse, LlmProvider } from '../types';

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/** Parses Google's RetryInfo delay (e.g. "27s" or "1.5s") into milliseconds. */
const parseRetryDelay = (body: any): number | undefined => {
  const info = body?.error?.details?.find((d: any) => String(d?.['@type']).includes('RetryInfo'));
  const match = /^([\d.]+)s$/.exec(String(info?.retryDelay ?? ''));
  return match ? Math.ceil(Number(match[1]) * 1000) : undefined;
};

/** Used as httpStatus when a request times out or the connection fails (no real HTTP status). */
const NO_RESPONSE_STATUS = 504;

/**
 * Errors where a different model may succeed straight away: overloaded (503), per-model quota (429),
 * model not available to this key (404), or no response in time.
 */
const tryNextModel = (status: number) =>
  status === 503 || status === 429 || status === 404 || status === NO_RESPONSE_STATUS;

/**
 * Google Gemini via the REST API (free tier available at https://aistudio.google.com/apikey).
 * Tries the main model first, then each fallback model, before reporting an error. This matters on
 * the free tier, where a single model is often briefly overloaded (HTTP 503) or rate limited (429).
 */
export class GeminiProvider implements LlmProvider {
  readonly name: string;
  private readonly models: string[];

  constructor(
    private readonly apiKey: string,
    model: string,
    fallbackModels: string[],
    private readonly timeoutMs: number,
  ) {
    this.models = [...new Set([model, ...fallbackModels].filter(Boolean))];
    this.name = `gemini:${model}`;
  }

  async generateJson(request: JsonRequest): Promise<JsonResponse> {
    let lastError: AnalysisError | null = null;

    for (const model of this.models) {
      try {
        const data = await this.callModel(model, request);
        return { data, model: `gemini:${model}` };
      } catch (err) {
        if (!(err instanceof AnalysisError) || !tryNextModel(err.httpStatus ?? 0)) throw err;
        lastError = err;
        if (model !== this.models[this.models.length - 1]) {
          const reason = err.httpStatus === NO_RESPONSE_STATUS ? 'no response' : `HTTP ${err.httpStatus}`;
          console.warn(`Gemini model "${model}" unavailable (${reason}); trying the next model.`);
        }
      }
    }

    throw lastError!;
  }

  private async callModel(model: string, request: JsonRequest): Promise<unknown> {
    let response: Response;
    try {
      response = await fetch(`${API_BASE}/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': this.apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: request.system }] },
          contents: [{ role: 'user', parts: [{ text: request.user }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: request.schema,
            temperature: 0.2, // consistent, factual evaluations
          },
        }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (err: any) {
      const timedOut = err?.name === 'TimeoutError';
      throw new AnalysisError(
        timedOut ? 'The AI service took too long to respond.' : 'Could not reach the AI service.',
        true,
        undefined,
        `${model}: ${err?.message}`,
        NO_RESPONSE_STATUS,
      );
    }

    const body: any = await response.json().catch(() => null);

    if (!response.ok) {
      const status = response.status;
      const detail = `${model} HTTP ${status}: ${body?.error?.message ?? 'no details'}`;
      if (status === 429) {
        throw new AnalysisError('The AI service rate limit was reached.', true, parseRetryDelay(body), detail, status);
      }
      if (status >= 500) {
        throw new AnalysisError('The AI service is temporarily overloaded. Please retry later.', true, undefined, detail, status);
      }
      if (status === 401 || status === 403) {
        throw new AnalysisError('The AI service rejected the API key. Check GEMINI_API_KEY.', false, undefined, detail, status);
      }
      if (status === 404) {
        throw new AnalysisError(`The AI model "${model}" is not available. Check GEMINI_MODEL.`, false, undefined, detail, status);
      }
      throw new AnalysisError('The AI service rejected the request.', false, undefined, detail, status);
    }

    if (body?.promptFeedback?.blockReason) {
      throw new AnalysisError('The AI service declined to analyse this CV.', false, undefined, body.promptFeedback.blockReason);
    }

    const candidate = body?.candidates?.[0];
    const text: string = (candidate?.content?.parts ?? [])
      .map((part: any) => part?.text ?? '')
      .join('')
      .trim();

    if (!text) {
      throw new AnalysisError('The AI service returned an empty response.', true, undefined, `${model}: ${candidate?.finishReason}`);
    }

    try {
      return JSON.parse(text);
    } catch {
      // Usually a reply cut off by the output limit; another attempt normally succeeds.
      throw new AnalysisError('The AI service returned an incomplete response.', true, undefined, `${model}: ${candidate?.finishReason}`);
    }
  }
}
