import { DataTypes, Model } from 'sequelize';
import SequelizeClass from '../../settings/orm/sequelize';
import { RecruiterAttributes, RecruiterCreationAttributes } from './interfaces';

const sequelize = SequelizeClass.getInstance().sequelize;

class Recruiter extends Model<RecruiterAttributes, RecruiterCreationAttributes> {
  declare id: string;
  declare fullName: string;
  declare email: string;
  declare password: string;
  declare role: RecruiterAttributes['role'];
  declare isActive: boolean;
  declare isEmailVerified: boolean;
  declare lastLoginAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Recruiter.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  fullName: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: { isEmail: true },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('admin', 'recruiter'),
    allowNull: false,
    defaultValue: 'recruiter',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  isEmailVerified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  sequelize,
  tableName: 'recruiters',
  underscored: true, // columns: full_name, is_active, last_login_at, created_at, ...
  defaultScope: {
    attributes: { exclude: ['password'] },
  },
  scopes: {
    withPassword: { attributes: { include: ['password'] } },
  },
  indexes: [
    { unique: true, fields: ['email'] },
  ],
});

export default Recruiter;
