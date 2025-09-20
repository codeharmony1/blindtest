import 'dotenv/config';

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  API_PORT: Number(process.env.API_PORT ?? 3000),
  API_HOST: process.env.API_HOST ?? '0.0.0.0',
  DB_HOST: process.env.DB_HOST ?? '127.0.0.1',
  DB_PORT: Number(process.env.DB_PORT ?? 3306),
  DB_USER: process.env.DB_USER ?? 'root',
  DB_PASS: process.env.DB_PASS ?? '',
  DB_NAME: process.env.DB_NAME ?? 'blindtest',
  JWT_SECRET: process.env.JWT_SECRET ?? 'dev-secret',
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:4200'
};
