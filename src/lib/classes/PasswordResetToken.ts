import crypto from 'crypto';
import RedisClass from '../../../settings/cache/redis';

const redis = () => RedisClass.getInstance().client;

const expirySeconds = () => (Number(process.env.PASSWORD_RESET_TOKEN_EXPIRY) || 15) * 60;

/** Only a hash of the token is used as the Redis key, so a leaked Redis dump can't be replayed. */
const tokenKey = (token: string) =>
  `password_reset:${crypto.createHash('sha256').update(token).digest('hex')}`;

/**
 * Single-use token issued after the reset code is verified. It is kept in Redis with an
 * expiry and deleted the moment it is used, so it can change the password only once.
 */
class PasswordResetToken {
  static async create(recruiterId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    await redis().set(tokenKey(token), recruiterId, { EX: expirySeconds() });
    return token;
  }

  /** Returns the recruiter id and deletes the token, or null if it is invalid or expired. */
  static async consume(token: string): Promise<string | null> {
    return redis().getDel(tokenKey(token));
  }

  static expiryMinutes(): number {
    return expirySeconds() / 60;
  }
}

export default PasswordResetToken;
