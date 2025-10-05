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
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:4200',
  // Configuration Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  // Configuration multi-tenant
  APP_BASE_URL: process.env.APP_BASE_URL ?? 'http://localhost:4200',
  SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL ?? 'admin@blindtest.local',
  SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD ?? 'admin123'
};
