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
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:4200',
  // Configuration Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  // Stripe Price IDs (préconfigurés dans Stripe Dashboard)
  STRIPE_PRICE_PER_EVENT: process.env.STRIPE_PRICE_PER_EVENT,
  STRIPE_PRICE_MONTHLY: process.env.STRIPE_PRICE_MONTHLY,
  STRIPE_PRICE_2DAYS: process.env.STRIPE_PRICE_2DAYS,
  STRIPE_PRICE_1WEEK: process.env.STRIPE_PRICE_1WEEK,
  STRIPE_PRICE_1MONTH: process.env.STRIPE_PRICE_1MONTH,
  // Configuration multi-tenant
  APP_BASE_URL: process.env.APP_BASE_URL ?? 'http://localhost:4200',
  SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL ?? 'admin@blindtest.local',
  SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD ?? 'admin123',
  // Configuration Email (SMTP)
  SMTP_HOST: process.env.SMTP_HOST ?? 'smtp.hostinger.com',
  SMTP_PORT: process.env.SMTP_PORT ?? '465',
  SMTP_SECURE: process.env.SMTP_SECURE ?? 'true',
  SMTP_USER: process.env.SMTP_USER ?? 'support@codeharmony.com',
  SMTP_PASS: process.env.SMTP_PASS ?? '',
  EMAIL_FROM: process.env.EMAIL_FROM ?? process.env.SMTP_USER ?? 'support@codeharmony.com',
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME ?? 'Blind Test Musical'
};
