const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Runs `fn` until it succeeds, waiting `delayMs` between tries. Used at startup so the API and the
 * worker wait for PostgreSQL / Redis / RabbitMQ to accept connections (e.g. right after
 * `docker compose up`) instead of exiting on the first refused connection.
 */
export const retryOnStartup = async <T>(
  name: string,
  fn: () => Promise<T>,
  { attempts = Number(process.env.STARTUP_RETRY_ATTEMPTS) || 15, delayMs = 3000 } = {},
): Promise<T> => {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      if (attempt >= attempts) throw err;
      console.warn(`${name} not ready (${err?.message || err}); retry ${attempt}/${attempts - 1} in ${delayMs / 1000}s...`);
      await sleep(delayMs);
    }
  }
};
