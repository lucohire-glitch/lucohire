import * as cheerio from 'cheerio';
import { ComplianceService } from './complianceService.js';

export const DiscoveryService = {
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
   */
  detectAts(html = '', url = '') {
    const combined = (url + ' ' + html).toLowerCase();

    if (combined.includes('boards.greenhouse.io') || combined.includes('api.greenhouse.io') || combined.includes('grnh.se')) {
      const match = url.match(/boards\.greenhouse\.io\/(?:embed\/job_board\?for=)?([^/?&#]+)/i) ||
                    html.match(/boards\.greenhouse\.io\/(?:embed\/job_board\?for=)?([a-zA-Z0-9_-]+)/i);
      return { ats: 'Greenhouse', token: match ? match[1] : null };
    }
    if (combined.includes('jobs.lever.co') || combined.includes('api.lever.co')) {
      const match = url.match(/jobs\.lever\.co\/([^/?&#]+)/i) ||
                    html.match(/jobs\.lever\.co\/([a-zA-Z0-9_-]+)/i);
      return { ats: 'Lever', token: match ? match[1] : null };
    }
    if (combined.includes('jobs.ashbyhq.com')) {
      const match = url.match(/jobs\.ashbyhq\.com\/([^/?&#]+)/i) ||
                    html.match(/jobs\.ashbyhq\.com\/([a-zA-Z0-9_-]+)/i);
      return { ats: 'Ashby', token: match ? match[1] : null };
    }
    if (combined.includes('careers.smartrecruiters.com')) {
      const match = url.match(/careers\.smartrecruiters\.com\/([^/?&#]+)/i);
      return { ats: 'SmartRecruiters', token: match ? match[1] : null };
    }
    if (combined.includes('myworkdayjobs.com')) {
      return { ats: 'Workday', token: null };
    }
    if (combined.includes('apply.workable.com')) {
      const match = url.match(/apply\.workable\.com\/([^/?&#]+)/i);
      return { ats: 'Workable', token: match ? match[1] : null };
    }
    return { ats: 'Custom website', token: null };
  },

  /**
   * Find Career Page by checking standard paths and homepage links
   */
  async findCareerPage(websiteUrl) {
    const origin = this.normalizeWebsite(websiteUrl);
    if (!origin) return null;

    // Check common paths directly
    const commonPaths = ['/careers', '/jobs', '/about/careers', '/join-us', '/openings'];
    for (const path of commonPaths) {
      try {
        const testUrl = `${origin}${path}`;
        const res = await ComplianceService.safeFetch(testUrl, { method: 'GET', timeout: 6000 });
        if (res.ok) {
          const finalUrl = res.url || testUrl;
          const html = await res.text();
          const atsInfo = this.detectAts(html, finalUrl);
          return {
            careerUrl: finalUrl,
            ats: atsInfo.ats,
            atsToken: atsInfo.token,
            html,
          };
        }
      } catch {}
    }

    // Inspect homepage for career links
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
            (text.includes('career') || text.includes('job') || text.includes('work with us') || text.includes('join our team'))
          ) {
            foundHref = href;
            return false; // break
          }
        });

        if (foundHref) {
          const fullCareerUrl = new URL(foundHref, origin).href;
          const atsInfo = this.detectAts(homeHtml, fullCareerUrl);
          return {
            careerUrl: fullCareerUrl,
            ats: atsInfo.ats,
            atsToken: atsInfo.token,
            html: homeHtml,
          };
        }
      }
    } catch {}

    return { careerUrl: origin, ats: 'Custom website', atsToken: null, html: '' };
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
