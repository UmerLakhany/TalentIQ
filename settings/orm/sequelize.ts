import { Sequelize } from 'sequelize';
import { getDatabaseUrl } from '../database';

class SequelizeClass {
  private static instance: SequelizeClass | null = null;
  public sequelize: Sequelize;

  private constructor() {
    this.sequelize = new Sequelize(getDatabaseUrl(), {
      dialect: 'postgres',
      logging: false,
    });
  }

  public static getInstance(): SequelizeClass {
    if (!SequelizeClass.instance) {
      SequelizeClass.instance = new SequelizeClass();
    }
    return SequelizeClass.instance;
  }

  /** Verifies the connection and syncs models. Call once before the server starts listening. */
  public async connect(): Promise<void> {
    await this.sequelize.authenticate();
    console.log('Database connected.');
    await this.sequelize.sync({ alter: process.env.DB_SYNC_ALTER === 'true' });
    console.log('Database synchronized.');
  }

  public close(): Promise<void> {
    return this.sequelize.close();
  }
}

export default SequelizeClass;
