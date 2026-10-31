import React, { useEffect } from 'react';
import {
  X,
  ExternalLink,
  Share2,
  FileText
} from 'lucide-react';

function StatTile({ label, value, color }) {
  return (
    <div className="glass-panel" style={{ padding: '0.75rem', background: 'var(--surface-2)', boxShadow: 'none' }}>
      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{label}</span>
      <div style={{ fontWeight: 650, marginTop: '0.15rem', color: color || 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
    </div>
  );
}

function LengthBadge({ length, min, max }) {
  const ideal = length >= min && length <= max;
  return (
    <span className={`badge ${ideal ? 'badge-200' : 'badge-warn'}`} style={{ fontSize: '0.7rem' }}>
      {length} chars {ideal ? '· ideal' : `· aim for ${min}–${max}`}
    </span>
  );
}

export default function PageModal({ page, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  if (!page) return null;

  const failed = page.fetchFailed || !page.statusCode;
  const is2xx = !failed && page.statusCode >= 200 && page.statusCode < 300;
  const titleLen = (page.title || '').length;
  const descLen = (page.description || '').length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="page-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '1.1rem 1.4rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileText size={18} style={{ color: 'var(--primary)' }} />
            <h3 id="page-modal-title" style={{ fontSize: '1.02rem', fontWeight: 650 }}>Page inspector</h3>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close" autoFocus>
            <X size={17} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              URL
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
              <span style={{ fontWeight: 550, wordBreak: 'break-all', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                {page.url}
              </span>
              <a href={page.url} target="_blank" rel="noreferrer" className="ext-link" aria-label="Open page in new tab">
                <ExternalLink size={14} />
              </a>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.6rem' }}>
            <StatTile
              label="HTTP status"
              value={failed ? 'Not reached' : `${page.statusCode} ${is2xx ? 'OK' : 'Error'}`}
              color={failed ? 'var(--accent-amber)' : is2xx ? 'var(--accent-emerald)' : 'var(--accent-red)'}
            />
            <StatTile label="Response time" value={page.loadTime > 0 ? `${page.loadTime} ms` : '—'} />
            <StatTile label="Depth" value={`Level ${page.depth ?? 0}`} />
            <StatTile label="Images" value={page.imagesCount || 0} />
          </div>

          <div className="glass-panel" style={{ padding: '1rem', boxShadow: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
              <span className="option-label">Title tag</span>
              <LengthBadge length={titleLen} min={30} max={65} />
            </div>
            <p style={{ fontWeight: 550, fontSize: '0.95rem', color: page.title ? 'var(--text-primary)' : 'var(--accent-red)' }}>
              {page.title || 'Missing title tag'}
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '1rem', boxShadow: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
              <span className="option-label">Meta description</span>
              <LengthBadge length={descLen} min={100} max={165} />
            </div>
            <p style={{ fontSize: '0.9rem', color: page.description ? 'var(--text-secondary)' : 'var(--accent-red)' }}>
              {page.description || 'Missing meta description tag'}
            </p>
          </div>

          {page.h1 && (
            <div className="glass-panel" style={{ padding: '1rem', boxShadow: 'none' }}>
              <span className="option-label">H1 heading</span>
              <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>{page.h1}</p>
            </div>
          )}

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>
              <Share2 size={14} />
              <span>Search result preview</span>
            </div>
            <div className="serp-preview">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>{page.url}</div>
              <div style={{ fontSize: '1.05rem', color: 'var(--link)', margin: '0.15rem 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {page.title || 'Untitled'}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {(page.description || 'No description provided.').slice(0, 165)}
                {descLen > 165 ? '…' : ''}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '0.9rem 1.4rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
