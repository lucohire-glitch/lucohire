/**
 * Compliance & Ethics Service for LucoHire Scraping Engine
 * Enforces robots.txt, honest user-agent, SSRF defense, and rate-limits.
 */

const robotsCache = new Map(); // domain -> { rules, crawlDelay, timestamp }

const STEALTH_USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.7; rv:130.0) Gecko/20100101 Firefox/130.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36 Edg/127.0.0.0'
];

export const ComplianceService = {
  USER_AGENT: STEALTH_USER_AGENTS[0],
  STEALTH_USER_AGENTS,

  getRandomUserAgent() {
    return STEALTH_USER_AGENTS[Math.floor(Math.random() * STEALTH_USER_AGENTS.length)];
  },

  getStealthHeaders() {
    return {
      'User-Agent': this.getRandomUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml,application/json;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'sec-ch-ua': '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'cache-control': 'no-cache',
    };
  },

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

    const defaultStealth = this.getStealthHeaders();
    const headers = {
      ...defaultStealth,
      ...(options.headers || {}),
    };

    const fetchOptions = {
      ...options,
      headers,
      signal: controller.signal,
    };

    // Proxy support (Residential / Datacenter rotation via SCRAPER_PROXY_URL, HTTPS_PROXY, or HTTP_PROXY)
    const proxyUrl = process.env.SCRAPER_PROXY_URL || process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
    if (proxyUrl && !fetchOptions.dispatcher) {
      try {
        const { ProxyAgent } = await import('undici');
        fetchOptions.dispatcher = new ProxyAgent(proxyUrl);
      } catch {}
    }

    try {
      const res = await fetch(url, fetchOptions);
      return res;
    } catch (err) {
      // Fallback: if bare domain fails (e.g. SSL cert only on www. or *corp.com like aptara.com -> www.aptaracorp.com), retry once
      try {
        const parsed = new URL(url);
        const host = parsed.hostname.toLowerCase();
        const fallbackHosts = [];
        if (!host.startsWith('www.') && host.split('.').length === 2) {
          fallbackHosts.push(`www.${host}`);
          const base = host.split('.')[0];
          const tld = host.split('.')[1];
          fallbackHosts.push(`www.${base}corp.${tld}`);
        }
        for (const fbHost of fallbackHosts) {
          try {
            const fbUrl = new URL(url);
            fbUrl.hostname = fbHost;
            const fbCtrl = new AbortController();
            const fbTimer = setTimeout(() => fbCtrl.abort(), timeoutMs);
            const fbRes = await fetch(fbUrl.href, {
              ...options,
              headers,
              signal: fbCtrl.signal,
            });
            clearTimeout(fbTimer);
            if (fbRes.ok || fbRes.status < 500) {
              return fbRes;
            }
          } catch {}
        }
      } catch {}
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }
};
