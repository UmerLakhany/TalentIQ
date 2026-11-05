import express, { Router } from 'express';
import AuthMiddleware from '../../../auth/jwt';
import authRoute from './auth';
import jobsRoute from './jobs';
import candidatesRoute from './candidates';

const router: Router = express.Router();

router.use('/auth', authRoute);
router.use('/jobs', AuthMiddleware.auth, jobsRoute);
router.use('/candidates', candidatesRoute); // auth is applied per route (the CV file also accepts a signed link)

export default router;
