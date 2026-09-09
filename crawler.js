const axios = require('axios');
const cheerio = require('cheerio');
const robotsParser = require('robots-parser');
const { URL } = require('url');

class WebCrawler {
  constructor(options = {}) {
    this.startUrl = options.url ? this.normalizeUrl(options.url) : '';
    this.maxPages = parseInt(options.maxPages) || 100;
    this.maxDepth = parseInt(options.maxDepth) || 5;
    this.concurrency = Math.min(Math.max(parseInt(options.concurrency) || 3, 1), 10);
    this.delay = parseInt(options.delay) || 100; // ms
    this.userAgent = options.userAgent || 'Mozilla/5.0 (compatible; SitemapBot/1.0; +https://github.com/sitemap-generator)';
    this.respectRobots = options.respectRobots !== false;
    this.includeSubdomains = options.includeSubdomains === true;
    this.includeImages = options.includeImages !== false;
    this.includePatterns = options.includePatterns ? options.includePatterns.split('\n').map(p => p.trim()).filter(Boolean) : [];
    this.excludePatterns = options.excludePatterns ? options.excludePatterns.split('\n').map(p => p.trim()).filter(Boolean) : [];
    this.customHeaders = options.customHeaders || {};

    this.queue = [];
    this.visited = new Map(); // url -> pageData
    this.discovered = new Set();
    this.blockedByRobotsCount = 0;
    this.activeWorkers = 0;
    this.isAborted = false;
    this.isPaused = false;
    this.robots = null;
    this.startTime = null;
    this.endTime = null;

    // Events
    this.onPage = options.onPage || (() => {});
    this.onProgress = options.onProgress || (() => {});
    this.onLog = options.onLog || (() => {});
    this.onComplete = options.onComplete || (() => {});
    this.onError = options.onError || (() => {});

    try {
      this.originUrlObj = new URL(this.startUrl);
      this.hostname = this.originUrlObj.hostname;
      this.protocol = this.originUrlObj.protocol;
    } catch (e) {
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
      let resolved;
      if (baseUrl) {
        resolved = new URL(rawUrl, baseUrl);
      } else {
        resolved = new URL(rawUrl);
      }

      // Only allow http and https
      if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') {
        return null;
      }

      // Remove hash fragments
      resolved.hash = '';

      // Standardize trailing slash: keep root slash, remove ending slash for other paths
      let path = resolved.pathname;
      if (path.length > 1 && path.endsWith('/')) {
        resolved.pathname = path.slice(0, -1);
      }

      return resolved.href;
    } catch (err) {
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
    } catch (e) {
      return false;
    }
  }

  matchesPatterns(urlStr) {
    // Check exclude patterns first
    for (const pattern of this.excludePatterns) {
      try {
        const reg = new RegExp(pattern, 'i');
        if (reg.test(urlStr)) return false;
      } catch (e) {
        if (urlStr.includes(pattern)) return false;
      }
    }

    // Check include patterns if any are specified
    if (this.includePatterns.length > 0) {
      let matched = false;
      for (const pattern of this.includePatterns) {
        try {
          const reg = new RegExp(pattern, 'i');
          if (reg.test(urlStr)) {
            matched = true;
            break;
          }
        } catch (e) {
          if (urlStr.includes(pattern)) {
            matched = true;
            break;
          }
        }
      }
      if (!matched) return false;
    }

    // Exclude common binary/asset extensions from page crawl
    const ignoreExtensions = /\.(pdf|zip|tar|gz|rar|exe|dmg|iso|mp3|mp4|avi|mov|wmv|wav|ogg|doc|docx|ppt|pptx|xls|xlsx|apk|css|js|woff|woff2|ttf|eot|svg|ico)$/i;
    if (ignoreExtensions.test(urlStr.split('?')[0])) {
      return false;
    }

    return true;
  }

  async fetchRobotsTxt() {
    if (!this.respectRobots) {
      this.onLog({ type: 'info', message: 'Skipping robots.txt compliance per settings' });
      return;
    }

    const robotsUrl = `${this.protocol}//${this.hostname}/robots.txt`;
    this.onLog({ type: 'info', message: `Checking ${robotsUrl}...` });

    try {
      const response = await axios.get(robotsUrl, {
        timeout: 8000,
        headers: { 'User-Agent': this.userAgent, ...this.customHeaders },
        validateStatus: () => true
      });

      if (response.status === 200 && typeof response.data === 'string') {
        this.robots = robotsParser(robotsUrl, response.data);
        this.onLog({ type: 'success', message: `Successfully loaded and parsed robots.txt` });
      } else {
        this.onLog({ type: 'info', message: `robots.txt not found or returned HTTP ${response.status}. Allowing all routes.` });
      }
    } catch (err) {
      this.onLog({ type: 'warning', message: `Failed to fetch robots.txt (${err.message}). Proceeding.` });
    }
  }

  isRobotsAllowed(urlStr) {
    if (!this.respectRobots || !this.robots) return true;
    const botToken = this.getBotToken();
    const allowed = this.robots.isAllowed(urlStr, botToken);
    if (!allowed) {
      this.blockedByRobotsCount++;
    }
    return allowed;
  }

  async start() {
    this.startTime = Date.now();
    this.onLog({ type: 'info', message: `Starting crawler on ${this.startUrl} (Max Pages: ${this.maxPages}, Max Depth: ${this.maxDepth}, Concurrency: ${this.concurrency})` });

    await this.fetchRobotsTxt();

    // Enqueue root URL
    const initialUrl = this.startUrl;
    this.queue.push({ url: initialUrl, depth: 0, referrer: null });
    this.discovered.add(initialUrl);

    await this.processQueue();

    this.endTime = Date.now();
    const duration = ((this.endTime - this.startTime) / 1000).toFixed(2);
    
    if (this.visited.size === 0 && this.blockedByRobotsCount > 0) {
      this.onLog({
        type: 'error',
        message: `Blocked by target site's robots.txt rules. Tip: Uncheck 'Respect robots.txt' in Options or switch User-Agent to Googlebot/Browser.`
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
    const activeTasks = new Set();

    while ((this.queue.length > 0 || activeTasks.size > 0) && !this.isAborted) {
      if (this.visited.size >= this.maxPages) {
        this.onLog({ type: 'info', message: `Reached maximum page limit of ${this.maxPages}. Finishing active tasks.` });
        break;
      }

      while (activeTasks.size < this.concurrency && this.queue.length > 0 && (this.visited.size + activeTasks.size) < this.maxPages && !this.isAborted) {
        const item = this.queue.shift();
        if (!item) break;

        const taskPromise = this.crawlPage(item).finally(() => {
          activeTasks.delete(taskPromise);
        });
        activeTasks.add(taskPromise);
      }

      if (activeTasks.size > 0) {
        await Promise.race(Array.from(activeTasks));
      }

      if (this.delay > 0 && this.queue.length > 0) {
        await new Promise(r => setTimeout(r, Math.min(this.delay, 500)));
      }
    }

    await Promise.allSettled(Array.from(activeTasks));
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
    let pageData = {
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
      const response = await axios.get(url, {
        timeout: 12000,
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          ...this.customHeaders
        },
        maxRedirects: 5,
        validateStatus: () => true,
        responseType: 'arraybuffer'
      });

      pageData.responseTime = Date.now() - pageStartTime;
      pageData.status = response.status;
      pageData.statusText = response.statusText;
      pageData.contentType = response.headers['content-type'] || '';
      pageData.size = response.data ? response.data.length : 0;
      pageData.lastModified = response.headers['last-modified'] ? new Date(response.headers['last-modified']).toISOString() : new Date().toISOString();

      const isHtml = pageData.contentType.includes('text/html') || pageData.contentType.includes('application/xhtml');

      if (response.status >= 200 && response.status < 300 && isHtml) {
        const html = response.data.toString('utf-8');
        const $ = cheerio.load(html);

        pageData.title = $('title').first().text().trim() || '';
        pageData.description = $('meta[name="description"]').attr('content')?.trim() || $('meta[property="og:description"]').attr('content')?.trim() || '';
        pageData.h1 = $('h1').first().text().trim() || '';
        pageData.canonical = $('link[rel="canonical"]').attr('href')?.trim() || '';
        pageData.metaRobots = $('meta[name="robots"]').attr('content')?.trim() || '';

        // Extract Images if enabled
        if (this.includeImages) {
          const seenImg = new Set();
          $('img[src]').each((_, el) => {
            const src = $(el).attr('src');
            const resolvedSrc = this.normalizeUrl(src, url);
            if (resolvedSrc && !seenImg.has(resolvedSrc)) {
              seenImg.add(resolvedSrc);
              pageData.images.push({
                url: resolvedSrc,
                alt: $(el).attr('alt')?.trim() || '',
                title: $(el).attr('title')?.trim() || ''
              });
            }
          });
        }

        // Extract Links
        const extractedLinks = [];
        let internalCount = 0;
        let externalCount = 0;

        $('a[href]').each((_, el) => {
          const href = $(el).attr('href');
          if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
            return;
          }

          const normalized = this.normalizeUrl(href, url);
          if (!normalized) return;

          if (this.isAllowedDomain(normalized)) {
            internalCount++;
            extractedLinks.push(normalized);
          } else {
            externalCount++;
          }
        });

        pageData.internalLinksCount = internalCount;
        pageData.externalLinksCount = externalCount;

        // Add to queue if depth permits and no nofollow
        const isNoFollowPage = pageData.metaRobots.toLowerCase().includes('nofollow');
        if (depth < this.maxDepth && !isNoFollowPage) {
          for (const nextUrl of extractedLinks) {
            if (!this.discovered.has(nextUrl) && this.matchesPatterns(nextUrl)) {
              this.discovered.add(nextUrl);
              this.queue.push({
                url: nextUrl,
                depth: depth + 1,
                referrer: url
              });
            }
          }
        }
      } else if (response.status >= 300 && response.status < 400) {
        const redirectLocation = response.headers['location'];
        if (redirectLocation) {
          const nextUrl = this.normalizeUrl(redirectLocation, url);
          if (nextUrl && !this.discovered.has(nextUrl) && this.isAllowedDomain(nextUrl)) {
            this.discovered.add(nextUrl);
            this.queue.push({ url: nextUrl, depth: depth, referrer: url });
          }
        }
      }
    } catch (err) {
      pageData.responseTime = Date.now() - pageStartTime;
      pageData.error = err.message;
      pageData.status = err.response ? err.response.status : 500;
      pageData.statusText = err.code || err.message;
      this.onLog({ type: 'error', message: `Error fetching ${url}: ${err.message}` });
    }

    this.visited.set(url, pageData);

    this.onPage(pageData);
    this.onProgress({
      crawled: this.visited.size,
      queued: this.queue.length,
      maxPages: this.maxPages,
      percent: Math.min(100, Math.round((this.visited.size / Math.min(this.maxPages, this.visited.size + this.queue.length || 1)) * 100)),
      currentUrl: url,
      statusCode: pageData.status
    });

    const statusBadge = pageData.status >= 200 && pageData.status < 300 ? 'success' : (pageData.status >= 300 && pageData.status < 400 ? 'info' : 'error');
    this.onLog({
      type: statusBadge,
      message: `[${pageData.status}] ${url} (${pageData.responseTime}ms) - Title: "${pageData.title.slice(0, 40)}${pageData.title.length > 40 ? '...' : ''}"`
    });
  }
}

module.exports = WebCrawler;
