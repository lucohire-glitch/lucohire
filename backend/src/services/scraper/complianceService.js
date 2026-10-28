/**
 * Compliance & Ethics Service for LucoHire Scraping Engine
 * Enforces robots.txt, honest user-agent, SSRF defense, and rate-limits.
 */

const robotsCache = new Map(); // domain -> { rules, crawlDelay, timestamp }

export const ComplianceService = {
  USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 (LucoHireBot/2.0; +https://lucohire.com/bot; bot@lucohire.com)',

  /**
   * SSRF Protection: Blocks requests to localhost, internal IPs, cloud metadata endpoints
   */
  isSafeUrl(urlString) {
    try {
      const parsed = new URL(urlString);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return false;
      }
      const host = parsed.hostname.toLowerCase();
      // Block localhost, private IPs and cloud metadata
      if (
        host === 'localhost' ||
        host.endsWith('.local') ||
        host === '127.0.0.1' ||
        host === '0.0.0.0' ||
        host === '::1' ||
        host === '169.254.169.254' || // AWS/GCP metadata
        host.startsWith('10.') ||
        host.startsWith('192.168.') ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)
      ) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Fetches and parses robots.txt for a domain
   */
  async getRobotsRules(domain) {
    const cached = robotsCache.get(domain);
    if (cached && Date.now() - cached.timestamp < 3600 * 1000) {
      return cached;
    }

    const robotsUrl = `https://${domain}/robots.txt`;
    if (!this.isSafeUrl(robotsUrl)) {
      return { allowed: false, crawlDelay: 0, disallows: [], sitemaps: [], reason: 'Unsafe domain' };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(robotsUrl, {
        headers: { 'User-Agent': this.USER_AGENT },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        // If 404 or no robots.txt, scraping standard says it's generally allowed
        const ruleObj = { allowed: true, crawlDelay: 1, disallows: [], sitemaps: [], timestamp: Date.now() };
        robotsCache.set(domain, ruleObj);
        return ruleObj;
      }

      const text = await res.text();
      const lines = text.split('\n').map(l => l.trim());
      const disallows = [];
      const allows = [];
      const sitemaps = [];
      let crawlDelay = 1;
      let appliesToUs = false;

      for (const line of lines) {
        if (/^User-agent:\s*/i.test(line)) {
          const agent = line.replace(/^User-agent:\s*/i, '').trim();
          appliesToUs = agent === '*' || /LucoHireBot/i.test(agent);
        } else if (appliesToUs && /^Disallow:\s*/i.test(line)) {
          const path = line.replace(/^Disallow:\s*/i, '').trim();
          if (path) disallows.push(path);
        } else if (appliesToUs && /^Allow:\s*/i.test(line)) {
          const path = line.replace(/^Allow:\s*/i, '').trim();
          if (path) allows.push(path);
        } else if (appliesToUs && /^Crawl-delay:\s*/i.test(line)) {
          const delay = parseInt(line.replace(/^Crawl-delay:\s*/i, ''), 10);
          if (!isNaN(delay)) crawlDelay = Math.max(delay, 1);
        } else if (/^Sitemap:\s*/i.test(line)) {
          const sm = line.replace(/^Sitemap:\s*/i, '').trim();
          if (sm && this.isSafeUrl(sm)) sitemaps.push(sm);
        }
      }

      const ruleObj = { allowed: true, crawlDelay, disallows, allows, sitemaps, timestamp: Date.now() };
      robotsCache.set(domain, ruleObj);
      return ruleObj;
    } catch (err) {
      // Network error or timeout: allow with conservative delay
      return { allowed: true, crawlDelay: 2, disallows: [], allows: [], sitemaps: [], timestamp: Date.now() };
    }
  },

  /**
   * Retrieves any sitemaps discovered from robots.txt
   */
  async getRobotsSitemaps(domain) {
    const rules = await this.getRobotsRules(domain);
    return rules.sitemaps || [];
  },

  /**
   * Check if a specific URL path is permitted by robots.txt
   * Honors RFC 9309: Longest matching rule (Allow vs Disallow) wins
   */
  async isPathAllowed(fullUrl) {
    try {
      const parsed = new URL(fullUrl);
      const rules = await this.getRobotsRules(parsed.hostname);
      const pathname = parsed.pathname || '/';

      let longestAllow = -1;
      for (const allow of (rules.allows || [])) {
        const cleanAllow = allow.replace(/\$$/, '');
        if (cleanAllow === '/' || pathname === cleanAllow || pathname.startsWith(cleanAllow)) {
          longestAllow = Math.max(longestAllow, cleanAllow.length);
        }
      }

      let longestDisallow = -1;
      for (const disallow of (rules.disallows || [])) {
        const cleanDisallow = disallow.replace(/\$$/, '');
        if (cleanDisallow === '/' || pathname === cleanDisallow || pathname.startsWith(cleanDisallow)) {
          longestDisallow = Math.max(longestDisallow, cleanDisallow.length);
        }
      }

      // If a disallow rule is strictly longer and more specific than any allow rule, block
      if (longestDisallow > -1 && longestDisallow > longestAllow) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  },

  /**
   * Safe fetch with User-Agent, SSRF defense, and timeout
   */
  async safeFetch(url, options = {}) {
    if (!this.isSafeUrl(url)) {
      throw new Error(`SSRF Guard: Blocked request to forbidden target ${url}`);
    }

    const controller = new AbortController();
    const timeoutMs = options.timeout || 12000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const headers = {
      'User-Agent': this.USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml,application/xml,application/json;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      ...(options.headers || {}),
    };

    try {
      const res = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });
      return res;
    } finally {
      clearTimeout(timeoutId);
    }
  }
};
