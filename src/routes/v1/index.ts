import express, { Router } from 'express';
import recruiterRoutes from './recruiter';

const router: Router = express.Router();

router.use('/recruiter', recruiterRoutes);

// health check
router.get('/_health', (_req, res) => {
  res.generalResponse('OK', { uptime: process.uptime() });
});

export default router;
