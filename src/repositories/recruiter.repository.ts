import { Recruiter } from '../models';
import { RecruiterCreationAttributes } from '../models/interfaces';

class RecruiterRepository {
  static async createRecruiter(data: RecruiterCreationAttributes): Promise<Recruiter> {
    return Recruiter.create(data);
  }

  static async findByEmail(email: string): Promise<Recruiter | null> {
    return Recruiter.findOne({ where: { email } });
  }

  /** Includes the password hash; use only for credential checks. */
  static async findByEmailWithPassword(email: string): Promise<Recruiter | null> {
    return Recruiter.scope('withPassword').findOne({ where: { email } });
  }

  static async findById(id: string): Promise<Recruiter | null> {
    return Recruiter.findByPk(id);
  }

  static async markEmailVerified(recruiter: Recruiter): Promise<Recruiter> {
    return recruiter.update({ isEmailVerified: true, lastLoginAt: new Date() });
  }

  /**
   * Sets a new password hash. Receiving the reset code also proves the recruiter owns the
   * email, so the email is marked verified as well.
   */
  static async updatePassword(id: string, passwordHash: string): Promise<void> {
    await Recruiter.update({ password: passwordHash, isEmailVerified: true }, { where: { id } });
  }

  static async updateLastLogin(recruiter: Recruiter): Promise<Recruiter> {
    return recruiter.update({ lastLoginAt: new Date() });
  }
}

export default RecruiterRepository;
