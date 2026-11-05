import express, { Router } from 'express';
import AuthMiddleware from '../../../auth/jwt';
import CandidateService from '../../../services/candidate.service';

const router: Router = express.Router();

// The CV file accepts either the signed ?token= from cvUrl or a Bearer token (see CandidateService.cvAccess).
router.get('/:id/cv', CandidateService.cvAccess, CandidateService.serveCv);

// Everything else requires a logged-in recruiter.
router.get('/:id', AuthMiddleware.auth, CandidateService.getCandidate);
router.post('/:id/retry', AuthMiddleware.auth, CandidateService.retry);
router.delete('/:id', AuthMiddleware.auth, CandidateService.deleteCandidate);

export default router;
