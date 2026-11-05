import crypto from 'crypto';
import RedisClass from '../../../settings/cache/redis';

export type OtpPurpose = 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';
export type OtpCheckResult = 'valid' | 'invalid' | 'expired' | 'too_many_attempts';

const redis = () => RedisClass.getInstance().client;

const config = () => ({
  length: Number(process.env.OTP_LENGTH) || 6,
  expirySeconds: (Number(process.env.OTP_EXPIRY) || 10) * 60,
  maxAttempts: Number(process.env.OTP_MAX_ATTEMPTS) || 5,
  resendCooldownSeconds: Number(process.env.OTP_RESEND_COOLDOWN) || 60,
});

const otpKey = (purpose: OtpPurpose, email: string) => `otp:${purpose}:${email}`;
const cooldownKey = (purpose: OtpPurpose, email: string) => `otp:cooldown:${purpose}:${email}`;

/** Only a keyed hash of the code is stored, never the code itself. */
const hashOtp = (otp: string) =>
  crypto.createHmac('sha256', process.env.JWT_SECRET || 'talentiq').update(otp).digest('hex');

/**
 * One-time codes kept in Redis. Each code expires automatically (OTP_EXPIRY minutes),
 * allows OTP_MAX_ATTEMPTS wrong guesses, and a new code can be requested only after
 * OTP_RESEND_COOLDOWN seconds. Generating a new code replaces the previous one.
 */
class OTP {
  static async generateOTP(email: string, purpose: OtpPurpose): Promise<string> {
    const { length, expirySeconds, resendCooldownSeconds } = config();
    const otp = crypto.randomInt(0, 10 ** length).toString().padStart(length, '0');
    const key = otpKey(purpose, email);

    await redis()
      .multi()
      .del(key)
      .hSet(key, { hash: hashOtp(otp), attempts: '0' })
      .expire(key, expirySeconds)
      .set(cooldownKey(purpose, email), '1', { EX: resendCooldownSeconds })
      .exec();

    return otp;
  }

  /** Seconds left before a new code may be sent (0 = allowed now). */
  static async getResendCooldown(email: string, purpose: OtpPurpose): Promise<number> {
    const ttl = await redis().ttl(cooldownKey(purpose, email));
    return ttl > 0 ? ttl : 0;
  }

  static async verifyOTP(email: string, otp: string, purpose: OtpPurpose): Promise<OtpCheckResult> {
    const { maxAttempts } = config();
    const key = otpKey(purpose, email);
    const stored = await redis().hGetAll(key);

    if (!stored?.hash) return 'expired';

    const expected = Buffer.from(stored.hash, 'hex');
    const actual = Buffer.from(hashOtp(otp), 'hex');
    if (expected.length === actual.length && crypto.timingSafeEqual(expected, actual)) {
      await redis().del(key);
      return 'valid';
    }

    const attempts = await redis().hIncrBy(key, 'attempts', 1);
    if (attempts >= maxAttempts) {
      await redis().del(key);
      return 'too_many_attempts';
    }
    return 'invalid';
  }

  static expiryMinutes(): number {
    return config().expirySeconds / 60;
  }
}

export default OTP;
