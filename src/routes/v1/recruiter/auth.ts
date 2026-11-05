import express, { Router } from 'express';
import RecruiterService from '../../../services/recruiter.service';
import RecruiterRegisterDTO from '../../../dto/classes/RecruiterRegister.dto';
import validateDTO from '../../../dto/middlewares';

const router: Router = express.Router();

router.post('/register', validateDTO(RecruiterRegisterDTO), RecruiterService.register);

export default router;
