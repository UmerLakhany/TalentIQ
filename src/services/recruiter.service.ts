import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import RecruiterRepository from '../repositories/recruiter.repository';
import AuthMiddleware from '../auth/jwt';
import PasswordManager from '../auth/passwordManager';
import asyncHandler from '../common/asyncHandler';
import RecruiterRegisterDTO from '../dto/classes/RecruiterRegister.dto';
import LoginDTO from '../dto/classes/Login.dto';
import VerifyEmailDTO from '../dto/classes/VerifyEmail.dto';
import ResendOtpDTO from '../dto/classes/ResendOtp.dto';
import ForgetPasswordDTO from '../dto/classes/ForgetPassword.dto';
import ResetPasswordDTO from '../dto/classes/ResetPassword.dto';
import OTP, { OtpPurpose } from '../lib/classes/Otp';
import PasswordResetToken from '../lib/classes/PasswordResetToken';
import emailService from './email.service';
import emailTemplates from '../lib/emailTemplates.json';
import { Recruiter } from '../models';

const PasswordManagerClass = new PasswordManager();

/** Token lifetime when "remember me" is ticked (matches the panel's 30-day cookie). */
const REMEMBER_ME_EXPIRY = '30d';

/**
 * Compared against when the email is unknown, so a login attempt takes about as long
 * whether or not the account exists (avoids revealing registered emails by timing).
 */
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('talentiq-dummy-password', 10);

/** Public shape of a recruiter (matches AuthUser in the recruiter panel). */
const toAuthUser = (recruiter: Recruiter) => ({
  id: recruiter.id,
  full_name: recruiter.fullName,
  email: recruiter.email,
  role: recruiter.role,
  is_email_verified: recruiter.isEmailVerified,
  last_login_at: recruiter.lastLoginAt,
});

/** Session payload (matches LoginResponse in the recruiter panel). */
const buildAuthResponse = (recruiter: Recruiter, expiresIn: string = process.env.JWT_EXPIRY || '1h') => ({
  access_token: AuthMiddleware.createJwt(
    { id: recruiter.id, email: recruiter.email, role: recruiter.role },
    'defined',
    expiresIn,
  ),
  token_type: 'Bearer' as const,
  expires_in: expiresIn,
  user: toAuthUser(recruiter),
});

const OTP_EMAIL_TEMPLATES: Record<OtpPurpose, { subject: string; template: string }> = {
  EMAIL_VERIFICATION: emailTemplates.emailVerificationOtp,
  PASSWORD_RESET: emailTemplates.passwordResetOtp,
};

/** Generates a new code for the purpose and emails it. Returns false if the email could not be sent. */
const sendOtpEmail = async (recruiter: Recruiter, purpose: OtpPurpose): Promise<boolean> => {
  const otp = await OTP.generateOTP(recruiter.email, purpose);
  const { subject, template } = OTP_EMAIL_TEMPLATES[purpose];
  try {
    await emailService.sendTemplateMail(recruiter.email, subject, template, {
      name: recruiter.fullName,
      otp,
      expiryMinutes: OTP.expiryMinutes(),
    });
    return true;
  } catch (err: any) {
    console.error(`Failed to send ${purpose} email to ${recruiter.email}:`, err?.message || err);
    return false;
  }
};

const sendVerificationOtp = (recruiter: Recruiter) => sendOtpEmail(recruiter, 'EMAIL_VERIFICATION');

/** Sends a notification email without failing the request if it can't be delivered. */
const notify = (recruiter: Recruiter, mail: { subject: string; template: string }) => {
  emailService
    .sendTemplateMail(recruiter.email, mail.subject, mail.template, { name: recruiter.fullName })
    .catch((err) => console.error(`Failed to send "${mail.subject}" to ${recruiter.email}:`, err?.message || err));
};

const OTP_ERROR_MESSAGES = {
  invalid: 'Invalid verification code.',
  expired: 'Verification code has expired. Please request a new one.',
  too_many_attempts: 'Too many incorrect attempts. Please request a new code.',
} as const;

class RecruiterService {
  /** POST /api/v1/recruiter/auth/register */
  static register = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as RecruiterRegisterDTO;
    const email = body.email.trim().toLowerCase();

    const existing = await RecruiterRepository.findByEmail(email);
    if (existing) {
      const message = existing.isEmailVerified
        ? 'An account with this email already exists.'
        : 'An account with this email already exists but is not verified. Please verify your email or request a new code.';
      return res.generalError(message, {}, 409);
    }

    const recruiter = await RecruiterRepository.createRecruiter({
      fullName: body.full_name.trim(),
      email,
      password: await PasswordManagerClass.encryptPassword(body.password),
    });

    const emailSent = await sendVerificationOtp(recruiter);
    const message = emailSent
      ? 'Registration successful. A verification code has been sent to your email.'
      : 'Registration successful, but the verification email could not be sent. Please request a new code.';

    return res.generalResponse(message, {
      email: recruiter.email,
      email_sent: emailSent,
      otp_expires_in_minutes: OTP.expiryMinutes(),
    }, 201);
  });

  /** POST /api/v1/recruiter/auth/verify-email */
  static verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as VerifyEmailDTO;
    const email = body.email.trim().toLowerCase();

    const recruiter = await RecruiterRepository.findByEmail(email);
    if (!recruiter) {
      return res.generalError(OTP_ERROR_MESSAGES.invalid, {}, 400);
    }
    if (recruiter.isEmailVerified) {
      return res.generalError('Email is already verified. Please log in.', {}, 409);
    }

    const result = await OTP.verifyOTP(email, body.otp, 'EMAIL_VERIFICATION');
    if (result !== 'valid') {
      return res.generalError(OTP_ERROR_MESSAGES[result], {}, 400);
    }

    await RecruiterRepository.markEmailVerified(recruiter);
    notify(recruiter, emailTemplates.emailVerified);

    // Verifying signs the recruiter in, so the panel can go straight to the dashboard.
    return res.generalResponse('Email verified successfully.', buildAuthResponse(recruiter), 200);
  });

  /** POST /api/v1/recruiter/auth/resend-otp */
  static resendOtp = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as ResendOtpDTO;
    const email = body.email.trim().toLowerCase();

    const recruiter = await RecruiterRepository.findByEmail(email);
    if (!recruiter) {
      return res.generalError('No account found with this email.', {}, 404);
    }
    if (recruiter.isEmailVerified) {
      return res.generalError('Email is already verified. Please log in.', {}, 409);
    }

    const waitSeconds = await OTP.getResendCooldown(email, 'EMAIL_VERIFICATION');
    if (waitSeconds > 0) {
      return res.generalError(`Please wait ${waitSeconds} seconds before requesting a new code.`, {}, 429);
    }

    const emailSent = await sendVerificationOtp(recruiter);
    if (!emailSent) {
      return res.generalError('Could not send the verification email. Please try again later.', {}, 502);
    }

    return res.generalResponse('A new verification code has been sent to your email.', {
      email,
      otp_expires_in_minutes: OTP.expiryMinutes(),
    }, 200);
  });

  /**
   * POST /api/v1/recruiter/auth/forgot-password
   * Step 1 of 3: emails a reset code. The response is the same whether or not the email is
   * registered, so this endpoint can't be used to discover accounts.
   */
  static forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as ForgetPasswordDTO;
    const email = body.email.trim().toLowerCase();
    const genericMessage = 'If an account exists for this email, a password reset code has been sent.';

    const recruiter = await RecruiterRepository.findByEmail(email);
    if (!recruiter || !recruiter.isActive) {
      return res.generalResponse(genericMessage, { email, otp_expires_in_minutes: OTP.expiryMinutes() }, 200);
    }

    const waitSeconds = await OTP.getResendCooldown(email, 'PASSWORD_RESET');
    if (waitSeconds > 0) {
      return res.generalError(`Please wait ${waitSeconds} seconds before requesting a new code.`, {}, 429);
    }

    const emailSent = await sendOtpEmail(recruiter, 'PASSWORD_RESET');
    if (!emailSent) {
      return res.generalError('Could not send the reset email. Please try again later.', {}, 502);
    }

    return res.generalResponse(genericMessage, { email, otp_expires_in_minutes: OTP.expiryMinutes() }, 200);
  });

  /**
   * POST /api/v1/recruiter/auth/verify-reset-otp
   * Step 2 of 3: exchanges a valid reset code for a single-use reset token.
   */
  static verifyResetOtp = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as VerifyEmailDTO;
    const email = body.email.trim().toLowerCase();

    const recruiter = await RecruiterRepository.findByEmail(email);
    if (!recruiter || !recruiter.isActive) {
      return res.generalError(OTP_ERROR_MESSAGES.invalid, {}, 400);
    }

    const result = await OTP.verifyOTP(email, body.otp, 'PASSWORD_RESET');
    if (result !== 'valid') {
      return res.generalError(OTP_ERROR_MESSAGES[result], {}, 400);
    }

    const resetToken = await PasswordResetToken.create(recruiter.id);
    return res.generalResponse('Code verified. You can now set a new password.', {
      reset_token: resetToken,
      expires_in_minutes: PasswordResetToken.expiryMinutes(),
    }, 200);
  });

  /**
   * POST /api/v1/recruiter/auth/reset-password
   * Step 3 of 3: sets the new password using the reset token (works once).
   */
  static resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as ResetPasswordDTO;

    if (body.new_password !== body.confirm_password) {
      return res.generalError('Validation Error!', { errors: ['Passwords do not match.'] }, 400);
    }

    const recruiterId = await PasswordResetToken.consume(body.reset_token);
    const recruiter = recruiterId ? await RecruiterRepository.findById(recruiterId) : null;
    if (!recruiter || !recruiter.isActive) {
      return res.generalError('Reset token is invalid or has expired. Please request a new code.', {}, 400);
    }

    await RecruiterRepository.updatePassword(
      recruiter.id,
      await PasswordManagerClass.encryptPassword(body.new_password),
    );
    notify(recruiter, emailTemplates.passwordChanged);

    return res.generalResponse('Password has been reset successfully. Please log in with your new password.', {}, 200);
  });

  /** POST /api/v1/recruiter/auth/login (also served at /api/v1/auth/login for the recruiter panel) */
  static login = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as LoginDTO;
    const email = body.email.trim().toLowerCase();

    const recruiter = await RecruiterRepository.findByEmailWithPassword(email);
    const isCorrectPass = await PasswordManagerClass.comparePassword(
      recruiter?.password ?? DUMMY_PASSWORD_HASH,
      body.password,
    );

    // Same message for unknown email and wrong password, so emails can't be probed.
    if (!recruiter || !isCorrectPass) {
      return res.generalError('Invalid email or password.', {}, 401);
    }

    if (!recruiter.isEmailVerified) {
      return res.generalError('Please verify your email before logging in.', {}, 403);
    }

    if (!recruiter.isActive) {
      return res.generalError('Your account is deactivated. Please contact your workspace administrator.', {}, 403);
    }

    await RecruiterRepository.updateLastLogin(recruiter);

    const expiresIn = body.remember_me ? REMEMBER_ME_EXPIRY : process.env.JWT_EXPIRY || '1h';
    return res.generalResponse('Login successful.', buildAuthResponse(recruiter, expiresIn), 200);
  });
}

export default RecruiterService;
