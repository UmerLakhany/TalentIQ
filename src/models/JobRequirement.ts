import { DataTypes, Model } from 'sequelize';
import SequelizeClass from '../../settings/orm/sequelize';
import {
  JobRequirementAttributes,
  JobRequirementCreationAttributes,
  REQUIREMENT_CATEGORIES,
  REQUIREMENT_TYPES,
  RequirementCategory,
  RequirementType,
} from './interfaces';

const sequelize = SequelizeClass.getInstance().sequelize;

/** One requirement of a job (e.g. skill "Node.js", mandatory). Evaluated individually by the AI. */
class JobRequirement extends Model<JobRequirementAttributes, JobRequirementCreationAttributes> {
  declare id: string;
  declare jobId: string;
  declare category: RequirementCategory;
  declare name: string;
  declare type: RequirementType;
  declare sortOrder: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

JobRequirement.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  jobId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  category: {
    type: DataTypes.ENUM(...REQUIREMENT_CATEGORIES),
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM(...REQUIREMENT_TYPES),
    allowNull: false,
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  sequelize,
  tableName: 'job_requirements',
  underscored: true,
  indexes: [
    { fields: ['job_id'] },
  ],
});

export default JobRequirement;
