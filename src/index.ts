import 'dotenv/config';
import express, { Express } from 'express';
import cors from 'cors';
import SequelizeClass from '../settings/orm/sequelize';
import './models';
import v1Routes from './routes/v1';
import { errorHandler, handleAPIResponse } from './middlewares';
import APIResponse from './lib/classes/APIResponse';

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
    await SequelizeClass.getInstance().connect();
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}/api/v1`);
    });
  } catch (err: any) {
    console.error('Failed to start server:', err?.message || err);
    process.exit(1);
  }
};

start();
