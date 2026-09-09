import React, { useState, useMemo } from 'react';
import { 
  Copy, 
  Download, 
  Check, 
  FileCode, 
  FileText, 
  FileSpreadsheet, 
  Braces,
  Settings2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  generateSitemapXml, 
  generateRobotsTxt, 
  generateUrlListTxt, 
  generateSeoCsv 
} from '../../utils/xmlGenerator';

export default function XmlStudioTab({ pages, targetUrl, addToast }) {
  const [activeSubtab, setActiveSubtab] = useState('xml');
  const [includeImages, setIncludeImages] = useState(true);
  const [copied, setCopied] = useState(false);

  // Generate artifacts
  const xmlContent = useMemo(() => {
    return generateSitemapXml(pages, { includeImages });
  }, [pages, includeImages]);

  const robotsContent = useMemo(() => {
    return generateRobotsTxt(targetUrl || 'https://example.com');
  }, [targetUrl]);

  const handleCopy = () => {
    const textToCopy = activeSubtab === 'xml' ? xmlContent : robotsContent;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    // Trigger celebratory confetti effect
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.85 }
      });
    } catch (e) {}

    addToast('Copied to clipboard successfully!', 'success');
  };

  const handleDownload = (type) => {
    let content = '';
    let filename = '';
    let mimeType = 'text/plain';

    if (type === 'xml') {
      content = xmlContent;
      filename = 'sitemap.xml';
      mimeType = 'application/xml';
    } else if (type === 'robots') {
      content = robotsContent;
      filename = 'robots.txt';
    } else if (type === 'txt') {
      content = generateUrlListTxt(pages);
      filename = 'urls.txt';
    } else if (type === 'csv') {
      content = generateSeoCsv(pages);
      filename = 'seo-audit.csv';
      mimeType = 'text/csv';
    } else if (type === 'json') {
      content = JSON.stringify(pages, null, 2);
      filename = 'sitemap.json';
      mimeType = 'application/json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addToast(`Downloaded ${filename}`, 'success');
  };

  return (
    <div className="tab-content-container">
      {/* Top Toolbar */}
      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={`btn ${activeSubtab === 'xml' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveSubtab('xml')}
            style={{ fontSize: '0.85rem', padding: '0.45rem 0.9rem' }}
          >
            <FileCode size={15} />
            <span>sitemap.xml</span>
          </button>
          <button
            className={`btn ${activeSubtab === 'robots' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveSubtab('robots')}
            style={{ fontSize: '0.85rem', padding: '0.45rem 0.9rem' }}
          >
            <FileText size={15} />
            <span>robots.txt</span>
          </button>
        </div>

        {/* Export & Action Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {activeSubtab === 'xml' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer', marginRight: '0.5rem' }}>
              <input
                type="checkbox"
                checked={includeImages}
                onChange={(e) => setIncludeImages(e.target.checked)}
              />
              <span>Google Images</span>
            </label>
          )}

          <button className="btn btn-secondary" onClick={handleCopy} style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}>
            {copied ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>

          <button className="btn btn-primary" onClick={() => handleDownload(activeSubtab)} style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}>
            <Download size={14} />
            <span>Download {activeSubtab === 'xml' ? 'XML' : 'TXT'}</span>
          </button>

          {/* Quick extra exports */}
          <button className="btn btn-secondary" onClick={() => handleDownload('csv')} title="Export SEO CSV" style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}>
            <FileSpreadsheet size={14} />
            <span>CSV</span>
          </button>

          <button className="btn btn-secondary" onClick={() => handleDownload('json')} title="Export JSON" style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}>
            <Braces size={14} />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Code Editor Preview */}
      <div className="code-viewer-container">
        <div className="code-viewer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }}></span>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }}></span>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></span>
            <span style={{ marginLeft: '0.5rem', fontFamily: 'var(--font-mono)' }}>
              {activeSubtab === 'xml' ? 'sitemap.xml (Standard 0.9 + Image Extension)' : 'robots.txt'}
            </span>
          </div>

          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {activeSubtab === 'xml' ? `${pages.length} URLs mapped` : 'UTF-8 Encoded'}
          </span>
        </div>

        <pre className="code-block">
          <code>
            {activeSubtab === 'xml' ? xmlContent : robotsContent}
          </code>
        </pre>
      </div>
    </div>
  );
}
