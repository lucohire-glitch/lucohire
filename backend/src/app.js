import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import planRoutes from './routes/planRoutes.js';
import careerPathRoutes from './routes/careerPathRoutes.js';
import resumeSkillRoutes from './routes/resumeSkillRoutes.js';
import resumeAnalysisRoutes from './routes/resumeAnalysisRoutes.js';
import scraperRoutes from './routes/scraperRoutes.js';
import { errorHandler } from './middleware/auth.js';

const app = express();
app.use(cors({ origin: env.nodeEnv === 'development' ? true : env.corsOrigins, credentials: true }));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

app.get('/api/health', (_req, res) => {
  try {
    const host = new URL(env.databaseUrl).hostname;
    res.json({ ok: true, dbHost: host });
  } catch {
    res.json({ ok: true });
  }
});
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/paths', careerPathRoutes);
app.use('/api/skills', resumeSkillRoutes);
app.use('/api/resume', resumeAnalysisRoutes);
app.use('/api/scraper', scraperRoutes);

app.use(errorHandler);

export default app;
