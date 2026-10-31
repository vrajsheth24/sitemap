import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  ExternalLink,
  FileCheck,
  RefreshCw
} from 'lucide-react';

const SITEMAP_NS = 'http://www.sitemaps.org/schemas/sitemap/0.9';
const MAX_URLS = 50000;
const MAX_BYTES = 50 * 1024 * 1024;

function validateSitemap(xmlText) {
  if (!xmlText.trim()) {
    return { valid: false, error: 'Please paste XML content, or load the current sitemap.' };
  }

  const xmlDoc = new DOMParser().parseFromString(xmlText, 'text/xml');
  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    return { valid: false, error: 'XML syntax error: ' + parserError.textContent.slice(0, 200) };
  }

  const root = xmlDoc.documentElement;
  const rootName = root?.localName;
  if (rootName !== 'urlset' && rootName !== 'sitemapindex') {
    return { valid: false, error: 'The root element must be <urlset> or <sitemapindex>.' };
  }
  if (root.namespaceURI !== SITEMAP_NS) {
    return { valid: false, error: `The root element must declare xmlns="${SITEMAP_NS}".` };
  }

  const entryName = rootName === 'urlset' ? 'url' : 'sitemap';
  const entries = Array.from(root.children).filter(el => el.localName === entryName);
  const count = entries.length;
  const bytes = new Blob([xmlText]).size;

  if (count === 0) {
    return { valid: false, error: `No <${entryName}> entries found.` };
  }
  if (count > MAX_URLS) {
    return { valid: false, error: `Found ${count.toLocaleString()} entries; the limit is 50,000 per file. Split it with a sitemap index.` };
  }
  if (bytes > MAX_BYTES) {
    return { valid: false, error: 'The file is larger than the 50 MB (uncompressed) limit.' };
  }

  const warnings = [];
  let invalidLocs = 0;
  let badPriority = 0;
  let badLastmod = 0;
  const seen = new Set();
  let duplicates = 0;

  entries.forEach(entry => {
    const field = (name) => Array.from(entry.children).find(c => c.localName === name)?.textContent?.trim();
    const loc = field('loc');
    if (!loc || !/^https?:\/\/[^\s]+$/i.test(loc)) {
      invalidLocs++;
    } else if (seen.has(loc)) {
      duplicates++;
    } else {
      seen.add(loc);
    }

    const priority = field('priority');
    if (priority !== undefined) {
      const p = Number(priority);
      if (Number.isNaN(p) || p < 0 || p > 1) badPriority++;
    }

    const lastmod = field('lastmod');
    if (lastmod !== undefined && !/^\d{4}-\d{2}-\d{2}([T ][\d:.]+(Z|[+-]\d{2}:\d{2})?)?$/.test(lastmod)) {
      badLastmod++;
    }
  });

  if (invalidLocs > 0) {
    return { valid: false, error: `${invalidLocs} <loc> element${invalidLocs === 1 ? ' is' : 's are'} missing or not an absolute http(s) URL.` };
  }
  if (duplicates > 0) warnings.push(`${duplicates} duplicate URL${duplicates === 1 ? '' : 's'}`);
  if (badPriority > 0) warnings.push(`${badPriority} priority value${badPriority === 1 ? '' : 's'} outside 0.0–1.0`);
  if (badLastmod > 0) warnings.push(`${badLastmod} lastmod value${badLastmod === 1 ? '' : 's'} not in W3C date format`);

  return {
    valid: true,
    kind: rootName,
    count,
    sizeKb: Math.max(1, Math.round(bytes / 1024)),
    warnings
  };
}

export default function ValidatorTab({ currentXml, hasPages, addToast }) {
  const [xmlInput, setXmlInput] = useState(hasPages ? currentXml : '');
  const [validationResult, setValidationResult] = useState(null);

  const handleValidate = () => {
    let result;
    try {
      result = validateSitemap(xmlInput);
    } catch (e) {
      result = { valid: false, error: e.message };
    }
    setValidationResult(result);
    if (result.valid) {
      addToast('Validation passed — the file follows the sitemaps.org protocol.', 'success');
    }
  };

  const handleLoadCurrent = () => {
    setXmlInput(currentXml);
    setValidationResult(null);
  };

  return (
    <div className="tab-content-container">
      <div className="section-header">
        <div>
          <h2 className="section-title">Validator & guides</h2>
          <p className="section-subtitle">Check any sitemap against the sitemaps.org protocol, then submit it to search engines.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '1rem', alignItems: 'start' }}>
        {/* Validator */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.9rem', gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 650, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileCheck size={17} style={{ color: 'var(--primary)' }} />
              <span>Sitemap XML validator</span>
            </h3>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-secondary" onClick={handleLoadCurrent} disabled={!hasPages} title={hasPages ? 'Load the sitemap generated from your current pages' : 'Crawl or import pages first'}>
                <RefreshCw size={14} />
                <span>Load current sitemap</span>
              </button>
              <button type="button" className="btn btn-primary" onClick={handleValidate}>
                Validate
              </button>
            </div>
          </div>

          <textarea
            className="code-block"
            aria-label="Sitemap XML"
            spellCheck={false}
            placeholder="Paste sitemap XML here…"
            value={xmlInput}
            onChange={(e) => { setXmlInput(e.target.value); setValidationResult(null); }}
          />

          {validationResult && (
            <div
              className="issue-row"
              style={{
                display: 'block',
                borderLeftColor: validationResult.valid ? 'var(--accent-emerald)' : 'var(--accent-red)',
                background: validationResult.valid ? 'var(--success-soft)' : 'var(--danger-soft)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                {validationResult.valid ? (
                  <CheckCircle2 size={18} className="text-emerald" />
                ) : (
                  <XCircle size={18} className="text-red" />
                )}
                <span style={{ fontWeight: 650, fontSize: '0.92rem' }}>
                  {validationResult.valid ? 'Valid sitemap' : 'Validation failed'}
                </span>
              </div>

              {validationResult.valid ? (
                <>
                  <div style={{ marginTop: '0.45rem', fontSize: '0.84rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.4rem 1.5rem', flexWrap: 'wrap' }}>
                    <span>✓ {validationResult.count.toLocaleString()} {validationResult.kind === 'urlset' ? 'URLs' : 'child sitemaps'}</span>
                    <span>✓ {validationResult.sizeKb.toLocaleString()} KB (limit 50 MB)</span>
                    <span>✓ sitemaps.org 0.9 namespace</span>
                  </div>
                  {validationResult.warnings.length > 0 && (
                    <div style={{ marginTop: '0.45rem', fontSize: '0.84rem', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <AlertTriangle size={14} />
                      <span>Warnings: {validationResult.warnings.join(' · ')}</span>
                    </div>
                  )}
                </>
              ) : (
                <p style={{ marginTop: '0.35rem', fontSize: '0.85rem', color: 'var(--accent-red)' }}>
                  {validationResult.error}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Submission guide */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.9rem', gridColumn: '1 / -1' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 650, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Send size={17} className="text-emerald" />
            <span>Submit to search engines</span>
          </h3>

          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
            Upload <code>sitemap.xml</code> to your site's root, then let search engines know where it is:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '0.75rem' }}>
            {[
              {
                name: 'Google Search Console',
                href: 'https://search.google.com/search-console/sitemaps',
                text: <>Open <b>Sitemaps</b> in the sidebar, enter <code>sitemap.xml</code> and click <b>Submit</b>.</>
              },
              {
                name: 'Bing Webmaster Tools',
                href: 'https://www.bing.com/webmasters',
                text: <>Go to <b>Sitemaps → Submit sitemap</b> and paste your full sitemap URL.</>
              },
              {
                name: 'robots.txt',
                text: <>Add a <code>Sitemap: https://your-site.com/sitemap.xml</code> line so every crawler can find it. Google no longer accepts sitemap “ping” URLs.</>
              }
            ].map(item => (
              <div key={item.name} className="subpanel" style={{ gap: '0.3rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 650, fontSize: '0.9rem' }}>{item.name}</span>
                  {item.href && (
                    <a href={item.href} target="_blank" rel="noreferrer" className="icon-btn" style={{ width: '28px', height: '28px' }} aria-label={`Open ${item.name}`}>
                      <ExternalLink size={13} />
                    </a>
                  )}
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
