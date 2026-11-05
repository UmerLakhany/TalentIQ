import 'reflect-metadata';
import 'dotenv/config';
import SequelizeClass from '../settings/orm/sequelize';
import RabbitMQClass, { CV_PROCESSING_QUEUE } from '../settings/queue/rabbitmq';
import './models';
import CvAnalysisService from './services/cvAnalysis.service';
import { getLlmProvider } from './lib/ai';

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
    await SequelizeClass.getInstance().connect({ sync: false });
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
  await SequelizeClass.getInstance().close().catch(() => undefined);
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start();
