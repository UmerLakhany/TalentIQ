import { AnalysisError } from '../errors';
import { LlmProvider } from './types';
import { GeminiProvider } from './providers/gemini';

let provider: LlmProvider | null = null;

/**
 * Returns the LLM selected by LLM_PROVIDER. To add a provider (e.g. Claude or OpenAI), implement
 * LlmProvider in ./providers and add a case here.
 */
export const getLlmProvider = (): LlmProvider => {
  if (provider) return provider;

  const name = (process.env.LLM_PROVIDER || 'gemini').toLowerCase();
  const timeoutMs = Number(process.env.LLM_TIMEOUT_MS) || 90000;

  switch (name) {
    case 'gemini': {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new AnalysisError('GEMINI_API_KEY is not set.', false);
      const fallbackModels = (process.env.GEMINI_FALLBACK_MODELS ?? 'gemini-flash-latest,gemini-3.6-flash,gemini-3.5-flash-lite')
        .split(',')
        .map((model) => model.trim())
        .filter(Boolean);
      provider = new GeminiProvider(apiKey, process.env.GEMINI_MODEL || 'gemini-3.5-flash', fallbackModels, timeoutMs);
      break;
    }
    default:
      throw new AnalysisError(`Unknown LLM_PROVIDER "${name}".`, false);
  }

  return provider;
};

export * from './types';
