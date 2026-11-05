import jwt from 'jsonwebtoken';

const PURPOSE = 'cv_access';

const expiry = () => `${Number(process.env.CV_URL_EXPIRY_MINUTES) || 60}m`;

/**
 * Short-lived signed token for one CV file, added to `cvUrl` as ?token=...
 * Browsers can't send an Authorization header from a plain link (<a href>, <iframe>), so the link
 * itself carries permission: it opens only that CV and expires after CV_URL_EXPIRY_MINUTES.
 */
class CvAccessToken {
  static create(candidateId: string): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET not defined');
    return jwt.sign({ sub: candidateId, purpose: PURPOSE }, secret, { expiresIn: expiry() as any });
  }

  /** True if the token is valid, unexpired, and was issued for this candidate. */
  static verify(token: string, candidateId: string): boolean {
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || '');
      return decoded?.purpose === PURPOSE && decoded?.sub === candidateId;
    } catch {
      return false;
    }
  }
}

export default CvAccessToken;
