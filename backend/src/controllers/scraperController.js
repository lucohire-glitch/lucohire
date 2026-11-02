import { ScraperModel } from '../models/scraperModel.js';
import { ScraperEngine } from '../services/scraper/scraperEngine.js';
import { DiscoveryService } from '../services/scraper/discoveryService.js';
import { ScraperQueueService } from '../services/scraper/queueService.js';

export const ScraperController = {
  // Add single company
  async addCompany(req, res) {
    const { name, website, careerUrl, contactEmail, country } = req.body;
    
    // 1. Guard against 3rd-party job portals / aggregators
    const portalDetected =
      DiscoveryService.isJobPortal(name) ||
      DiscoveryService.isJobPortal(website) ||
      DiscoveryService.isJobPortal(careerUrl) ||
      DiscoveryService.isJobPortal(contactEmail);

    if (portalDetected) {
      return res.status(400).json({
        success: false,
        error: 'JOB_PORTAL_BLOCKED',
        reason: `Scanning 3rd-party job portals ("${portalDetected}") is strictly blocked. LucoHire Engine only connects directly to official company career sites (e.g. accenture.com, stripe.com, adobe.com) to guarantee 100% active, verified, and unexpired employer jobs without intermediary spam. Please enter the direct hiring company name or official website.`
      });
    }

    // Normalize input from company name, website, or email
    const norm = DiscoveryService.normalizeCompanyInput({
      name,
      website,
      careerUrl,
      contactEmail,
    });

    if (!norm.name || norm.name === 'Unnamed Company') {
      return res.status(400).json({ error: 'Please provide at least a company name, official website, or email' });
    }

    const company = await ScraperModel.createOrFindCompany({
      name: norm.name,
      website: norm.website,
      careerUrl: norm.careerUrl,
      contactEmail: norm.contactEmail,
      country: country || '',
    });
    return res.status(201).json({ success: true, company });
  },

  // Bulk import CSV
  async importCsv(req, res) {
    const { companies } = req.body; // Array of { name, website, country, contactEmail }
    if (!Array.isArray(companies) || companies.length === 0) {
      return res.status(400).json({ error: 'Companies list must be a non-empty array' });
    }

    const created = [];
    const rejectedPortals = [];

    for (const item of companies) {
      const portal =
        DiscoveryService.isJobPortal(item.name) ||
        DiscoveryService.isJobPortal(item.website) ||
        DiscoveryService.isJobPortal(item.careerUrl) ||
        DiscoveryService.isJobPortal(item.contactEmail);

      if (portal) {
        rejectedPortals.push({
          input: item.name || item.website,
          portal,
          reason: `Rejected 3rd-party job aggregator "${portal}". Only direct employers allowed.`
        });
        continue;
      }

      if (item.name && item.name.trim()) {
        const c = await ScraperModel.createOrFindCompany({
          name: item.name,
          website: item.website || '',
          careerUrl: item.careerUrl || '',
          contactEmail: item.contactEmail || '',
          country: item.country || '',
        });
        created.push(c);
      }
    }
    return res.json({
      success: true,
      importedCount: created.length,
      companies: created,
      rejectedPortals
    });
  },

  // Get all companies
  async getCompanies(_req, res) {
    const companies = await ScraperModel.getAllCompanies();
    return res.json({ success: true, companies });
  },

  // Get company by ID
  async getCompanyById(req, res) {
    const { id } = req.params;
    const company = await ScraperModel.getCompanyById(id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    const scans = await ScraperModel.getScanRuns(id, 10);
    return res.json({ success: true, company, recentScans: scans });
  },

  // Update company access / verification status
  async updateCompany(req, res) {
    const { id } = req.params;
    const { access_status, verification_status, contact_email, career_url, website } = req.body;
    const fields = {};
    if (access_status) fields.access_status = access_status;
    if (verification_status) fields.verification_status = verification_status;
    if (contact_email !== undefined) fields.contact_email = contact_email;
    if (career_url !== undefined) fields.career_url = career_url;
    if (website !== undefined) fields.website = website;

    const updated = await ScraperModel.updateCompany(id, fields);
    return res.json({ success: true, company: updated });
  },

  // Trigger scan for a company (supports sync & background queue mode)
  async scanCompany(req, res) {
    const { id } = req.params;
    const { keyword, title, location, isAsync } = req.body || {};
    const useAsync = isAsync || req.query.async === 'true';

    try {
      const company = await ScraperModel.getCompanyById(id);
      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }

      const portalDetected =
        DiscoveryService.isJobPortal(company.name) ||
        DiscoveryService.isJobPortal(company.website) ||
        DiscoveryService.isJobPortal(company.career_url);

      if (portalDetected) {
        return res.status(400).json({
          success: false,
          error: 'JOB_PORTAL_BLOCKED',
          reason: `Cannot scan "${company.name}": Detected as a 3rd-party job portal (${portalDetected}). Scanning job aggregators is prohibited to protect data freshness and direct application URLs.`
        });
      }

      // Background Queue execution: returns immediately to avoid serverless timeout
      if (useAsync) {
        const queuedTask = await ScraperQueueService.enqueueScan(id, { keyword, title, location });
        return res.status(202).json({
          success: true,
          queued: true,
          taskId: queuedTask.id,
          message: `Scan for ${company.name} successfully queued in background worker.`
        });
      }

      // Standard execution
      const result = await ScraperEngine.scanCompany(id, { keyword, title, location });
      return res.json({ success: true, ...result });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // Trigger scan for all allowed companies (Background Queue supported)
  async scanAll(req, res) {
    const useAsync = req.body?.isAsync !== false && req.query.sync !== 'true';
    try {
      if (useAsync) {
        const queueResult = await ScraperQueueService.enqueueAllAllowed();
        return res.status(202).json({
          success: true,
          queued: true,
          message: `Queued ${queueResult.enqueuedCount} companies for background scan without serverless timeout limits.`,
          ...queueResult
        });
      }

      const results = await ScraperEngine.scanAllAllowed();
      return res.json({ success: true, results });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // Get background queue stats, incomplete scans list, and recent tasks
  async getQueueStatus(_req, res) {
    try {
      const data = await ScraperQueueService.getStats();
      return res.json({ success: true, ...data });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // Process a batch of queued jobs (used by worker or cron)
  async processQueueBatch(req, res) {
    const concurrency = req.body?.concurrency ? parseInt(req.body.concurrency, 10) : 2;
    const maxTasks = req.body?.maxTasks ? parseInt(req.body.maxTasks, 10) : 5;
    try {
      const result = await ScraperQueueService.processBatch(concurrency, maxTasks);
      return res.json({ success: true, ...result });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // Trigger automatic retry for all incomplete/partial scans
  async retryIncompleteScans(_req, res) {
    try {
      const result = await ScraperQueueService.enqueueIncompleteRetries();
      return res.json({
        success: true,
        message: `Queued ${result.retriedCount} incomplete scans for automated retry.`,
        ...result
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // Daily Cron Rescan & Audit Job (Vercel Cron / External Scheduler / Admin)
  async triggerDailyCron(req, res) {
    const isVercelCron = Boolean(req.headers['x-vercel-cron']);
    const authHeader = req.headers.authorization || '';
    const cronSecret = process.env.CRON_SECRET;
    const isSecretAuthorized = cronSecret && authHeader === `Bearer ${cronSecret}`;
    const isAdmin = req.user?.role === 'admin';

    if (!isVercelCron && !isSecretAuthorized && !isAdmin) {
      return res.status(401).json({ error: 'Unauthorized cron request. Provide CRON_SECRET or run as admin.' });
    }

    try {
      console.log('[Daily Cron] Triggering daily full audit and rescan...');
      // 1. Enqueue all allowed companies for daily rescan
      const allQueued = await ScraperQueueService.enqueueAllAllowed();
      // 2. Enqueue any incomplete / failed retry jobs
      const retries = await ScraperQueueService.enqueueIncompleteRetries();
      // 3. Process immediate batch within serverless budget
      const batchResult = await ScraperQueueService.processBatch(2, 4);

      return res.json({
        success: true,
        cron: 'daily-rescan-audit',
        enqueuedCompanies: allQueued.enqueuedCount,
        incompleteRetries: retries.retriedCount,
        immediateBatch: batchResult,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // Get scan runs history
  async getScanRuns(req, res) {
    const companyId = req.query.company_id ? parseInt(req.query.company_id, 10) : null;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
    const runs = await ScraperModel.getScanRuns(companyId, limit);
    return res.json({ success: true, scans: runs });
  },

  // Get single scan run detail with coverage report
  async getScanRunById(req, res) {
    const { id } = req.params;
    const scan = await ScraperModel.getScanRunById(id);
    if (!scan) {
      return res.status(404).json({ error: 'Scan run not found' });
    }
    return res.json({ success: true, scan });
  },

  // Partial Scan Recovery: retry unfinished parts only
  async retryPending(req, res) {
    const { id } = req.params;
    const scan = await ScraperModel.getScanRunById(id);
    if (!scan) {
      return res.status(404).json({ error: 'Scan run not found' });
    }

    // Trigger recovery scan
    const result = await ScraperEngine.scanCompany(scan.company_id);
    await ScraperModel.updateScanRun(id, {
      retry_outcome: 'Recovered via incremental retry. Earlier work preserved.',
      pending_tasks: [],
    });
    return res.json({ success: true, message: 'Recovery scan completed', result });
  },

  // Get jobs (supports searching by company, title, location, or general search)
  async getJobs(req, res) {
    const { company_id, company_name, title, location, status, is_published, search, limit, offset } = req.query;
    const { jobs, totalCount } = await ScraperModel.getAllJobs({
      company_id: company_id ? parseInt(company_id, 10) : null,
      company_name: company_name || null,
      title: title || null,
      location: location || null,
      status: status || null,
      is_published: is_published !== undefined ? is_published === 'true' : null,
      search: search || null,
      limit: limit ? parseInt(limit, 10) : 15000,
      offset: offset ? parseInt(offset, 10) : 0,
    });
    return res.json({ success: true, jobs, count: jobs.length, totalCount });
  },

  // Toggle publish / unpublish
  async toggleJobPublish(req, res) {
    const { id } = req.params;
    const { is_published } = req.body;
    const updated = await ScraperModel.toggleJobPublish(id, is_published);
    return res.json({ success: true, job: updated });
  },

  // Public candidate jobs listing API (for LucoHire website)
  async getPublicJobs(req, res) {
    const { search, location, work_mode, limit, offset } = req.query;
    const { jobs, totalCount } = await ScraperModel.getAllJobs({
      status: 'ACTIVE',
      is_published: true,
      search: search || null,
      location: location || null,
      work_mode: (work_mode && work_mode !== 'All') ? work_mode : null,
      limit: limit ? parseInt(limit, 10) : 60,
      offset: offset ? parseInt(offset, 10) : 0,
    });

    return res.json({
      success: true,
      jobs: jobs.map(j => ({
        id: j.id,
        title: j.title,
        company: j.company_name,
        company_website: j.company_website,
        company_email: j.contact_email || j.company_email,
        location: j.location,
        work_mode: j.work_mode,
        employment_type: j.employment_type,
        department: j.department,
        salary: j.salary,
        experience: j.experience,
        skills: j.skills,
        description: j.description || '',
        external_job_id: j.external_job_id,
        ats_provider: j.ats_provider,
        apply_url: j.apply_url || j.original_job_url,
        last_verified: j.last_verified_at,
        created_at: j.created_at,
      })),
      count: jobs.length,
      totalCount: totalCount || jobs.length,
    });
  },

  // Get scraper watchdog alerts (30%+ drop, zero jobs, count discrepancies)
  async getAlerts(req, res) {
    try {
      const status = req.query.status || 'ACTIVE';
      const severity = req.query.severity || null;
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;

      const alerts = await ScraperModel.getAlerts({ status, severity, limit });
      const stats = await ScraperModel.getAlertStats();

      return res.json({ success: true, stats, alerts });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // Resolve or acknowledge an alert
  async resolveAlert(req, res) {
    const { id } = req.params;
    const { status = 'RESOLVED' } = req.body || {};
    try {
      const updated = await ScraperModel.updateAlertStatus(id, status);
      return res.json({ success: true, alert: updated });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
};
