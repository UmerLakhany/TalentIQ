import express, { Router } from 'express';
import AuthMiddleware from '../../auth/jwt';
import recruiterRoutes from './recruiter';
import recruiterAuthRoutes from './recruiter/auth';
import recruiterJobsRoutes from './recruiter/jobs';
import recruiterCandidatesRoutes from './recruiter/candidates';

const router: Router = express.Router();

router.use('/recruiter', recruiterRoutes);

// The recruiter panel calls {API_URL}/auth/..., /jobs/... and /candidates/..., so these are also served at the top level.
router.use('/auth', recruiterAuthRoutes);
router.use('/jobs', AuthMiddleware.auth, recruiterJobsRoutes);
router.use('/candidates', recruiterCandidatesRoutes);

// health check
router.get('/_health', (_req, res) => {
  res.generalResponse('OK', { uptime: process.uptime() });
});

export default router;
