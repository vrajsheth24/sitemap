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
      if (!targetUrl.trim()) {
        addToast('Please enter a website URL or select a preset.', 'warn');
        return;
      }
      onStartCrawl();
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
          <div className="advanced-options-grid">
            <div className="option-group">
              <label className="option-label">Max Pages to Crawl</label>
              <input 
                type="number" 
                className="option-input"
                min="1" 
                max="100" 
                value={crawlConfig.maxPages}
                onChange={(e) => setCrawlConfig({ ...crawlConfig, maxPages: parseInt(e.target.value) || 20 })}
              />
            </div>

            <div className="option-group">
              <label className="option-label">Max Crawl Depth</label>
              <input 
                type="number" 
                className="option-input"
                min="1" 
                max="6" 
                value={crawlConfig.maxDepth}
                onChange={(e) => setCrawlConfig({ ...crawlConfig, maxDepth: parseInt(e.target.value) || 3 })}
              />
            </div>

            <div className="option-group">
              <label className="option-label">CORS Proxy Fallback</label>
              <select 
                className="option-select"
                value={crawlConfig.useCorsProxy ? 'yes' : 'no'}
                onChange={(e) => setCrawlConfig({ ...crawlConfig, useCorsProxy: e.target.value === 'yes' })}
              >
                <option value="yes">Enabled (allorigins proxy)</option>
                <option value="no">Disabled (Direct browser fetch)</option>
              </select>
            </div>

            <div className="option-group">
              <label className="option-label">Include Image Tags</label>
              <select 
                className="option-select"
                value={crawlConfig.includeImages ? 'yes' : 'no'}
                onChange={(e) => setCrawlConfig({ ...crawlConfig, includeImages: e.target.value === 'yes' })}
              >
                <option value="yes">Yes (Google Image Sitemap)</option>
                <option value="no">No (Standard URLs only)</option>
              </select>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
