import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';

const app = express();
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.use(rateLimit({ windowMs: 10_000, max: 200 }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

export default app;
