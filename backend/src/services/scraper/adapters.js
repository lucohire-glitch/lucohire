import * as cheerio from 'cheerio';
import { ComplianceService } from './complianceService.js';

export const ATSAdapters = {
  /**
   * Adapter: Accenture Career Portal API (Elasticsearch)
   * Connects directly to Accenture's live career search portal for 10,000+ jobs
   */
  async extractAccentureElastic(careerUrl = '', companyName = 'Accenture', maxPages = 2, options = {}) {
    if (careerUrl && typeof careerUrl === 'object') {
      options = careerUrl;
      careerUrl = options.careerUrl || '';
    }
    let countrySite = 'in-en';
    let jobCountry = 'India';

    if (careerUrl && typeof careerUrl === 'string') {
      const match = careerUrl.match(/\/([a-z]{2}-[a-z]{2})\b/i);
      if (match) {
        countrySite = match[1].toLowerCase();
        if (countrySite.startsWith('in')) jobCountry = 'India';
        else if (countrySite.startsWith('us')) jobCountry = 'USA';
        else if (countrySite.startsWith('gb')) jobCountry = 'United Kingdom';
        else if (countrySite.startsWith('ca')) jobCountry = 'Canada';
        else if (countrySite.startsWith('au')) jobCountry = 'Australia';
      }
    }

    const keyword = (options.keyword || options.title || options.search || '').trim();
    const targetLocation = (options.location || '').trim().toLowerCase();

    const apiUrl = 'https://www.accenture.com/api/accenture/elastic/findjobs';
    const limit = 50;
    const allJobs = [];
    let totalReported = 10000;

    for (let p = 0; p < maxPages; p++) {
      try {
        const form = new FormData();
        form.append('startIndex', String(p * limit));
        form.append('maxResultSize', String(limit));
        form.append('jobKeyword', keyword);
        form.append('jobCountry', jobCountry);
        form.append('jobLanguage', 'en');
        form.append('countrySite', countrySite);
        form.append('sortBy', '1'); // 1 = Newest
        form.append('searchType', 'vectorSearch');
        form.append('enableQueryBoost', 'true');
        form.append('minScore', '0.6');
        form.append('getFeedbackJudgmentEnabled', 'true');
        form.append('useCleanEmbedding', 'true');
        form.append('score', 'true');
        form.append('totalHits', 'true');
        form.append('debugQuery', 'false');
        form.append('jobFilters', '[]');

        const res = await ComplianceService.safeFetch(apiUrl, {
          method: 'POST',
          body: form,
          timeout: 10000,
        });

        if (!res.ok) break;
        const data = await res.json();
        if (data.totalHits?.total) {
          totalReported = data.totalHits.total;
        }

        const items = data.data || [];
        if (items.length === 0) break;

        for (const item of items) {
          const loc = item.feedCity || item.location?.[0] || 'Multiple Locations';
          // If location filter provided, match location
          if (targetLocation && !loc.toLowerCase().includes(targetLocation) && !JSON.stringify(item.location || []).toLowerCase().includes(targetLocation)) {
            continue;
          }

          const title = item.title || 'Custom Software Engineer';
          const guid = item.guid || Math.random().toString(36).substring(7);
          const fullJobUrl = `https://www.accenture.com/${countrySite}/careers/jobdetails?id=${guid}`;
          const isRemote = (item.remoteType || '').toLowerCase().includes('remote') ||
                           title.toLowerCase().includes('remote');

          allJobs.push({
            external_job_id: guid,
            title,
            location: loc,
            locations: item.location || [loc],
            work_mode: isRemote ? 'Remote' : 'On-site',
            employment_type: 'Full-time',
            department: item.orgUnitLevel2 || item.areaOfInterest?.[0] || 'Technology',
            experience: item.yearsOfExperience || '',
            salary: '',
            skills: item.mustHaveSkills || [],
            description: item.jobDescription || item.jobOverview || '',
            original_job_url: fullJobUrl,
            apply_url: fullJobUrl,
            ats_provider: 'Accenture Careers',
            confidence_score: 99,
          });
        }
      } catch (err) {
        console.error('Accenture Elastic API page fetch error:', err.message);
        break;
      }
    }

    if (allJobs.length === 0) {
      throw new Error('Accenture Elastic API returned 0 postings');
    }

    return {
      extractionMethod: 'Accenture Career API',
      reportedCount: totalReported,
      jobs: allJobs,
      strategyMemory: {
        s: 'Accenture Elasticsearch API',
        ep: apiUrl,
        countrySite,
        totalFound: totalReported,
        v: '1.0.0',
        chk: new Date().toISOString(),
      }
    };
  },

  /**
   * Adapter: Workday CXS (Public Universal API)
   * Used by Accenture, IBM, Adobe, Target, Walmart, Nvidia, HP, Dell, etc.
   */
  async extractWorkday(workdayUrl, companyName, maxPages = 5, options = {}) {
    if (!workdayUrl || !workdayUrl.includes('myworkdayjobs.com')) {
      throw new Error(`Invalid Workday URL: must be a *.myworkdayjobs.com domain, got: ${workdayUrl}`);
    }
    let cleanUrl = workdayUrl.replace(/["';,].*$/, '').replace(/\/userHome.*$/, '');
    let host = '';
    let site = '';
    let tenant = '';

    try {
      const u = new URL(cleanUrl);
      host = u.hostname;
      if (!host.includes('myworkdayjobs.com')) {
        throw new Error(`Hostname ${host} is not a Workday domain`);
      }
      const parts = u.pathname.split('/').filter(Boolean);
      site = parts[0] || 'Careers';
      tenant = host.split('.')[0];
    } catch (e) {
      throw new Error(`Invalid Workday URL: ${workdayUrl} (${e.message})`);
    }

    const apiUrl = `https://${host}/wday/cxs/${tenant}/${site}/jobs`;
    const limit = 20;
    let offset = 0;
    let totalReported = null;
    const allJobs = [];
    const searchText = (options.keyword || options.title || options.search || options.location || '').trim();

    for (let p = 0; p < maxPages; p++) {
      try {
        const res = await ComplianceService.safeFetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            appliedFacets: {},
            limit,
            offset,
            searchText,
          }),
          timeout: 10000,
        });

        if (!res.ok) break;
        const data = await res.json();
        if (totalReported === null && typeof data.total === 'number') {
          totalReported = data.total;
        }

        const postings = data.jobPostings || [];
        if (postings.length === 0) break;

        for (const item of postings) {
          const reqId = item.bulletFields?.[0] || item.externalPath || Math.random().toString(36).substring(7);
          const location = item.locationsText || item.bulletFields?.[1] || 'Multiple Locations';
          const title = item.title || 'Untitled Role';
          const jobViewUrl = `https://${host}/en-US/${site}${item.externalPath}`;
          const applyUrl = `https://${host}/en-US/${site}${item.externalPath}/apply`;
          const isRemote = (title + ' ' + location).toLowerCase().includes('remote');

          allJobs.push({
            external_job_id: String(reqId),
            title,
            location,
            locations: [location],
            work_mode: isRemote ? 'Remote' : 'On-site',
            employment_type: item.timeType || 'Full-time',
            department: item.bulletFields?.[2] || 'General',
            experience: '',
            salary: '',
            skills: [],
            description: `Workday job requisition: ${reqId}. Posted: ${item.postedOn || 'Recent'}.`,
            original_job_url: jobViewUrl,
            apply_url: applyUrl,
            ats_provider: 'Workday',
            confidence_score: 98,
          });
        }

        offset += limit;
        if (totalReported && offset >= totalReported) break;
      } catch (err) {
        console.error('Workday page fetch error:', err.message);
        break;
      }
    }

    if (allJobs.length === 0) {
      throw new Error(`Workday API returned 0 postings from ${apiUrl}`);
    }

    return {
      extractionMethod: 'Workday API',
      reportedCount: totalReported || allJobs.length,
      jobs: allJobs,
      strategyMemory: {
        s: 'Workday CXS API',
        host,
        tenant,
        site,
        ep: apiUrl,
        total: totalReported || allJobs.length,
        v: '2.0.0',
        chk: new Date().toISOString(),
      }
    };
  },

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
      extractionMethod: 'API (Greenhouse)',
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
      extractionMethod: 'API (Lever)',
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
    const cleanToken = (siteToken || '')
      .replace(/^https?:\/\/jobs\.ashbyhq\.com\//i, '')
      .replace(/\/.*$/, '')
      .trim();
    const apiUrl = 'https://jobs.ashbyhq.com/api/non-user-graphql?op=ApiJobBoardWithTeams';
    const body = {
      operationName: 'ApiJobBoardWithTeams',
      variables: { organizationHostedJobsPageName: cleanToken },
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
      extractionMethod: 'API (Ashby GraphQL)',
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
        ep: `/posting-api/job-board/${siteToken}`,
        v: '1.3.0',
        chk: new Date().toISOString(),
      }
    };
  },

  /**
   * Adapter: SmartRecruiters (Public API)
   */
  async extractSmartRecruiters(token, companyName) {
    const apiUrl = `https://api.smartrecruiters.com/v1/companies/${token}/postings?limit=100`;
    const res = await ComplianceService.safeFetch(apiUrl, { timeout: 10000 });
    if (!res.ok) {
      throw new Error(`SmartRecruiters API responded with status ${res.status}`);
    }
    const data = await res.json();
    const postings = data.content || [];

    return {
      extractionMethod: 'API (SmartRecruiters)',
      reportedCount: data.totalFound || postings.length,
      jobs: postings.map(j => ({
        external_job_id: String(j.id),
        title: j.name || 'Untitled Role',
        location: j.location?.city ? `${j.location.city}, ${j.location.country || ''}` : 'Multiple Locations',
        locations: [j.location?.city || 'Multiple Locations'],
        work_mode: j.location?.remote ? 'Remote' : 'On-site',
        employment_type: j.typeOfEmployment?.label || 'Full-time',
        department: j.department?.label || 'General',
        experience: j.experienceLevel?.label || '',
        salary: '',
        skills: [],
        description: '',
        original_job_url: `https://jobs.smartrecruiters.com/${token}/${j.id}`,
        apply_url: `https://jobs.smartrecruiters.com/${token}/${j.id}`,
        ats_provider: 'SmartRecruiters',
        confidence_score: 96,
      })),
      strategyMemory: {
        s: 'SmartRecruiters API',
        ep: apiUrl,
        total: data.totalFound,
        v: '1.0.0',
        chk: new Date().toISOString(),
      }
    };
  },

  /**
   * Adapter: Workable (Public API)
   */
  async extractWorkable(token, companyName) {
    const apiUrl = `https://apply.workable.com/api/v3/accounts/${token}/jobs`;
    const res = await ComplianceService.safeFetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '' }),
      timeout: 10000,
    });
    if (!res.ok) {
      throw new Error(`Workable API responded with status ${res.status}`);
    }
    const data = await res.json();
    const results = data.results || [];

    return {
      extractionMethod: 'API (Workable)',
      reportedCount: data.total || results.length,
      jobs: results.map(j => ({
        external_job_id: String(j.shortcode || j.id),
        title: j.title || 'Untitled Role',
        location: j.city ? `${j.city}, ${j.country || ''}` : 'Multiple Locations',
        locations: [j.city || 'Multiple Locations'],
        work_mode: j.telecommuting ? 'Remote' : 'On-site',
        employment_type: j.employment_type || 'Full-time',
        department: j.department || 'General',
        experience: j.experience || '',
        salary: '',
        skills: [],
        description: '',
        original_job_url: `https://apply.workable.com/${token}/j/${j.shortcode || j.id}`,
        apply_url: `https://apply.workable.com/${token}/j/${j.shortcode || j.id}/apply`,
        ats_provider: 'Workable',
        confidence_score: 95,
      })),
      strategyMemory: {
        s: 'Workable API',
        ep: apiUrl,
        total: data.total,
        v: '1.0.0',
        chk: new Date().toISOString(),
      }
    };
  },

  /**
   * Adapter: XML Sitemaps Job Extractor
   * Discovers and parses high-volume enterprise jobs from XML sitemaps
   */
  async extractSitemapJobs(sitemapUrl, companyName, maxSample = 50) {
    const res = await ComplianceService.safeFetch(sitemapUrl, { timeout: 12000 });
    if (!res.ok) {
      throw new Error(`Sitemap request returned ${res.status}`);
    }
    const xml = await res.text();
    const locMatches = xml.match(/<loc>(https?:\/\/[^<]+)<\/loc>/gi) || [];
    const allUrls = locMatches.map(m => m.replace(/<\/?loc>/gi, '').trim());

    // Filter genuine job URLs
    const jobUrls = allUrls.filter(u =>
      /\/(job|career|position|opening|jobdetails|vacancy)\b/i.test(u) ||
      u.includes('jobdetails?id=')
    );

    const targetList = jobUrls.length > 0 ? jobUrls : allUrls;
    if (targetList.length === 0) {
      throw new Error(`No URLs found in sitemap ${sitemapUrl}`);
    }

    const sample = targetList.slice(0, maxSample);
    const jobs = [];

    for (const url of sample) {
      try {
        let title = '';
        let location = 'Multiple Locations';
        let extId = url;

        // Try extracting title from URL slug
        try {
          const u = new URL(url);
          if (u.searchParams.get('id')) {
            extId = u.searchParams.get('id');
          }
          const segments = u.pathname.split('/').filter(Boolean);
          const lastSeg = segments[segments.length - 1] || '';
          if (lastSeg && !lastSeg.includes('.html') && lastSeg.length > 3) {
            const cleanSlug = lastSeg.replace(/[-_]/g, ' ').replace(/\b(id|job|\d+)\b/gi, '').trim();
            if (cleanSlug.length > 3) {
              title = cleanSlug.charAt(0).toUpperCase() + cleanSlug.slice(1);
            }
          }
        } catch {}

        if (!title) {
          title = `${companyName} Open Position`;
        }

        jobs.push({
          external_job_id: extId,
          title,
          location,
          locations: [location],
          work_mode: url.toLowerCase().includes('remote') ? 'Remote' : 'On-site',
          employment_type: 'Full-time',
          department: 'General',
          experience: '',
          salary: '',
          skills: [],
          description: `Direct career posting from ${companyName}.`,
          original_job_url: url,
          apply_url: url,
          ats_provider: 'Sitemap XML',
          confidence_score: 90,
        });
      } catch {}
    }

    return {
      extractionMethod: 'Sitemap XML',
      reportedCount: targetList.length,
      jobs,
      strategyMemory: {
        s: 'Sitemap XML',
        sitemapUrl,
        totalFound: targetList.length,
        v: '1.0.0',
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
              confidence_score: 92,
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
          ep: 'script[type="application/ld+json"]',
          v: '1.0.0',
          chk: new Date().toISOString(),
        }
      };
    }

    // Layer 2: Static HTML card/link parser with strict anti-false-positive filters
    const ignoredLinkTexts = [
      'careers', 'jobs', 'all jobs', 'search jobs', 'view all', 'view jobs', 'apply now',
      'learn more', 'read more', 'back', 'next', 'previous', 'privacy policy', 'terms',
      'contact us', 'about us', 'cookie settings', 'login', 'sign in'
    ];

    $('a').each((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim().replace(/\s+/g, ' ');
      const textLower = text.toLowerCase();

      // Ensure text is not generic navigation
      if (!href || text.length < 4 || text.length > 80 || ignoredLinkTexts.includes(textLower)) {
        return;
      }

      // Must have career/job indicators in href or parent
      const isJobLink = /\/(job|career|position|opening|vacancy)\b/i.test(href) ||
                        href.includes('jobdetails?id=') ||
                        $(el).closest('[class*="job"], [class*="career"], [class*="posting"]').length > 0;

      if (isJobLink) {
        try {
          const fullJobUrl = new URL(href, url).href;
          jobs.push({
            external_job_id: fullJobUrl,
            title: text,
            location: 'See listing',
            locations: ['See listing'],
            work_mode: textLower.includes('remote') ? 'Remote' : 'On-site',
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
        } catch {}
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
        ep: 'a[href*="job"]',
        v: '1.0.0',
        chk: new Date().toISOString(),
      }
    };
  }
};
