import express, { Router } from 'express';
import AuthMiddleware from '../../auth/jwt';
import recruiterRoutes from './recruiter';
import recruiterAuthRoutes from './recruiter/auth';
import recruiterJobsRoutes from './recruiter/jobs';

const router: Router = express.Router();

router.use('/recruiter', recruiterRoutes);

// The recruiter panel calls {API_URL}/auth/... and {API_URL}/jobs/..., so these are also served at the top level.
router.use('/auth', recruiterAuthRoutes);
router.use('/jobs', AuthMiddleware.auth, recruiterJobsRoutes);

// health check
router.get('/_health', (_req, res) => {
  res.generalResponse('OK', { uptime: process.uptime() });
});

export default router;
