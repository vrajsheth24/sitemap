import React, { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { escapeHtmlAttr } from '../../utils/seoTools';
import { CodeOutput } from './ToolShared';

// ISO 639-1 language, optional ISO 3166-1 alpha-2 region (or UN M.49 numeric), or x-default
const HREFLANG_RE = /^([a-z]{2,3})(-([a-z]{2}|\d{3}|[a-z]{4}(-[a-z]{2})?))?$/i;

const PRESETS = [
  { code: 'en', label: 'English' },
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'en-IN', label: 'English (India)' },
  { code: 'hi', label: 'Hindi' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'pt-BR', label: 'Portuguese (Brazil)' },
  { code: 'ja', label: 'Japanese' },
  { code: 'zh-Hans', label: 'Chinese (Simplified)' },
  { code: 'ar', label: 'Arabic' }
];

function validate(rows) {
  const issues = [];
  const seen = new Set();
  rows.forEach((r, i) => {
    const code = r.code.trim();
    const url = r.url.trim();
    if (!code && !url) return;
    if (!HREFLANG_RE.test(code)) {
      issues.push(`Row ${i + 1}: “${code || '(empty)'}” is not a valid hreflang code (use e.g. en, en-GB, pt-BR).`);
    } else if (/^[a-z]{2,3}-[a-z]{2}$/i.test(code) && code.split('-')[1].toUpperCase() === 'UK') {
      issues.push(`Row ${i + 1}: use “en-GB” for the United Kingdom, not “${code}”.`);
    }
    if (!/^https?:\/\/\S+$/i.test(url)) issues.push(`Row ${i + 1}: URL must be absolute (https://…).`);
    const key = code.toLowerCase();
    if (seen.has(key)) issues.push(`Row ${i + 1}: “${code}” is listed more than once.`);
    seen.add(key);
  });
  return issues;
}

export default function HreflangTool({ addToast }) {
  const [rows, setRows] = useState([
    { code: 'en', url: 'https://example.com/' },
    { code: 'es', url: 'https://example.com/es/' }
  ]);
  const [xDefault, setXDefault] = useState('https://example.com/');
  const [format, setFormat] = useState('html');

  const valid = rows.filter(r => r.code.trim() && r.url.trim());
  const issues = useMemo(() => validate(rows), [rows]);

  const code = useMemo(() => {
    const entries = valid.map(r => ({ code: r.code.trim(), url: r.url.trim() }));
    if (xDefault.trim()) entries.push({ code: 'x-default', url: xDefault.trim() });
    if (entries.length === 0) return '';

    if (format === 'html') {
      return entries.map(e => `<link rel="alternate" hreflang="${escapeHtmlAttr(e.code)}" href="${escapeHtmlAttr(e.url)}">`).join('\n');
    }
    // Sitemap: every language version is its own <url> listing all alternates (including itself)
    const links = entries.map(e => `    <xhtml:link rel="alternate" hreflang="${escapeHtmlAttr(e.code)}" href="${escapeHtmlAttr(e.url)}"/>`).join('\n');
    const urls = valid.map(r => `  <url>\n    <loc>${escapeHtmlAttr(r.url.trim())}</loc>\n${links}\n  </url>`).join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>`;
  }, [valid, xDefault, format]);

  const updateRow = (i, patch) => setRows(rs => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  return (
    <div className="tool-body">
      <div className="glass-panel tool-panel">
        <h3 className="tool-panel-title">Language versions of this page</h3>
        <span className="option-hint">
          List every translated or regional version of the same page. Each version must include this full set of tags, including a link to itself.
        </span>

        {rows.map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <input className="option-input mono" list="hreflang-codes" style={{ flex: '0 1 130px' }} placeholder="en-GB" value={r.code}
              onChange={(e) => updateRow(i, { code: e.target.value })} aria-label={`Language code ${i + 1}`} />
            <input className="option-input mono" style={{ flex: '1 1 260px' }} placeholder="https://example.com/uk/" value={r.url}
              onChange={(e) => updateRow(i, { url: e.target.value })} aria-label={`URL ${i + 1}`} />
            <button type="button" className="icon-btn hover-danger" aria-label={`Remove row ${i + 1}`} disabled={rows.length === 1}
              onClick={() => setRows(rs => rs.filter((_, j) => j !== i))}>
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        <datalist id="hreflang-codes">
          {PRESETS.map(p => <option key={p.code} value={p.code}>{p.label}</option>)}
        </datalist>
        <button type="button" className="btn btn-secondary" style={{ alignSelf: 'flex-start' }} onClick={() => setRows(rs => [...rs, { code: '', url: '' }])}>
          <Plus size={14} /><span>Add language</span>
        </button>

        <div className="option-group">
          <label className="option-label" htmlFor="hreflang-xdefault">Fallback page (x-default)</label>
          <input id="hreflang-xdefault" className="option-input mono" placeholder="https://example.com/ (language picker or main version)" value={xDefault}
            onChange={(e) => setXDefault(e.target.value)} />
          <span className="option-hint">Shown to users whose language doesn't match any version. Leave empty to skip.</span>
        </div>

        {issues.length > 0 && (
          <ul className="plain-list" style={{ marginTop: 0 }}>
            {issues.map(issue => <li key={issue} className="field-error">• {issue}</li>)}
          </ul>
        )}
      </div>

      <div className="segmented" style={{ alignSelf: 'flex-start' }}>
        <button type="button" className={format === 'html' ? 'active' : ''} onClick={() => setFormat('html')}>HTML &lt;head&gt; tags</button>
        <button type="button" className={format === 'sitemap' ? 'active' : ''} onClick={() => setFormat('sitemap')}>XML sitemap</button>
      </div>
      <CodeOutput code={code || '<!-- Add at least one language and URL -->'} filename={format === 'html' ? 'Paste inside <head> on every version' : 'sitemap.xml (hreflang)'} addToast={addToast} />
    </div>
  );
}
