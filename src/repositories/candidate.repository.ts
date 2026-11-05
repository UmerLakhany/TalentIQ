import { Candidate } from '../models';
import { CandidateCreationAttributes } from '../models/interfaces';

class CandidateRepository {
  static async bulkCreate(data: CandidateCreationAttributes[]): Promise<Candidate[]> {
    return Candidate.bulkCreate(data, { returning: true });
  }

  static async markFailed(candidate: Candidate, errorMessage: string): Promise<Candidate> {
    return candidate.update({ status: 'failed', errorMessage });
  }
}

export default CandidateRepository;
