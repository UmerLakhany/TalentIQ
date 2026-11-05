import { createClient } from 'redis';
import 'dotenv/config';

type RedisClient = ReturnType<typeof createClient>;

class RedisClass {
  private static instance: RedisClass | null = null;
  public client: RedisClient;

  private constructor() {
    this.client = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    this.client.on('error', (err) => console.error('Redis error:', err.message));
  }

  public static getInstance(): RedisClass {
    if (!RedisClass.instance) {
      RedisClass.instance = new RedisClass();
    }
    return RedisClass.instance;
  }

  /** Opens the connection. Call once before the server starts listening. */
  public async connect(): Promise<void> {
    if (!this.client.isOpen) {
      await this.client.connect();
      console.log('Redis connected.');
    }
  }

  public async close(): Promise<void> {
    if (this.client.isOpen) await this.client.quit();
  }
}

export default RedisClass;
