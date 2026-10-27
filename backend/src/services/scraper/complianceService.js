/**
 * Compliance & Ethics Service for LucoHire Scraping Engine
 * Enforces robots.txt, honest user-agent, SSRF defense, and rate-limits.
 */

const robotsCache = new Map(); // domain -> { rules, crawlDelay, timestamp }

export const ComplianceService = {
  USER_AGENT: 'LucoHireBot/1.0 (+https://lucohire.com/bot; bot@lucohire.com)',

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
      return { allowed: false, crawlDelay: 0, reason: 'Unsafe domain' };
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
        const ruleObj = { allowed: true, crawlDelay: 1, disallows: [], timestamp: Date.now() };
        robotsCache.set(domain, ruleObj);
        return ruleObj;
      }

      const text = await res.text();
      const lines = text.split('\n').map(l => l.trim());
      const disallows = [];
      let crawlDelay = 1;
      let appliesToUs = false;

      for (const line of lines) {
        if (/^User-agent:\s*/i.test(line)) {
          const agent = line.replace(/^User-agent:\s*/i, '').trim();
          appliesToUs = agent === '*' || /LucoHireBot/i.test(agent);
        } else if (appliesToUs && /^Disallow:\s*/i.test(line)) {
          const path = line.replace(/^Disallow:\s*/i, '').trim();
          if (path) disallows.push(path);
        } else if (appliesToUs && /^Crawl-delay:\s*/i.test(line)) {
          const delay = parseInt(line.replace(/^Crawl-delay:\s*/i, ''), 10);
          if (!isNaN(delay)) crawlDelay = Math.max(delay, 1);
        }
      }

      const ruleObj = { allowed: true, crawlDelay, disallows, timestamp: Date.now() };
      robotsCache.set(domain, ruleObj);
      return ruleObj;
    } catch (err) {
      // Network error or timeout: allow with conservative delay
      return { allowed: true, crawlDelay: 2, disallows: [], timestamp: Date.now() };
    }
  },

  /**
   * Check if a specific URL path is permitted by robots.txt
   */
  async isPathAllowed(fullUrl) {
    try {
      const parsed = new URL(fullUrl);
      const rules = await this.getRobotsRules(parsed.hostname);
      const pathname = parsed.pathname;

      for (const disallow of rules.disallows) {
        if (disallow === '/') return false;
        if (pathname.startsWith(disallow)) return false;
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
