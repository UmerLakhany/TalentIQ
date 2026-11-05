import 'reflect-metadata'; // must load first: used by class-transformer decorators in DTOs
import 'dotenv/config';
import express, { Express } from 'express';
import cors from 'cors';
import SequelizeClass from '../settings/orm/sequelize';
import RedisClass from '../settings/cache/redis';
import RabbitMQClass from '../settings/queue/rabbitmq';
import emailService from './services/email.service';
import './models';
import v1Routes from './routes/v1';
import { errorHandler, handleAPIResponse } from './middlewares';
import APIResponse from './lib/classes/APIResponse';
import { retryOnStartup } from './common/retry';

const app: Express = express();
const port = Number(process.env.PORT) || 4000;

app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()) || '*',
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(handleAPIResponse);

app.use('/api/v1', v1Routes);

app.use((req, res) => {
  res.status(404).json(APIResponse.error(`Route not found: ${req.method} ${req.originalUrl}`, 404));
});

app.use(errorHandler);

const start = async () => {
  try {
    await retryOnStartup('PostgreSQL', () => SequelizeClass.getInstance().connect());
    await retryOnStartup('Redis', () => RedisClass.getInstance().connect());
    await retryOnStartup('RabbitMQ', () => RabbitMQClass.getInstance().connect());
    emailService.verifyConnection(); // logs only; a mail problem shouldn't stop the API
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}/api/v1`);
    });
  } catch (err: any) {
    console.error('Failed to start server:', err?.message || err);
    process.exit(1);
  }
};

start();
