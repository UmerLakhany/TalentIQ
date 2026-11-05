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
}

export default RecruiterRepository;
