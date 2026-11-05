/**
 * Errors raised while analysing a CV.
 * `retryable` = worth trying again (rate limit, timeout, temporary outage).
 * `userMessage` is safe to show to the recruiter (stored as the candidate's errorMessage).
 * `httpStatus` is the AI service's HTTP status, when the error came from it.
 */
export class AnalysisError extends Error {
  constructor(
    public readonly userMessage: string,
    public readonly retryable: boolean,
    public readonly retryAfterMs?: number,
    detail?: string,
    public readonly httpStatus?: number,
  ) {
    super(detail ? `${userMessage} (${detail})` : userMessage);
    this.name = 'AnalysisError';
  }
}
