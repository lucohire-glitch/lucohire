import { env } from './config/env.js';
import { initSchema } from './config/db.js';
import { PlanModel } from './models/planModel.js';
import { CareerPathModel } from './models/careerPathModel.js';
import { ScraperModel } from './models/scraperModel.js';
import { ScraperEngine } from './services/scraper/scraperEngine.js';
import { ScraperQueueService } from './services/scraper/queueService.js';
import app from './app.js';

initSchema()
  .then(() => PlanModel.initTableAndSeed())
  .then(() => CareerPathModel.initTableAndSeed())
  .then(() => ScraperModel.initTables())
  .then(() => {
    console.log('DB, Plans, Career Paths, and Scraper Engine ready');

    // 1. Continuous Background Queue Worker: Drains background scan tasks in polite batches of 2
    let isWorkerRunning = false;
    setInterval(async () => {
      if (isWorkerRunning) return;
      isWorkerRunning = true;
      try {
        await ScraperQueueService.processBatch(2, 4);
      } catch (err) {
        // Silent worker catch
      } finally {
        isWorkerRunning = false;
      }
    }, 60 * 1000); // Check queue every 60 seconds

    // 2. Periodic Due Scanner: Queues companies that haven't been scanned in 12+ hours
    let isAutoSyncRunning = false;
    setInterval(async () => {
      if (isAutoSyncRunning) return;
      isAutoSyncRunning = true;
      try {
        const companies = await ScraperModel.getAllCompanies();
        const now = Date.now();
        const due = companies.filter(c =>
          c.access_status === 'ALLOWED' &&
          (!c.last_scanned_at || (now - new Date(c.last_scanned_at).getTime()) > 12 * 60 * 60 * 1000)
        );
        for (const c of due.slice(0, 4)) {
          await ScraperQueueService.enqueueScan(c.id, { priority: 2 });
        }
      } catch (err) {
        console.warn('[Auto-Sync] Background scan warning:', err.message);
      } finally {
        isAutoSyncRunning = false;
      }
    }, 15 * 60 * 1000); // Check due companies every 15 minutes
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

