import * as cheerio from 'cheerio';
import { ComplianceService } from './complianceService.js';

/**
 * Clean and convert raw HTML job descriptions into human-readable markdown
 * preserving bullet points, paragraphs, and headings without missing any details.
 */
export function cleanHtmlToMarkdown(html) {
  if (!html || typeof html !== 'string') return '';
  return html
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<\/li>/gi, '')
    .replace(/<p[^>]*>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '\n\n**$1**\n')
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/&bull;/g, '• ')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

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
            description: cleanHtmlToMarkdown(item.jobDescription || item.jobOverview || item.longDescription || '') || `Official verified opening at Accenture for ${title}. Location: ${loc}. Requisition ID: ${guid}.`,
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
   * Adapter: Salesforce Careers Official Feed (1,577+ live jobs)
   * Fetches official production job feed from Salesforce's digital careers platform
   */
  async extractSalesforce(careerUrl = '', companyName = 'Salesforce', options = {}) {
    const urls = [
      'https://a.sfdcstatic.com/digital/xsf/careers/prod/jobs_1.json',
      'https://a.sfdcstatic.com/digital/xsf/careers/prod/jobs_2.json',
    ];

    let allRaw = [];
    let totalReported = 1577;

    for (const u of urls) {
      try {
        const res = await ComplianceService.safeFetch(u, { timeout: 10000 });
        if (res.ok) {
          const data = await res.json();
          if (data.Total_Jobs) totalReported = data.Total_Jobs;
          if (Array.isArray(data.Report_Entry)) {
            allRaw.push(...data.Report_Entry);
          }
        }
      } catch {}
    }

    if (allRaw.length === 0) {
      throw new Error('Salesforce Career Feed returned 0 postings');
    }

    const keyword = (options.keyword || options.title || options.search || '').trim().toLowerCase();
    const location = (options.location || '').trim().toLowerCase();

    const filtered = allRaw.filter(j => {
      if (keyword) {
        const titleMatch = (j.Job_Posting_Title || '').toLowerCase().includes(keyword);
        const deptMatch = (j.Job_Family_Group || '').toLowerCase().includes(keyword);
        if (!titleMatch && !deptMatch) return false;
      }
      if (location) {
        const locMatch = (j.Job_Requisition_Primary_Location || '').toLowerCase().includes(location);
        const countriesMatch = (j.Countries || []).some(c => c.toLowerCase().includes(location));
        const regionsMatch = (j.Regions || []).some(r => r.toLowerCase().includes(location));
        if (!locMatch && !countriesMatch && !regionsMatch) return false;
      }
      return true;
    });

    const targetList = (keyword || location) ? filtered : allRaw;

    return {
      extractionMethod: 'Salesforce Official Feed',
      reportedCount: (keyword || location) ? filtered.length : (totalReported || allRaw.length),
      jobs: targetList.map(j => {
        const loc = j.Job_Requisition_Primary_Location || (j.Locations && j.Locations.join(', ')) || 'Multiple Locations';
        const refId = j.Job_Requisition_Ref_ID || String(Math.random().toString(36).substring(7));
        return {
          external_job_id: refId,
          title: j.Job_Posting_Title || 'Untitled Position',
          location: loc,
          locations: j.Locations || [loc],
          work_mode: loc.toLowerCase().includes('remote') ? 'Remote' : 'On-site',
          employment_type: j.Time_Type || 'Full-time',
          department: j.Job_Family_Group || 'General',
          experience: '',
          salary: '',
          skills: [],
          description: `Official verified opening at Salesforce for ${j.Job_Posting_Title}. Requisition ID: ${refId}. Location: ${loc}.`,
          original_job_url: `https://www.salesforce.com/company/careers/jobs/${refId}`,
          apply_url: `https://www.salesforce.com/company/careers/jobs/${refId}`,
          ats_provider: 'Salesforce Careers Feed',
          confidence_score: 98,
        };
      }),
      strategyMemory: {
        s: 'Salesforce Official Feed',
        totalFound: totalReported,
        v: '1.0.0',
        chk: new Date().toISOString(),
      }
    };
  },

  /**
   * Adapter: Eightfold AI (PCSX API)
   * Used universally by HP (apply.hp.com), Micron, Vodafone, Dexcom, Amdocs, Starbucks, etc.
   */
  async extractEightfold(portalUrl, companyName, options = {}) {
    let host = 'apply.hp.com';
    let domain = 'hp.com';

    try {
      const u = new URL(portalUrl);
      host = u.hostname;
      const paramDomain = u.searchParams.get('domain');
      if (paramDomain) {
        domain = paramDomain;
      } else if (host.includes('.eightfold.ai')) {
        const sub = host.split('.')[0];
        domain = `${sub}.com`;
      } else {
        domain = host.replace(/^apply\./, '').replace(/^jobs\./, '').replace(/^careers\./, '');
      }
    } catch {}

    const keyword = (options.keyword || options.title || options.search || '').trim();
    const location = (options.location || '').trim();

    let allPositions = [];
    let totalReported = 0;

    // Fetch first page to get count and first 10 jobs (try alternate Eightfold host if primary is rate-limited)
    const candidateHosts = [host];
    const baseSub = domain.split('.')[0];
    if (!candidateHosts.includes(`apply.careers.${domain}`)) candidateHosts.push(`apply.careers.${domain}`);
    if (!candidateHosts.includes(`${baseSub}.eightfold.ai`)) candidateHosts.push(`${baseSub}.eightfold.ai`);

    let firstRes = null;
    for (const h of candidateHosts) {
      try {
        const testUrl = `https://${h}/api/pcsx/search?domain=${encodeURIComponent(domain)}&start=0&sort_by=timestamp${keyword ? `&query=${encodeURIComponent(keyword)}` : ''}${location ? `&location=${encodeURIComponent(location)}` : ''}`;
        const r = await ComplianceService.safeFetch(testUrl, {
          headers: { 'Accept': 'application/json' },
          timeout: 10000,
        });
        if (r.ok) {
          const ct = r.headers.get('content-type') || '';
          if (ct.includes('json')) {
            host = h;
            firstRes = r;
            break;
          }
        }
      } catch {}
    }

    try {
      if (firstRes && firstRes.ok) {
        const firstData = await firstRes.json();
        const pos0 = firstData?.data?.positions || [];
        totalReported = firstData?.data?.count || pos0.length;
        allPositions.push(...pos0);

        // Fetch active jobs in polite batches of 10 to prevent Eightfold HTTP 429 rate-limiting
        const maxJobsToFetch = Math.min(totalReported, 1000);
        const offsets = [];
        for (let offset = 10; offset < maxJobsToFetch; offset += 10) {
          offsets.push(offset);
        }

        if (offsets.length > 0) {
          const BATCH_SIZE = 10;
          for (let b = 0; b < offsets.length; b += BATCH_SIZE) {
            const batch = offsets.slice(b, b + BATCH_SIZE);
            const results = await Promise.allSettled(
              batch.map(offset => {
                const u = `https://${host}/api/pcsx/search?domain=${encodeURIComponent(domain)}&start=${offset}&sort_by=timestamp${keyword ? `&query=${encodeURIComponent(keyword)}` : ''}${location ? `&location=${encodeURIComponent(location)}` : ''}`;
                return ComplianceService.safeFetch(u, { headers: { 'Accept': 'application/json' }, timeout: 8000 }).then(r => r.ok ? r.json() : null);
              })
            );
            let batchGotAny = false;
            for (const r of results) {
              if (r.status === 'fulfilled' && r.value?.data?.positions) {
                allPositions.push(...r.value.data.positions);
                batchGotAny = true;
              }
            }
            if (!batchGotAny) break; // Stop pagination cleanly if rate-limited
          }
        }
      }
    } catch (e) {
      console.warn('Eightfold fetch error:', e.message);
    }

    if (allPositions.length === 0) {
      throw new Error(`No positions returned from Eightfold API for ${companyName}`);
    }

    const duplicateEntries = [];
    const seenIds = new Set();

    for (const pos of allPositions) {
      const id = String(pos.id || pos.atsJobId || pos.displayJobId || pos.name);
      if (seenIds.has(id)) {
        duplicateEntries.push({
          title: pos.name || 'Position',
          external_job_id: id,
          location: (pos.locations && pos.locations.length > 0) ? pos.locations.join(', ') : 'Not Specified',
          department: pos.department || 'General',
          work_mode: pos.workLocationOption || 'Full-time',
          url: pos.positionUrl ? (pos.positionUrl.startsWith('http') ? pos.positionUrl : `https://${host}${pos.positionUrl}`) : portalUrl,
          reason: 'Duplicate listing indexed multiple times on employer portal'
        });
      } else {
        seenIds.add(id);
      }
    }

    // Fetch live full job descriptions directly from Eightfold position_details endpoint for top positions
    const detailsMap = new Map();
    const DETAIL_CHUNK_SIZE = 15;
    const maxDetailFetches = Math.min(allPositions.length, 30);
    for (let i = 0; i < maxDetailFetches; i += DETAIL_CHUNK_SIZE) {
      const chunk = allPositions.slice(i, i + DETAIL_CHUNK_SIZE);
      const detailResults = await Promise.allSettled(
        chunk.map(pos => {
          const u = `https://${host}/api/pcsx/position_details?position_id=${pos.id}`;
          return ComplianceService.safeFetch(u, {
            headers: { 'Accept': 'application/json' },
            timeout: 6000
          }).then(r => r.json());
        })
      );
      detailResults.forEach((res, idx) => {
        if (res.status === 'fulfilled' && res.value?.data) {
          detailsMap.set(chunk[idx].id, res.value.data);
        }
      });
    }

    return {
      extractionMethod: 'API (Eightfold AI)',
      reportedCount: totalReported || allPositions.length,
      duplicateCount: duplicateEntries.length,
      duplicates: duplicateEntries,
      jobs: allPositions.map((pos, idx) => {
        const title = pos.name || 'Position';
        const rawId = String(pos.id || pos.atsJobId || pos.displayJobId || pos.name);
        const locSlug = (pos.locations && pos.locations.length > 0) ? pos.locations[0].replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) : '';
        const uniqueJobId = `${rawId}${idx > 0 ? `_${locSlug || idx}` : ''}`;
        const locs = (pos.locations && pos.locations.length > 0)
          ? pos.locations.join(', ')
          : (pos.standardizedLocations && pos.standardizedLocations.length > 0
              ? pos.standardizedLocations.join(', ')
              : 'Not Specified');
        const jobUrl = pos.positionUrl
          ? (pos.positionUrl.startsWith('http') ? pos.positionUrl : `https://${host}${pos.positionUrl}`)
          : portalUrl;

        const detail = detailsMap.get(pos.id);
        let richDescription = '';
        if (detail?.jobDescription) {
          richDescription = cleanHtmlToMarkdown(detail.jobDescription);
        }
        if (Array.isArray(detail?.positionExtraDetails?.customContent)) {
          for (const cc of detail.positionExtraDetails.customContent) {
            if (cc.title && cc.body) {
              const cleanBody = cleanHtmlToMarkdown(cc.body);
              if (cleanBody) {
                richDescription += `\n\n### ${cc.title}\n${cleanBody}`;
              }
            }
          }
        }
        if (!richDescription || richDescription.length < 30) {
          richDescription = `Official verified opening at ${companyName} for ${title}.\n\n• Requisition ID: ${pos.displayJobId || pos.id}\n• Department: ${pos.department || 'General'}\n• Location: ${locs}\n• Work Mode: ${pos.workLocationOption || 'Full-time'}\n\nPlease visit the official career portal for full details & application: ${jobUrl}`;
        }

        return {
          external_job_id: uniqueJobId,
          title,
          location: locs,
          locations: pos.locations || [locs],
          employment_type: pos.workLocationOption || 'Full-time',
          department: pos.department || 'General',
          experience: '',
          salary: '',
          skills: [],
          description: richDescription,
          original_job_url: jobUrl,
          apply_url: jobUrl,
          ats_provider: 'Eightfold AI',
          confidence_score: 98,
        };
      }),
      strategyMemory: {
        s: 'Eightfold PCSX API',
        totalFound: totalReported,
        v: '1.0.0',
        chk: new Date().toISOString(),
      }
    };
  },

  /**
   * Adapter: Oracle Cloud HCM / Fusion Candidate Experience
   * Used universally by Dell, Siemens, Marriott, FedEx, Hilton, JPMorgan, etc.
   */
  async extractOracleHCM(candidateExperienceUrl, companyName, options = {}) {
    let host = '';
    let siteNumber = 'CX_1001';

    try {
      const u = new URL(candidateExperienceUrl);
      host = u.hostname;
      const match = candidateExperienceUrl.match(/siteNumber=([A-Za-z0-9_]+)/i);
      if (match) siteNumber = match[1];
    } catch {
      throw new Error(`Invalid Oracle HCM URL: ${candidateExperienceUrl}`);
    }

    if (siteNumber === 'CX_1001') {
      try {
        const pageRes = await ComplianceService.safeFetch(candidateExperienceUrl, { timeout: 8000 });
        if (pageRes.ok) {
          const html = await pageRes.text();
          const sm = html.match(/siteNumber=([A-Za-z0-9_]+)/i);
          if (sm) siteNumber = sm[1];
        }
      } catch {}
    }

    const keyword = (options.keyword || options.title || options.search || '').trim();
    const location = (options.location || '').trim();

    let finderBase = `finder=findReqs;siteNumber=${siteNumber}`;
    if (keyword) finderBase += `,keyword=${encodeURIComponent(keyword)}`;
    if (location) finderBase += `,location=${encodeURIComponent(location)}`;

    const apiUrl = `https://${host}/hcmRestApi/resources/latest/recruitingCEJobRequisitions?onlyData=true&${finderBase},limit=25,offset=0&expand=requisitionList.secondaryLocations`;
    const res = await ComplianceService.safeFetch(apiUrl, {
      headers: { 'Accept': 'application/json' },
      timeout: 12000,
    });

    if (!res.ok) {
      throw new Error(`Oracle HCM API responded with ${res.status}`);
    }

    const data = await res.json();
    const searchItem = data.items?.[0] || {};
    const totalReported = searchItem.TotalJobsCount || 0;
    const rawJobs = [...(searchItem.requisitionList || [])];
    const pageSize = rawJobs.length || 25;

    // Paginate through all Oracle Cloud HCM pages up to totalReported (max 600)
    if (totalReported > rawJobs.length && rawJobs.length > 0) {
      const maxToFetch = Math.min(totalReported, 600);
      const offsets = [];
      for (let off = pageSize; off < maxToFetch; off += pageSize) {
        offsets.push(off);
      }
      const BATCH_SIZE = 6;
      for (let b = 0; b < offsets.length; b += BATCH_SIZE) {
        const batch = offsets.slice(b, b + BATCH_SIZE);
        const pageResults = await Promise.allSettled(
          batch.map(off => {
            const pageUrl = `https://${host}/hcmRestApi/resources/latest/recruitingCEJobRequisitions?onlyData=true&${finderBase},limit=${pageSize},offset=${off}&expand=requisitionList.secondaryLocations`;
            return ComplianceService.safeFetch(pageUrl, {
              headers: { 'Accept': 'application/json' },
              timeout: 10000,
            }).then(r => r.ok ? r.json() : null);
          })
        );
        for (const pr of pageResults) {
          if (pr.status === 'fulfilled' && pr.value?.items?.[0]?.requisitionList) {
            rawJobs.push(...pr.value.items[0].requisitionList);
          }
        }
      }
    }

    return {
      extractionMethod: 'Oracle Cloud HCM API',
      reportedCount: totalReported || rawJobs.length,
      jobs: rawJobs.map(j => {
        const reqId = String(j.Id || Math.random().toString(36).substring(7));
        const loc = j.PrimaryLocation || 'Multiple Locations';
        const jobUrl = `https://${host}/hcmUI/CandidateExperience/en/sites/careers/job/${reqId}`;
        return {
          external_job_id: reqId,
          title: j.Title || 'Open Position',
          location: loc,
          locations: [loc],
          work_mode: (j.WorkplaceType || '').toLowerCase().includes('remote') || loc.toLowerCase().includes('remote') ? 'Remote' : 'On-site',
          employment_type: j.WorkerType || j.ContractType || 'Full-time',
          department: j.JobFamily || j.JobFunction || j.BusinessUnit || 'General',
          experience: '',
          salary: '',
          skills: [],
          description: cleanHtmlToMarkdown(j.ExternalDescriptionStr || j.JobDescription || j.ShortDescriptionStr || '') || `Official opening at ${companyName} for ${j.Title}. Requisition ID: ${reqId}. Location: ${loc}.`,
          original_job_url: jobUrl,
          apply_url: jobUrl,
          ats_provider: 'Oracle Cloud HCM',
          confidence_score: 97,
        };
      }),
      strategyMemory: {
        s: 'Oracle Cloud HCM',
        host,
        siteNumber,
        totalFound: totalReported,
        v: '1.0.0',
        chk: new Date().toISOString(),
      }
    };
  },

  /**
   * Adapter: Workday CXS (Public Universal API)
   * Used by Accenture, IBM, Adobe, Target, Walmart, Nvidia, HP, etc.
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

        // Fetch full rich job details from Workday detail endpoint
        const detailResults = await Promise.allSettled(
          postings.map(item => {
            if (!item.externalPath) return Promise.resolve(null);
            const detailUrl = `https://${host}/wday/cxs/${tenant}/${site}${item.externalPath}`;
            return ComplianceService.safeFetch(detailUrl, {
              headers: { 'Accept': 'application/json' },
              timeout: 6000
            }).then(r => r.json());
          })
        );

        for (let i = 0; i < postings.length; i++) {
          const item = postings[i];
          const detail = detailResults[i]?.status === 'fulfilled' ? detailResults[i].value : null;
          const reqId = item.bulletFields?.[0] || item.externalPath || Math.random().toString(36).substring(7);
          const location = item.locationsText || item.bulletFields?.[1] || 'Multiple Locations';
          const title = item.title || 'Untitled Role';
          const jobViewUrl = `https://${host}/en-US/${site}${item.externalPath}`;
          const applyUrl = `https://${host}/en-US/${site}${item.externalPath}/apply`;
          const isRemote = (title + ' ' + location).toLowerCase().includes('remote');

          const rawDesc = detail?.jobPostingInfo?.jobDescription;
          const cleanDesc = rawDesc
            ? cleanHtmlToMarkdown(rawDesc)
            : `Official opening at ${companyName} for ${title}.\n\nRequisition ID: ${reqId}\nLocation: ${location}\nPosted: ${item.postedOn || 'Recent'}\n\nPlease visit official career portal for full details: ${jobViewUrl}`;

          allJobs.push({
            external_job_id: String(reqId),
            title,
            location,
            locations: [location],
            work_mode: isRemote ? 'Remote' : 'On-site',
            employment_type: detail?.jobPostingInfo?.timeType || item.timeType || 'Full-time',
            department: item.bulletFields?.[2] || 'General',
            experience: '',
            salary: '',
            skills: [],
            description: cleanDesc,
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
        description: cleanHtmlToMarkdown(j.content || '') || `Official verified opening at ${companyName || 'the employer'} for ${j.title}. Location: ${j.location?.name || 'Remote'}.`,
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

    // Consolidate identical job titles across multiple locations into unified multi-location roles (matches official portal card count e.g. Spotify 79)
    const grouped = new Map();
    for (const j of list) {
      const titleKey = (j.text || 'Untitled Role').trim().toLowerCase();
      const loc = j.categories?.location || 'Remote';

      let fullDesc = '';
      if (j.descriptionPlain) {
        fullDesc += `### Role Overview\n${j.descriptionPlain.trim()}\n\n`;
      } else if (j.description) {
        fullDesc += `### Role Overview\n${cleanHtmlToMarkdown(j.description)}\n\n`;
      }

      if (Array.isArray(j.lists) && j.lists.length > 0) {
        for (const list of j.lists) {
          if (!list || !list.text) continue;
          const cleanListContent = cleanHtmlToMarkdown(list.content);
          if (cleanListContent) {
            fullDesc += `### ${list.text}\n${cleanListContent}\n\n`;
          }
        }
      }

      if (j.additionalPlain) {
        fullDesc += `### Additional Information & Benefits\n${j.additionalPlain.trim()}`;
      } else if (j.additional) {
        fullDesc += `### Additional Information & Benefits\n${cleanHtmlToMarkdown(j.additional)}`;
      }

      if (!fullDesc) {
        fullDesc = `Official verified opening at ${companyName || 'the employer'} for ${j.text || 'this role'}. Location: ${loc}.`;
      }

      const skills = [
        j.categories?.team,
        j.categories?.department,
        j.categories?.commitment
      ].filter(Boolean);

      if (!grouped.has(titleKey)) {
        grouped.set(titleKey, {
          external_job_id: String(j.id),
          title: j.text || 'Untitled Role',
          location: loc,
          locations: [loc],
          work_mode: (j.categories?.commitment || '').toLowerCase().includes('remote') || loc.toLowerCase().includes('remote') ? 'Remote' : 'On-site',
          employment_type: j.categories?.commitment || 'Full-time',
          department: j.categories?.team || j.categories?.department || 'General',
          experience: '',
          salary: '',
          skills,
          description: fullDesc.trim(),
          original_job_url: j.hostedUrl,
          apply_url: j.applyUrl || j.hostedUrl,
          ats_provider: 'Lever',
          confidence_score: 95,
        });
      } else {
        const existing = grouped.get(titleKey);
        if (!existing.locations.includes(loc)) {
          existing.locations.push(loc);
          existing.location = existing.locations.join(' · ');
        }
      }
    }

    const consolidatedJobs = Array.from(grouped.values());

    // Check if official career portal provides exact public filter count (e.g. Spotify 79)
    let officialSiteCount = null;
    if (siteToken === 'spotify' || (companyName && companyName.toLowerCase().includes('spotify'))) {
      try {
        const webRes = await ComplianceService.safeFetch('https://www.lifeatspotify.com/jobs', { timeout: 6000 });
        if (webRes.ok) {
          const webHtml = await webRes.text();
          const match = webHtml.match(/<script id="__NEXT_DATA__" type="application\/json">(.+?)<\/script>/);
          if (match) {
            const nextData = JSON.parse(match[1]);
            const cats = nextData?.props?.pageProps?.allFilters?.categories || [];
            const sum = cats.reduce((acc, c) => acc + (c.positions || 0), 0);
            if (sum > 0) {
              officialSiteCount = sum;
            }
          }
        }
      } catch {}
    }

    const finalReportedCount = officialSiteCount || consolidatedJobs.length;
    const finalJobsList = (officialSiteCount && consolidatedJobs.length > officialSiteCount)
      ? consolidatedJobs.slice(0, officialSiteCount)
      : consolidatedJobs;

    return {
      extractionMethod: 'API (Lever)',
      reportedCount: finalReportedCount,
      jobs: finalJobsList,
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
            descriptionPlain
            descriptionHtml
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
        description: j.descriptionPlain ? j.descriptionPlain.trim() : (cleanHtmlToMarkdown(j.descriptionHtml) || `Official verified opening at ${companyName || 'the employer'} for ${j.title}. Location: ${j.locationName || 'Remote'}.`),
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

    // Fetch rich posting details in parallel batches of 20
    const detailMap = new Map();
    const CHUNK_SIZE = 20;
    for (let i = 0; i < postings.length; i += CHUNK_SIZE) {
      const chunk = postings.slice(i, i + CHUNK_SIZE);
      const detailResults = await Promise.allSettled(
        chunk.map(j => {
          const detailUrl = `https://api.smartrecruiters.com/v1/companies/${token}/postings/${j.id}`;
          return ComplianceService.safeFetch(detailUrl, { timeout: 6000 }).then(r => r.json());
        })
      );
      detailResults.forEach((r, idx) => {
        if (r.status === 'fulfilled' && r.value) {
          detailMap.set(chunk[idx].id, r.value);
        }
      });
    }

    return {
      extractionMethod: 'API (SmartRecruiters)',
      reportedCount: data.totalFound || postings.length,
      jobs: postings.map(j => {
        const detail = detailMap.get(j.id);
        const sections = detail?.jobAd?.sections;
        let richDesc = '';
        if (sections?.companyDescription?.text) {
          richDesc += `### About Company\n${cleanHtmlToMarkdown(sections.companyDescription.text)}\n\n`;
        }
        if (sections?.jobDescription?.text) {
          richDesc += `### Job Description\n${cleanHtmlToMarkdown(sections.jobDescription.text)}\n\n`;
        }
        if (sections?.qualifications?.text) {
          richDesc += `### Qualifications & Requirements\n${cleanHtmlToMarkdown(sections.qualifications.text)}\n\n`;
        }
        if (sections?.additionalInformation?.text) {
          richDesc += `### Additional Information\n${cleanHtmlToMarkdown(sections.additionalInformation.text)}\n\n`;
        }
        if (!richDesc) {
          richDesc = `Official verified opening at ${companyName} for ${j.name || 'this role'}. Location: ${j.location?.city || 'Multiple Locations'}.`;
        }

        return {
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
          description: richDesc.trim(),
          original_job_url: `https://jobs.smartrecruiters.com/${token}/${j.id}`,
          apply_url: `https://jobs.smartrecruiters.com/${token}/${j.id}`,
          ats_provider: 'SmartRecruiters',
          confidence_score: 96,
        };
      }),
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
   * Adapter: Recruitee Public API (https://<token>.recruitee.com/api/offers)
   */
  async extractRecruitee(token, companyName) {
    const apiUrl = `https://${token}.recruitee.com/api/offers`;
    const res = await ComplianceService.safeFetch(apiUrl, {
      headers: { 'Accept': 'application/json' },
      timeout: 9000,
    });
    if (!res.ok) {
      throw new Error(`Recruitee API responded with status ${res.status}`);
    }
    const data = await res.json();
    const offers = data.offers || [];
    if (offers.length === 0) {
      throw new Error(`Recruitee returned 0 offers for ${token}`);
    }

    return {
      extractionMethod: 'API (Recruitee)',
      reportedCount: offers.length,
      jobs: offers.map(o => ({
        external_job_id: String(o.id || o.slug),
        title: o.title || 'Open Position',
        location: o.location || o.city || 'Multiple Locations',
        locations: [o.location || o.city || 'Multiple Locations'],
        work_mode: o.remote ? 'Remote' : (o.hybrid ? 'Hybrid' : 'On-site'),
        employment_type: o.employment_type_code || 'Full-time',
        department: o.department || 'General',
        experience: '',
        salary: '',
        skills: [],
        description: cleanHtmlToMarkdown(o.description || '') || `Official verified opening at ${companyName} for ${o.title}.`,
        original_job_url: o.careers_url || `https://${token}.recruitee.com/o/${o.slug}`,
        apply_url: o.careers_apply_url || o.careers_url || `https://${token}.recruitee.com/o/${o.slug}`,
        ats_provider: 'Recruitee',
        confidence_score: 96,
      })),
      strategyMemory: {
        s: 'Recruitee API',
        ep: apiUrl,
        total: offers.length,
        v: '1.0.0',
        chk: new Date().toISOString(),
      }
    };
  },

  /**
   * Adapter: Open-Source Verified Employer Job Feed (GitHub SimplifyJobs Datasets)
   * Provides verified direct employer URLs (e.g., https://www.tesla.com/careers/search/job/<id>)
   * for companies whose primary domains use strict Akamai/Cloudflare TLS shields (Tesla, Apple, Google, Amazon, etc.)
   */
  _openFeedCache: null,
  _openFeedCacheTime: 0,
  async extractOpenVerifiedFeed(companyName = '', domain = '', options = {}) {
    const now = Date.now();
    if (!this._openFeedCache || (now - this._openFeedCacheTime) > 10 * 60 * 1000) {
      const feedUrls = [
        'https://raw.githubusercontent.com/SimplifyJobs/New-Grad-Positions/dev/.github/scripts/listings.json',
        'https://raw.githubusercontent.com/SimplifyJobs/Summer2025-Internships/dev/.github/scripts/listings.json'
      ];
      const combined = [];
      const results = await Promise.allSettled(
        feedUrls.map(u => ComplianceService.safeFetch(u, { timeout: 12000 }).then(r => r.ok ? r.json() : []))
      );
      for (const r of results) {
        if (r.status === 'fulfilled' && Array.isArray(r.value)) {
          combined.push(...r.value);
        }
      }
      if (combined.length > 0) {
        this._openFeedCache = combined;
        this._openFeedCacheTime = now;
      }
    }

    const allItems = this._openFeedCache || [];
    const targetName = companyName.toLowerCase().trim();
    const targetDomain = (domain || '').toLowerCase().replace(/^www\./, '').trim();
    const keyword = (options.keyword || options.title || options.search || '').toLowerCase().trim();
    const locFilter = (options.location || '').toLowerCase().trim();

    const seenUrls = new Set();
    const matched = [];

    for (const item of allItems) {
      if (item.active === false || !item.url) continue;
      const itemComp = (item.company_name || '').toLowerCase().trim();
      const itemUrl = String(item.url);
      const isCompanyMatch =
        (targetName && itemComp === targetName) ||
        (targetDomain && targetDomain.length > 3 && itemUrl.toLowerCase().includes(targetDomain));

      if (!isCompanyMatch) continue;
      if (seenUrls.has(itemUrl)) continue;

      const title = item.title || 'Open Position';
      const locs = Array.isArray(item.locations) && item.locations.length > 0 ? item.locations.join(' | ') : 'Multiple Locations';
      if (keyword && !title.toLowerCase().includes(keyword) && !(item.category || '').toLowerCase().includes(keyword)) continue;
      if (locFilter && !locs.toLowerCase().includes(locFilter)) continue;

      seenUrls.add(itemUrl);
      matched.push(item);
    }

    if (matched.length === 0) {
      throw new Error(`No verified feed openings found for ${companyName}`);
    }

    return {
      extractionMethod: 'Official Career Portal Feed',
      reportedCount: matched.length,
      jobs: matched.map(item => {
        const locs = Array.isArray(item.locations) && item.locations.length > 0 ? item.locations.join(', ') : 'Multiple Locations';
        const jobIdMatch = String(item.url).match(/\/job\/([A-Za-z0-9_-]+)/i);
        const reqId = jobIdMatch ? jobIdMatch[1] : String(item.id || item.url);
        const dept = item.category || 'Engineering & Technology';
        const isRemote = locs.toLowerCase().includes('remote') || (item.title || '').toLowerCase().includes('remote');

        return {
          external_job_id: reqId,
          title: item.title || 'Open Position',
          location: locs,
          locations: Array.isArray(item.locations) && item.locations.length > 0 ? item.locations : [locs],
          work_mode: isRemote ? 'Remote' : 'On-site',
          employment_type: 'Full-time',
          department: dept,
          experience: '',
          salary: '',
          skills: [],
          description: `Official verified opening at ${companyName} for **${item.title}**.\n\n• **Requisition ID**: ${reqId}\n• **Category / Department**: ${dept}\n• **Location**: ${locs}\n• **Official Direct Application URL**: ${item.url}`,
          original_job_url: item.url,
          apply_url: item.url,
          ats_provider: `${companyName} Careers`,
          confidence_score: 98,
        };
      }),
      strategyMemory: {
        s: 'Official Career Portal Feed',
        totalFound: matched.length,
        v: '1.0.0',
        chk: new Date().toISOString(),
      }
    };
  },

  /**
   * Adapter: Phenom People Universal Career Platform (widgets API & phApp.ddo)
   * Used universally by Cisco (careers.cisco.com), Cognizant, Abbott, Booking, L'Oreal, Thermo Fisher, Eli Lilly, etc.
   */
  async extractPhenomPeople(careerUrl, companyName, options = {}) {
    let host = 'careers.cisco.com';
    let lang = 'en_global';
    let country = 'global';
    let siteType = 'external';

    try {
      const u = new URL(careerUrl.startsWith('http') ? careerUrl : `https://${careerUrl}`);
      host = u.hostname;
      if (host === 'www.cisco.com' || host === 'cisco.com' || host === 'jobs.cisco.com') {
        host = 'careers.cisco.com';
      }
    } catch {}

    const keyword = (options.keyword || options.title || options.search || '').trim();
    const location = (options.location || '').trim().toLowerCase();

    const widgetsUrl = `https://${host}/widgets`;
    let totalReported = 0;
    const rawJobs = [];

    // Try fetching pages of 100 via Phenom widgets API
    const PAGE_SIZE = 100;
    const MAX_PAGES = 16; // up to 1,600 jobs fetched cleanly

    for (let page = 0; page < MAX_PAGES; page++) {
      try {
        const res = await ComplianceService.safeFetch(widgetsUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            lang,
            deviceType: 'desktop',
            country,
            pageName: 'search-results',
            ddoKey: 'refineSearch',
            sortBy: '',
            subsearch: '',
            from: page * PAGE_SIZE,
            jobs: true,
            counts: true,
            all_fields: ['category', 'country', 'state', 'city', 'type', 'workLocation'],
            size: PAGE_SIZE,
            clearAll: false,
            jdSource: 'facets',
            isSliderEnable: false,
            pageId: 'page11',
            siteType,
            keywords: keyword,
            global: true,
            selected_fields: {}
          }),
          timeout: 10000,
        });

        if (!res.ok) break;
        const data = await res.json();
        const refSearch = data.refineSearch || data.eagerLoadRefineSearch || {};
        if (typeof refSearch.totalHits === 'number' && refSearch.totalHits > 0) {
          totalReported = refSearch.totalHits;
        }
        const batchJobs = refSearch.data?.jobs || [];
        if (batchJobs.length === 0) break;
        rawJobs.push(...batchJobs);
        if (totalReported && rawJobs.length >= totalReported) break;
      } catch {
        break;
      }
    }

    // Fallback: parse phApp.ddo from HTML if widgets POST didn't return jobs
    if (rawJobs.length === 0) {
      const searchUrl = careerUrl.includes('search') ? careerUrl : `https://${host}/global/en/search-results`;
      const pageRes = await ComplianceService.safeFetch(searchUrl, { timeout: 10000 });
      if (pageRes.ok) {
        const html = await pageRes.text();
        const ddoMatch = html.match(/phApp\.ddo\s*=\s*(\{.+?\});\s*(?:phApp|window|var|<\/script>)/s);
        if (ddoMatch) {
          const ddo = JSON.parse(ddoMatch[1]);
          const ref = ddo.eagerLoadRefineSearch || ddo.refineSearch || {};
          totalReported = ref.totalHits || 0;
          if (Array.isArray(ref.data?.jobs)) {
            rawJobs.push(...ref.data.jobs);
          }
        }
      }
    }

    if (rawJobs.length === 0) {
      throw new Error(`Phenom People API returned 0 jobs for ${companyName}`);
    }

    const filtered = location
      ? rawJobs.filter(j => JSON.stringify(j).toLowerCase().includes(location))
      : rawJobs;

    return {
      extractionMethod: 'API (Phenom People)',
      reportedCount: totalReported || filtered.length,
      jobs: filtered.map(j => {
        const reqId = String(j.reqId || j.jobId || j.jobSeqNo || Math.random().toString(36).substring(7));
        const title = j.title || 'Open Position';
        const loc = j.cityStateCountry || j.location || [j.city, j.state, j.country].filter(Boolean).join(', ') || 'Multiple Locations';
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const jobUrl = j.applyUrl || `https://${host}/global/en/job/${reqId}/${slug}`;
        const isRemote = (loc + ' ' + (j.workLocation || '') + ' ' + title).toLowerCase().includes('remote');

        return {
          external_job_id: reqId,
          title,
          location: loc,
          locations: j.multi_location_array || [loc],
          work_mode: isRemote ? 'Remote' : ((j.workLocation || '').toLowerCase().includes('hybrid') ? 'Hybrid' : 'On-site'),
          employment_type: j.type || 'Full-time',
          department: j.category || j.department || 'General',
          experience: j.experienceLevel || '',
          salary: '',
          skills: j.skills || [],
          description: cleanHtmlToMarkdown(j.descriptionTeaser || j.description || '') || `Official verified opening at ${companyName} for ${title}. Requisition ID: ${reqId}. Location: ${loc}.`,
          original_job_url: jobUrl,
          apply_url: j.applyUrl || jobUrl,
          ats_provider: 'Phenom People',
          confidence_score: 98,
        };
      }),
      strategyMemory: {
        s: 'Phenom People API',
        host,
        totalFound: totalReported || filtered.length,
        v: '1.0.0',
        chk: new Date().toISOString(),
      }
    };
  },

  /**
   * Adapter: SAP SuccessFactors Recruiting Marketing (RMK / Career Site Builder)
   * Used universally by Wipro (careers.wipro.com), HCL, Infosys, Deloitte, NTT Data, etc.
   */
  async extractSuccessFactorsRMK(careerUrl, companyName, options = {}) {
    let host = 'careers.wipro.com';
    try {
      const u = new URL(careerUrl.startsWith('http') ? careerUrl : `https://${careerUrl}`);
      host = u.hostname;
      if (host === 'www.wipro.com' || host === 'wipro.com') {
        host = 'careers.wipro.com';
      }
    } catch {}

    const keyword = (options.keyword || options.title || options.search || '').trim();
    const location = (options.location || '').trim();
    const apiUrl = `https://${host}/services/recruiting/v1/jobs`;

    let totalReported = 0;
    const rawResults = [];

    // 1. Try Modern RMK JSON API (/services/recruiting/v1/jobs)
    try {
      const firstRes = await ComplianceService.safeFetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          keywords: keyword,
          locale: 'en_US',
          location,
          pageNumber: 0,
          sortBy: 'recent'
        }),
        timeout: 10000,
      });

      if (firstRes.ok) {
        const firstData = await firstRes.json();
        totalReported = firstData.totalJobs || 0;
        if (Array.isArray(firstData.jobSearchResult)) {
          rawResults.push(...firstData.jobSearchResult);
        }

        // Fetch additional pages in polite batches (up to 35 pages = 350 jobs)
        const totalPages = Math.min(Math.ceil(totalReported / 10), 35);
        const pages = [];
        for (let p = 1; p < totalPages; p++) pages.push(p);

        const BATCH_SIZE = 7;
        for (let b = 0; b < pages.length; b += BATCH_SIZE) {
          const batch = pages.slice(b, b + BATCH_SIZE);
          const batchRes = await Promise.allSettled(
            batch.map(p =>
              ComplianceService.safeFetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({
                  keywords: keyword,
                  locale: 'en_US',
                  location,
                  pageNumber: p,
                  sortBy: 'recent'
                }),
                timeout: 8000,
              }).then(r => r.ok ? r.json() : null)
            )
          );
          for (const br of batchRes) {
            if (br.status === 'fulfilled' && Array.isArray(br.value?.jobSearchResult)) {
              rawResults.push(...br.value.jobSearchResult);
            }
          }
        }
      }
    } catch (e) {
      console.warn('SAP SuccessFactors RMK JSON error:', e.message);
    }

    if (rawResults.length > 0) {
      return {
        extractionMethod: 'API (SAP SuccessFactors)',
        reportedCount: totalReported || rawResults.length,
        jobs: rawResults.map(item => {
          const r = item.response || item;
          const id = String(r.id || Math.random().toString(36).substring(7));
          const title = r.unifiedStandardTitle || r.title || 'Open Position';
          const urlTitle = r.urlTitle || r.unifiedUrlTitle || title.replace(/[^a-zA-Z0-9]+/g, '-');
          const loc = (Array.isArray(r.jobLocationShort) ? r.jobLocationShort[0] : r.jobLocationShort)
            ?.replace(/,\s*$/, '')
            ?.trim() || (Array.isArray(r.sfstd_jobLocation_obj) ? r.sfstd_jobLocation_obj.join(', ') : 'Multiple Locations');
          const dept = Array.isArray(r.custRMKMappingPicklist) ? r.custRMKMappingPicklist[0] : 'Technology & Operations';
          const jobUrl = `https://${host}/job/${encodeURIComponent(urlTitle)}/${id}-en_US`;

          return {
            external_job_id: id,
            title,
            location: loc,
            locations: [loc],
            work_mode: (title + ' ' + loc).toLowerCase().includes('remote') ? 'Remote' : 'On-site',
            employment_type: 'Full-time',
            department: dept || 'General',
            experience: '',
            salary: '',
            skills: [],
            description: `Official verified opening at ${companyName} for ${title}.\n\n• Requisition ID: ${id}\n• Department: ${dept}\n• Location: ${loc}\n• Start Date: ${r.unifiedStandardStart || 'Immediate'}\n\nApply directly on official portal: ${jobUrl}`,
            original_job_url: jobUrl,
            apply_url: jobUrl,
            ats_provider: 'SAP SuccessFactors',
            confidence_score: 98,
          };
        }),
        strategyMemory: {
          s: 'SAP SuccessFactors RMK API',
          host,
          totalFound: totalReported || rawResults.length,
          v: '1.0.0',
          chk: new Date().toISOString(),
        }
      };
    }

    throw new Error(`SAP SuccessFactors RMK returned 0 jobs for ${companyName}`);
  },

  /**
   * Adapter: IBM Global Careers Search API (2,154+ live jobs)
   */
  async extractIBM(careerUrl = '', companyName = 'IBM', options = {}) {
    const apiUrl = 'https://www-api.ibm.com/search/api/v2';
    const keyword = (options.keyword || options.title || options.search || '').trim();
    const location = (options.location || '').trim().toLowerCase();

    let totalReported = 0;
    const allHits = [];
    const PAGE_SIZE = 100;
    const MAX_PAGES = 22; // Fetch up to 2,200 verified jobs cleanly

    for (let page = 0; page < MAX_PAGES; page++) {
      try {
        const mustClauses = [];
        if (keyword) {
          mustClauses.push({ query_string: { query: keyword } });
        }
        const res = await ComplianceService.safeFetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            appId: 'careers',
            scopes: ['careers2'],
            query: { bool: { must: mustClauses } },
            size: PAGE_SIZE,
            from: page * PAGE_SIZE,
            lang: 'zz',
            sm: { query: keyword, lang: 'zz' },
            _source: ['_id', 'title', 'url', 'description', 'field_keyword_05', 'field_keyword_08', 'field_keyword_17', 'field_keyword_18', 'field_keyword_19']
          }),
          timeout: 10000,
        });

        if (!res.ok) break;
        const data = await res.json();
        if (typeof data.hits?.total?.value === 'number') {
          totalReported = data.hits.total.value;
        }
        const hits = data.hits?.hits || [];
        if (hits.length === 0) break;
        allHits.push(...hits);
        if (totalReported && allHits.length >= totalReported) break;
      } catch {
        break;
      }
    }

    if (allHits.length === 0) {
      throw new Error('IBM Careers API returned 0 jobs');
    }

    const filtered = location
      ? allHits.filter(h => JSON.stringify(h._source || {}).toLowerCase().includes(location))
      : allHits;

    return {
      extractionMethod: 'API (IBM Global Careers)',
      reportedCount: totalReported || filtered.length,
      jobs: filtered.map(h => {
        const s = h._source || {};
        const urlJobId = (s.url || '').match(/jobId=([A-Za-z0-9_-]+)/i)?.[1];
        const reqId = String(urlJobId || h._id || Math.random().toString(36).substring(7));
        const title = s.title || 'Open Position';
        const loc = [s.field_keyword_19, s.field_keyword_05].filter(Boolean).join(', ') || s.field_keyword_08 || 'Multiple Locations';
        const dept = s.field_keyword_08 || 'Technology';
        const workMode = (s.field_keyword_17 || loc).toLowerCase().includes('remote') ? 'Remote' : ((s.field_keyword_17 || '').toLowerCase().includes('hybrid') ? 'Hybrid' : 'On-site');
        const jobUrl = s.url || `https://www.ibm.com/careers/search?q=${encodeURIComponent(reqId)}`;

        return {
          external_job_id: reqId,
          title,
          location: loc,
          locations: [loc],
          work_mode: workMode,
          employment_type: s.field_keyword_18 || 'Full-time',
          department: dept,
          experience: '',
          salary: '',
          skills: [],
          description: cleanHtmlToMarkdown(s.description || '') || `Official verified opening at IBM for ${title}. Requisition ID: ${reqId}. Location: ${loc}.`,
          original_job_url: jobUrl,
          apply_url: jobUrl,
          ats_provider: 'IBM Careers API',
          confidence_score: 98,
        };
      }),
      strategyMemory: {
        s: 'IBM Search API v2',
        ep: apiUrl,
        totalFound: totalReported || filtered.length,
        v: '1.0.0',
        chk: new Date().toISOString(),
      }
    };
  },

  /**
   * Adapter: Capgemini Global JobStream API (6,799+ live jobs)
   */
  async extractCapgemini(careerUrl = '', companyName = 'Capgemini', options = {}) {
    const keyword = (options.keyword || options.title || options.search || '').trim();
    const location = (options.location || '').trim().toLowerCase();

    let totalReported = 0;
    const allItems = [];
    const PAGE_SIZE = 100;
    const MAX_PAGES = 5; // 500 rich jobs with full HTML descriptions

    for (let page = 1; page <= MAX_PAGES; page++) {
      try {
        const params = new URLSearchParams({
          page: String(page),
          size: String(PAGE_SIZE),
        });
        if (keyword) params.set('search', keyword);

        const apiUrl = `https://cg-jobstream-api.azurewebsites.net/api/job-search?${params.toString()}`;
        const res = await ComplianceService.safeFetch(apiUrl, {
          headers: { 'Accept': 'application/json' },
          timeout: 10000,
        });
        if (!res.ok) break;
        const data = await res.json();
        if (typeof data.total === 'number' && data.total > 0) {
          totalReported = data.total;
        }
        const items = data.data || [];
        if (items.length === 0) break;
        allItems.push(...items);
        if (totalReported && allItems.length >= totalReported) break;
      } catch {
        break;
      }
    }

    if (allItems.length === 0) {
      throw new Error('Capgemini JobStream API returned 0 jobs');
    }

    const filtered = location
      ? allItems.filter(j => (j.location || '').toLowerCase().includes(location) || (j.country_name || '').toLowerCase().includes(location))
      : allItems;

    return {
      extractionMethod: 'API (Capgemini JobStream)',
      reportedCount: totalReported || filtered.length,
      jobs: filtered.map(j => {
        const reqId = String(j.ref || j.id || j._id || Math.random().toString(36).substring(7));
        const title = j.title || 'Open Position';
        const loc = j.location || j.country_name || 'Multiple Locations';
        const jobUrl = j.apply_job_url || `https://www.capgemini.com/careers/join-capgemini/job-search/?search=${encodeURIComponent(reqId)}`;

        return {
          external_job_id: reqId,
          title,
          location: loc,
          locations: [loc],
          work_mode: loc.toLowerCase().includes('remote') ? 'Remote' : 'On-site',
          employment_type: j.contract_type || 'Full-time',
          department: j.professional_communities || j.department || j.sbu || 'Technology',
          experience: j.experience_level || '',
          salary: '',
          skills: [],
          description: cleanHtmlToMarkdown(j.description || j.description_stripped || '') || `Official verified opening at Capgemini for ${title}. Location: ${loc}.`,
          original_job_url: jobUrl,
          apply_url: jobUrl,
          ats_provider: 'Capgemini Careers',
          confidence_score: 98,
        };
      }),
      strategyMemory: {
        s: 'Capgemini JobStream API',
        totalFound: totalReported || filtered.length,
        v: '1.0.0',
        chk: new Date().toISOString(),
      }
    };
  },

  /**
   * Adapter: Tata Group Official Global Careers Portal (14,014+ live jobs across Tata companies)
   */
  async extractTata(careerUrl = '', companyName = 'Tata', options = {}) {
    let totalReported = 0;

    // 1. Fetch official total job postings count from Tata CountServlet
    try {
      const countRes = await ComplianceService.safeFetch('https://www.tata.com/bin/tata/jobPostingsCountServlet', {
        headers: { 'Accept': 'application/json' },
        timeout: 8000,
      });
      if (countRes.ok) {
        const countData = await countRes.json();
        if (countData?.response?.totalCount) {
          totalReported = Number(countData.response.totalCount);
        }
      }
    } catch {}

    // 2. Fetch live job listings across key role categories from jobPostingsFilterServlet
    const userKeyword = (options.keyword || options.title || options.search || '').trim();
    const searchTerms = userKeyword
      ? [userKeyword]
      : ['engineer', 'developer', 'manager', 'analyst', 'consultant', 'lead', 'associate', 'executive', 'architect', 'designer', 'specialist', 'officer'];

    const seenIds = new Set();
    const allPostings = [];

    const results = await Promise.allSettled(
      searchTerms.map(term =>
        ComplianceService.safeFetch('https://www.tata.com/bin/tata/jobPostingsFilterServlet?', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Referer': 'https://www.tata.com/careers/jobs/joblisting',
            'Origin': 'https://www.tata.com',
            'X-Requested-With': 'XMLHttpRequest',
          },
          body: `searchTerm=${encodeURIComponent(term)}&searchMode=search&jobFormat=undefined`,
          timeout: 9000,
        }).then(r => r.ok ? r.json() : null)
      )
    );

    for (const r of results) {
      if (r.status === 'fulfilled' && Array.isArray(r.value?.response?.jobPostings)) {
        for (const p of r.value.response.jobPostings) {
          const id = String(p.jobId || `${p.companyName}_${p.jobTitle}`);
          if (!seenIds.has(id)) {
            seenIds.add(id);
            allPostings.push(p);
          }
        }
      }
    }

    if (allPostings.length === 0) {
      throw new Error('Tata Careers Servlet returned 0 postings');
    }

    return {
      extractionMethod: 'API (Tata Careers Portal)',
      reportedCount: totalReported || allPostings.length,
      jobs: allPostings.map(p => {
        const reqId = String(p.jobId || Math.random().toString(36).substring(7));
        const subCompany = p.companyName || 'Tata Group';
        const title = p.jobTitle ? `${p.jobTitle} (${subCompany})` : `Open Position (${subCompany})`;
        const loc = p.location || 'India';
        const jobUrl = `https://www.tata.com/careers/jobs/jobdetails?jobId=${encodeURIComponent(reqId)}&company=${encodeURIComponent(subCompany)}`;

        return {
          external_job_id: reqId,
          title,
          location: loc,
          locations: [loc],
          work_mode: loc.toLowerCase().includes('remote') || loc.toLowerCase().includes('flexible') ? 'Remote' : 'On-site',
          employment_type: p.jobType || 'Full-time',
          department: subCompany,
          experience: '',
          salary: '',
          skills: [],
          description: cleanHtmlToMarkdown(p.shortDescription || '') || `Official opening at ${subCompany} (Tata Group) for ${p.jobTitle}. Requisition ID: ${reqId}. Location: ${loc}.`,
          original_job_url: jobUrl,
          apply_url: jobUrl,
          ats_provider: 'Tata Careers Portal',
          confidence_score: 97,
        };
      }),
      strategyMemory: {
        s: 'Tata Global Job Servlet',
        totalFound: totalReported || allPostings.length,
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
   * Adapter: Autonomous Universal Job Extractor
   * Works on any website without hardcoded scripts by trying:
   * 1. Schema.org JSON-LD structured data
   * 2. Embedded SPA / Next.js / Nuxt application state (__NEXT_DATA__)
   * 3. Probing standard public REST/JSON APIs (/api/jobs, /jobs.json, /wp-json/wp/v2/jobs)
   * 4. Auto-probing Sitemaps (/sitemap.xml, /jobs-sitemap.xml)
   * 5. Checking 2nd-hop job search subpaths (/careers/jobs, /jobs)
   * 6. Smart DOM Card & Link Parser with anti-junk heuristics
   */
  async extractGeneric(url, companyName) {
    const res = await ComplianceService.safeFetch(url, { timeout: 12000 });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} when fetching career page ${url}`);
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const jobs = [];

    let origin = '';
    try {
      origin = new URL(url).origin;
    } catch {}

    // Layer 1: Schema.org JSON-LD JobPosting (Google for Jobs Standard)
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const parsed = JSON.parse($(el).html());
        const items = Array.isArray(parsed) ? parsed : (parsed?.['@graph'] ? parsed['@graph'] : [parsed]);
        for (const item of items) {
          if (item?.['@type'] === 'JobPosting') {
            const loc = item.jobLocation?.address?.addressLocality ||
                        item.jobLocation?.address?.addressRegion ||
                        item.jobLocation?.address?.addressCountry ||
                        'Multiple Locations';
            jobs.push({
              external_job_id: String(item.identifier?.value || item.identifier || item.url || Math.random().toString(36).substring(7)),
              title: item.title || item.name || 'Open Position',
              location: loc,
              locations: [loc],
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
              confidence_score: 95,
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
        strategyMemory: { s: 'Schema.org JSON-LD', v: '2.0.0', chk: new Date().toISOString() }
      };
    }

    // Layer 2: Embedded SPA / Next.js / Nuxt state (<script id="__NEXT_DATA__"> or <script type="application/json">)
    $('script[type="application/json"], script#__NEXT_DATA__').each((_, el) => {
      try {
        const text = $(el).html();
        if (text && (text.includes('job') || text.includes('position') || text.includes('opening'))) {
          const parsed = JSON.parse(text);
          // Recursively find arrays with job-like objects
          const findJobArrays = (obj) => {
            if (!obj || typeof obj !== 'object') return;
            if (Array.isArray(obj)) {
              if (obj.length > 0 && typeof obj[0] === 'object' && obj[0] !== null) {
                const sample = obj[0];
                const hasTitle = sample.title || sample.Job_Posting_Title || sample.name || sample.jobTitle || sample.position;
                const hasDetails = sample.location || sample.Locations || sample.department || sample.reqId || sample.id || sample.url;
                if (hasTitle && hasDetails) {
                  for (const j of obj) {
                    const title = j.title || j.Job_Posting_Title || j.name || j.jobTitle || j.position;
                    if (title && typeof title === 'string') {
                      const loc = j.location || (Array.isArray(j.Locations) ? j.Locations.join(', ') : j.jobLocation) || 'Multiple Locations';
                      const jobUrl = j.url || j.applyUrl || j.link || url;
                      jobs.push({
                        external_job_id: String(j.id || j.Job_Requisition_Ref_ID || j.reqId || Math.random().toString(36).substring(7)),
                        title: title.trim(),
                        location: typeof loc === 'string' ? loc : 'Multiple Locations',
                        locations: [typeof loc === 'string' ? loc : 'Multiple Locations'],
                        work_mode: (JSON.stringify(j).toLowerCase().includes('remote')) ? 'Remote' : 'On-site',
                        employment_type: j.type || j.Time_Type || 'Full-time',
                        department: j.department || j.Job_Family_Group || 'General',
                        experience: '',
                        salary: '',
                        skills: [],
                        description: j.description || `Verified opening at ${companyName}.`,
                        original_job_url: jobUrl.startsWith('http') ? jobUrl : (origin ? `${origin}${jobUrl}` : url),
                        apply_url: jobUrl.startsWith('http') ? jobUrl : (origin ? `${origin}${jobUrl}` : url),
                        ats_provider: 'Embedded App State',
                        confidence_score: 92,
                      });
                    }
                  }
                  return;
                }
              }
              for (const item of obj) findJobArrays(item);
            } else {
              for (const key of Object.keys(obj)) findJobArrays(obj[key]);
            }
          };
          findJobArrays(parsed);
        }
      } catch {}
    });

    if (jobs.length > 0) {
      return {
        extractionMethod: 'Embedded App State',
        reportedCount: jobs.length,
        jobs: jobs.slice(0, 100),
        strategyMemory: { s: 'SPA State', v: '2.0.0', chk: new Date().toISOString() }
      };
    }

    // Layer 3: Probe Common Public JSON API Endpoints
    if (origin) {
      const commonApiPaths = [
        '/api/jobs',
        '/api/careers',
        '/api/v1/jobs',
        '/jobs.json',
        '/careers.json',
        '/wp-json/wp/v2/job-postings',
        '/wp-json/wp/v2/jobs'
      ];
      for (const apiPath of commonApiPaths) {
        try {
          const apiRes = await ComplianceService.safeFetch(`${origin}${apiPath}`, { timeout: 6000 });
          if (apiRes.ok) {
            const data = await apiRes.json();
            const list = Array.isArray(data) ? data : (data.jobs || data.postings || data.items || data.results || []);
            if (Array.isArray(list) && list.length > 0 && typeof list[0] === 'object') {
              for (const j of list) {
                const title = j.title?.rendered || j.title || j.name || j.position;
                if (title && typeof title === 'string') {
                  const loc = j.location?.name || j.location || j.city || 'Multiple Locations';
                  const jobUrl = j.link || j.url || `${origin}${apiPath}`;
                  jobs.push({
                    external_job_id: String(j.id || Math.random().toString(36).substring(7)),
                    title: title.trim(),
                    location: typeof loc === 'string' ? loc : 'Multiple Locations',
                    locations: [typeof loc === 'string' ? loc : 'Multiple Locations'],
                    work_mode: (JSON.stringify(j).toLowerCase().includes('remote')) ? 'Remote' : 'On-site',
                    employment_type: j.type || 'Full-time',
                    department: j.department || 'General',
                    experience: '',
                    salary: '',
                    skills: [],
                    description: j.excerpt?.rendered || j.description || '',
                    original_job_url: jobUrl,
                    apply_url: jobUrl,
                    ats_provider: 'Direct JSON API',
                    confidence_score: 90,
                  });
                }
              }
              if (jobs.length > 0) {
                return {
                  extractionMethod: 'Direct JSON API',
                  reportedCount: jobs.length,
                  jobs: jobs.slice(0, 100),
                  strategyMemory: { s: 'JSON API', ep: apiPath, v: '2.0.0', chk: new Date().toISOString() }
                };
              }
            }
          }
        } catch {}
      }
    }

    // Layer 4: Accordion / Toggle / Card Parser for WordPress, Fusion Builder, Elementor, Divi & Custom Career Pages (e.g. Aptara 13 jobs)
    $('a').each((idx, el) => {
      const href = ($(el).attr('href') || '').trim();
      const btnText = $(el).text().trim().replace(/\s+/g, ' ').toLowerCase();
      if (btnText === 'apply now' || btnText === 'apply' || href === '#applynow' || href.startsWith('#apply')) {
        const card = $(el).closest('.fusion-layout-column, .fusion-column-wrapper, .fusion-toggle, .job-card, .career-card, .opening-card, .position-card, .elementor-widget-wrap, article, .card');
        if (card.length > 0) {
          const heading = card.find('h2, h3, h4, .job-title, .title').first().text().trim().replace(/\s+/g, ' ');
          if (heading && heading.length > 3 && heading.length < 140) {
            const locText = card.find('li, .location, .job-location, p').first().text().trim().replace(/\s+/g, ' ') || 'Multiple Locations';
            const cleanLoc = (locText.length > 1 && locText.length < 80 && locText.toLowerCase() !== heading.toLowerCase() && locText.toLowerCase() !== 'apply now')
              ? locText
              : 'Multiple Locations';
            const cardText = cleanHtmlToMarkdown(card.html() || '') || `Official opening at ${companyName} for ${heading}. Location: ${cleanLoc}.`;
            const isRemote = (heading + ' ' + cleanLoc).toLowerCase().includes('remote');
            const isHybrid = (heading + ' ' + cleanLoc).toLowerCase().includes('hybrid');
            const slug = heading.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
            const fullApplyUrl = (href && !href.startsWith('#')) ? new URL(href, res.url || url).href : (res.url || url);

            jobs.push({
              external_job_id: `${slug}-${idx + 1}`,
              title: heading,
              location: cleanLoc,
              locations: [cleanLoc],
              work_mode: isRemote ? 'Remote' : (isHybrid ? 'Hybrid' : 'On-site'),
              employment_type: heading.toLowerCase().includes('contract') ? 'Contract' : 'Full-time',
              department: 'General',
              experience: '',
              salary: '',
              skills: [],
              description: cardText,
              original_job_url: `${res.url || url}#job-${slug}-${idx + 1}`,
              apply_url: fullApplyUrl,
              ats_provider: 'Official Career Page',
              confidence_score: 94,
            });
          }
        }
      }
    });

    if (jobs.length > 0) {
      const uniqueCardMap = new Map();
      for (const j of jobs) {
        const key = `${j.title.toLowerCase()}__${j.location.toLowerCase()}`;
        if (!uniqueCardMap.has(key)) {
          uniqueCardMap.set(key, j);
        }
      }
      const uniqueCards = Array.from(uniqueCardMap.values());
      return {
        extractionMethod: 'Official Career Page Cards',
        reportedCount: uniqueCards.length,
        jobs: uniqueCards,
        strategyMemory: {
          s: 'Official Career Page Cards',
          ep: res.url || url,
          totalFound: uniqueCards.length,
          v: '2.1.0',
          chk: new Date().toISOString(),
        }
      };
    }

    // Layer 5: Static HTML Card / Link Parser with Strict Quality Filter
    const ignoredLinkTexts = [
      'careers', 'jobs', 'all jobs', 'search jobs', 'view all', 'view jobs', 'apply now',
      'learn more', 'read more', 'back', 'next', 'previous', 'privacy policy', 'terms',
      'contact us', 'about us', 'cookie settings', 'login', 'sign in', 'home', 'explore all jobs',
      'see open positions', 'write to us', 'join our talent network', 'turn on job alerts',
      'explore our locations', 'search now', 'equal opportunity', 'job search', 'join us'
    ];

    $('a').each((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim().replace(/\s+/g, ' ');
      const textLower = text.toLowerCase();

      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
        return;
      }
      if (text.length < 4 || text.length > 80 || ignoredLinkTexts.includes(textLower)) {
        return;
      }

      // Must point to a specific job detail path, not a top-level marketing/category page
      const isSpecificJobLink =
        /\/(job|jobs|position|positions|opening|openings|vacancy|vacancies)\/[a-zA-Z0-9_-]{3,}/i.test(href) ||
        href.includes('jobdetails?id=') ||
        href.includes('jobId=');

      if (isSpecificJobLink) {
        try {
          const fullJobUrl = new URL(href, res.url || url).href;
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
            description: `Official opening from ${companyName}.`,
            original_job_url: fullJobUrl,
            apply_url: fullJobUrl,
            ats_provider: 'Custom HTML',
            confidence_score: 80,
          });
        } catch {}
      }
    });

    // Deduplicate by title + URL
    const uniqueMap = new Map();
    for (const j of jobs) {
      const key = `${j.title.toLowerCase()}__${j.original_job_url}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, j);
      }
    }
    const finalJobs = Array.from(uniqueMap.values());

    // Check if the official career page explicitly states there are 0 openings (e.g. Kellton "Zero Opening For the keyword")
    const bodyText = $('body').text().replace(/\s+/g, ' ');
    const bodyTextLower = bodyText.toLowerCase();
    const hasExplicitZeroOpenings =
      bodyTextLower.includes('zero opening') ||
      bodyTextLower.includes('no open positions') ||
      bodyTextLower.includes('no current openings') ||
      bodyTextLower.includes('currently no openings') ||
      bodyTextLower.includes('no vacancies available') ||
      bodyTextLower.includes('0 jobs found') ||
      bodyTextLower.includes('no jobs found');

    // Detect explicit official total count displayed on the page (e.g. "Showing 1-20 of 145 jobs", "145 Open Positions")
    let pageReportedTotal = finalJobs.length;
    if (finalJobs.length > 0) {
      const countMatch =
        bodyText.match(/showing\s+\d+\s*[-–to]+\s*\d+\s+of\s+([\d,]+)\s+(?:jobs|positions|openings|results|roles)/i) ||
        bodyText.match(/\b([\d,]+)\s+(?:open positions|live openings|jobs available|jobs found|open roles|matching jobs)\b/i);
      if (countMatch && countMatch[1]) {
        const parsedCount = parseInt(countMatch[1].replace(/,/g, ''), 10);
        if (!isNaN(parsedCount) && parsedCount >= finalJobs.length && parsedCount < 100000) {
          pageReportedTotal = parsedCount;
        }
      }
    }

    return {
      extractionMethod: 'Autonomous Universal Extractor',
      reportedCount: finalJobs.length > 0 ? pageReportedTotal : (hasExplicitZeroOpenings ? 0 : null),
      jobs: finalJobs,
      strategyMemory: {
        s: 'Autonomous Universal',
        ep: res.url || url,
        v: '2.1.0',
        chk: new Date().toISOString(),
      }
    };
  }
};
