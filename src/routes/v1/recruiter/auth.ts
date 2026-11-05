import express, { Router } from 'express';
import RecruiterService from '../../../services/recruiter.service';
import RecruiterRegisterDTO from '../../../dto/classes/RecruiterRegister.dto';
import LoginDTO from '../../../dto/classes/Login.dto';
import VerifyEmailDTO from '../../../dto/classes/VerifyEmail.dto';
import ResendOtpDTO from '../../../dto/classes/ResendOtp.dto';
import ForgetPasswordDTO from '../../../dto/classes/ForgetPassword.dto';
import ResetPasswordDTO from '../../../dto/classes/ResetPassword.dto';
import validateDTO from '../../../dto/middlewares';

const router: Router = express.Router();

router.post('/register', validateDTO(RecruiterRegisterDTO), RecruiterService.register);
router.post('/verify-email', validateDTO(VerifyEmailDTO), RecruiterService.verifyEmail);
router.post('/resend-otp', validateDTO(ResendOtpDTO), RecruiterService.resendOtp);
router.post('/login', validateDTO(LoginDTO), RecruiterService.login);

// Forgot password: request code -> verify code -> set new password
router.post('/forgot-password', validateDTO(ForgetPasswordDTO), RecruiterService.forgotPassword);
router.post('/verify-reset-otp', validateDTO(VerifyEmailDTO), RecruiterService.verifyResetOtp);
router.post('/reset-password', validateDTO(ResetPasswordDTO), RecruiterService.resetPassword);

export default router;
