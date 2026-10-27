import { ScraperModel } from '../../models/scraperModel.js';
import { ComplianceService } from './complianceService.js';
import { DiscoveryService } from './discoveryService.js';
import { ATSAdapters } from './adapters.js';

export const ScraperEngine = {
  /**
   * Run complete scan for a single company
   */
  async scanCompany(companyId, options = {}) {
    const startTime = Date.now();
    const company = await ScraperModel.getCompanyById(companyId);
    if (!company) {
      throw new Error(`Company with ID ${companyId} not found`);
    }

    // Stage 1: Compliance Check
    if (company.access_status === 'BLOCKED_BY_OWNER' || company.access_status === 'RESTRICTED') {
      const scanRun = await ScraperModel.createScanRun({
        company_id: company.id,
        company_name: company.name,
        status: 'ACCESS_RESTRICTED',
        coverage: 'UNKNOWN',
        extraction_method: '-',
        jobs_found: 0,
        duration_seconds: 0.1,
        failed_stage: 'Compliance',
        http_status_summary: 'Access restricted by owner or policy',
        outcome_notes: 'Scanning blocked by owner/policy. No bypass attempted.',
        retry_outcome: 'No retry. Scanning blocked by owner.',
      });
      return { status: 'ACCESS_RESTRICTED', scanRun, jobsExtracted: 0 };
    }

    let careerUrl = company.career_url;
    let website = company.website;
    let atsProvider = company.ats_provider || 'Detecting...';
    let contactEmail = company.contact_email;
    let memory = company.structure_memory || {};

    let pagesVisited = 1;
    let filtersExplored = 0;
    let incompleteSections = [];
    let pendingTasks = [];
    let failedStage = '';
    let httpStatus = '200 OK';
    let extractionMethod = memory.s || 'Auto-detect';

    try {
      // Stage 2: Discovery if career_url or website missing
      if (!careerUrl || !website || atsProvider === 'Detecting...') {
        const queryTarget = website || `${company.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
        const discovery = await DiscoveryService.findCareerPage(queryTarget);
        if (discovery && discovery.careerUrl) {
          careerUrl = discovery.careerUrl;
          if (!website) website = DiscoveryService.normalizeWebsite(careerUrl);
          atsProvider = discovery.ats;

          // Extract public contact email from discovered HTML if not already known
          if (!contactEmail && discovery.html) {
            contactEmail = DiscoveryService.extractContactEmail(discovery.html);
          }

          await ScraperModel.updateCompany(company.id, {
            website,
            career_url: careerUrl,
            ats_provider: atsProvider,
            contact_email: contactEmail || company.contact_email,
            verification_status: 'Verified',
          });
        }
      }

      // Stage 3: Robots.txt verification
      const pathAllowed = await ComplianceService.isPathAllowed(careerUrl || website);
      if (!pathAllowed) {
        const scanRun = await ScraperModel.createScanRun({
          company_id: company.id,
          company_name: company.name,
          status: 'ACCESS_RESTRICTED',
          coverage: 'UNKNOWN',
          extraction_method: '-',
          jobs_found: 0,
          duration_seconds: (Date.now() - startTime) / 1000,
          failed_stage: 'Compliance',
          http_status_summary: 'robots.txt Disallow',
          outcome_notes: 'Target path disallows bot crawling. Honored robots.txt.',
          retry_outcome: 'No retry. Complied with robots.txt.',
        });
        return { status: 'ACCESS_RESTRICTED', scanRun, jobsExtracted: 0 };
      }

      // Stage 4: Extraction based on ATS or Memory
      let extractedResult = { jobs: [], reportedCount: null, extractionMethod: 'HTML', strategyMemory: null };

      const atsLower = atsProvider.toLowerCase();
      const atsToken = DiscoveryService.detectAts('', careerUrl).token || company.name.toLowerCase().replace(/[^a-z0-9]/g, '');

      if (atsLower.includes('greenhouse')) {
        extractedResult = await ATSAdapters.extractGreenhouse(atsToken, company.name);
      } else if (atsLower.includes('lever')) {
        extractedResult = await ATSAdapters.extractLever(atsToken, company.name);
      } else if (atsLower.includes('ashby')) {
        extractedResult = await ATSAdapters.extractAshby(atsToken, company.name);
      } else {
        // Smart ATS Probe: Check Greenhouse and Lever before falling back to generic HTML
        let probed = false;
        try {
          const ghRes = await ATSAdapters.extractGreenhouse(atsToken, company.name);
          if (ghRes.jobs && ghRes.jobs.length > 0) {
            extractedResult = ghRes;
            atsProvider = 'Greenhouse';
            probed = true;
            await ScraperModel.updateCompany(company.id, { ats_provider: 'Greenhouse' });
          }
        } catch {}

        if (!probed) {
          try {
            const leverRes = await ATSAdapters.extractLever(atsToken, company.name);
            if (leverRes.jobs && leverRes.jobs.length > 0) {
              extractedResult = leverRes;
              atsProvider = 'Lever';
              probed = true;
              await ScraperModel.updateCompany(company.id, { ats_provider: 'Lever' });
            }
          } catch {}
        }

        if (!probed) {
          // Generic Website extraction (JSON-LD -> HTML)
          extractedResult = await ATSAdapters.extractGeneric(careerUrl || website, company.name);
        }
      }

      // Fallback clean email if none found
      if (!contactEmail && website) {
        try {
          const host = new URL(website.startsWith('http') ? website : `https://${website}`).hostname.replace(/^www\./, '');
          contactEmail = `careers@${host}`;
          await ScraperModel.updateCompany(company.id, { contact_email: contactEmail });
        } catch {}
      }

      const jobs = extractedResult.jobs || [];
      const reportedCount = extractedResult.reportedCount;
      extractionMethod = extractedResult.extractionMethod;

      // Stage 5: Zero-Job Safety (Requirement 3)
      // If a previously active career page suddenly returns zero jobs, verify before marking NO_OPENINGS
      let scanStatus = 'PASS';
      let coverage = 'COMPLETE';

      if (jobs.length === 0) {
        if (reportedCount === 0) {
          scanStatus = 'NO_OPENINGS';
          coverage = 'COMPLETE';
        } else {
          // Zero jobs but site normally has jobs or selector didn't find cards -> mark INCOMPLETE
          scanStatus = 'INCOMPLETE';
          failedStage = 'Extract';
          coverage = 'UNKNOWN';
          incompleteSections.push('Zero jobs returned, selector revalidation needed');
          pendingTasks.push('Revalidate HTML structure & selectors');
        }
      }

      // Stage 6: Partial Scan Recovery & DB Storage (Requirement 4)
      // Save all valid jobs extracted before any failure occurs
      let savedCount = 0;
      const foundIds = [];

      for (const job of jobs) {
        try {
          const res = await ScraperModel.upsertJob({
            ...job,
            company_id: company.id,
            company_name: company.name,
            contact_email: contactEmail || company.contact_email,
            ats_provider: atsProvider,
            extraction_method: extractionMethod,
          });
          if (res) {
            savedCount++;
            foundIds.push(job.external_job_id || job.original_job_url);
          }
        } catch (e) {
          console.error(`Error saving job for ${company.name}:`, e.message);
        }
      }

      // Stage 7: Expiry protection (Requirement 3 & 11)
      // Only complete scans can count towards job absence!
      const isComplete = scanStatus === 'PASS' && coverage === 'COMPLETE';
      await ScraperModel.processMissingJobs(company.id, foundIds, isComplete);

      // Save website structure memory on successful scan (Requirement 2)
      if (scanStatus === 'PASS' && extractedResult.strategyMemory) {
        await ScraperModel.updateStructureMemory(company.id, extractedResult.strategyMemory);
      }

      // Update company timestamp
      await ScraperModel.updateCompany(company.id, {
        last_scanned_at: new Date().toISOString(),
      });

      const duration = Number(((Date.now() - startTime) / 1000).toFixed(1));

      // Stage 8: Create Extraction Coverage Report (Requirement 1)
      const scanRun = await ScraperModel.createScanRun({
        company_id: company.id,
        company_name: company.name,
        status: scanStatus,
        coverage: coverage,
        extraction_method: extractionMethod,
        jobs_found: savedCount,
        reported_job_count: reportedCount,
        pages_visited: pagesVisited,
        filters_explored: filtersExplored,
        duration_seconds: duration,
        failed_stage: failedStage,
        http_status_summary: httpStatus,
        snapshot_data: { sampleJobs: jobs.slice(0, 3), totalExtracted: jobs.length },
        incomplete_sections: incompleteSections,
        pending_tasks: pendingTasks,
        outcome_notes: scanStatus === 'PASS'
          ? `Successfully scanned ${savedCount} jobs using ${extractionMethod}.`
          : `Scan ended with status ${scanStatus}. Saved ${savedCount} valid jobs.`,
        retry_outcome: pendingTasks.length > 0 ? 'Retry queued for pending tasks' : 'Not needed',
      });

      return {
        status: scanStatus,
        scanRun,
        jobsExtracted: savedCount,
        coverage,
      };

    } catch (error) {
      const duration = Number(((Date.now() - startTime) / 1000).toFixed(1));
      console.error(`Scrape failure for ${company.name}:`, error.message);

      const is403OrBlocked = error.message.includes('403') || error.message.toLowerCase().includes('blocked');
      const finalStatus = is403OrBlocked ? 'ACCESS_RESTRICTED' : 'SOURCE_ERROR';
      const outcomeNotes = is403OrBlocked
        ? 'Target site blocks bot requests (HTTP 403 / Bot Shield). Obeying Rule 7: no illegal circumvention/CAPTCHA bypass attempted. Marked for review.'
        : `Scan failed at ${failedStage || 'Fetch'}: ${error.message}`;

      if (is403OrBlocked) {
        await ScraperModel.updateCompany(company.id, {
          access_status: 'RESTRICTED',
          verification_status: 'Needs review',
        });
      }

      const scanRun = await ScraperModel.createScanRun({
        company_id: company.id,
        company_name: company.name,
        status: finalStatus,
        coverage: 'UNKNOWN',
        extraction_method: extractionMethod,
        jobs_found: 0,
        pages_visited: pagesVisited,
        duration_seconds: duration,
        failed_stage: failedStage || 'Fetch',
        http_status_summary: error.message,
        incomplete_sections: [is403OrBlocked ? 'Bot shield active (HTTP 403)' : 'Network / parse error'],
        pending_tasks: is403OrBlocked ? ['Manual admin review required'] : ['Retry full scan with backoff'],
        outcome_notes: outcomeNotes,
        retry_outcome: is403OrBlocked ? 'No automated retry. Blocked by target domain.' : 'Automatic retry recommended with exponential backoff',
      });

      return {
        status: finalStatus,
        error: error.message,
        scanRun,
        jobsExtracted: 0,
      };
    }
  },

  /**
   * Run scans for all allowed companies
   */
  async scanAllAllowed() {
    const companies = await ScraperModel.getAllCompanies();
    const allowed = companies.filter(c => c.access_status === 'ALLOWED' || c.access_status === 'ALLOWED_API_ONLY');
    const results = [];

    for (const comp of allowed) {
      try {
        const res = await this.scanCompany(comp.id);
        results.push({ company: comp.name, ...res });
      } catch (err) {
        results.push({ company: comp.name, status: 'ERROR', error: err.message });
      }
    }
    return results;
  }
};
