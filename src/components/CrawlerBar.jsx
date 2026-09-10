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
  RotateCcw 
} from 'lucide-react';
import { parseSitemapXml, parseUrlList } from '../utils/sitemapParser';

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
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (!content || typeof content !== 'string') return;

      try {
        let parsedPages = [];
        if (file.name.endsWith('.xml') || content.trim().startsWith('<?xml') || content.trim().startsWith('<urlset')) {
          parsedPages = parseSitemapXml(content);
        } else if (file.name.endsWith('.json')) {
          parsedPages = JSON.parse(content);
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

    reader.readAsText(file);
    // Reset file input so user can re-upload same file if desired
    e.target.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isCrawling) {
      onStopCrawl();
    } else {
      let trimmed = targetUrl.trim();
      if (!trimmed) {
        addToast('Please enter a website URL or select a preset.', 'warn');
        return;
      }
      if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        trimmed = 'https://' + trimmed;
        setTargetUrl(trimmed);
      }
      onStartCrawl(trimmed);
    }
  };

  return (
    <div className="hero-card glass-panel">
      {/* Title */}
      <div className="hero-title-row">
        <div>
          <h1 className="hero-headline">Visual Sitemap & SEO Intelligence Engine</h1>
          <p className="hero-subheadline">
            Crawl websites client-side, explore interactive directory hierarchies, and generate compliant sitemaps.
          </p>
        </div>
      </div>

      {/* Main URL Bar & Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div className="url-input-box" style={{ flex: 1, minWidth: '280px' }}>
            <Globe size={18} className="text-cyan" />
            <input
              type="text"
              className="url-input-field"
              placeholder="Enter website URL to crawl (e.g. https://example.com)"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              disabled={isCrawling}
            />
            {targetUrl && !isCrawling && (
              <button 
                type="button" 
                onClick={() => setTargetUrl('')}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowOptions(!showOptions)}
            >
              <SlidersHorizontal size={16} />
              <span>Options</span>
              {showOptions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => fileInputRef.current?.click()}
              title="Upload existing sitemap.xml, URLs.txt or CSV"
            >
              <UploadCloud size={16} />
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
              type="submit"
              className={`btn ${isCrawling ? 'btn-danger' : 'btn-primary'}`}
            >
              {isCrawling ? (
                <>
                  <Square size={16} />
                  <span>Stop Crawl</span>
                </>
              ) : (
                <>
                  <Play size={16} />
                  <span>Start Crawl</span>
                </>
              )}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClearAll}
              title="Clear current dataset"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

        {/* Collapsible Advanced Crawl Settings */}
        {showOptions && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', animation: 'fadeIn 0.25s ease' }}>
            {/* Sliders & Configuration Grid */}
            <div className="advanced-options-grid">
              {/* Max Pages Limit (up to 1000) */}
              <div className="option-group">
                <div className="option-header">
                  <label className="option-label">Max Pages Limit</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <input 
                      type="number" 
                      className="option-input"
                      style={{ width: '85px', padding: '0.2rem 0.5rem', textAlign: 'right', fontSize: '0.85rem', fontWeight: '700', color: 'var(--accent-cyan)' }}
                      min="1" 
                      max="10000"
                      value={crawlConfig.maxPages}
                      onChange={(e) => setCrawlConfig({ ...crawlConfig, maxPages: Math.max(1, parseInt(e.target.value) || 1) })}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>pages</span>
                  </div>
                </div>
                <input 
                  type="range" 
                  className="range-slider"
                  min="5" 
                  max="1000" 
                  step="5" 
                  value={Math.min(1000, crawlConfig.maxPages)}
                  onChange={(e) => setCrawlConfig({ ...crawlConfig, maxPages: parseInt(e.target.value) || 100 })}
                />
                <div className="slider-ticks">
                  <span>5</span>
                  <span>250</span>
                  <span>500</span>
                  <span>1000</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Ceiling limit (stops when all real pages are crawled)
                </div>
              </div>

              {/* Max Crawl Depth */}
              <div className="option-group">
                <div className="option-header">
                  <label className="option-label">Max Crawl Depth</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <input 
                      type="number" 
                      className="option-input"
                      style={{ width: '65px', padding: '0.2rem 0.5rem', textAlign: 'right', fontSize: '0.85rem', fontWeight: '700', color: 'var(--accent-cyan)' }}
                      min="1" 
                      max="20"
                      value={crawlConfig.maxDepth}
                      onChange={(e) => setCrawlConfig({ ...crawlConfig, maxDepth: Math.max(1, parseInt(e.target.value) || 1) })}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>levels</span>
                  </div>
                </div>
                <input 
                  type="range" 
                  className="range-slider"
                  min="1" 
                  max="10" 
                  step="1" 
                  value={Math.min(10, crawlConfig.maxDepth)}
                  onChange={(e) => setCrawlConfig({ ...crawlConfig, maxDepth: parseInt(e.target.value) || 4 })}
                />
                <div className="slider-ticks">
                  <span>1 (Root)</span>
                  <span>3</span>
                  <span>6</span>
                  <span>10 (Deep)</span>
                </div>
              </div>

              {/* Concurrent Workers */}
              <div className="option-group">
                <div className="option-header">
                  <label className="option-label">Concurrent Workers</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <input 
                      type="number" 
                      className="option-input"
                      style={{ width: '65px', padding: '0.2rem 0.5rem', textAlign: 'right', fontSize: '0.85rem', fontWeight: '700', color: 'var(--accent-cyan)' }}
                      min="1" 
                      max="10"
                      value={crawlConfig.concurrency || 4}
                      onChange={(e) => setCrawlConfig({ ...crawlConfig, concurrency: Math.max(1, parseInt(e.target.value) || 1) })}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>threads</span>
                  </div>
                </div>
                <input 
                  type="range" 
                  className="range-slider"
                  min="1" 
                  max="10" 
                  step="1" 
                  value={crawlConfig.concurrency || 4}
                  onChange={(e) => setCrawlConfig({ ...crawlConfig, concurrency: parseInt(e.target.value) || 4 })}
                />
                <div className="slider-ticks">
                  <span>1 (Gentle)</span>
                  <span>4</span>
                  <span>7</span>
                  <span>10 (Turbo)</span>
                </div>
              </div>

              {/* Crawler User-Agent */}
              <div className="option-group">
                <label className="option-label">Crawler User-Agent</label>
                <select 
                  className="option-select"
                  value={crawlConfig.userAgent}
                  onChange={(e) => setCrawlConfig({ ...crawlConfig, userAgent: e.target.value })}
                >
                  <option value="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36">Chrome Desktop (Recommended)</option>
                  <option value="Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)">Googlebot</option>
                  <option value="Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)">Bingbot</option>
                  <option value="Screaming Frog SEO Spider/19.4">Screaming Frog SEO Spider</option>
                  <option value="Mozilla/5.0 (compatible; SitemapBot/1.0; +https://github.com/sitemap-generator)">SitemapBot</option>
                </select>
              </div>
            </div>

            {/* Feature Toggles Row */}
            <div className="options-toggles-row">
              <label className="toggle-control">
                <input 
                  type="checkbox" 
                  checked={crawlConfig.respectRobots !== false}
                  onChange={(e) => setCrawlConfig({ ...crawlConfig, respectRobots: e.target.checked })}
                />
                <span>Respect robots.txt</span>
              </label>

              <label className="toggle-control">
                <input 
                  type="checkbox" 
                  checked={crawlConfig.includeImages !== false}
                  onChange={(e) => setCrawlConfig({ ...crawlConfig, includeImages: e.target.checked })}
                />
                <span>Extract Images for &lt;image:image&gt;</span>
              </label>

              <label className="toggle-control">
                <input 
                  type="checkbox" 
                  checked={crawlConfig.includeSubdomains === true}
                  onChange={(e) => setCrawlConfig({ ...crawlConfig, includeSubdomains: e.target.checked })}
                />
                <span>Follow Subdomains</span>
              </label>

              <label className="toggle-control">
                <input 
                  type="checkbox" 
                  checked={crawlConfig.filterNoindex !== false}
                  onChange={(e) => setCrawlConfig({ ...crawlConfig, filterNoindex: e.target.checked })}
                />
                <span>Exclude Noindex Pages from XML</span>
              </label>

              <label className="toggle-control">
                <input 
                  type="checkbox" 
                  checked={crawlConfig.useCorsProxy !== false}
                  onChange={(e) => setCrawlConfig({ ...crawlConfig, useCorsProxy: e.target.checked })}
                />
                <span>CORS Proxy Fallback</span>
              </label>

              <label className="toggle-control" title="Stay inside starting URL path/folder (e.g. /Dev/phrtax.cpa/L1/)">
                <input 
                  type="checkbox" 
                  checked={crawlConfig.restrictToPath === true}
                  onChange={(e) => setCrawlConfig({ ...crawlConfig, restrictToPath: e.target.checked })}
                />
                <span>Stay within Starting Subdirectory</span>
              </label>
            </div>

            {/* Custom Proxy Optional Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', background: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="option-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  Custom CORS Proxy Endpoint (Optional Fallback)
                </label>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  e.g. Cloudflare Worker or private proxy
                </span>
              </div>
              <input 
                type="text" 
                className="url-input-field"
                style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem', background: 'rgba(0, 0, 0, 0.25)', borderRadius: '6px', border: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)' }}
                placeholder="https://your-worker.workers.dev/?url="
                value={crawlConfig.customCorsProxy || ''}
                onChange={(e) => setCrawlConfig({ ...crawlConfig, customCorsProxy: e.target.value })}
              />
            </div>

            {/* URL Inclusion/Exclusion Patterns Grid */}
            <div className="patterns-grid">
              <div>
                <label className="option-label" style={{ marginBottom: '0.4rem', display: 'block' }}>
                  Exclude URL Patterns (Regex or substring, 1 per line)
                </label>
                <textarea 
                  rows="2" 
                  className="code-textarea"
                  placeholder="e.g. /cart&#10;/checkout&#10;\?sort="
                  value={crawlConfig.excludePatterns || ''}
                  onChange={(e) => setCrawlConfig({ ...crawlConfig, excludePatterns: e.target.value })}
                />
              </div>

              <div>
                <label className="option-label" style={{ marginBottom: '0.4rem', display: 'block' }}>
                  Include URL Patterns (Optional filter, 1 per line)
                </label>
                <textarea 
                  rows="2" 
                  className="code-textarea"
                  placeholder="e.g. /blog/&#10;/products/"
                  value={crawlConfig.includePatterns || ''}
                  onChange={(e) => setCrawlConfig({ ...crawlConfig, includePatterns: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
