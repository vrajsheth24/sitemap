import React, { useState, useRef } from 'react';
import {
  Globe,
  Play,
  Square,
  SlidersHorizontal,
  UploadCloud,
  X,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  CheckCircle2,
  Copy,
  ShieldCheck,
  Radar
} from 'lucide-react';
import { parseSitemapXml, parseUrlList, parseJsonPages } from '../utils/sitemapParser';
import { isLocalEnvironment } from '../utils/clientCrawler';

const WORKER_CODE = `export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': '*'
        }
      });
    }

    const url = new URL(request.url).searchParams.get('url');
    if (!url) return new Response('Missing ?url= param', { status: 400 });

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });

      const newHeaders = new Headers(response.headers);
      newHeaders.set('Access-Control-Allow-Origin', '*');
      newHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      newHeaders.set('Access-Control-Allow-Headers', '*');

      return new Response(response.body, {
        status: response.status,
        headers: newHeaders
      });
    } catch (err) {
      return new Response(err.message, { status: 502 });
    }
  }
};`;

const clampInt = (value, min, max, fallback) => {
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

export default function CrawlerBar({
  targetUrl,
  setTargetUrl,
  isCrawling,
  onStartCrawl,
  onStopCrawl,
  onImportPages,
  onClearAll,
  crawlConfig,
  setCrawlConfig,
  addToast
}) {
  const [showOptions, setShowOptions] = useState(false);
  const [isTestingProxy, setIsTestingProxy] = useState(false);
  const [showWorkerGuide, setShowWorkerGuide] = useState(false);
  const [copiedWorker, setCopiedWorker] = useState(false);
  const fileInputRef = useRef(null);
  const isLocal = isLocalEnvironment();

  const updateConfig = (patch) => setCrawlConfig(prev => ({ ...prev, ...patch }));

  const handleTestProxy = async () => {
    const proxy = crawlConfig.customCorsProxy?.trim();
    if (!proxy) {
      addToast('Please enter a proxy URL to test first.', 'warn');
      return;
    }
    setIsTestingProxy(true);
    const testTarget = 'https://example.com';
    const testUrl = proxy.includes('${url}')
      ? proxy.replace('${url}', encodeURIComponent(testTarget))
      : `${proxy}${encodeURIComponent(testTarget)}`;

    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 4500);
    try {
      const res = await fetch(testUrl, { signal: c.signal });
      if (res.ok) {
        addToast('Custom proxy verified successfully! Connection is working.', 'success');
      } else {
        addToast(`Proxy returned HTTP ${res.status}. Check URL or CORS settings.`, 'warn');
      }
    } catch (e) {
      addToast(`Connection failed: ${e.message}. Ensure proxy sets Access-Control-Allow-Origin: *`, 'error');
    } finally {
      clearTimeout(t);
      setIsTestingProxy(false);
    }
  };

  const handleCopyWorkerCode = async () => {
    try {
      await navigator.clipboard.writeText(WORKER_CODE);
      setCopiedWorker(true);
      addToast('Cloudflare Worker code copied to clipboard!', 'success');
      setTimeout(() => setCopiedWorker(false), 3000);
    } catch (e) {
      addToast('Clipboard access was blocked by the browser.', 'error');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (!content || typeof content !== 'string') return;

      try {
        const trimmed = content.trim();
        const name = file.name.toLowerCase();
        let parsedPages = [];
        if (name.endsWith('.xml') || trimmed.startsWith('<?xml') || trimmed.startsWith('<urlset')) {
          parsedPages = parseSitemapXml(content);
        } else if (name.endsWith('.json') || trimmed.startsWith('[') || trimmed.startsWith('{')) {
          parsedPages = parseJsonPages(content);
        } else {
          parsedPages = parseUrlList(content);
        }

        if (parsedPages.length > 0) {
          onImportPages(parsedPages);
          addToast(`Successfully imported ${parsedPages.length} pages from ${file.name}`, 'success');
        } else {
          addToast('No valid URLs found in file.', 'error');
        }
      } catch (err) {
        addToast(`Import failed: ${err.message}`, 'error');
      }
    };
    reader.onerror = () => addToast(`Could not read ${file.name}.`, 'error');

    reader.readAsText(file);
    // Reset file input so user can re-upload same file if desired
    e.target.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isCrawling) {
      onStopCrawl();
      return;
    }
    const trimmed = targetUrl.trim();
    if (!trimmed) {
      addToast('Please enter a website URL to crawl.', 'warn');
      return;
    }
    onStartCrawl(trimmed);
  };

  return (
    <section className="hero-card glass-panel">
      {/* Title */}
      <div className="hero-title-row">
        <div>
          <div className="hero-eyebrow">
            <Radar size={13} />
            <span>Crawler</span>
          </div>
          <h1 className="hero-headline">Map any website in seconds</h1>
          <p className="hero-subheadline">
            Crawl a site right in your browser, explore its structure, audit SEO basics and export a standards-compliant sitemap.
          </p>
        </div>
      </div>

      {/* Main URL Bar & Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="crawl-form-row">
          <div className="url-input-box lg" style={{ flex: 1, minWidth: '260px' }}>
            <Globe size={17} className="text-muted" />
            <input
              type="text"
              inputMode="url"
              autoComplete="url"
              spellCheck={false}
              className="url-input-field"
              placeholder="https://example.com"
              aria-label="Website URL to crawl"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              disabled={isCrawling}
            />
            {targetUrl && !isCrawling && (
              <button
                type="button"
                className="clear-input-btn"
                onClick={() => setTargetUrl('')}
                aria-label="Clear URL"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="crawl-actions">
            <button
              type="submit"
              className={`btn ${isCrawling ? 'btn-danger' : 'btn-primary'}`}
              style={{ minHeight: '44px', paddingInline: '1.25rem' }}
            >
              {isCrawling ? <Square size={15} /> : <Play size={15} />}
              <span>{isCrawling ? 'Stop crawl' : 'Start crawl'}</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ minHeight: '44px' }}
              onClick={() => setShowOptions(!showOptions)}
              aria-expanded={showOptions}
            >
              <SlidersHorizontal size={15} />
              <span>Options</span>
              {showOptions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ minHeight: '44px' }}
              onClick={() => fileInputRef.current?.click()}
              title="Upload an existing sitemap.xml, URL list (.txt/.csv) or JSON export"
            >
              <UploadCloud size={15} />
              <span>Import</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".xml,.txt,.csv,.json"
              onChange={handleFileUpload}
            />

            <button
              type="button"
              className="btn btn-secondary"
              style={{ minHeight: '44px', paddingInline: '0.8rem' }}
              onClick={onClearAll}
              title="Clear current dataset"
              aria-label="Clear current dataset"
            >
              <RotateCcw size={15} />
            </button>
          </div>
        </div>

        {/* Collapsible Advanced Crawl Settings */}
        {showOptions && (
          <div className="options-panel">
            {/* Environment Status */}
            <div className={`env-banner ${isLocal ? 'local' : ''}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className="status-dot" style={{ background: isLocal ? 'var(--accent-emerald)' : 'var(--accent-cyan)' }} />
                <span style={{ fontWeight: 650, color: 'var(--text-primary)' }}>
                  {isLocal ? 'Local server mode' : 'Live client-side mode'}
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {isLocal
                    ? 'Requests go through the Vite dev server proxy (no CORS limits).'
                    : 'Requests go through a resilient public proxy fleet with auto-failover.'}
                </span>
              </div>
              <span className={`badge ${isLocal ? 'badge-200' : 'badge-300'}`}>
                {isLocal ? 'Zero CORS limits' : 'CORS auto-bypass'}
              </span>
            </div>

            {/* Sliders & Configuration Grid */}
            <div className="advanced-options-grid">
              <div className="option-group">
                <div className="option-header">
                  <label className="option-label" htmlFor="opt-max-pages">Max pages</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <input
                      id="opt-max-pages"
                      type="number"
                      className="option-input num-input"
                      min="1"
                      max="10000"
                      value={crawlConfig.maxPages}
                      onChange={(e) => updateConfig({ maxPages: clampInt(e.target.value, 1, 10000, 1) })}
                    />
                    <span className="unit-label">pages</span>
                  </div>
                </div>
                <input
                  type="range"
                  className="range-slider"
                  aria-label="Max pages"
                  min="5"
                  max="1000"
                  step="5"
                  value={Math.min(1000, crawlConfig.maxPages)}
                  onChange={(e) => updateConfig({ maxPages: clampInt(e.target.value, 5, 1000, 100) })}
                />
                <div className="slider-ticks">
                  <span>5</span>
                  <span>250</span>
                  <span>500</span>
                  <span>1000</span>
                </div>
                <div className="option-hint">Upper limit — the crawl stops early once every page is found.</div>
              </div>

              <div className="option-group">
                <div className="option-header">
                  <label className="option-label" htmlFor="opt-max-depth">Max depth</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <input
                      id="opt-max-depth"
                      type="number"
                      className="option-input num-input"
                      min="1"
                      max="20"
                      value={crawlConfig.maxDepth}
                      onChange={(e) => updateConfig({ maxDepth: clampInt(e.target.value, 1, 20, 1) })}
                    />
                    <span className="unit-label">levels</span>
                  </div>
                </div>
                <input
                  type="range"
                  className="range-slider"
                  aria-label="Max depth"
                  min="1"
                  max="10"
                  step="1"
                  value={Math.min(10, crawlConfig.maxDepth)}
                  onChange={(e) => updateConfig({ maxDepth: clampInt(e.target.value, 1, 10, 4) })}
                />
                <div className="slider-ticks">
                  <span>1 (root)</span>
                  <span>3</span>
                  <span>6</span>
                  <span>10 (deep)</span>
                </div>
              </div>

              <div className="option-group">
                <div className="option-header">
                  <label className="option-label" htmlFor="opt-concurrency">Concurrent workers</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <input
                      id="opt-concurrency"
                      type="number"
                      className="option-input num-input"
                      min="1"
                      max="8"
                      value={crawlConfig.concurrency || 4}
                      onChange={(e) => updateConfig({ concurrency: clampInt(e.target.value, 1, 8, 1) })}
                    />
                    <span className="unit-label">threads</span>
                  </div>
                </div>
                <input
                  type="range"
                  className="range-slider"
                  aria-label="Concurrent workers"
                  min="1"
                  max="8"
                  step="1"
                  value={crawlConfig.concurrency || 4}
                  onChange={(e) => updateConfig({ concurrency: clampInt(e.target.value, 1, 8, 4) })}
                />
                <div className="slider-ticks">
                  <span>1 (gentle)</span>
                  <span>4</span>
                  <span>8 (turbo)</span>
                </div>
              </div>

              <div className="option-group">
                <label className="option-label" htmlFor="opt-ua">Crawler user-agent</label>
                <select
                  id="opt-ua"
                  className="option-select"
                  value={crawlConfig.userAgent}
                  onChange={(e) => updateConfig({ userAgent: e.target.value })}
                >
                  <option value="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36">Chrome Desktop (Recommended)</option>
                  <option value="Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)">Googlebot</option>
                  <option value="Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)">Bingbot</option>
                  <option value="Screaming Frog SEO Spider/19.4">Screaming Frog SEO Spider</option>
                  <option value="Mozilla/5.0 (compatible; SitemapBot/1.0; +https://github.com/sitemap-generator)">SitemapBot</option>
                </select>
                <div className="option-hint">Sent when crawling through the local dev server proxy (browsers block this header elsewhere).</div>
              </div>
            </div>

            {/* Feature Toggles Row */}
            <div className="options-toggles-row">
              <label className="toggle-control">
                <input
                  type="checkbox"
                  checked={crawlConfig.respectRobots !== false}
                  onChange={(e) => updateConfig({ respectRobots: e.target.checked })}
                />
                <span>Respect robots.txt</span>
              </label>

              <label className="toggle-control">
                <input
                  type="checkbox"
                  checked={crawlConfig.includeImages !== false}
                  onChange={(e) => updateConfig({ includeImages: e.target.checked })}
                />
                <span>Include &lt;image:image&gt; tags</span>
              </label>

              <label className="toggle-control">
                <input
                  type="checkbox"
                  checked={crawlConfig.includeSubdomains === true}
                  onChange={(e) => updateConfig({ includeSubdomains: e.target.checked })}
                />
                <span>Follow subdomains</span>
              </label>

              <label className="toggle-control">
                <input
                  type="checkbox"
                  checked={crawlConfig.filterNoindex !== false}
                  onChange={(e) => updateConfig({ filterNoindex: e.target.checked })}
                />
                <span>Exclude noindex pages</span>
              </label>

              <label className="toggle-control">
                <input
                  type="checkbox"
                  checked={crawlConfig.useCorsProxy !== false}
                  onChange={(e) => updateConfig({ useCorsProxy: e.target.checked })}
                />
                <span>CORS proxy fallback</span>
              </label>

              <label className="toggle-control" title="Stay inside the starting URL's folder (e.g. /docs/v2/)">
                <input
                  type="checkbox"
                  checked={crawlConfig.restrictToPath === true}
                  onChange={(e) => updateConfig({ restrictToPath: e.target.checked })}
                />
                <span>Stay within starting folder</span>
              </label>
            </div>

            {/* Custom Proxy Optional Input */}
            <div className="subpanel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <label className="option-label" htmlFor="opt-proxy" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ShieldCheck size={15} className="text-cyan" />
                  Custom CORS proxy endpoint (optional)
                </label>
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => setShowWorkerGuide(!showWorkerGuide)}
                  aria-expanded={showWorkerGuide}
                >
                  <span>Free Cloudflare Worker guide</span>
                  <ChevronDown size={12} style={{ transform: showWorkerGuide ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  id="opt-proxy"
                  type="text"
                  className="option-input mono"
                  style={{ flex: 1, minWidth: '220px' }}
                  placeholder="https://your-worker.workers.dev/?url="
                  spellCheck={false}
                  value={crawlConfig.customCorsProxy || ''}
                  onChange={(e) => updateConfig({ customCorsProxy: e.target.value })}
                />
                {crawlConfig.customCorsProxy && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '0.45rem 0.8rem', fontSize: '0.8rem' }}
                    onClick={handleTestProxy}
                    disabled={isTestingProxy}
                  >
                    {isTestingProxy ? 'Testing…' : 'Test connection'}
                  </button>
                )}
              </div>

              {showWorkerGuide && (
                <div className="subpanel-inset">
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    Deploy your own private CORS proxy in about a minute (100,000 requests/day on the free plan):
                  </div>
                  <ol style={{ paddingLeft: '1.2rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    <li>Log into <a href="https://workers.cloudflare.com" target="_blank" rel="noreferrer">Cloudflare Workers</a> (free).</li>
                    <li>Click <b>Create Application</b> &gt; <b>Create Worker</b>.</li>
                    <li>Replace the worker code with the snippet below and click <b>Deploy</b>.</li>
                    <li>Copy your worker URL (e.g. <code>https://my-proxy.workers.dev/?url=</code>) and paste it above.</li>
                  </ol>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '0.35rem 0.7rem' }}
                      onClick={handleCopyWorkerCode}
                    >
                      {copiedWorker ? <CheckCircle2 size={13} className="text-emerald" /> : <Copy size={13} />}
                      <span>{copiedWorker ? 'Copied!' : 'Copy Worker code'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* URL Inclusion/Exclusion Patterns Grid */}
            <div className="patterns-grid">
              <div className="option-group">
                <label className="option-label" htmlFor="opt-exclude">
                  Exclude URL patterns <span className="text-muted" style={{ fontWeight: 400 }}>(regex or text, one per line)</span>
                </label>
                <textarea
                  id="opt-exclude"
                  rows="3"
                  className="code-textarea"
                  placeholder={'/cart\n/checkout\n\\?sort='}
                  value={crawlConfig.excludePatterns || ''}
                  onChange={(e) => updateConfig({ excludePatterns: e.target.value })}
                />
              </div>

              <div className="option-group">
                <label className="option-label" htmlFor="opt-include">
                  Include URL patterns <span className="text-muted" style={{ fontWeight: 400 }}>(optional filter, one per line)</span>
                </label>
                <textarea
                  id="opt-include"
                  rows="3"
                  className="code-textarea"
                  placeholder={'/blog/\n/products/'}
                  value={crawlConfig.includePatterns || ''}
                  onChange={(e) => updateConfig({ includePatterns: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}
      </form>
    </section>
  );
}
