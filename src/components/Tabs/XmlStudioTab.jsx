import React, { useState, useMemo } from 'react';
import { 
  Copy, 
  Download, 
  Check, 
  FileCode, 
  FileText, 
  FileSpreadsheet, 
  Braces,
  List
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  generateSitemapXml, 
  generateRobotsTxt, 
  generateUrlListTxt, 
  generateSeoCsv 
} from '../../utils/xmlGenerator';

export default function XmlStudioTab({ pages, targetUrl, addToast, defaultIncludeImages = true }) {
  const [activeSubtab, setActiveSubtab] = useState('xml');
  const [includeImages, setIncludeImages] = useState(defaultIncludeImages);
  const [copied, setCopied] = useState(false);

  // Generate artifacts
  const xmlContent = useMemo(() => {
    return generateSitemapXml(pages, { includeImages });
  }, [pages, includeImages]);

  const robotsContent = useMemo(() => {
    let origin = 'https://example.com';
    try {
      origin = new URL(targetUrl || pages[0]?.url).origin;
    } catch (e) {}
    return generateRobotsTxt(origin);
  }, [targetUrl, pages]);

  const urlCount = useMemo(() => pages.filter(p => !(p.statusCode >= 400)).length, [pages]);

  const handleCopy = async () => {
    const textToCopy = activeSubtab === 'xml' ? xmlContent : robotsContent;
    try {
      await navigator.clipboard.writeText(textToCopy);
    } catch (e) {
      addToast('Clipboard access was blocked by the browser. Use Download instead.', 'error');
      return;
    }
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
      <div className="section-header">
        <div>
          <h2 className="section-title">XML studio</h2>
          <p className="section-subtitle">Preview, copy and download your sitemap, robots.txt and data exports.</p>
        </div>
        <div className="segmented" role="tablist" aria-label="File">
          <button type="button" role="tab" aria-selected={activeSubtab === 'xml'} className={activeSubtab === 'xml' ? 'active' : ''} onClick={() => setActiveSubtab('xml')}>
            <FileCode size={14} />
            <span>sitemap.xml</span>
          </button>
          <button type="button" role="tab" aria-selected={activeSubtab === 'robots'} className={activeSubtab === 'robots' ? 'active' : ''} onClick={() => setActiveSubtab('robots')}>
            <FileText size={14} />
            <span>robots.txt</span>
          </button>
        </div>
      </div>

      {/* Export & Action Buttons */}
      <div className="glass-panel toolbar">
        <div className="toolbar-group">
          <button type="button" className="btn btn-primary" onClick={() => handleDownload(activeSubtab)} disabled={activeSubtab === 'xml' && pages.length === 0}>
            <Download size={14} />
            <span>Download {activeSubtab === 'xml' ? 'sitemap.xml' : 'robots.txt'}</span>
          </button>

          <button type="button" className="btn btn-secondary" onClick={handleCopy}>
            {copied ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          {activeSubtab === 'xml' && (
            <label className="toggle-control" style={{ marginLeft: '0.25rem' }}>
              <input
                type="checkbox"
                checked={includeImages}
                onChange={(e) => setIncludeImages(e.target.checked)}
              />
              <span>Include image tags</span>
            </label>
          )}
        </div>

        <div className="toolbar-group">
          <span className="unit-label">Other exports:</span>
          <button type="button" className="btn btn-secondary" onClick={() => handleDownload('txt')} disabled={pages.length === 0} title="Plain list of URLs" style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}>
            <List size={14} />
            <span>TXT</span>
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => handleDownload('csv')} disabled={pages.length === 0} title="SEO audit spreadsheet" style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}>
            <FileSpreadsheet size={14} />
            <span>CSV</span>
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => handleDownload('json')} disabled={pages.length === 0} title="Full data (re-importable)" style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}>
            <Braces size={14} />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Code Editor Preview */}
      <div className="code-viewer-container">
        <div className="code-viewer-header">
          <span style={{ fontFamily: 'var(--font-mono)' }}>
            {activeSubtab === 'xml' ? 'sitemap.xml' : 'robots.txt'}
          </span>
          <span>
            {activeSubtab === 'xml' ? `${urlCount} URLs · sitemaps.org 0.9` : 'UTF-8'}
          </span>
        </div>

        <pre className="code-block">{activeSubtab === 'xml' ? xmlContent : robotsContent}</pre>
      </div>
    </div>
  );
}
