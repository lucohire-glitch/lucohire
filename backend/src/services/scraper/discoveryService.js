import * as cheerio from 'cheerio';
import { ComplianceService } from './complianceService.js';

export const DiscoveryService = {
  // Known 3rd party aggregators to exclude as company primary websites
  AGGREGATOR_DOMAINS: [
    'indeed.com', 'naukri.com', 'linkedin.com', 'glassdoor.com', 'monster.com',
    'foundit.in', 'shine.com', 'simplyhired.com', 'ziprecruiter.com', 'dice.com',
    'timesjobs.com', 'freshersworld.com', 'upwork.com', 'fiverr.com'
  ],

  /**
   * Normalizes company name, website, and contact email from any combination of inputs.
   * If only email is provided (e.g. hr@accenture.com), extracts website and company name.
   * If only website is provided (e.g. accenture.com), extracts company name.
   * If only name is provided (e.g. Accenture), deduces domain and website.
   */
  normalizeCompanyInput({ name = '', website = '', email = '', careerUrl = '' } = {}) {
    let cleanName = (name || '').trim();
    let cleanWebsite = (website || '').trim();
    let cleanEmail = (email || '').trim().toLowerCase();
    let cleanCareerUrl = (careerUrl || '').trim();
    let domain = '';

    // 1. Try extracting domain from website or careerUrl
    const urlCandidate = cleanWebsite || cleanCareerUrl;
    if (urlCandidate) {
      try {
        const u = urlCandidate.startsWith('http') ? urlCandidate : `https://${urlCandidate}`;
        domain = new URL(u).hostname.toLowerCase().replace(/^www\./, '');
      } catch {}
    }

    // 2. If no domain from URL, extract from email
    if (!domain && cleanEmail && cleanEmail.includes('@')) {
      const emailDomain = cleanEmail.split('@')[1];
      if (emailDomain && !this.isIgnoredEmail(cleanEmail)) {
        domain = emailDomain.toLowerCase().replace(/^www\./, '');
      }
    }

    // 3. If no domain yet, deduce from company name
    if (!domain && cleanName) {
      const slug = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (slug) {
        domain = `${slug}.com`;
      }
    }

    // Check if domain is a 3rd party aggregator
    const isAggregator = domain && this.AGGREGATOR_DOMAINS.some(aggr => domain.includes(aggr));
    if (isAggregator) {
      // Discard aggregator domain to force direct company search
      domain = cleanName ? `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com` : '';
    }

    // If company name was missing, derive from domain
    if (!cleanName && domain) {
      const base = domain.split('.')[0];
      cleanName = base.charAt(0).toUpperCase() + base.slice(1);
    }

    // Ensure website has valid protocol
    if (!cleanWebsite && domain) {
      cleanWebsite = `https://${domain}`;
    } else if (cleanWebsite && !/^https?:\/\//i.test(cleanWebsite)) {
      cleanWebsite = `https://${cleanWebsite}`;
    }

    return {
      name: cleanName || 'Unnamed Company',
      website: cleanWebsite,
      domain,
      contactEmail: cleanEmail,
      careerUrl: cleanCareerUrl,
      isAggregator,
    };
  },

  /**
   * Cleans and formats a domain or company website
   */
  normalizeWebsite(input) {
    if (!input) return '';
    let url = input.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    try {
      const parsed = new URL(url);
      return parsed.origin;
    } catch {
      return '';
    }
  },

  /**
   * Detects ATS provider from page HTML or URLs
   * Supports: Workday, Greenhouse, Lever, Ashby, SmartRecruiters, Workable, BambooHR, Recruitee
   */
  detectAts(html = '', url = '') {
    const combined = (url + ' ' + html);
    const combinedLower = combined.toLowerCase();

    // 1. Workday (Universal enterprise ATS)
    if (combinedLower.includes('myworkdayjobs.com')) {
      const wdMatch = combined.match(/https?:\/\/([a-zA-Z0-9_.-]+)\.myworkdayjobs\.com\/([a-zA-Z0-9_/%-]+)/i);
      if (wdMatch) {
        const fullWd = wdMatch[0].replace(/["';,].*$/, '').replace(/\/userHome.*$/, '');
        try {
          const u = new URL(fullWd);
          const host = u.hostname;
          const pathParts = u.pathname.split('/').filter(Boolean);
          const site = pathParts[0] || '';
          const tenant = host.split('.')[0];
          return {
            ats: 'Workday',
            token: site || tenant,
            workdayUrl: fullWd,
            host,
            tenant,
            site,
          };
        } catch {}
      }
      return { ats: 'Workday', token: null };
    }

    // 2. Greenhouse
    if (combinedLower.includes('boards.greenhouse.io') || combinedLower.includes('api.greenhouse.io') || combinedLower.includes('grnh.se')) {
      const match = url.match(/boards\.greenhouse\.io\/(?:embed\/job_board\?for=)?([^/?&#]+)/i) ||
                    html.match(/boards\.greenhouse\.io\/(?:embed\/job_board\?for=)?([a-zA-Z0-9_-]+)/i) ||
                    html.match(/grnh\.se\/([a-zA-Z0-9_-]+)/i);
      return { ats: 'Greenhouse', token: match ? match[1] : null };
    }

    // 3. Lever
    if (combinedLower.includes('jobs.lever.co') || combinedLower.includes('api.lever.co')) {
      const match = url.match(/jobs\.lever\.co\/([^/?&#]+)/i) ||
                    html.match(/jobs\.lever\.co\/([a-zA-Z0-9_-]+)/i);
      return { ats: 'Lever', token: match ? match[1] : null };
    }

    // 4. Ashby
    if (combinedLower.includes('jobs.ashbyhq.com')) {
      const match = url.match(/jobs\.ashbyhq\.com\/([^/?&#]+)/i) ||
                    html.match(/jobs\.ashbyhq\.com\/([a-zA-Z0-9_-]+)/i);
      return { ats: 'Ashby', token: match ? match[1] : null };
    }

    // 5. SmartRecruiters
    if (combinedLower.includes('careers.smartrecruiters.com') || combinedLower.includes('smartrecruiters.com')) {
      const match = url.match(/careers\.smartrecruiters\.com\/([^/?&#]+)/i) ||
                    html.match(/careers\.smartrecruiters\.com\/([a-zA-Z0-9_-]+)/i);
      return { ats: 'SmartRecruiters', token: match ? match[1] : null };
    }

    // 6. Workable
    if (combinedLower.includes('apply.workable.com')) {
      const match = url.match(/apply\.workable\.com\/([^/?&#]+)/i) ||
                    html.match(/apply\.workable\.com\/([a-zA-Z0-9_-]+)/i);
      return { ats: 'Workable', token: match ? match[1] : null };
    }

    // 7. BambooHR
    if (combinedLower.includes('bamboohr.com')) {
      const match = url.match(/([a-zA-Z0-9_-]+)\.bamboohr\.com/i) ||
                    html.match(/([a-zA-Z0-9_-]+)\.bamboohr\.com/i);
      return { ats: 'BambooHR', token: match ? match[1] : null };
    }

    // 8. Recruitee
    if (combinedLower.includes('recruitee.com')) {
      const match = url.match(/([a-zA-Z0-9_-]+)\.recruitee\.com/i) ||
                    html.match(/([a-zA-Z0-9_-]+)\.recruitee\.com/i);
      return { ats: 'Recruitee', token: match ? match[1] : null };
    }

    return { ats: 'Custom website', token: null };
  },

  /**
   * Find Career Page by checking standard paths, robots.txt sitemaps, and homepage links
   */
  async findCareerPage(websiteUrl, companyName = '') {
    const origin = this.normalizeWebsite(websiteUrl);
    if (!origin) return null;

    let domain = '';
    try {
      domain = new URL(origin).hostname.replace(/^www\./, '');
    } catch {}

    // Step 1: Discovered Sitemaps from robots.txt
    let jobSitemap = '';
    let allSitemaps = [];
    if (domain) {
      try {
        allSitemaps = await ComplianceService.getRobotsSitemaps(domain);
        // Look specifically for job/career/jobpostings sitemaps
        for (const sm of allSitemaps) {
          const lower = sm.toLowerCase();
          if (lower.includes('job') || lower.includes('career') || lower.includes('opening')) {
            jobSitemap = sm;
            break;
          }
        }
      } catch {}
    }

    // Step 2: Check common career paths directly
    const commonPaths = [
      '/careers/jobsearch',
      '/careers',
      '/jobs',
      '/job-search',
      '/openings',
      '/positions',
      '/join-us',
      '/about/careers',
      '/work-with-us',
      '/vacancies',
    ];

    for (const path of commonPaths) {
      try {
        const testUrl = `${origin}${path}`;
        const res = await ComplianceService.safeFetch(testUrl, { method: 'GET', timeout: 8000 });
        if (res.ok) {
          const finalUrl = res.url || testUrl;
          const html = await res.text();
          const atsInfo = this.detectAts(html, finalUrl);

          // If Workday or known ATS was detected inside HTML/data attributes, prioritize its URL
          let targetCareerUrl = finalUrl;
          if (atsInfo.workdayUrl) {
            targetCareerUrl = atsInfo.workdayUrl;
          }

          return {
            careerUrl: targetCareerUrl,
            ats: atsInfo.ats,
            atsToken: atsInfo.token,
            atsData: atsInfo,
            jobSitemap,
            allSitemaps,
            html,
          };
        }
      } catch {}
    }

    // Step 3: Inspect homepage for career links
    try {
      const homeRes = await ComplianceService.safeFetch(origin, { timeout: 8000 });
      if (homeRes.ok) {
        const homeHtml = await homeRes.text();
        const $ = cheerio.load(homeHtml);
        let foundHref = null;

        $('a').each((_, el) => {
          const href = $(el).attr('href');
          const text = $(el).text().toLowerCase().trim();
          if (
            href &&
            (text.includes('career') ||
             text.includes('job') ||
             text.includes('work with us') ||
             text.includes('join our team') ||
             text.includes('openings') ||
             href.includes('/career') ||
             href.includes('/job'))
          ) {
            foundHref = href;
            return false; // break
          }
        });

        if (foundHref) {
          const fullCareerUrl = new URL(foundHref, origin).href;
          const atsInfo = this.detectAts(homeHtml, fullCareerUrl);
          return {
            careerUrl: atsInfo.workdayUrl || fullCareerUrl,
            ats: atsInfo.ats,
            atsToken: atsInfo.token,
            atsData: atsInfo,
            jobSitemap,
            allSitemaps,
            html: homeHtml,
          };
        }
      }
    } catch {}

    return {
      careerUrl: origin,
      ats: 'Custom website',
      atsToken: null,
      atsData: null,
      jobSitemap,
      allSitemaps,
      html: '',
    };
  },

  /**
   * Extracts public contact email from HTML
   * Scans mailto links and regex matches for info@, careers@, hr@, etc.
   */
  extractContactEmail(html = '') {
    if (!html) return '';

    // 1. Check mailto: links first (highest confidence)
    const mailtoMatches = html.match(/mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
    if (mailtoMatches && mailtoMatches[1]) {
      const email = mailtoMatches[1].toLowerCase().trim();
      if (!this.isIgnoredEmail(email)) return email;
    }

    // 2. Scan text for public emails
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const matches = html.match(emailRegex) || [];
    
    // Prefer hiring/contact prefixes
    const preferred = matches.find(e => /^(careers|jobs|recruitment|talent|hr|contact|info|hello|team)@/i.test(e));
    if (preferred && !this.isIgnoredEmail(preferred)) {
      return preferred.toLowerCase();
    }

    for (const email of matches) {
      if (!this.isIgnoredEmail(email)) {
        return email.toLowerCase();
      }
    }
    return '';
  },

  isIgnoredEmail(email) {
    if (!email) return true;
    const e = email.toLowerCase();
    return (
      e.includes('example.com') ||
      e.includes('domain.com') ||
      e.includes('email.com') ||
      e.includes('wixpress.com') ||
      e.includes('sentry.io') ||
      e.endsWith('.png') ||
      e.endsWith('.jpg') ||
      e.endsWith('.svg')
    );
  }
};
