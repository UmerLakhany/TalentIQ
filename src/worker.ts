import 'reflect-metadata';
import 'dotenv/config';
import SequelizeClass from '../settings/orm/sequelize';
import RabbitMQClass, { CV_PROCESSING_QUEUE } from '../settings/queue/rabbitmq';
import RedisClass from '../settings/cache/redis';
import './models';
import CvAnalysisService from './services/cvAnalysis.service';
import { getLlmProvider } from './lib/ai';
import { retryOnStartup } from './common/retry';

/**
 * CV analysis worker: consumes the "cv_processing" queue and analyses each CV with the LLM.
 * Run alongside the API:  npm run worker
 * Several workers can run at once; RabbitMQ shares the messages between them.
 */
const concurrency = Number(process.env.WORKER_CONCURRENCY) || 2;

const start = async () => {
  try {
    const llm = getLlmProvider(); // fail fast on a missing key / unknown provider
    // The API owns schema changes, so the worker never syncs tables.
    await retryOnStartup('PostgreSQL', () => SequelizeClass.getInstance().connect({ sync: false }));
    // Used to clear cached rankings / dashboards when a CV finishes. Not fatal if Redis is down.
    await RedisClass.getInstance().connect().catch((err) => console.warn('Redis unavailable, cache will not be cleared:', err.message));
    await retryOnStartup('RabbitMQ', () => RabbitMQClass.getInstance().connect());
    await RabbitMQClass.getInstance().consume(CV_PROCESSING_QUEUE, concurrency, (message) =>
      CvAnalysisService.processMessage(message),
    );
    console.log(`CV worker ready (${llm.name}, ${concurrency} at a time). Waiting for CVs...`);
  } catch (err: any) {
    console.error('Failed to start worker:', err?.message || err);
    process.exit(1);
  }
};

const shutdown = async (signal: string) => {
  console.log(`${signal} received, shutting down worker...`);
  // Unfinished CVs are not acknowledged, so RabbitMQ will deliver them again on the next start.
  await RabbitMQClass.getInstance().close();
  await RedisClass.getInstance().close().catch(() => undefined);
  await SequelizeClass.getInstance().close().catch(() => undefined);
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start();
