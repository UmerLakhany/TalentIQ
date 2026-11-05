import express, { Router } from 'express';
import AuthMiddleware from '../../../auth/jwt';
import authRoute from './auth';
import jobsRoute from './jobs';

const router: Router = express.Router();

router.use('/auth', authRoute);
router.use('/jobs', AuthMiddleware.auth, jobsRoute);

export default router;
