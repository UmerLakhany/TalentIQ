import express, { Router } from 'express';
import JobService from '../../../services/job.service';
import CandidateService from '../../../services/candidate.service';
import CreateJobDTO from '../../../dto/classes/CreateJob.dto';
import UpdateJobDTO from '../../../dto/classes/UpdateJob.dto';
import validateDTO from '../../../dto/middlewares';
import { uploadCvFiles } from '../../../common/cvUpload';

// All routes here require a logged-in recruiter (AuthMiddleware.auth is applied where mounted).
const router: Router = express.Router();

router.post('/', validateDTO(CreateJobDTO), JobService.createJob);
router.get('/', JobService.listJobs);
router.get('/:id', JobService.getJob);
router.put('/:id', validateDTO(UpdateJobDTO), JobService.updateJob);
router.delete('/:id', JobService.deleteJob);

// CVs: ownership is checked before any file is stored.
router.post('/:id/cvs', JobService.requireOwnJob, uploadCvFiles, CandidateService.uploadCvs);

export default router;
