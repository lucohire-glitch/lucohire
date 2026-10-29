import { pool } from '../config/db.js';

export const ScraperModel = {
  async initTables() {
    await pool.query(`
      -- 1. Scraped Companies Table
      CREATE TABLE IF NOT EXISTS scraped_companies (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        website TEXT,
        career_url TEXT,
        contact_email TEXT,
        ats_provider TEXT DEFAULT 'Detecting...',
        access_status TEXT DEFAULT 'ALLOWED', -- ALLOWED, ALLOWED_API_ONLY, RESTRICTED, BLOCKED_BY_OWNER, UNDER_REVIEW
        verification_status TEXT DEFAULT 'Needs review', -- Verified, Needs review
        country TEXT,
        last_scanned_at TIMESTAMPTZ,
        structure_memory JSONB DEFAULT '{}'::jsonb,
        meta JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );

      -- 2. Scraped Jobs Table
      CREATE TABLE IF NOT EXISTS scraped_jobs (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES scraped_companies(id) ON DELETE CASCADE,
        company_name TEXT NOT NULL,
        title TEXT NOT NULL,
        location TEXT,
        locations JSONB DEFAULT '[]'::jsonb,
        work_mode TEXT DEFAULT 'On-site', -- Remote, Hybrid, On-site
        employment_type TEXT DEFAULT 'Full-time',
        department TEXT,
        experience TEXT,
        salary TEXT,
        skills JSONB DEFAULT '[]'::jsonb,
        description TEXT,
        original_job_url TEXT,
        apply_url TEXT,
        external_job_id TEXT,
        ats_provider TEXT,
        extraction_method TEXT DEFAULT 'API',
        confidence_score INTEGER DEFAULT 85,
        apply_verification_status TEXT DEFAULT 'VERIFIED_APPLY_LINK',
        status TEXT DEFAULT 'ACTIVE', -- DISCOVERED, ACTIVE, SUSPECTED_REMOVED, EXPIRED, UNPUBLISHED
        is_published BOOLEAN DEFAULT true,
        missing_scans_count INTEGER DEFAULT 0,
        content_hash TEXT,
        contact_email TEXT,
        first_discovered_at TIMESTAMPTZ DEFAULT now(),
        last_verified_at TIMESTAMPTZ DEFAULT now(),
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );

      -- 3. Scraper Scan Runs (History & Debugging)
      CREATE TABLE IF NOT EXISTS scraper_scan_runs (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES scraped_companies(id) ON DELETE CASCADE,
        company_name TEXT NOT NULL,
        status TEXT NOT NULL, -- PASS, PARTIAL, INCOMPLETE, MANUAL_REVIEW, SOURCE_ERROR, NO_OPENINGS, ACCESS_RESTRICTED
        coverage TEXT NOT NULL DEFAULT 'UNKNOWN', -- COMPLETE, PARTIAL, UNKNOWN
        extraction_method TEXT DEFAULT 'API',
        jobs_found INTEGER DEFAULT 0,
        reported_job_count INTEGER,
        pages_visited INTEGER DEFAULT 0,
        filters_explored INTEGER DEFAULT 0,
        duration_seconds NUMERIC DEFAULT 0,
        failed_stage TEXT,
        http_status_summary TEXT,
        snapshot_data JSONB,
        incomplete_sections JSONB DEFAULT '[]'::jsonb,
        pending_tasks JSONB DEFAULT '[]'::jsonb,
        outcome_notes TEXT,
        retry_outcome TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      );

      -- Indexes for high performance
      CREATE INDEX IF NOT EXISTS idx_scraped_companies_name ON scraped_companies(name);
      CREATE INDEX IF NOT EXISTS idx_scraped_jobs_company_id ON scraped_jobs(company_id);
      CREATE INDEX IF NOT EXISTS idx_scraped_jobs_status ON scraped_jobs(status);
      CREATE INDEX IF NOT EXISTS idx_scraped_jobs_published ON scraped_jobs(is_published);
      CREATE INDEX IF NOT EXISTS idx_scraper_scan_runs_company_id ON scraper_scan_runs(company_id);
      CREATE INDEX IF NOT EXISTS idx_scraper_scan_runs_created_at ON scraper_scan_runs(created_at DESC);
    `);
    console.log('Scraper tables initialized successfully');
  },

  // Company operations
  async createOrFindCompany({ name, website = '', careerUrl = '', contactEmail = '', country = '' }) {
    const cleanName = name.trim();
    const existing = await pool.query(
      'SELECT * FROM scraped_companies WHERE LOWER(name) = LOWER($1)',
      [cleanName]
    );
    if (existing.rows.length > 0) {
      return existing.rows[0];
    }
    const res = await pool.query(
      `INSERT INTO scraped_companies (name, website, career_url, contact_email, country, access_status, verification_status)
       VALUES ($1, $2, $3, $4, $5, 'ALLOWED', 'Verified')
       RETURNING *`,
      [cleanName, website.trim(), careerUrl.trim(), contactEmail.trim(), country.trim()]
    );
    return res.rows[0];
  },

  async getAllCompanies() {
    const res = await pool.query(`
      SELECT c.*, 
        (SELECT COUNT(*)::int FROM scraped_jobs j WHERE j.company_id = c.id AND j.is_published = true AND j.status = 'ACTIVE') AS active_jobs_count,
        (SELECT s.status FROM scraper_scan_runs s WHERE s.company_id = c.id ORDER BY s.created_at DESC LIMIT 1) AS latest_scan_status,
        (SELECT s.coverage FROM scraper_scan_runs s WHERE s.company_id = c.id ORDER BY s.created_at DESC LIMIT 1) AS latest_scan_coverage,
        (SELECT s.reported_job_count FROM scraper_scan_runs s WHERE s.company_id = c.id AND s.reported_job_count IS NOT NULL ORDER BY s.created_at DESC LIMIT 1) AS latest_reported_count,
        (SELECT s.snapshot_data FROM scraper_scan_runs s WHERE s.company_id = c.id AND s.snapshot_data IS NOT NULL ORDER BY s.created_at DESC LIMIT 1) AS latest_snapshot_data
      FROM scraped_companies c
      ORDER BY c.created_at DESC
    `);
    return res.rows;
  },

  async getCompanyById(id) {
    const res = await pool.query('SELECT * FROM scraped_companies WHERE id = $1', [id]);
    return res.rows[0] || null;
  },

  async updateCompany(id, fields = {}) {
    const keys = Object.keys(fields);
    if (keys.length === 0) return null;
    const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const values = [id, ...keys.map(k => fields[k])];
    const res = await pool.query(
      `UPDATE scraped_companies SET ${setClause}, updated_at = now() WHERE id = $1 RETURNING *`,
      values
    );
    return res.rows[0];
  },

  async updateStructureMemory(id, memoryObj) {
    const res = await pool.query(
      `UPDATE scraped_companies 
       SET structure_memory = $2, updated_at = now() 
       WHERE id = $1 RETURNING *`,
      [id, JSON.stringify(memoryObj)]
    );
    return res.rows[0];
  },

  // Job operations
  async upsertJob(jobData) {
    const {
      company_id,
      company_name,
      title,
      location = '',
      locations = [],
      work_mode = 'On-site',
      employment_type = 'Full-time',
      department = '',
      experience = '',
      salary = '',
      skills = [],
      description = '',
      original_job_url = '',
      apply_url = '',
      external_job_id = '',
      ats_provider = '',
      extraction_method = 'API',
      confidence_score = 85,
      contact_email = '',
    } = jobData;

    // Check if job exists by company + external_job_id or original_job_url
    let existing;
    if (external_job_id) {
      existing = await pool.query(
        'SELECT * FROM scraped_jobs WHERE company_id = $1 AND external_job_id = $2',
        [company_id, external_job_id]
      );
    }
    if ((!existing || existing.rows.length === 0) && original_job_url) {
      existing = await pool.query(
        'SELECT * FROM scraped_jobs WHERE company_id = $1 AND original_job_url = $2',
        [company_id, original_job_url]
      );
    }

    if (existing && existing.rows.length > 0) {
      // Update existing job
      const id = existing.rows[0].id;
      const res = await pool.query(
        `UPDATE scraped_jobs SET
          title = $1, location = $2, locations = $3, work_mode = $4,
          employment_type = $5, department = $6, experience = $7, salary = $8,
          skills = $9, description = $10, original_job_url = $11, apply_url = $12,
          ats_provider = $13, extraction_method = $14, confidence_score = $15,
          contact_email = COALESCE(NULLIF($16, ''), contact_email),
          status = 'ACTIVE', missing_scans_count = 0, last_verified_at = now(), updated_at = now()
         WHERE id = $17 RETURNING *`,
        [
          title, location, JSON.stringify(locations), work_mode,
          employment_type, department, experience, salary,
          JSON.stringify(skills), description, original_job_url, apply_url,
          ats_provider, extraction_method, confidence_score, contact_email, id
        ]
      );
      return { job: res.rows[0], isNew: false };
    } else {
      // Insert new job
      const res = await pool.query(
        `INSERT INTO scraped_jobs (
          company_id, company_name, title, location, locations, work_mode,
          employment_type, department, experience, salary, skills, description,
          original_job_url, apply_url, external_job_id, ats_provider,
          extraction_method, confidence_score, contact_email, status, is_published,
          missing_scans_count, first_discovered_at, last_verified_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
          $17, $18, $19, 'ACTIVE', true, 0, now(), now()
        ) RETURNING *`,
        [
          company_id, company_name, title, location, JSON.stringify(locations), work_mode,
          employment_type, department, experience, salary, JSON.stringify(skills), description,
          original_job_url, apply_url, external_job_id, ats_provider,
          extraction_method, confidence_score, contact_email
        ]
      );
      return { job: res.rows[0], isNew: true };
    }
  },

  // Zero-Job Safety & Expiry Protection
  // Only marks jobs as SUSPECTED_REMOVED or EXPIRED after N successful complete scans where they were absent
  async processMissingJobs(companyId, foundExternalIds = [], scanIsComplete = false) {
    if (!scanIsComplete) {
      // Incomplete or failed scans NEVER expire jobs! (Requirement 3 & 11)
      return { message: 'Incomplete or partial scan. Expiry protection active, no jobs modified.' };
    }

    // If scan was 100% complete, increment missing count for jobs of this company not in foundExternalIds
    const { rows } = await pool.query(
      `SELECT * FROM scraped_jobs WHERE company_id = $1 AND status != 'EXPIRED'`,
      [companyId]
    );

    const foundSet = new Set(foundExternalIds);
    const idsToUpdate = [];
    for (const job of rows) {
      const isFound = foundSet.has(job.external_job_id) || foundSet.has(job.original_job_url);
      if (!isFound) {
        idsToUpdate.push(job.id);
      }
    }

    if (idsToUpdate.length > 0) {
      const shouldExpireNow = foundExternalIds.length > 0;
      if (shouldExpireNow) {
        await pool.query(
          `UPDATE scraped_jobs 
           SET missing_scans_count = COALESCE(missing_scans_count, 0) + 1, status = 'EXPIRED', is_published = false, updated_at = now() 
           WHERE id = ANY($1::int[])`,
          [idsToUpdate]
        );
      } else {
        await pool.query(
          `UPDATE scraped_jobs 
           SET missing_scans_count = COALESCE(missing_scans_count, 0) + 1,
               status = CASE WHEN COALESCE(missing_scans_count, 0) + 1 >= 3 THEN 'EXPIRED' ELSE 'SUSPECTED_REMOVED' END,
               is_published = CASE WHEN COALESCE(missing_scans_count, 0) + 1 >= 3 THEN false ELSE is_published END,
               updated_at = now() 
           WHERE id = ANY($1::int[])`,
          [idsToUpdate]
        );
      }
    }
    return { updatedCount: idsToUpdate.length };
  },

  async upsertJobsBulk(companyId, companyName, contactEmail, atsProvider, extractionMethod, jobsList = []) {
    if (!Array.isArray(jobsList) || jobsList.length === 0) {
      return { savedCount: 0, foundIds: [] };
    }

    // 1. Fetch existing jobs for this company in 1 query
    const existingRes = await pool.query(
      'SELECT id, external_job_id, original_job_url FROM scraped_jobs WHERE company_id = $1',
      [companyId]
    );
    const byExtId = new Map();
    const byUrl = new Map();
    for (const r of existingRes.rows) {
      if (r.external_job_id) byExtId.set(r.external_job_id, r.id);
      if (r.original_job_url) byUrl.set(r.original_job_url, r.id);
    }

    const toInsert = [];
    const toUpdate = [];
    const foundIds = [];
    const seenBatchKeys = new Set();

    for (const j of jobsList) {
      const extId = String(j.external_job_id || '');
      const origUrl = String(j.original_job_url || '');
      const key = extId || origUrl;
      if (!key || seenBatchKeys.has(key)) continue;
      seenBatchKeys.add(key);
      foundIds.push(key);

      const existingId = (extId && byExtId.get(extId)) || (origUrl && byUrl.get(origUrl));
      if (existingId) {
        toUpdate.push({ ...j, id: existingId });
      } else {
        toInsert.push(j);
      }
    }

    let savedCount = 0;

    // 2. Multi-row bulk INSERT for new jobs (batches of 100 rows per query)
    const INSERT_BATCH = 100;
    for (let i = 0; i < toInsert.length; i += INSERT_BATCH) {
      const batch = toInsert.slice(i, i + INSERT_BATCH);
      const values = [];
      const placeholders = [];
      let pIdx = 1;

      for (const j of batch) {
        placeholders.push(
          `($${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, 'ACTIVE', true, 0, now(), now())`
        );
        values.push(
          companyId,
          companyName,
          j.title || 'Open Position',
          j.location || '',
          JSON.stringify(j.locations || []),
          j.work_mode || 'On-site',
          j.employment_type || 'Full-time',
          j.department || 'General',
          j.experience || '',
          j.salary || '',
          JSON.stringify(j.skills || []),
          j.description || '',
          j.original_job_url || '',
          j.apply_url || j.original_job_url || '',
          String(j.external_job_id || ''),
          atsProvider || j.ats_provider || '',
          extractionMethod || j.extraction_method || 'API',
          j.confidence_score || 90,
          contactEmail || j.contact_email || ''
        );
      }

      await pool.query(
        `INSERT INTO scraped_jobs (
          company_id, company_name, title, location, locations, work_mode,
          employment_type, department, experience, salary, skills, description,
          original_job_url, apply_url, external_job_id, ats_provider,
          extraction_method, confidence_score, contact_email, status, is_published,
          missing_scans_count, first_discovered_at, last_verified_at
        ) VALUES ${placeholders.join(', ')}`,
        values
      );
      savedCount += batch.length;
    }

    // 3. Fast bulk refresh for existing jobs + parallel chunk updates
    if (toUpdate.length > 0) {
      const updateIds = toUpdate.map(u => u.id);
      await pool.query(
        `UPDATE scraped_jobs
         SET status = 'ACTIVE', missing_scans_count = 0, last_verified_at = now(), updated_at = now(),
             ats_provider = COALESCE(NULLIF($1, ''), ats_provider),
             extraction_method = COALESCE(NULLIF($2, ''), extraction_method),
             contact_email = COALESCE(NULLIF($3, ''), contact_email)
         WHERE id = ANY($4::int[])`,
        [atsProvider || '', extractionMethod || '', contactEmail || '', updateIds]
      );
      savedCount += toUpdate.length;
    }

    return { savedCount, foundIds };
  },

  async getAllJobs({ company_id, company_name, title, location, status, is_published, search, limit = 15000, offset = 0 } = {}) {
    let whereClauses = [];
    let values = [];
    let idx = 1;

    if (company_id) {
      whereClauses.push(`j.company_id = $${idx++}`);
      values.push(company_id);
    }
    if (company_name) {
      whereClauses.push(`j.company_name ILIKE $${idx++}`);
      values.push(`%${company_name}%`);
    }
    if (title) {
      whereClauses.push(`j.title ILIKE $${idx++}`);
      values.push(`%${title}%`);
    }
    if (location) {
      whereClauses.push(`(j.location ILIKE $${idx} OR j.locations::text ILIKE $${idx})`);
      values.push(`%${location}%`);
      idx++;
    }
    if (status && status !== 'All') {
      whereClauses.push(`j.status = $${idx++}`);
      values.push(status);
    } else if (!status) {
      whereClauses.push(`j.status = 'ACTIVE'`);
    }
    if (typeof is_published === 'boolean') {
      whereClauses.push(`j.is_published = $${idx++}`);
      values.push(is_published);
    }
    if (search) {
      whereClauses.push(`(j.title ILIKE $${idx} OR j.company_name ILIKE $${idx} OR j.location ILIKE $${idx} OR j.skills::text ILIKE $${idx})`);
      values.push(`%${search}%`);
      idx++;
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const countRes = await pool.query(`SELECT COUNT(*)::int AS total FROM scraped_jobs j ${whereStr}`, values);
    const totalCount = countRes.rows[0]?.total || 0;

    const query = `
      SELECT j.*, c.website AS company_website, c.contact_email AS company_email
      FROM scraped_jobs j
      LEFT JOIN scraped_companies c ON j.company_id = c.id
      ${whereStr}
      ORDER BY j.last_verified_at DESC
      LIMIT $${idx++} OFFSET $${idx}
    `;
    const queryValues = [...values, limit, offset];

    const { rows } = await pool.query(query, queryValues);
    return { jobs: rows, totalCount };
  },

  async toggleJobPublish(id, isPublished) {
    const res = await pool.query(
      `UPDATE scraped_jobs 
       SET is_published = $1, status = CASE WHEN $1 = true THEN 'ACTIVE' ELSE 'UNPUBLISHED' END, updated_at = now() 
       WHERE id = $2 RETURNING *`,
      [isPublished, id]
    );
    return res.rows[0];
  },

  // Scan runs
  async createScanRun(scanData) {
    const {
      company_id,
      company_name,
      status,
      coverage = 'UNKNOWN',
      extraction_method = 'API',
      jobs_found = 0,
      reported_job_count = null,
      pages_visited = 0,
      filters_explored = 0,
      duration_seconds = 0,
      failed_stage = '',
      http_status_summary = '',
      snapshot_data = null,
      incomplete_sections = [],
      pending_tasks = [],
      outcome_notes = '',
      retry_outcome = '',
    } = scanData;

    const res = await pool.query(
      `INSERT INTO scraper_scan_runs (
        company_id, company_name, status, coverage, extraction_method,
        jobs_found, reported_job_count, pages_visited, filters_explored,
        duration_seconds, failed_stage, http_status_summary, snapshot_data,
        incomplete_sections, pending_tasks, outcome_notes, retry_outcome
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
      ) RETURNING *`,
      [
        company_id, company_name, status, coverage, extraction_method,
        jobs_found, reported_job_count, pages_visited, filters_explored,
        duration_seconds, failed_stage, http_status_summary,
        snapshot_data ? JSON.stringify(snapshot_data) : null,
        JSON.stringify(incomplete_sections), JSON.stringify(pending_tasks),
        outcome_notes, retry_outcome
      ]
    );
    return res.rows[0];
  },

  async getScanRuns(companyId = null, limit = 50) {
    let query = 'SELECT * FROM scraper_scan_runs';
    let params = [];
    if (companyId) {
      query += ' WHERE company_id = $1';
      params.push(companyId);
    }
    query += ' ORDER BY created_at DESC LIMIT ' + (params.length ? '$2' : '$1');
    params.push(limit);

    const { rows } = await pool.query(query, params);
    return rows;
  },

  async getScanRunById(id) {
    const res = await pool.query('SELECT * FROM scraper_scan_runs WHERE id = $1', [id]);
    return res.rows[0] || null;
  },

  async updateScanRun(id, fields = {}) {
    const keys = Object.keys(fields);
    if (keys.length === 0) return null;
    const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const values = [id, ...keys.map(k => typeof fields[k] === 'object' ? JSON.stringify(fields[k]) : fields[k])];
    const res = await pool.query(
      `UPDATE scraper_scan_runs SET ${setClause} WHERE id = $1 RETURNING *`,
      values
    );
    return res.rows[0];
  }
};
