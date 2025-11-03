import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// 加载环境变量
config();

export default new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'zxsj_hub',
  entities: ['src/entities/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  migrationsTableName: 'migrations',
  synchronize: false, // 生产环境必须为 false
  logging: process.env.NODE_ENV === 'development',
  timezone: '+08:00',
  charset: 'utf8mb4',
});