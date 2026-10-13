import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import { errorHandler } from './middleware/auth.js';

const app = express();
app.use(cors({ origin: env.corsOrigins }));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);

app.use(errorHandler);

export default app;
