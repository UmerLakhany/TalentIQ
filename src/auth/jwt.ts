import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';


declare module 'express-serve-static-core' {
  interface Request {
    user?: any;
  }
}

class AuthMiddleware {

  static async auth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {

      let token = '';

      if (req?.headers?.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1].trim()
      }

      if (!token) {
        return res.generalError("Authentication required", { error: 'Authentication required' }, 401);
      }


      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || '')

      req.user = decoded;
      next();
    } catch (err: any) {
      res.generalError("Authentication required", { error: err?.message || 'Authentication required' }, 401);
    }
  }

  static authAdmin(req: Request, res: Response, next: NextFunction): void {
    const token = req?.headers?.token || req?.cookies?.token;
    if (!token) {
      res.generalError("Authentication required", { error: 'Authentication required' }, 401);
    }

    jwt.verify(token, process.env.JWT_SECRET || '', (err: any, user: any) => {
      if (err) {
        return res.status(401).json({ error: 'Token verification failed', detail: err });
      }

      const jwtSecret = AuthMiddleware.createJwt({
        id: user.id,
        email: user.email
      })


      delete user.password

      req.user = user;
      next();
    });
  }

  static createJwt(payload: Record<string, any>, period: 'short' | 'defined' = 'defined'): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET not defined');

    const defaultExpiry = '1h';
    const expiry = period === 'short' ? '600s' : process.env.JWT_EXPIRY || defaultExpiry;

    const options: jwt.SignOptions | any = expiry
      ? { expiresIn: expiry }
      : {};

    return jwt.sign(payload, secret, options);
  }
}

export default AuthMiddleware;