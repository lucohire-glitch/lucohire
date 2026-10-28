import { ScraperModel } from '../models/scraperModel.js';
import { ScraperEngine } from '../services/scraper/scraperEngine.js';
import { DiscoveryService } from '../services/scraper/discoveryService.js';

export const ScraperController = {
  // Add single company
  async addCompany(req, res) {
    const { name, website, careerUrl, contactEmail, country } = req.body;
    
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
    for (const item of companies) {
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
    return res.json({ success: true, importedCount: created.length, companies: created });
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

  // Trigger scan for a company
  async scanCompany(req, res) {
    const { id } = req.params;
    try {
      const result = await ScraperEngine.scanCompany(id);
      return res.json({ success: true, ...result });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // Trigger scan for all allowed companies
  async scanAll(_req, res) {
    try {
      const results = await ScraperEngine.scanAllAllowed();
      return res.json({ success: true, results });
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

  // Get jobs
  async getJobs(req, res) {
    const { company_id, status, is_published, search, limit, offset } = req.query;
    const { jobs, totalCount } = await ScraperModel.getAllJobs({
      company_id: company_id ? parseInt(company_id, 10) : null,
      status: status || null,
      is_published: is_published !== undefined ? is_published === 'true' : null,
      search: search || null,
      limit: limit ? parseInt(limit, 10) : 2000,
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
      limit: limit ? parseInt(limit, 10) : 60,
      offset: offset ? parseInt(offset, 10) : 0,
    });

    // Filter by work mode or location if provided
    let filtered = jobs;
    if (work_mode && work_mode !== 'All') {
      filtered = filtered.filter(j => j.work_mode?.toLowerCase() === work_mode.toLowerCase());
    }
    if (location) {
      filtered = filtered.filter(j => j.location?.toLowerCase().includes(location.toLowerCase()));
    }

    return res.json({
      success: true,
      jobs: filtered.map(j => ({
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
        apply_url: j.apply_url || j.original_job_url,
        last_verified: j.last_verified_at,
        created_at: j.created_at,
      })),
      count: filtered.length,
      totalCount: totalCount || filtered.length,
    });
  }
};
