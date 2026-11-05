import { Request, Response } from 'express';
import RecruiterRepository from '../repositories/recruiter.repository';
import AuthMiddleware from '../auth/jwt';
import PasswordManager from '../auth/passwordManager';
import asyncHandler from '../common/asyncHandler';
import RecruiterRegisterDTO from '../dto/classes/RecruiterRegister.dto';
import { Recruiter } from '../models';

const PasswordManagerClass = new PasswordManager();

/** Public shape of a recruiter (matches AuthUser in the recruiter panel). */
const toAuthUser = (recruiter: Recruiter) => ({
  id: recruiter.id,
  full_name: recruiter.fullName,
  email: recruiter.email,
  role: recruiter.role,
  last_login_at: recruiter.lastLoginAt,
});

/** Session payload (matches LoginResponse in the recruiter panel). */
const buildAuthResponse = (recruiter: Recruiter) => ({
  access_token: AuthMiddleware.createJwt({
    id: recruiter.id,
    email: recruiter.email,
    role: recruiter.role,
  }),
  token_type: 'Bearer' as const,
  expires_in: process.env.JWT_EXPIRY || '1h',
  user: toAuthUser(recruiter),
});

class RecruiterService {
  /** POST /api/v1/recruiter/auth/register */
  static register = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as RecruiterRegisterDTO;
    const email = body.email.trim().toLowerCase();

    const existing = await RecruiterRepository.findByEmail(email);
    if (existing) {
      return res.generalError('An account with this email already exists.', {}, 409);
    }

    const recruiter = await RecruiterRepository.createRecruiter({
      fullName: body.full_name.trim(),
      email,
      password: await PasswordManagerClass.encryptPassword(body.password),
    });

    return res.generalResponse('Recruiter registered successfully.', buildAuthResponse(recruiter), 201);
  });
}

export default RecruiterService;
