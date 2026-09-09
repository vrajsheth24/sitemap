(function (global) {
  class BrowserCrawler {
    constructor(options = {}) {
      this.startUrl = options.url ? this.normalizeUrl(options.url) : '';
      this.maxPages = parseInt(options.maxPages, 10) || 100;
      this.maxDepth = parseInt(options.maxDepth, 10) || 5;
      this.concurrency = Math.min(Math.max(parseInt(options.concurrency, 10) || 3, 1), 10);
      this.delay = parseInt(options.delay, 10) || 100;
      this.userAgent = options.userAgent || 'Mozilla/5.0 (compatible; SitemapFlow/1.0; +https://github.com/sitemap-generator)';
      this.respectRobots = options.respectRobots !== false;
      this.includeSubdomains = options.includeSubdomains === true;
      this.includeImages = options.includeImages !== false;
      this.includePatterns = options.includePatterns ? options.includePatterns.split(/\r?\n/).map((p) => p.trim()).filter(Boolean) : [];
      this.excludePatterns = options.excludePatterns ? options.excludePatterns.split(/\r?\n/).map((p) => p.trim()).filter(Boolean) : [];
      this.customHeaders = options.customHeaders || {};

      this.queue = [];
      this.visited = new Map();
      this.discovered = new Set();
      this.blockedByRobotsCount = 0;
      this.isAborted = false;
      this.robots = null;
      this.startTime = null;
      this.endTime = null;

      this.onPage = options.onPage || (() => {});
      this.onProgress = options.onProgress || (() => {});
      this.onLog = options.onLog || (() => {});
      this.onComplete = options.onComplete || (() => {});
      this.onError = options.onError || (() => {});

      try {
        const parsed = new URL(this.startUrl);
        this.hostname = parsed.hostname;
        this.protocol = parsed.protocol;
      } catch (error) {
        throw new Error(`Invalid starting URL: ${options.url}`);
      }
    }

    getBotToken() {
      const ua = this.userAgent.toLowerCase();
      if (ua.includes('googlebot')) return 'Googlebot';
      if (ua.includes('bingbot')) return 'bingbot';
      if (ua.includes('screaming frog')) return 'Screaming Frog SEO Spider';
      if (ua.includes('slurp')) return 'slurp';
      if (ua.includes('yandex')) return 'yandex';
      if (ua.includes('baiduspider')) return 'baiduspider';
      if (ua.includes('sitemapbot') || ua.includes('sitemapflow')) return 'SitemapBot';
      return '*';
    }

    normalizeUrl(rawUrl, baseUrl = null) {
      try {
        const resolved = baseUrl ? new URL(rawUrl, baseUrl) : new URL(rawUrl);

        if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') {
          return null;
        }

        resolved.hash = '';
        const path = resolved.pathname;
        if (path.length > 1 && path.endsWith('/')) {
          resolved.pathname = path.slice(0, -1);
        }

        return resolved.href;
      } catch (error) {
        return null;
      }
    }

    isAllowedDomain(targetUrl) {
      try {
        const parsed = new URL(targetUrl);
        if (this.includeSubdomains) {
          return parsed.hostname === this.hostname || parsed.hostname.endsWith('.' + this.hostname);
        }
        return parsed.hostname === this.hostname;
      } catch (error) {
        return false;
      }
    }

    matchesPatterns(urlStr) {
      for (const pattern of this.excludePatterns) {
        try {
          const reg = new RegExp(pattern, 'i');
          if (reg.test(urlStr)) return false;
        } catch (error) {
          if (urlStr.includes(pattern)) return false;
        }
      }

      if (this.includePatterns.length > 0) {
        let matched = false;
        for (const pattern of this.includePatterns) {
          try {
            const reg = new RegExp(pattern, 'i');
            if (reg.test(urlStr)) {
              matched = true;
              break;
            }
          } catch (error) {
            if (urlStr.includes(pattern)) {
              matched = true;
              break;
            }
          }
        }
        if (!matched) return false;
      }

      const ignoreExtensions = /\.(pdf|zip|tar|gz|rar|exe|dmg|iso|mp3|mp4|avi|mov|wmv|wav|ogg|doc|docx|ppt|pptx|xls|xlsx|apk|css|js|woff|woff2|ttf|eot|svg|ico)$/i;
      if (ignoreExtensions.test(urlStr.split('?')[0])) {
        return false;
      }

      return true;
    }

    parseRobotsTxt(robotsText) {
      const lines = robotsText.split(/\r?\n/);
      const agents = new Map();
      let currentAgent = null;

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        const [key, ...rest] = trimmed.split(':');
        const value = rest.join(':').trim();
        const directive = key.trim().toLowerCase();

        if (directive === 'user-agent') {
          currentAgent = value.toLowerCase();
          if (!agents.has(currentAgent)) {
            agents.set(currentAgent, { allow: [], disallow: [] });
          }
        } else if (currentAgent && (directive === 'allow' || directive === 'disallow')) {
          const entries = agents.get(currentAgent);
          if (entries) {
            if (directive === 'allow') entries.allow.push(value);
            else entries.disallow.push(value);
          }
        }
      }

      const group = agents.get('*') || agents.get(this.getBotToken().toLowerCase()) || null;
      if (!group) return { allow: [], disallow: [] };

      return group;
    }

    async fetchRobotsTxt() {
      if (!this.respectRobots) {
        this.onLog({ type: 'info', message: 'Skipping robots.txt compliance per settings' });
        return;
      }

      const robotsUrl = `${this.protocol}//${this.hostname}/robots.txt`;
      this.onLog({ type: 'info', message: `Checking ${robotsUrl}...` });

      try {
        const response = await fetch(robotsUrl, {
          method: 'GET',
          credentials: 'omit',
          headers: { 'User-Agent': this.userAgent, ...this.customHeaders }
        });

        if (response.ok) {
          const text = await response.text();
          this.robots = this.parseRobotsTxt(text);
          this.onLog({ type: 'success', message: 'Successfully loaded and parsed robots.txt' });
        } else {
          this.onLog({ type: 'info', message: `robots.txt not found or returned HTTP ${response.status}. Allowing all routes.` });
        }
      } catch (error) {
        this.onLog({ type: 'warning', message: `Failed to fetch robots.txt (${error.message}). Proceeding.` });
      }
    }

    isRobotsAllowed(urlStr) {
      if (!this.respectRobots || !this.robots) return true;
      const botToken = this.getBotToken().toLowerCase();
      const rules = this.robots;

      let matched = false;
      for (const rule of rules.disallow || []) {
        if (!rule) continue;
        const pattern = rule.replace(/\*/g, '.*');
        const matcher = new RegExp(pattern, 'i');
        if (matcher.test(urlStr)) {
          matched = true;
          break;
        }
      }

      if (matched) {
        this.blockedByRobotsCount += 1;
        return false;
      }

      if (this.robots.allow) {
        for (const rule of this.robots.allow || []) {
          if (!rule) continue;
          const pattern = rule.replace(/\*/g, '.*');
          const matcher = new RegExp(pattern, 'i');
          if (matcher.test(urlStr)) {
            return true;
          }
        }
      }

      return true;
    }

    async start() {
      this.startTime = Date.now();
      this.onLog({ type: 'info', message: `Starting browser crawler on ${this.startUrl} (Max Pages: ${this.maxPages}, Max Depth: ${this.maxDepth}, Concurrency: ${this.concurrency})` });

      await this.fetchRobotsTxt();

      this.queue.push({ url: this.startUrl, depth: 0, referrer: null });
      this.discovered.add(this.startUrl);

      await this.processQueue();

      this.endTime = Date.now();
      const duration = ((this.endTime - this.startTime) / 1000).toFixed(2);

      if (this.visited.size === 0 && this.blockedByRobotsCount > 0) {
        this.onLog({
          type: 'error',
          message: 'Blocked by target site robots.txt rules. Tip: Uncheck "Respect robots.txt" in Options.'
        });
      }

      this.onLog({ type: 'success', message: `Crawl finished in ${duration}s. Total pages indexed: ${this.visited.size}` });

      const results = Array.from(this.visited.values());
      this.onComplete({
        total: results.length,
        duration: parseFloat(duration),
        pages: results,
        blockedByRobots: this.visited.size === 0 && this.blockedByRobotsCount > 0
      });

      return results;
    }

    abort() {
      this.isAborted = true;
      this.onLog({ type: 'warning', message: 'Crawl cancelled by user.' });
    }

    async processQueue() {
      const tasks = new Set();

      while ((!this.queue.length && tasks.size === 0) === false && !this.isAborted) {
        while (tasks.size < this.concurrency && this.queue.length > 0 && !this.isAborted) {
          const item = this.queue.shift();
          if (!item) break;

          const task = this.crawlPage(item).finally(() => tasks.delete(task));
          tasks.add(task);
        }

        if (tasks.size > 0) {
          await Promise.race(Array.from(tasks));
        } else {
          break;
        }

        if (this.delay > 0 && this.queue.length > 0) {
          await new Promise((resolve) => setTimeout(resolve, Math.min(this.delay, 500)));
        }
      }

      await Promise.allSettled(Array.from(tasks));
    }

    async crawlPage(item) {
      const { url, depth, referrer } = item;

      if (this.visited.has(url) || this.isAborted) {
        return;
      }

      if (!this.isRobotsAllowed(url)) {
        this.onLog({ type: 'warning', message: `Skipping (blocked by robots.txt): ${url}` });
        return;
      }

      const pageStartTime = Date.now();
      const pageData = {
        url,
        depth,
        referrer,
        status: 0,
        statusText: '',
        title: '',
        description: '',
        h1: '',
        canonical: '',
        metaRobots: '',
        contentType: '',
        size: 0,
        responseTime: 0,
        lastModified: null,
        internalLinksCount: 0,
        externalLinksCount: 0,
        images: [],
        error: null,
        crawledAt: new Date().toISOString()
      };

      try {
        const response = await fetch(url, {
          method: 'GET',
          credentials: 'omit',
          mode: 'cors',
          redirect: 'follow',
          headers: {
            'User-Agent': this.userAgent,
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            ...this.customHeaders
          }
        });

        const finalUrl = response.url || url;
        const contentType = response.headers.get('content-type') || '';
        const text = await response.text();

        pageData.responseTime = Date.now() - pageStartTime;
        pageData.status = response.status;
        pageData.statusText = response.statusText || '';
        pageData.contentType = contentType;
        pageData.size = new Blob([text]).size;

        const isHtml = contentType.includes('text/html') || contentType.includes('application/xhtml');

        if (response.status >= 200 && response.status < 300 && isHtml) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(text, 'text/html');
          pageData.title = doc.querySelector('title')?.textContent?.trim() || '';
          pageData.description = doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || doc.querySelector('meta[property="og:description"]')?.getAttribute('content')?.trim() || '';
          pageData.h1 = doc.querySelector('h1')?.textContent?.trim() || '';
          pageData.canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href')?.trim() || '';
          pageData.metaRobots = doc.querySelector('meta[name="robots"]')?.getAttribute('content')?.trim() || '';
          pageData.lastModified = new Date().toISOString();

          if (this.includeImages) {
            const seenImages = new Set();
            doc.querySelectorAll('img[src]').forEach((img) => {
              const src = img.getAttribute('src');
              const resolvedSrc = this.normalizeUrl(src, finalUrl);
              if (resolvedSrc && !seenImages.has(resolvedSrc)) {
                seenImages.add(resolvedSrc);
                pageData.images.push({
                  url: resolvedSrc,
                  alt: img.getAttribute('alt')?.trim() || '',
                  title: img.getAttribute('title')?.trim() || ''
                });
              }
            });
          }

          const extractedLinks = [];
          let internalCount = 0;
          let externalCount = 0;

          doc.querySelectorAll('a[href]').forEach((link) => {
            const href = link.getAttribute('href');
            if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
              return;
            }

            const normalized = this.normalizeUrl(href, finalUrl);
            if (!normalized) return;

            if (this.isAllowedDomain(normalized)) {
              internalCount += 1;
              extractedLinks.push(normalized);
            } else {
              externalCount += 1;
            }
          });

          pageData.internalLinksCount = internalCount;
          pageData.externalLinksCount = externalCount;

          const isNoFollowPage = pageData.metaRobots.toLowerCase().includes('nofollow');
          if (depth < this.maxDepth && !isNoFollowPage) {
            for (const nextUrl of extractedLinks) {
              if (!this.discovered.has(nextUrl) && this.matchesPatterns(nextUrl)) {
                this.discovered.add(nextUrl);
                this.queue.push({ url: nextUrl, depth: depth + 1, referrer: url });
              }
            }
          }

          this.visited.set(url, pageData);
          this.onPage(pageData);
          this.onProgress({
            crawled: this.visited.size,
            queued: this.queue.length,
            maxPages: this.maxPages,
            percent: Math.min(100, Math.round((this.visited.size / Math.max(1, this.maxPages)) * 100)),
            currentUrl: url
          });
          return;
        }

        if (response.status >= 300 && response.status < 400) {
          const nextUrl = response.headers.get('location');
          if (nextUrl) {
            const redirected = this.normalizeUrl(nextUrl, finalUrl);
            if (redirected && !this.discovered.has(redirected) && this.isAllowedDomain(redirected)) {
              this.discovered.add(redirected);
              this.queue.push({ url: redirected, depth, referrer: url });
            }
          }
        }
      } catch (error) {
        pageData.responseTime = Date.now() - pageStartTime;
        pageData.error = error.message;
        pageData.status = 0;
        pageData.statusText = 'CORS blocked or network error';

        if (error && error.message && error.message.includes('CORS')) {
          pageData.error = 'This website does not allow browser-based crawling because of CORS restrictions. A server-side crawler is required for this domain.';
          this.onLog({ type: 'error', message: pageData.error });
          this.onError({ message: pageData.error });
        } else {
          this.onLog({ type: 'error', message: `Error fetching ${url}: ${error.message}` });
        }
      }

      if (!this.visited.has(url)) {
        this.visited.set(url, pageData);
        this.onPage(pageData);
      }

      this.onProgress({
        crawled: this.visited.size,
        queued: this.queue.length,
        maxPages: this.maxPages,
        percent: Math.min(100, Math.round((this.visited.size / Math.max(1, this.maxPages)) * 100)),
        currentUrl: url
      });
    }
  }

  global.BrowserCrawler = BrowserCrawler;
})(typeof window !== 'undefined' ? window : globalThis);
