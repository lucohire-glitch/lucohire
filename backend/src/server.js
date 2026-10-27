import { env } from './config/env.js';
import { initSchema } from './config/db.js';
import { PlanModel } from './models/planModel.js';
import { CareerPathModel } from './models/careerPathModel.js';
import { ScraperModel } from './models/scraperModel.js';
import app from './app.js';

initSchema()
  .then(() => PlanModel.initTableAndSeed())
  .then(() => CareerPathModel.initTableAndSeed())
  .then(() => ScraperModel.initTables())
  .then(() => console.log('DB, Plans, Career Paths, and Scraper Engine ready'))
  .catch((e) => console.error('DB init failed:', e.message));

const server = app.listen(env.port, () => {
  console.log(`API running on http://localhost:${env.port}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`[PORT IN USE] Port ${env.port} busy, waiting to release...`);
    setTimeout(() => {
      try {
        server.close();
      } catch {}
      server.listen(env.port);
    }, 1000);
  } else {
    console.error('[SERVER ERROR]', err);
  }
});

process.on('SIGTERM', () => {
  try { server.close(); } catch {}
});
process.on('SIGINT', () => {
  try { server.close(); } catch {}
});

