import * as cheerio from 'cheerio';
import { ComplianceService } from './complianceService.js';

export const ATSAdapters = {
  /**
   * Adapter: Greenhouse (Public API)
   */
  async extractGreenhouse(boardToken, companyName) {
    const apiUrl = `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs?content=true`;
    const res = await ComplianceService.safeFetch(apiUrl, { timeout: 10000 });
    if (!res.ok) {
      throw new Error(`Greenhouse API responded with status ${res.status}`);
    }
    const data = await res.json();
    const jobsList = data.jobs || [];

    return {
      extractionMethod: 'API',
      reportedCount: jobsList.length,
      jobs: jobsList.map(j => ({
        external_job_id: String(j.id),
        title: j.title || 'Untitled Role',
        location: j.location?.name || 'Remote',
        locations: j.location?.name ? [j.location.name] : ['Remote'],
        work_mode: (j.location?.name || '').toLowerCase().includes('remote') ? 'Remote' : 'On-site',
        employment_type: 'Full-time',
        department: j.departments?.[0]?.name || 'General',
        experience: '',
        salary: '',
        skills: [],
        description: j.content || '',
        original_job_url: j.absolute_url,
        apply_url: j.absolute_url,
        ats_provider: 'Greenhouse',
        confidence_score: 96,
      })),
      strategyMemory: {
        s: 'Public API',
        pg: 'None (Full collection)',
        fl: 'None (All jobs view)',
        ep: `/v1/boards/${boardToken}/jobs`,
        v: '1.4.0',
        chk: new Date().toISOString(),
      }
    };
  },

  /**
   * Adapter: Lever (Public API)
   */
  async extractLever(siteToken, companyName) {
    const apiUrl = `https://api.lever.co/v0/postings/${siteToken}?mode=json`;
    const res = await ComplianceService.safeFetch(apiUrl, { timeout: 10000 });
    if (!res.ok) {
      throw new Error(`Lever API responded with status ${res.status}`);
    }
    const list = await res.json();
    if (!Array.isArray(list)) {
      throw new Error('Invalid Lever API response');
    }

    return {
      extractionMethod: 'API',
      reportedCount: list.length,
      jobs: list.map(j => ({
        external_job_id: String(j.id),
        title: j.text || 'Untitled Role',
        location: j.categories?.location || 'Remote',
        locations: j.categories?.location ? [j.categories.location] : ['Remote'],
        work_mode: (j.categories?.commitment || '').toLowerCase().includes('remote') || (j.categories?.location || '').toLowerCase().includes('remote') ? 'Remote' : 'On-site',
        employment_type: j.categories?.commitment || 'Full-time',
        department: j.categories?.team || j.categories?.department || 'General',
        experience: '',
        salary: '',
        skills: [],
        description: j.descriptionPlain || '',
        original_job_url: j.hostedUrl,
        apply_url: j.applyUrl || j.hostedUrl,
        ats_provider: 'Lever',
        confidence_score: 95,
      })),
      strategyMemory: {
        s: 'Public API',
        pg: 'None',
        fl: 'None',
        ep: `/v0/postings/${siteToken}`,
        v: '1.2.0',
        chk: new Date().toISOString(),
      }
    };
  },

  /**
   * Adapter: Ashby (Public Posting API)
   */
  async extractAshby(siteToken, companyName) {
    const apiUrl = 'https://jobs.ashbyhq.com/api/non-user-graphql?op=ApiJobBoardWithTeams';
    const body = {
      operationName: 'ApiJobBoardWithTeams',
      variables: { organizationHostedJobsPageName: siteToken },
      query: `query ApiJobBoardWithTeams($organizationHostedJobsPageName: String!) {
        jobBoard: jobBoardWithTeams(organizationHostedJobsPageName: $organizationHostedJobsPageName) {
          jobPostings {
            id
            title
            locationName
            departmentName
            employmentType
            isRemote
          }
        }
      }`
    };

    const res = await ComplianceService.safeFetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      timeout: 10000,
    });

    if (!res.ok) {
      throw new Error(`Ashby API responded with status ${res.status}`);
    }
    const json = await res.json();
    const postings = json.data?.jobBoard?.jobPostings || [];

    return {
      extractionMethod: 'API',
      reportedCount: postings.length,
      jobs: postings.map(j => ({
        external_job_id: String(j.id),
        title: j.title || 'Untitled Role',
        location: j.locationName || (j.isRemote ? 'Remote' : 'On-site'),
        locations: [j.locationName || 'Remote'],
        work_mode: j.isRemote ? 'Remote' : 'On-site',
        employment_type: j.employmentType || 'Full-time',
        department: j.departmentName || 'General',
        experience: '',
        salary: '',
        skills: [],
        description: '',
        original_job_url: `https://jobs.ashbyhq.com/${siteToken}/${j.id}`,
        apply_url: `https://jobs.ashbyhq.com/${siteToken}/${j.id}/application`,
        ats_provider: 'Ashby',
        confidence_score: 94,
      })),
      strategyMemory: {
        s: 'Public API (GraphQL)',
        pg: 'None',
        fl: 'None',
        ep: `/posting-api/job-board/${siteToken}`,
        v: '1.3.0',
        chk: new Date().toISOString(),
      }
    };
  },

  /**
   * Adapter: Generic HTML & Schema.org JSON-LD parser
   */
  async extractGeneric(url, companyName) {
    const res = await ComplianceService.safeFetch(url, { timeout: 12000 });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} when fetching career page ${url}`);
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const jobs = [];

    // Layer 1: Schema.org JSON-LD JobPosting
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const parsed = JSON.parse($(el).html());
        const items = Array.isArray(parsed) ? parsed : [parsed];
        for (const item of items) {
          if (item['@type'] === 'JobPosting') {
            jobs.push({
              external_job_id: String(item.identifier?.value || item.identifier || Math.random().toString(36).substring(7)),
              title: item.title || item.name || 'Open Position',
              location: item.jobLocation?.address?.addressLocality || 'Multiple Locations',
              locations: [item.jobLocation?.address?.addressLocality || 'Multiple Locations'],
              work_mode: item.jobLocationType === 'TELECOMMUTE' ? 'Remote' : 'On-site',
              employment_type: item.employmentType || 'Full-time',
              department: item.occupationalCategory || 'General',
              experience: item.experienceRequirements || '',
              salary: item.baseSalary?.value?.value ? `${item.baseSalary.currency || ''} ${item.baseSalary.value.value}` : '',
              skills: [],
              description: item.description || '',
              original_job_url: item.url || url,
              apply_url: item.url || url,
              ats_provider: 'Schema.org JSON-LD',
              confidence_score: 90,
            });
          }
        }
      } catch {}
    });

    if (jobs.length > 0) {
      return {
        extractionMethod: 'JSON-LD',
        reportedCount: jobs.length,
        jobs,
        strategyMemory: {
          s: 'Schema.org JSON-LD',
          pg: 'None',
          fl: 'None',
          ep: 'script[type="application/ld+json"]',
          v: '1.0.0',
          chk: new Date().toISOString(),
        }
      };
    }

    // Layer 2: Static HTML card/link parser
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      // Look for job links
      if (href && /\/(job|career|position|opening|vacancy)\b/i.test(href) && text.length > 3 && text.length < 80) {
        const fullJobUrl = new URL(href, url).href;
        jobs.push({
          external_job_id: fullJobUrl,
          title: text,
          location: 'See listing',
          locations: ['See listing'],
          work_mode: text.toLowerCase().includes('remote') ? 'Remote' : 'On-site',
          employment_type: 'Full-time',
          department: 'General',
          experience: '',
          salary: '',
          skills: [],
          description: '',
          original_job_url: fullJobUrl,
          apply_url: fullJobUrl,
          ats_provider: 'Custom HTML',
          confidence_score: 75,
        });
      }
    });

    // Deduplicate by URL
    const uniqueMap = new Map();
    for (const j of jobs) {
      if (!uniqueMap.has(j.original_job_url)) {
        uniqueMap.set(j.original_job_url, j);
      }
    }
    const finalJobs = Array.from(uniqueMap.values());

    return {
      extractionMethod: 'HTML',
      reportedCount: finalJobs.length,
      jobs: finalJobs,
      strategyMemory: {
        s: 'Static HTML',
        pg: 'Numbered / Direct links',
        fl: 'None',
        ep: 'a[href*="job"]',
        v: '1.0.0',
        chk: new Date().toISOString(),
      }
    };
  }
};
