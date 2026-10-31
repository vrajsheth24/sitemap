import React, { useState } from 'react';
import { Copy, Check, Globe } from 'lucide-react';
import { copyText } from '../../utils/seoTools';

export function NeedsCrawl({ message = 'Crawl a website first — this tool analyzes your crawled pages.' }) {
  return (
    <div className="glass-panel empty-state">
      <div className="empty-state-icon"><Globe size={20} /></div>
      <span className="empty-state-title">No crawl data yet</span>
      <span>{message}</span>
    </div>
  );
}

export function StatPill({ label, value, tone }) {
  const color = tone === 'bad' ? 'var(--accent-red)' : tone === 'warn' ? 'var(--accent-amber)' : tone === 'good' ? 'var(--accent-emerald)' : 'var(--text-primary)';
  return (
    <div className="stat-pill">
      <span className="stat-pill-value" style={{ color }}>{value}</span>
      <span className="stat-pill-label">{label}</span>
    </div>
  );
}

export function CodeOutput({ code, filename, addToast }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    if (await copyText(code, addToast)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  return (
    <div className="code-viewer-container">
      <div className="code-viewer-header">
        <span style={{ fontFamily: 'var(--font-mono)' }}>{filename}</span>
        <button type="button" className="btn btn-secondary" onClick={handleCopy} style={{ fontSize: '0.76rem', padding: '0.25rem 0.6rem', background: 'transparent', color: '#e3e6ec', borderColor: 'rgba(255,255,255,0.15)' }}>
          {copied ? <Check size={13} /> : <Copy size={13} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="code-block" style={{ maxHeight: '420px' }}>{code}</pre>
    </div>
  );
}

export function PageLink({ page, onInspectPage }) {
  return (
    <button type="button" className="url-link-btn" onClick={() => onInspectPage?.(page)} title="Inspect page">
      {page.url}
    </button>
  );
}

// Inline select for choosing one of the crawled pages to prefill a form
export function PagePicker({ pages, onPick, label = 'Prefill from crawled page' }) {
  if (!pages || pages.length === 0) return null;
  return (
    <select
      className="option-select"
      aria-label={label}
      value=""
      onChange={(e) => {
        const page = pages.find(p => p.url === e.target.value);
        if (page) onPick(page);
      }}
      style={{ maxWidth: '100%' }}
    >
      <option value="">{label}…</option>
      {pages.slice(0, 500).map(p => (
        <option key={p.url} value={p.url}>{p.url}</option>
      ))}
    </select>
  );
}
