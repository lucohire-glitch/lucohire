import { env } from './config/env.js';
import { initSchema } from './config/db.js';
import { PlanModel } from './models/planModel.js';
import { CareerPathModel } from './models/careerPathModel.js';
import { ScraperModel } from './models/scraperModel.js';
import { ScraperEngine } from './services/scraper/scraperEngine.js';
import app from './app.js';

initSchema()
  .then(() => PlanModel.initTableAndSeed())
  .then(() => CareerPathModel.initTableAndSeed())
  .then(() => ScraperModel.initTables())
  .then(() => {
    console.log('DB, Plans, Career Paths, and Scraper Engine ready');
    // Background Auto-Sync Scheduler: checks tracked companies every 3 minutes for new live job postings
    let isAutoSyncRunning = false;
    setInterval(async () => {
      if (isAutoSyncRunning) return;
      isAutoSyncRunning = true;
      try {
        const companies = await ScraperModel.getAllCompanies();
        const now = Date.now();
        const due = companies
          .filter(c => !c.last_scanned_at || (now - new Date(c.last_scanned_at).getTime()) > 3 * 60 * 1000)
          .slice(0, 4);
        if (due.length > 0) {
          await Promise.allSettled(due.map(c => ScraperEngine.scanCompany(c.id)));
        }
      } catch (err) {
        console.warn('[Auto-Sync] Background scan warning:', err.message);
      } finally {
        isAutoSyncRunning = false;
      }
    }, 3 * 60 * 1000);
  })
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

