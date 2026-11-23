// Universal Client-Side Web Crawler & Discovery Engine
// Crawls ANY website dynamically via recursive BFS link extraction, SEO parsing, and streaming progress

import { parseRobotsTxt, getRulesForAgent, checkUrlAgainstRules } from './robotsTxt.js';

export function isLocalEnvironment() {
  if (typeof window === 'undefined') return true;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host.endsWith('.local');
}

const JINA_TURBO_HEADERS = {
  'X-Return-Format': 'html',
  'X-Wait-For-Selector': 'none',
  'X-Timeout': '8',
  'X-With-Generated-Alt': 'false',
  'X-No-Cache': 'true'
};

// ---------------------------------------------------------------------------
// Comprehensive on-page metadata extractor for SEO, AEO, and GEO signals
// ---------------------------------------------------------------------------
export function extractPageMetadata(fetchResult, url, depth = 1, hostname = '') {
  let doc = null;
  if (typeof DOMParser !== 'undefined' && !fetchResult.isMarkdown && fetchResult.html) {
    try {
      const parser = new DOMParser();
      doc = parser.parseFromString(fetchResult.html, 'text/html');
    } catch (e) {
      doc = null;
    }
  }

  // 1. Title
  const rawTitle = doc?.querySelector('title')?.textContent?.trim()
    || fetchResult.html?.match(/^Title:\s*(.+)$/im)?.[1]?.trim()
    || fetchResult.html?.match(/^#\s+(.+)$/im)?.[1]?.trim()
    || '';

  // 2. Meta description
  const metaDescTag = doc?.querySelector('meta[name="description"]')?.getAttribute('content')?.trim()
    || doc?.querySelector('meta[property="og:description"]')?.getAttribute('content')?.trim()
    || doc?.querySelector('meta[name="twitter:description"]')?.getAttribute('content')?.trim()
    || fetchResult.html?.match(/^Description:\s*(.+)$/im)?.[1]?.trim();

  // 3. Headings H1, H2, H3
  const h1Elements = doc ? Array.from(doc.querySelectorAll('h1')).map(el => el.textContent.trim()).filter(Boolean) : [];
  const rawH1 = h1Elements[0] || fetchResult.html?.match(/^#\s+(.+)$/im)?.[1]?.trim() || '';
  const h1Count = h1Elements.length || (rawH1 ? 1 : 0);

  const h2Elements = doc ? Array.from(doc.querySelectorAll('h2')).map(el => el.textContent.trim()).filter(Boolean) : [];
  const h3Elements = doc ? Array.from(doc.querySelectorAll('h3')).map(el => el.textContent.trim()).filter(Boolean) : [];
  const allHeadings = [...h2Elements, ...h3Elements];

  // Question Headings (AEO signal: Perplexity & AI Overviews target question-format headings)
  const questionRegex = /^(what|how|why|when|where|who|which|can|is|are|will|should|do|does|could|would)\b|\?$/i;
  const questionHeadings = allHeadings.filter(h => questionRegex.test(h.trim()));

  // 4. Canonical & Robots
  const canonicalHref = doc?.querySelector('link[rel="canonical"]')?.getAttribute('href')?.trim() || '';
  const metaRobots = doc?.querySelector('meta[name="robots"]')?.getAttribute('content') || '';
  const isNoFollow = metaRobots.toLowerCase().includes('nofollow');
  const isNoIndex = metaRobots.toLowerCase().includes('noindex');

  // Check if canonical matches current URL
  let isCanonicalMatching = true;
  if (canonicalHref) {
    try {
      const canonObj = new URL(canonicalHref, url);
      const urlObj = new URL(url);
      isCanonicalMatching = canonObj.origin === urlObj.origin &&
        canonObj.pathname.replace(/\/+$/, '') === urlObj.pathname.replace(/\/+$/, '');
    } catch (e) {
      isCanonicalMatching = false;
    }
  }

  // 5. Content text, word count, paragraphs
  const bodyText = doc ? (doc.body?.textContent || '') : (fetchResult.html || '').replace(/!?\[[^\]]*\]\([^)]*\)/g, ' ');
  const wordCount = (bodyText.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || []).length;
  const paragraphs = doc ? Array.from(doc.querySelectorAll('main p, article p, p')).map(p => p.textContent.replace(/\s+/g, ' ').trim()).filter(p => p.length > 20) : [];
  const paragraphsCount = paragraphs.length;

  // Direct answerability (AEO signal: 25-85 words definition/answer in early paragraph)
  let hasDirectAnswer = false;
  let directAnswerSample = '';
  for (let i = 0; i < Math.min(3, paragraphs.length); i++) {
    const p = paragraphs[i];
    const words = p.split(/\s+/).length;
    if (words >= 25 && words <= 85) {
      hasDirectAnswer = true;
      directAnswerSample = p.slice(0, 160) + (p.length > 160 ? '...' : '');
      break;
    }
  }

  // 6. FAQ & Q&A Detection (AEO signal)
  let faqCount = 0;
  if (doc) {
    const detailsCount = doc.querySelectorAll('details').length;
    const faqClasses = doc.querySelectorAll('[class*="faq" i], [id*="faq" i], [class*="accordion" i]').length;
    const qMatches = (bodyText.match(/\b(Q:|Question:|Q\d+:)\b/gi) || []).length;
    faqCount = Math.max(detailsCount, faqClasses, qMatches);
  }
  const hasFaq = faqCount > 0;

  // 7. Structured Lists & Tables (AEO/GEO signal)
  const listsCount = doc ? doc.querySelectorAll('ul, ol').length : 0;
  const tablesCount = doc ? doc.querySelectorAll('table').length : 0;
  const hasLists = listsCount > 0;
  const hasTables = tablesCount > 0;

  // 8. Author & E-E-A-T Signals (AEO/GEO trust)
  const authorName = doc?.querySelector('meta[name="author"]')?.getAttribute('content')?.trim()
    || doc?.querySelector('[rel="author"]')?.textContent?.trim()
    || doc?.querySelector('[class*="author" i]')?.textContent?.trim()?.slice(0, 50)
    || '';
  const datePublished = doc?.querySelector('meta[property="article:published_time"]')?.getAttribute('content')
    || doc?.querySelector('time')?.getAttribute('datetime')
    || doc?.querySelector('time')?.textContent?.trim()
    || '';
  const hasAuthor = !!authorName;
  const hasDate = !!datePublished;

  // 9. Structured Data (Schema.org JSON-LD - GEO Signal)
  const schemas = [];
  if (doc) {
    const ldScripts = doc.querySelectorAll('script[type="application/ld+json"]');
    ldScripts.forEach(script => {
      try {
        const parsed = JSON.parse(script.textContent || '{}');
        const extractType = (obj) => {
          if (!obj) return;
          if (obj['@type']) {
            if (Array.isArray(obj['@type'])) schemas.push(...obj['@type']);
            else schemas.push(obj['@type']);
          }
          if (Array.isArray(obj['@graph'])) {
            obj['@graph'].forEach(extractType);
          }
        };
        extractType(parsed);
      } catch (e) {}
    });
  }
  const uniqueSchemas = Array.from(new Set(schemas));
  const hasSchema = uniqueSchemas.length > 0;
  const hasFaqSchema = uniqueSchemas.some(s => /faqpage/i.test(s));

  // 10. Information / Fact Density (GEO Signal: numbers, percentages, data points)
  const statMatches = bodyText.match(/\b\d+(\.\d+)?%|\$\d+(\.\d+)?|\b(19\d\d|20\d\d)\b|\b\d{2,}(,\d{3})+\b/g) || [];
  const statDensity = statMatches.length;

  // 11. Images & Alt attributes
  const rawImages = doc ? Array.from(doc.querySelectorAll('img')) : [];
  const images = [];
  const imagesWithoutAlt = [];
  rawImages.forEach(img => {
    const src = img.getAttribute('src') || img.getAttribute('data-src');
    if (!src || src.startsWith('data:') || src.startsWith('blob:')) return;
    try {
      const abs = new URL(src, url).href;
      if (!images.includes(abs) && images.length < 30) images.push(abs);
      const alt = img.getAttribute('alt');
      if (alt === null || alt.trim() === '') {
        if (!imagesWithoutAlt.includes(abs) && imagesWithoutAlt.length < 20) {
          imagesWithoutAlt.push(abs);
        }
      }
    } catch (e) {}
  });

  // 12. External links for citations (GEO Signal)
  const externalLinks = [];
  if (doc) {
    try {
      const currentHost = new URL(url).hostname;
      doc.querySelectorAll('a[href^="http"]').forEach(a => {
        try {
          const href = a.getAttribute('href');
          const extHost = new URL(href).hostname;
          if (extHost && extHost !== currentHost && !extHost.endsWith('.' + currentHost)) {
            if (!externalLinks.includes(href) && externalLinks.length < 20) {
              externalLinks.push(href);
            }
          }
        } catch (e) {}
      });
    } catch (e) {}
  }

  // 13. Mobile & OpenGraph
  const hasViewport = !!doc?.querySelector('meta[name="viewport"]');
  const ogTitle = doc?.querySelector('meta[property="og:title"]')?.getAttribute('content')?.trim() || '';
  const ogDescription = doc?.querySelector('meta[property="og:description"]')?.getAttribute('content')?.trim() || '';
  const ogImage = doc?.querySelector('meta[property="og:image"]')?.getAttribute('content')?.trim() || '';
  const twitterCard = doc?.querySelector('meta[name="twitter:card"]')?.getAttribute('content')?.trim() || '';

  return {
    url,
    title: rawTitle,
    description: metaDescTag || '',
    h1: rawH1,
    h1Count,
    h2Headings: h2Elements,
    h3Headings: h3Elements,
    questionHeadings,
    canonicalHref,
    hasCanonical: !!canonicalHref,
    isCanonicalMatching,
    metaRobots,
    isNoIndex,
    isNoFollow,
    hasViewport,
    imagesCount: images.length,
    images,
    missingAltCount: imagesWithoutAlt.length,
    imagesWithoutAlt,
    wordCount,
    paragraphsCount,
    hasDirectAnswer,
    directAnswerSample,
    hasFaq: hasFaq || hasFaqSchema,
    faqCount,
    hasLists,
    listsCount,
    hasTables,
    tablesCount,
    hasAuthor,
    authorName,
    hasDate,
    datePublished,
    schemas: uniqueSchemas,
    hasSchema,
    hasFaqSchema,
    statDensity,
    externalLinks,
    externalLinksCount: externalLinks.length,
    ogTitle,
    ogDescription,
    ogImage,
    twitterCard,
    statusCode: fetchResult.status || 200,
    loadTime: fetchResult.latency || 100,
    sizeKb: Math.round((fetchResult.html?.length || 0) / 1024) || 1,
    depth,
    links: [],
    fetchFailed: false,
    fetchError: null,
    isIndexable: !isNoIndex,
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: depth === 0 ? 'daily' : depth === 1 ? 'weekly' : 'monthly',
    priority: Math.max(0.2, parseFloat((1.0 - depth * 0.12).toFixed(1)))
  };
}

export function createUnreachedPageObject(url, depth = 1, error = 'Network timeout / CORS restriction', latency = 0) {
  return {
    url,
    title: '',
    description: '',
    h1: '',
    h1Count: 0,
    h2Headings: [],
    h3Headings: [],
    questionHeadings: [],
    canonicalHref: '',
    hasCanonical: false,
    isCanonicalMatching: false,
    metaRobots: '',
    isNoIndex: false,
    isNoFollow: false,
    hasViewport: false,
    imagesCount: 0,
    images: [],
    missingAltCount: 0,
    imagesWithoutAlt: [],
    wordCount: 0,
    paragraphsCount: 0,
    hasDirectAnswer: false,
    directAnswerSample: '',
    hasFaq: false,
    faqCount: 0,
    hasLists: false,
    listsCount: 0,
    hasTables: false,
    tablesCount: 0,
    hasAuthor: false,
    authorName: '',
    hasDate: false,
    datePublished: '',
    schemas: [],
    hasSchema: false,
    hasFaqSchema: false,
    statDensity: 0,
    externalLinks: [],
    externalLinksCount: 0,
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    twitterCard: '',
    statusCode: 0,
    loadTime: latency || 0,
    sizeKb: 0,
    depth,
    links: [],
    fetchFailed: true,
    fetchError: error,
    isIndexable: true,
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: depth === 0 ? 'daily' : depth === 1 ? 'weekly' : 'monthly',
    priority: Math.max(0.2, parseFloat((1.0 - depth * 0.12).toFixed(1)))
  };
}

export class ClientCrawler {
  constructor(options = {}) {
    this.targetUrl = options.url ? this.normalizeUrl(options.url) : '';
    this.maxPages = Math.max(1, parseInt(options.maxPages) || 100);
    this.maxDepth = Math.max(1, parseInt(options.maxDepth) || 4);
    
    const isLocal = isLocalEnvironment();
    const requestedConcurrency = parseInt(options.concurrency) || 6;
    // On live static hosting (GitHub Pages), use polite concurrency (default 2-3) and a small delay to prevent triggering public proxy 429s
    this.concurrency = Math.min(8, Math.max(1, requestedConcurrency));
    this.requestDelayMs = 50;

    this.useCorsProxy = options.useCorsProxy !== false;
    this.customCorsProxy = options.customCorsProxy ? options.customCorsProxy.trim() : '';
    this.restrictToPath = options.restrictToPath === true;
    this.includeImages = options.includeImages !== false;
    this.includeSubdomains = options.includeSubdomains === true;
    this.respectRobots = options.respectRobots !== false;
    this.filterNoindex = options.filterNoindex !== false;
    this.userAgent = options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
    
    this.excludePatterns = options.excludePatterns 
      ? options.excludePatterns.split('\n').map(p => p.trim()).filter(Boolean) 
      : [];
    this.includePatterns = options.includePatterns 
      ? options.includePatterns.split('\n').map(p => p.trim()).filter(Boolean) 
      : [];

    this.onProgress = options.onProgress || (() => {});
    this.onPage = options.onPage || (() => {});
    this.onLog = options.onLog || (() => {});
    this.onComplete = options.onComplete || (() => {});
    this.isAborted = false;
    this.preferredProxy = null; // Remembers the first working proxy to speed up BFS
    this.cache = new Map(); // In-memory session response cache to avoid duplicate HTTP requests

    try {
      const u = new URL(this.targetUrl);
      this.hostname = u.hostname;
      this.protocol = u.protocol;

      // Extract starting directory basePath for optional path scoping (e.g. /Dev/phrtax.cpa/L1/)
      const pathParts = u.pathname.split('/');
      if (/\.[a-z0-9]{2,5}$/i.test(pathParts[pathParts.length - 1])) {
        pathParts.pop(); // remove file name
      }
      this.basePath = pathParts.join('/');
      if (this.basePath && !this.basePath.endsWith('/')) {
        this.basePath += '/';
      }
    } catch (e) {
      this.hostname = '';
      this.protocol = 'https:';
      this.basePath = '/';
    }
  }

  normalizeUrl(rawUrl, baseUrl = null) {
    try {
      let resolved;
      let effectiveBase = baseUrl;
      if (effectiveBase && typeof effectiveBase === 'string') {
        try {
          const baseObj = new URL(effectiveBase);
          const isFile = /\.[a-z0-9]{2,5}$/i.test(baseObj.pathname);
          // If the base URL is a directory path without a trailing slash, ensure it ends with '/' so relative links resolve correctly
          if (!isFile && !baseObj.pathname.endsWith('/')) {
            baseObj.pathname += '/';
            effectiveBase = baseObj.href;
          }
        } catch (e) {}
      }

      if (effectiveBase) {
        resolved = new URL(rawUrl, effectiveBase);
      } else {
        resolved = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
      }

      if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') {
        return null;
      }

      resolved.hash = '';

      let path = resolved.pathname;
      const isFile = /\.[a-z0-9]{2,5}$/i.test(path);
      // Remove trailing slash if accidentally attached to a file URL (e.g. index.html/)
      if (isFile && path.endsWith('/')) {
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
      let domainAllowed = false;
      if (this.includeSubdomains) {
        domainAllowed = parsed.hostname === this.hostname || parsed.hostname.endsWith('.' + this.hostname);
      } else {
        domainAllowed = parsed.hostname === this.hostname;
      }

      if (!domainAllowed) return false;

      // Optional path-scoping to stay inside starting subdirectory
      if (this.restrictToPath && this.basePath && this.basePath !== '/') {
        if (!parsed.pathname.startsWith(this.basePath)) {
          return false;
        }
      }

      return true;
    } catch (e) {
      return false;
    }
  }

  matchesPatterns(urlStr) {
    for (const pattern of this.excludePatterns) {
      try {
        const reg = new RegExp(pattern, 'i');
        if (reg.test(urlStr)) return false;
      } catch (e) {
        if (urlStr.toLowerCase().includes(pattern.toLowerCase())) return false;
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
        } catch (e) {
          if (urlStr.toLowerCase().includes(pattern.toLowerCase())) {
            matched = true;
            break;
          }
        }
      }
      if (!matched) return false;
    }

    const ignoreExtensions = /\.(pdf|zip|tar|gz|rar|exe|dmg|iso|mp3|mp4|avi|mov|wmv|wav|ogg|doc|docx|ppt|pptx|xls|xlsx|apk|css|js|woff|woff2|ttf|eot|svg|ico|png|jpg|jpeg|gif|webp)$/i;
    if (ignoreExtensions.test(urlStr.split('?')[0])) {
      return false;
    }

    return true;
  }

  devProxyUrl(url) {
    return `/api/proxy?url=${encodeURIComponent(url)}&ua=${encodeURIComponent(this.userAgent)}`;
  }

  // Fetch robots.txt and keep the rules that apply to the selected user-agent.
  // Uses only the already-detected engine so a missing robots.txt never resets proxy selection.
  async loadRobotsRules() {
    this.robotsRules = [];
    if (!this.respectRobots || !this.preferredProxy) return;

    try {
      const robotsUrl = `${this.protocol}//${this.hostname}/robots.txt`;
      const res = await this.executeProxyTarget(this.preferredProxy, robotsUrl, performance.now());
      if (!res || !res.ok || !res.html || /<html[\s>]/i.test(res.html)) return;
      this.robotsRules = getRulesForAgent(parseRobotsTxt(res.html), this.userAgent).rules;
    } catch (e) {
      this.robotsRules = [];
    }
  }

  isBlockedByRobots(urlStr) {
    if (!this.robotsRules || this.robotsRules.length === 0) return false;
    return !checkUrlAgainstRules(this.robotsRules, urlStr).allowed;
  }

  abort() {
    this.isAborted = true;
    this.onLog('Crawler stopped by user.', 'warn');
  }

  // Helper to execute a proxy target with timeout
  async tryFetchEndpoint(endpointUrl, headers = {}, timeoutMs = 5000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const resp = await fetch(endpointUrl, {
        signal: controller.signal,
        headers
      });
      clearTimeout(timeout);
      return resp;
    } catch (e) {
      clearTimeout(timeout);
      return null;
    }
  }

  // Upfront pre-flight probe: detects fastest working engine once at start
  async detectBestEngine(testUrl) {
    if (this.preferredProxy) return this.preferredProxy;

    // 0. User custom proxy
    if (this.customCorsProxy) {
      this.preferredProxy = { type: 'custom', urlTemplate: this.customCorsProxy };
      return this.preferredProxy;
    }

    // 1. Local Vite dev server proxy (ONLY active on localhost)
    if (isLocalEnvironment()) {
      try {
        const probeRes = await this.tryFetchEndpoint(this.devProxyUrl(testUrl), {}, 3000);
        if (probeRes && probeRes.ok) {
          const text = await probeRes.text();
          if (text && text.length > 20 && !text.includes('{"error":')) {
            this.preferredProxy = { type: 'dev' };
            return this.preferredProxy;
          }
        }
      } catch (e) {}
    }

    // 2. Direct fetch (works if target site sets Access-Control-Allow-Origin: *)
    try {
      const dirRes = await this.tryFetchEndpoint(testUrl, {}, 1200);
      if (dirRes && dirRes.ok) {
        this.preferredProxy = { type: 'direct' };
        return this.preferredProxy;
      }
    } catch (e) {}

    // 3. Probe CORS Proxy Fleet (Jina HTML, AllOrigins, Jina MD)
    if (this.useCorsProxy) {
      // Probe Jina HTML (fastest and cleanest DOM proxy)
      try {
        const probe = await this.tryFetchEndpoint(`https://r.jina.ai/${testUrl}`, JINA_TURBO_HEADERS, 4000);
        if (probe && probe.ok) {
          const text = await probe.text();
          if (text && text.length > 30 && !text.includes('{"error":') && probe.status !== 429) {
            this.preferredProxy = { type: 'jina_html' };
            return this.preferredProxy;
          }
        }
      } catch (e) {}

      // Probe AllOrigins JSON Gateway
      try {
        const probe = await this.tryFetchEndpoint(`https://api.allorigins.win/get?url=${encodeURIComponent(testUrl)}`, {}, 4000);
        if (probe && probe.ok) {
          const json = await probe.json();
          if (json && json.contents && json.contents.length > 30) {
            this.preferredProxy = { type: 'allorigins' };
            return this.preferredProxy;
          }
        }
      } catch (e) {}

      // Default fallback: Jina HTML
      this.preferredProxy = { type: 'jina_html' };
      return this.preferredProxy;
    }

    return null;
  }

  // Universal multi-tier fetch pipeline:
  // Session Cache -> Preferred Proxy -> Custom User Proxy -> Dev Proxy (localhost only) -> Direct Fetch -> Jina HTML -> AllOrigins -> Jina MD
  async fetchPageHtml(url) {
    if (this.cache.has(url)) {
      return this.cache.get(url);
    }

    const startTime = performance.now();

    // 0. Preferred proxy from pre-flight probe or earlier successful step
    if (this.preferredProxy) {
      try {
        const cachedRes = await this.executeProxyTarget(this.preferredProxy, url, startTime);
        if (cachedRes && cachedRes.ok) {
          this.cache.set(url, cachedRes);
          return cachedRes;
        } else {
          // If preferred proxy failed, invalidate and cascade through options
          this.preferredProxy = null;
        }
      } catch (e) {
        this.preferredProxy = null;
      }
    }

    // 1. Custom User-Defined Proxy (if configured in Options)
    if (this.customCorsProxy) {
      try {
        const customUrl = this.customCorsProxy.includes('${url}')
          ? this.customCorsProxy.replace('${url}', encodeURIComponent(url))
          : `${this.customCorsProxy}${encodeURIComponent(url)}`;
        const resp = await this.tryFetchEndpoint(customUrl, {}, 8000);
        if (resp && resp.ok) {
          const html = await resp.text();
          if (html && html.length > 30) {
            const latency = Math.round(performance.now() - startTime);
            this.preferredProxy = { type: 'custom', urlTemplate: this.customCorsProxy };
            const res = { ok: true, status: resp.status, latency, html, proxyName: 'Custom Proxy' };
            this.cache.set(url, res);
            return res;
          }
        }
      } catch (e) {}
    }

    // 2. Built-in local dev proxy endpoint (ONLY on localhost dev server)
    if (isLocalEnvironment()) {
      try {
        const devProxyUrl = this.devProxyUrl(url);
        const resp = await this.tryFetchEndpoint(devProxyUrl, {}, 8000);
        if (resp && resp.ok) {
          const html = await resp.text();
          if (html && html.length > 20 && !html.includes('{"error":')) {
            const latency = Math.round(performance.now() - startTime);
            this.preferredProxy = { type: 'dev' };
            const res = { ok: true, status: resp.status, latency, html, proxyName: 'Dev Server Proxy' };
            this.cache.set(url, res);
            return res;
          }
        }
      } catch (e) {}
    }

    // 3. Direct fetch (works if target site enables CORS headers or same-origin)
    try {
      const resp = await this.tryFetchEndpoint(url, {}, 1500);
      if (resp && resp.ok) {
        const html = await resp.text();
        const latency = Math.round(performance.now() - startTime);
        this.preferredProxy = { type: 'direct' };
        const res = { ok: true, status: resp.status, latency, html, proxyName: 'Direct Connection' };
        this.cache.set(url, res);
        return res;
      }
    } catch (e) {}

    // 4. Public CORS Proxy Fleet (when CORS proxy fallback is enabled)
    if (this.useCorsProxy) {
      // Tier A: Jina Reader Turbo HTML mode
      try {
        const jinaUrl = `https://r.jina.ai/${url}`;
        const resp = await this.tryFetchEndpoint(jinaUrl, JINA_TURBO_HEADERS, 8000);
        if (resp && resp.ok) {
          const html = await resp.text();
          if (html && html.length > 50 && !html.includes('{"error":') && !html.includes('AbuseAlleviationError') && resp.status !== 429) {
            const latency = Math.round(performance.now() - startTime);
            this.preferredProxy = { type: 'jina_html' };
            const res = { ok: true, status: 200, latency, html, proxyName: 'Jina Engine (HTML)' };
            this.cache.set(url, res);
            return res;
          }
        }
      } catch (e) {}

      // Tier B: AllOrigins JSON Gateway
      try {
        const allOriginsUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        const resp = await this.tryFetchEndpoint(allOriginsUrl, {}, 7000);
        if (resp && resp.ok) {
          const json = await resp.json();
          if (json && json.contents && json.contents.length > 50) {
            const latency = Math.round(performance.now() - startTime);
            this.preferredProxy = { type: 'allorigins' };
            const res = { ok: true, status: json.status?.http_code || 200, latency, html: json.contents, proxyName: 'AllOrigins Gateway' };
            this.cache.set(url, res);
            return res;
          }
        }
      } catch (e) {}

      // Tier C: Jina Reader Markdown mode
      try {
        const jinaUrl = `https://r.jina.ai/${url}`;
        const resp = await this.tryFetchEndpoint(jinaUrl, {}, 7000);
        if (resp && resp.ok) {
          const text = await resp.text();
          if (text && text.length > 50 && !text.includes('{"error":') && !text.includes('AbuseAlleviationError') && resp.status !== 429) {
            const latency = Math.round(performance.now() - startTime);
            this.preferredProxy = { type: 'jina_md' };
            const res = { ok: true, status: 200, latency, html: text, isMarkdown: true, proxyName: 'Jina Engine (Markdown)' };
            this.cache.set(url, res);
            return res;
          }
        }
      } catch (e) {}
    }

    return { 
      ok: false, 
      status: 0, 
      latency: Math.round(performance.now() - startTime), 
      html: '', 
      error: 'Connection timed out or blocked by CORS / bot firewall',
      proxyName: 'Unreachable' 
    };
  }

  // Fast dispatcher for cached preferred proxy
  async executeProxyTarget(pref, url, startTime) {
    if (pref.type === 'custom' && pref.urlTemplate) {
      const customUrl = pref.urlTemplate.includes('${url}')
        ? pref.urlTemplate.replace('${url}', encodeURIComponent(url))
        : `${pref.urlTemplate}${encodeURIComponent(url)}`;
      const resp = await this.tryFetchEndpoint(customUrl, {}, 8000);
      if (resp && resp.ok) {
        const html = await resp.text();
        if (html && html.length > 30) {
          return { ok: true, status: resp.status, latency: Math.round(performance.now() - startTime), html, proxyName: 'Custom Proxy' };
        }
      }
    } else if (pref.type === 'dev') {
      const devProxyUrl = this.devProxyUrl(url);
      const resp = await this.tryFetchEndpoint(devProxyUrl, {}, 8000);
      if (resp && resp.ok) {
        const html = await resp.text();
        if (html && html.length > 20 && !html.includes('{"error":')) {
          return { ok: true, status: resp.status, latency: Math.round(performance.now() - startTime), html, proxyName: 'Dev Server Proxy' };
        }
      }
    } else if (pref.type === 'direct') {
      const resp = await this.tryFetchEndpoint(url, {}, 1500);
      if (resp && resp.ok) {
        const html = await resp.text();
        return { ok: true, status: resp.status, latency: Math.round(performance.now() - startTime), html, proxyName: 'Direct Connection' };
      }
    } else if (pref.type === 'jina_html') {
      const resp = await this.tryFetchEndpoint(`https://r.jina.ai/${url}`, JINA_TURBO_HEADERS, 8000);
      if (resp && resp.ok) {
        const html = await resp.text();
        if (html && html.length > 50 && !html.includes('{"error":') && !html.includes('AbuseAlleviationError') && resp.status !== 429) {
          return { ok: true, status: 200, latency: Math.round(performance.now() - startTime), html, proxyName: 'Jina Engine (HTML)' };
        }
      }
    } else if (pref.type === 'allorigins') {
      const resp = await this.tryFetchEndpoint(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`, {}, 7000);
      if (resp && resp.ok) {
        const json = await resp.json();
        if (json && json.contents && json.contents.length > 50) {
          return { ok: true, status: json.status?.http_code || 200, latency: Math.round(performance.now() - startTime), html: json.contents, proxyName: 'AllOrigins Gateway' };
        }
      }
    } else if (pref.type === 'jina_md') {
      const resp = await this.tryFetchEndpoint(`https://r.jina.ai/${url}`, {}, 7000);
      if (resp && resp.ok) {
        const text = await resp.text();
        if (text && text.length > 50 && !text.includes('{"error":') && !text.includes('AbuseAlleviationError') && resp.status !== 429) {
          return { ok: true, status: 200, latency: Math.round(performance.now() - startTime), html: text, isMarkdown: true, proxyName: 'Jina Engine (Markdown)' };
        }
      }
    }
    return { ok: false };
  }

  createPageObject(url, depth = 1, customTitle = null) {
    let pathname = '/';
    try {
      pathname = new URL(url).pathname;
    } catch (e) {}

    const slug = pathname.split('/').filter(Boolean).pop() || 'Home';
    const inferredTitle = customTitle || slug
      .replace(/\.(php|html|htm|aspx|jsp)$/i, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());

    return {
      url,
      title: depth === 0 ? `${this.hostname} - Homepage` : `${inferredTitle} | ${this.hostname}`,
      description: '',
      h1: inferredTitle,
      h1Count: 1,
      h2Headings: [],
      h3Headings: [],
      questionHeadings: [],
      canonicalHref: url,
      hasCanonical: true,
      isCanonicalMatching: true,
      metaRobots: '',
      isNoIndex: false,
      isNoFollow: false,
      hasViewport: true,
      statusCode: 200,
      loadTime: 120,
      sizeKb: 25,
      depth,
      imagesCount: 0,
      images: [],
      missingAltCount: 0,
      imagesWithoutAlt: [],
      wordCount: 350,
      paragraphsCount: 3,
      hasDirectAnswer: false,
      directAnswerSample: '',
      hasFaq: false,
      faqCount: 0,
      hasLists: false,
      listsCount: 0,
      hasTables: false,
      tablesCount: 0,
      hasAuthor: false,
      authorName: '',
      hasDate: false,
      datePublished: '',
      schemas: [],
      hasSchema: false,
      hasFaqSchema: false,
      statDensity: 0,
      externalLinks: [],
      externalLinksCount: 0,
      ogTitle: '',
      ogDescription: '',
      ogImage: '',
      twitterCard: '',
      links: [],
      fetchFailed: false,
      fetchError: null,
      isIndexable: true,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: depth === 0 ? 'daily' : depth === 1 ? 'weekly' : 'monthly',
      priority: Math.max(0.2, parseFloat((1.0 - depth * 0.12).toFixed(1)))
    };
  }

  getSkipReason(urlStr) {
    if (!this.isAllowedDomain(urlStr)) {
      try {
        const host = new URL(urlStr).hostname;
        return `External Domain (${host})`;
      } catch (e) {
        return 'External Domain';
      }
    }

    const ignoreExtensions = /\.(pdf|zip|tar|gz|rar|exe|dmg|iso|mp3|mp4|avi|mov|wmv|wav|ogg|doc|docx|ppt|pptx|xls|xlsx|apk|css|js|woff|woff2|ttf|eot|svg|ico|png|jpg|jpeg|gif|webp)$/i;
    const cleanUrl = urlStr.split('?')[0];
    if (ignoreExtensions.test(cleanUrl)) {
      const ext = cleanUrl.split('.').pop()?.toLowerCase();
      return `Asset Resource (.${ext})`;
    }

    for (const pattern of this.excludePatterns) {
      try {
        const reg = new RegExp(pattern, 'i');
        if (reg.test(urlStr)) return `Excluded by Pattern (${pattern})`;
      } catch (e) {
        if (urlStr.toLowerCase().includes(pattern.toLowerCase())) return `Excluded by Pattern (${pattern})`;
      }
    }

    if (this.includePatterns.length > 0) {
      return 'Not in Include Filter';
    }

    return 'Filtered / Non-HTML';
  }

  async start() {
    this.isAborted = false;
    this.onLog(`Starting universal crawler for ${this.targetUrl} (Ceiling: ${this.maxPages} pages, Depth: ${this.maxDepth})...`, 'info');

    if (!this.hostname) {
      this.onLog('Invalid starting URL.', 'error');
      this.onComplete([], { discovered: 0, added: 0, skipped: 0, skippedPages: [], aborted: false });
      return;
    }

    this.discoveredUrls = new Set();
    this.addedUrls = new Set();
    this.skippedUrls = new Set();
    this.skippedMap = new Map();

    const recordSkipped = (url, reason) => {
      this.skippedUrls.add(url);
      if (!this.skippedMap.has(url)) {
        this.skippedMap.set(url, {
          url,
          reason,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        });
      }
    };

    let rootUrl = this.targetUrl;
    try {
      const parsedRoot = new URL(this.targetUrl);
      const isFileUrl = /\.[a-z0-9]{2,5}$/i.test(parsedRoot.pathname);
      // Only append trailing slash if it's a domain/directory, not a file (.html, .php, etc.)
      if (!isFileUrl && !rootUrl.endsWith('/')) {
        rootUrl = `${rootUrl}/`;
      }
    } catch (e) {
      if (!rootUrl.endsWith('/')) {
        rootUrl = `${rootUrl}/`;
      }
    }
    this.discoveredUrls.add(rootUrl);

    const queue = [{ url: rootUrl, depth: 0 }];
    const visited = new Set();
    const enqueued = new Set([rootUrl]);
    const discoveredPages = [];

    // Upfront engine detection: probe in background once so zero fallback wait occurs during crawl
    try {
      await this.detectBestEngine(rootUrl);
    } catch (e) {}

    await this.loadRobotsRules();
    if (this.robotsRules.length > 0) {
      this.onLog(`Loaded ${this.robotsRules.length} robots.txt rules.`, 'info');
    }

    const processItem = async (item) => {
      if (this.isAborted || discoveredPages.length >= this.maxPages) return;

      if (this.requestDelayMs > 0 && item.depth > 0) {
        await new Promise(r => setTimeout(r, this.requestDelayMs));
      }
      if (this.isAborted || discoveredPages.length >= this.maxPages) return;

      const fetchResult = await this.fetchPageHtml(item.url);
      if (this.isAborted) return;

      let pageData;

      if (fetchResult.ok && fetchResult.html) {
        try {
          pageData = extractPageMetadata(fetchResult, item.url, item.depth, this.hostname);

          if (this.filterNoindex && pageData.isNoIndex) {
            recordSkipped(item.url, 'Robots NoIndex directive');
            return;
          }

          if (item.depth === 0 && fetchResult.proxyName) {
            this.onLog(`Connected to ${this.hostname} via ${fetchResult.proxyName} (${fetchResult.latency}ms)`, 'info');
          }

          // Extract internal links: always recorded for the link graph, only enqueued within depth limits
          if (!pageData.isNoFollow) {
            const canEnqueue = item.depth < this.maxDepth;
            const rawLinks = [];

            if (typeof DOMParser !== 'undefined' && !fetchResult.isMarkdown) {
              try {
                const doc = new DOMParser().parseFromString(fetchResult.html, 'text/html');
                doc.querySelectorAll('a[href]').forEach(a => {
                  const href = a.getAttribute('href');
                  if (href) rawLinks.push(href);
                });
              } catch (e) {}
            }

            // Regex fallback if DOMParser missed links or markdown
            if (rawLinks.length === 0 && fetchResult.html) {
              const htmlHrefMatches = [...fetchResult.html.matchAll(/<a\s+[^>]*href=["']([^"'#][^"']*)["']/gi)];
              for (const m of htmlHrefMatches) {
                rawLinks.push(m[1]);
              }
              const mdMatches = [...fetchResult.html.matchAll(/\[(?:[^\]]*)\]\(([^)\s"']+)(?:\s+["'][^"']*["'])?\)/gi)];
              for (const m of mdMatches) {
                const urlCandidate = m[1]?.trim();
                if (urlCandidate && !urlCandidate.startsWith('data:') && !urlCandidate.startsWith('blob:')) {
                  rawLinks.push(urlCandidate);
                }
              }
            }

            for (const raw of rawLinks) {
              if (!raw || raw.startsWith('#') || raw.startsWith('javascript:') || raw.startsWith('mailto:') || raw.startsWith('tel:')) continue;
              const norm = this.normalizeUrl(raw, item.url);
              if (!norm) continue;

              if (!this.isAllowedDomain(norm)) {
                continue;
              }

              const cleanUrl = norm.split('?')[0].toLowerCase();
              const isMediaAsset = /\.(jpg|jpeg|png|gif|webp|svg|ico|bmp|mp3|mp4|avi|mov|wmv|wav|ogg|css|js|woff|woff2|ttf|eot|zip|tar|gz|rar|exe|dmg|iso|apk)$/i.test(cleanUrl);
              if (isMediaAsset) {
                continue;
              }

              // Record internal link graph
              if (norm !== item.url && !pageData.links.includes(norm) && pageData.links.length < 500) {
                pageData.links.push(norm);
              }

              if (!canEnqueue) continue;

              this.discoveredUrls.add(norm);

              const matches = this.matchesPatterns(norm);
              if (!matches) {
                recordSkipped(norm, 'Excluded by URL Pattern');
                continue;
              }

              if (this.isBlockedByRobots(norm)) {
                recordSkipped(norm, 'Blocked by robots.txt');
                continue;
              }

              if (!visited.has(norm) && !enqueued.has(norm)) {
                if ((discoveredPages.length + queue.length) < this.maxPages) {
                  enqueued.add(norm);
                  queue.push({ url: norm, depth: item.depth + 1 });
                } else {
                  recordSkipped(norm, `Exceeded Max Pages limit (${this.maxPages})`);
                }
              }
            }
          }
        } catch (err) {
          pageData = createUnreachedPageObject(item.url, item.depth, err.message, fetchResult.latency);
        }
      } else {
        pageData = createUnreachedPageObject(item.url, item.depth, fetchResult.error || 'Connection timed out or blocked by CORS', fetchResult.latency);

        if (item.depth === 0) {
          this.onLog(`Could not connect to ${item.url} via dev proxy or CORS gateways. Target server might block cross-origin requests.`, 'error');
        }
      }

      if (discoveredPages.length < this.maxPages && !this.isAborted) {
        discoveredPages.push(pageData);
        this.addedUrls.add(item.url);
        this.onPage(pageData);

        // Streaming progress update
        this.onProgress({
          current: discoveredPages.length,
          total: this.maxPages,
          url: item.url
        });
      }
    };

    // Run Concurrent BFS Worker Pool
    const concurrency = Math.min(10, Math.max(1, parseInt(this.concurrency) || 6));
    let activeWorkers = 0;

    await new Promise((resolve) => {
      let isDone = false;

      const checkDone = () => {
        if (isDone) return;
        if (this.isAborted || discoveredPages.length >= this.maxPages || (queue.length === 0 && activeWorkers === 0)) {
          isDone = true;
          resolve();
        }
      };

      const worker = async () => {
        while (!isDone && !this.isAborted && discoveredPages.length < this.maxPages) {
          if (queue.length === 0) {
            if (activeWorkers === 0) {
              checkDone();
              break;
            }
            // Wait for other active workers to finish or enqueue new child links
            await new Promise(r => setTimeout(r, 20));
            continue;
          }

          const item = queue.shift();
          if (!item) continue;
          if (visited.has(item.url)) continue;
          visited.add(item.url);

          activeWorkers++;
          try {
            await processItem(item);
          } catch (e) {
            // Keep crawler going if an individual worker has an unhandled error
          } finally {
            activeWorkers--;
            checkDone();
          }

          // Brief micro-yield to keep UI 60fps responsive
          await new Promise(r => setTimeout(r, 10));
        }
        checkDone();
      };

      for (let i = 0; i < concurrency; i++) {
        worker();
      }
    });

    // Compute complete stats for internal website pages
    const addedCount = discoveredPages.length;
    const skippedList = Array.from(this.skippedMap.values());
    const skippedCount = skippedList.length;
    const discoveredCount = addedCount + skippedCount;

    const stats = {
      discovered: discoveredCount,
      added: addedCount,
      skipped: skippedCount,
      skippedPages: skippedList,
      aborted: this.isAborted
    };

    // Finished
    this.onProgress({
      current: discoveredPages.length,
      total: discoveredPages.length,
      url: `${this.targetUrl} [Complete]`
    });
    this.onLog(`Crawl completed! Discovered ${discoveredPages.length} real pages for ${this.hostname} (${stats.skipped} skipped).`, 'info');
    
    discoveredPages.stats = stats;
    discoveredPages.skippedPages = skippedList;
    this.onComplete(discoveredPages, stats);
  }
}

// ---------------------------------------------------------------------------
// Standalone single-page live audit fetcher
// ---------------------------------------------------------------------------
export async function fetchSinglePage(url, options = {}) {
  const crawler = new ClientCrawler({
    url,
    maxPages: 1,
    maxDepth: 0,
    useCorsProxy: options.useCorsProxy !== false,
    customCorsProxy: options.customCorsProxy || '',
    userAgent: options.userAgent
  });
  const fetchResult = await crawler.fetchPageHtml(url);
  if (fetchResult.ok && fetchResult.html) {
    let hostname = '';
    try { hostname = new URL(url).hostname; } catch (e) {}
    return extractPageMetadata(fetchResult, url, options.depth || 0, hostname);
  }
  return createUnreachedPageObject(url, options.depth || 0, fetchResult.error || 'Could not fetch page content cross-origin', fetchResult.latency);
}
