import { DataTypes, Model } from 'sequelize';
import SequelizeClass from '../../settings/orm/sequelize';
import {
  CandidateAttributes,
  CandidateCreationAttributes,
  CV_FILE_TYPES,
  CvFileType,
  PROCESSING_STATUSES,
  ProcessingStatus,
} from './interfaces';

const sequelize = SequelizeClass.getInstance().sequelize;

/** One uploaded CV and, once analyzed, the AI's extracted profile and evaluation. */
class Candidate extends Model<CandidateAttributes, CandidateCreationAttributes> {
  declare id: string;
  declare jobId: string;
  declare fileName: string;
  declare fileType: CvFileType;
  declare mimeType: string;
  declare fileSizeBytes: number;
  declare storagePath: string;
  declare status: ProcessingStatus;
  declare errorMessage: string | null;
  declare profile: Record<string, any> | null;
  declare evaluation: Record<string, any> | null;
  declare matchScore: number | null;
  declare attempts: number;
  declare analysisVersion: number;
  declare processedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Candidate.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  jobId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  fileName: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  fileType: {
    type: DataTypes.ENUM(...CV_FILE_TYPES),
    allowNull: false,
  },
  mimeType: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  fileSizeBytes: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  storagePath: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM(...PROCESSING_STATUSES),
    allowNull: false,
    defaultValue: 'queued',
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  profile: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  evaluation: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  matchScore: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  analysisVersion: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  attempts: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  processedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  sequelize,
  tableName: 'candidates',
  underscored: true,
  indexes: [
    { fields: ['job_id'] },
    { fields: ['job_id', 'status'] },
    { fields: ['job_id', 'match_score'] },
  ],
});

export default Candidate;
