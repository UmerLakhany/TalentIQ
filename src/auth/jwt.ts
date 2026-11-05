import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { Recruiter } from '../models';

export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'recruiter';
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

class AuthMiddleware {

  /**
   * Requires `Authorization: Bearer <token>`. Also checks the recruiter still exists and is
   * active, so a deleted or deactivated account can't keep using an old token.
   */
  static async auth(req: Request, res: Response, next: NextFunction): Promise<void> {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : '';

    if (!token) {
      return res.generalError('Authentication required.', {}, 401);
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || '');
    } catch (err: any) {
      const message = err?.name === 'TokenExpiredError'
        ? 'Your session has expired. Please log in again.'
        : 'Invalid token. Please log in again.';
      return res.generalError(message, {}, 401);
    }

    try {
      const recruiter = decoded?.id ? await Recruiter.findByPk(decoded.id) : null;
      if (!recruiter || !recruiter.isActive || !recruiter.isEmailVerified) {
        return res.generalError('Your account is not allowed to access this resource.', {}, 401);
      }

      req.user = { id: recruiter.id, email: recruiter.email, role: recruiter.role };
      next();
    } catch (err) {
      next(err);
    }
  }

  static createJwt(payload: Record<string, any>, period: 'short' | 'defined' = 'defined', expiresIn?: string): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET not defined');

    const defaultExpiry = '1h';
    const expiry = expiresIn || (period === 'short' ? '600s' : process.env.JWT_EXPIRY || defaultExpiry);

    const options: jwt.SignOptions | any = expiry
      ? { expiresIn: expiry }
      : {};

    return jwt.sign(payload, secret, options);
  }
}

export default AuthMiddleware;
