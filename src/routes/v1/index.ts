import express, { Router } from 'express';
import recruiterRoutes from './recruiter';
import recruiterAuthRoutes from './recruiter/auth';

const router: Router = express.Router();

router.use('/recruiter', recruiterRoutes);

// The recruiter panel calls {API_URL}/auth/login, so recruiter auth is also served at /auth.
router.use('/auth', recruiterAuthRoutes);

// health check
router.get('/_health', (_req, res) => {
  res.generalResponse('OK', { uptime: process.uptime() });
});

export default router;
