import RedisClass from '../../../settings/cache/redis';

const redis = () => RedisClass.getInstance().client;

/** Cache keys, in one place so writers and invalidators always agree. */
export const CacheKeys = {
  /** Candidate list + summary of one job (used by GET /jobs/:id/candidates). */
  jobCandidates: (jobId: string) => `cache:job:${jobId}:candidates`,
  /** Dashboard of one recruiter (GET /dashboard). */
  dashboard: (recruiterId: string) => `cache:dashboard:${recruiterId}`,
};

export const CACHE_TTL_SECONDS = {
  jobCandidates: Number(process.env.CACHE_TTL_CANDIDATES) || 300,
  dashboard: Number(process.env.CACHE_TTL_DASHBOARD) || 120,
};

/**
 * Small JSON cache on Redis. Every method swallows Redis errors: if Redis is down the app keeps
 * working by reading from PostgreSQL, just without caching.
 */
class Cache {
  static async get<T>(key: string): Promise<T | null> {
    try {
      if (!redis().isOpen) return null;
      const value = await redis().get(key);
      return value ? (JSON.parse(value) as T) : null;
    } catch (err: any) {
      console.warn(`Cache read failed for ${key}:`, err?.message || err);
      return null;
    }
  }

  static async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    try {
      if (!redis().isOpen) return;
      await redis().set(key, JSON.stringify(value), { EX: ttlSeconds });
    } catch (err: any) {
      console.warn(`Cache write failed for ${key}:`, err?.message || err);
    }
  }

  static async del(...keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    try {
      if (!redis().isOpen) return;
      await redis().del(keys);
    } catch (err: any) {
      console.warn(`Cache delete failed for ${keys.join(', ')}:`, err?.message || err);
    }
  }

  /**
   * Returns the cached value, or computes it, stores it and returns it.
   * `hit` tells the caller whether it came from Redis (sent as the X-Cache header).
   */
  static async remember<T>(key: string, ttlSeconds: number, compute: () => Promise<T>): Promise<{ value: T; hit: boolean }> {
    const cached = await Cache.get<T>(key);
    if (cached !== null) return { value: cached, hit: true };
    const value = await compute();
    await Cache.set(key, value, ttlSeconds);
    return { value, hit: false };
  }

  /** Clears everything derived from one job's candidates: its ranking and its owner's dashboard. */
  static async invalidateJob(jobId: string, recruiterId: string): Promise<void> {
    await Cache.del(CacheKeys.jobCandidates(jobId), CacheKeys.dashboard(recruiterId));
  }
}

export default Cache;
