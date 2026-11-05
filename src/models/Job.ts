import { DataTypes, Model } from 'sequelize';
import SequelizeClass from '../../settings/orm/sequelize';
import { JobAttributes, JobCreationAttributes } from './interfaces';
import type JobRequirement from './JobRequirement';

const sequelize = SequelizeClass.getInstance().sequelize;

class Job extends Model<JobAttributes, JobCreationAttributes> {
  declare id: string;
  declare recruiterId: string;
  declare title: string;
  declare description: string;
  declare minExperience: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  declare requirements?: JobRequirement[];
}

Job.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  recruiterId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '',
  },
  minExperience: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  sequelize,
  tableName: 'jobs',
  underscored: true,
  indexes: [
    { fields: ['recruiter_id'] },
  ],
});

export default Job;
