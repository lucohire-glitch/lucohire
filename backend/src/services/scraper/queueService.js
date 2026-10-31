import { ScraperModel } from '../../models/scraperModel.js';
import { ScraperEngine } from './scraperEngine.js';

export const ScraperQueueService = {
  /**
   * Enqueue a single company for background scanning
   */
  async enqueueScan(companyId, options = {}) {
    const company = await ScraperModel.getCompanyById(companyId);
    if (!company) throw new Error(`Company with ID ${companyId} not found`);

    return await ScraperModel.enqueueJob({
      companyId: company.id,
      companyName: company.name,
      taskType: options.taskType || 'COMPANY_SCAN',
      priority: options.priority || 1,
      payload: {
        keyword: options.keyword,
        title: options.title,
        location: options.location,
        enqueuedAt: new Date().toISOString()
      },
      maxAttempts: options.maxAttempts || 3
    });
  },

  /**
   * Enqueue all allowed companies in bulk (bypassing Vercel synchronous timeout)
   */
  async enqueueAllAllowed(options = {}) {
    const companies = await ScraperModel.getAllCompanies();
    const allowed = companies.filter(c => c.access_status !== 'BLOCKED_BY_OWNER');
    const jobs = [];

    for (const c of allowed) {
      const job = await ScraperModel.enqueueJob({
        companyId: c.id,
        companyName: c.name,
        taskType: 'COMPANY_SCAN',
        priority: 1,
        payload: { enqueuedAt: new Date().toISOString() },
        maxAttempts: 3
      });
      jobs.push(job);
    }

    return {
      enqueuedCount: jobs.length,
      companies: allowed.map(c => ({ id: c.id, name: c.name }))
    };
  },

  /**
   * Automatically detect all companies with INCOMPLETE or PARTIAL scans
   * and enqueue them with high priority for auto-retry
   */
  async enqueueIncompleteRetries() {
    const incomplete = await ScraperModel.getIncompleteCompanies();
    const retried = [];

    for (const c of incomplete) {
      const job = await ScraperModel.enqueueJob({
        companyId: c.id,
        companyName: c.name,
        taskType: 'INCOMPLETE_RETRY',
        priority: 5, // Higher priority than normal scans
        payload: {
          lastStatus: c.last_scan_status,
          expectedCount: c.expected_count,
          extractedCount: c.extracted_count,
          reason: `Auto-retry scheduled: Extracted ${c.extracted_count} of ${c.expected_count} expected`,
          enqueuedAt: new Date().toISOString()
        },
        maxAttempts: 3
      });
      retried.push({ companyId: c.id, name: c.name, jobId: job.id });
    }

    return {
      retriedCount: retried.length,
      companies: retried
    };
  },

  /**
   * Process a single queued task atomically
   */
  async processNextJob(workerId = `worker-${process.pid}`) {
    const job = await ScraperModel.dequeueNextJob(workerId);
    if (!job) return null;

    console.log(`[Queue Worker ${workerId}] Processing task #${job.id}: ${job.company_name} (${job.task_type}). Attempt ${job.attempts}/${job.max_attempts}`);

    try {
      const scanResult = await ScraperEngine.scanCompany(job.company_id, job.payload || {});

      // Check if scan resulted in an INCOMPLETE scan
      if (scanResult.status === 'INCOMPLETE' || scanResult.coverage === 'PARTIAL') {
        const discrepancy = `Extracted ${scanResult.jobsExtracted} of ${scanResult.reportedCount} expected jobs`;
        console.warn(`[Queue Worker ${workerId}] Task #${job.id} finished with INCOMPLETE status: ${discrepancy}`);

        // Schedule exponential backoff retry (e.g. 30s, 60s, 120s)
        const delay = Math.pow(2, job.attempts) * 30;
        await ScraperModel.failOrRetryQueueJob(job.id, `Incomplete scan: ${discrepancy}`, delay);
        return { jobId: job.id, status: 'RETRY_SCHEDULED', delay, scanResult };
      }

      // Mark completed successfully
      await ScraperModel.completeQueueJob(job.id, {
        jobsExtracted: scanResult.jobsExtracted,
        reportedCount: scanResult.reportedCount,
        status: scanResult.status,
        coverage: scanResult.coverage
      });

      return { jobId: job.id, status: 'COMPLETED', scanResult };
    } catch (err) {
      console.error(`[Queue Worker ${workerId}] Task #${job.id} threw error:`, err.message);
      const delay = Math.pow(2, job.attempts) * 30;
      await ScraperModel.failOrRetryQueueJob(job.id, err.message, delay);
      return { jobId: job.id, status: 'ERROR_OR_RETRY', error: err.message };
    }
  },

  /**
   * Run a concurrency-controlled batch of queued jobs (e.g. for worker loop or cron trigger)
   */
  async processBatch(concurrency = 2, maxTasks = 10) {
    const results = [];
    let processed = 0;

    while (processed < maxTasks) {
      // Spawn up to `concurrency` parallel tasks
      const activePromises = [];
      for (let i = 0; i < concurrency && (processed + i) < maxTasks; i++) {
        activePromises.push(this.processNextJob(`worker-${i + 1}`));
      }

      const batchResults = await Promise.all(activePromises);
      const activeCount = batchResults.filter(Boolean).length;
      if (activeCount === 0) {
        // No more pending jobs in queue
        break;
      }

      results.push(...batchResults.filter(Boolean));
      processed += activeCount;
    }

    return {
      processedCount: results.length,
      results,
      stats: await ScraperModel.getQueueStats()
    };
  },

  /**
   * Get overall queue health and statistics
   */
  async getStats() {
    const stats = await ScraperModel.getQueueStats();
    const recentItems = await ScraperModel.getQueueItems(null, 15);
    const incompleteCompanies = await ScraperModel.getIncompleteCompanies();

    return {
      stats,
      incompleteCount: incompleteCompanies.length,
      incompleteCompanies: incompleteCompanies.map(c => ({
        id: c.id,
        name: c.name,
        expected: c.expected_count,
        extracted: c.extracted_count,
        lastStatus: c.last_scan_status
      })),
      recentTasks: recentItems
    };
  }
};
