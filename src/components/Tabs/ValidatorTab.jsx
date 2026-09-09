import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Send, 
  ExternalLink, 
  ShieldCheck, 
  FileCheck,
  HelpCircle 
} from 'lucide-react';

export default function ValidatorTab({ currentXml, addToast }) {
  const [xmlInput, setXmlInput] = useState(currentXml || '');
  const [validationResult, setValidationResult] = useState(null);

  const handleValidate = () => {
    if (!xmlInput.trim()) {
      setValidationResult({ valid: false, error: 'Please enter or paste XML content.' });
      return;
    }

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlInput, 'text/xml');

      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        setValidationResult({
          valid: false,
          error: 'XML Syntax Error: ' + parserError.textContent.slice(0, 200)
        });
        return;
      }

      const urlset = xmlDoc.querySelector('urlset');
      const sitemapindex = xmlDoc.querySelector('sitemapindex');

      if (!urlset && !sitemapindex) {
        setValidationResult({
          valid: false,
          error: 'Missing required root element <urlset> or <sitemapindex>.'
        });
        return;
      }

      const urls = xmlDoc.querySelectorAll('url');
      const count = urls.length;

      if (count > 50000) {
        setValidationResult({
          valid: false,
          error: `Sitemap exceeds Google's limit of 50,000 URLs (Found ${count}). Please split into sitemap index.`
        });
        return;
      }

      // Check URL formats
      let invalidLocs = 0;
      urls.forEach(u => {
        const loc = u.querySelector('loc')?.textContent?.trim();
        if (!loc || (!loc.startsWith('http://') && !loc.startsWith('https://'))) {
          invalidLocs++;
        }
      });

      if (invalidLocs > 0) {
        setValidationResult({
          valid: false,
          error: `Found ${invalidLocs} <loc> elements with missing or invalid HTTP/HTTPS URLs.`
        });
        return;
      }

      setValidationResult({
        valid: true,
        count,
        sizeKb: Math.round(new Blob([xmlInput]).size / 1024),
        hasNamespace: !!urlset?.getAttribute('xmlns'),
      });
      addToast('Validation passed! Conforms to sitemaps.org standard.', 'success');
    } catch (e) {
      setValidationResult({ valid: false, error: e.message });
    }
  };

  return (
    <div className="tab-content-container">
      <div className="metrics-grid">
        {/* Validator Column */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileCheck size={18} className="text-cyan" />
              <span>Sitemap XML Conformance Validator</span>
            </h3>

            <button className="btn btn-primary" onClick={handleValidate} style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}>
              Validate XML
            </button>
          </div>

          <textarea
            className="code-block"
            style={{ 
              width: '100%', 
              height: '240px', 
              background: '#0d1117', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--border-subtle)',
              resize: 'vertical',
              outline: 'none'
            }}
            placeholder="Paste raw XML here or click Validate to check current sitemap..."
            value={xmlInput}
            onChange={(e) => setXmlInput(e.target.value)}
          />

          {/* Validation Feedback Box */}
          {validationResult && (
            <div 
              className="glass-panel"
              style={{
                padding: '1rem',
                borderLeft: `4px solid ${validationResult.valid ? 'var(--accent-emerald)' : 'var(--accent-red)'}`,
                background: validationResult.valid ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                {validationResult.valid ? (
                  <CheckCircle2 size={20} className="text-emerald" />
                ) : (
                  <XCircle size={20} className="text-red" />
                )}
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                  {validationResult.valid ? 'Sitemap is 100% Valid & Compliant' : 'Validation Failed'}
                </span>
              </div>

              {validationResult.valid ? (
                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: '1.5rem' }}>
                  <span>✓ {validationResult.count} valid URLs</span>
                  <span>✓ Size: {validationResult.sizeKb} KB (&lt; 50 MB limit)</span>
                  <span>✓ sitemaps.org 0.9 namespace</span>
                </div>
              ) : (
                <p style={{ marginTop: '0.4rem', fontSize: '0.85rem', color: 'var(--accent-red)' }}>
                  {validationResult.error}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Search Engine Submission Guide */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Send size={18} className="text-emerald" />
            <span>Search Engine Submission</span>
          </h3>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Follow these steps to submit your newly generated `sitemap.xml` to major search engines:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="glass-panel" style={{ padding: '0.85rem', background: 'rgba(255, 255, 255, 0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Google Search Console</span>
                <a 
                  href="https://search.google.com/search-console/sitemaps" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="icon-btn" 
                  style={{ width: '28px', height: '28px' }}
                >
                  <ExternalLink size={13} />
                </a>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                Navigate to <b>Sitemaps</b> in the sidebar, enter <code>sitemap.xml</code>, and click <b>Submit</b>.
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '0.85rem', background: 'rgba(255, 255, 255, 0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Bing Webmaster Tools</span>
                <a 
                  href="https://www.bing.com/webmasters" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="icon-btn" 
                  style={{ width: '28px', height: '28px' }}
                >
                  <ExternalLink size={13} />
                </a>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                Go to <b>Sitemaps &gt; Submit Sitemap</b> and provide your full sitemap URL.
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '0.85rem', background: 'rgba(255, 255, 255, 0.02)' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Direct Ping Protocol</span>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                Search engines can also be notified by pinging:
                <br />
                <code>https://www.google.com/ping?sitemap=...</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
