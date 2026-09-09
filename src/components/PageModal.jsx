import React from 'react';
import { 
  X, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  HardDrive, 
  Layers, 
  Share2,
  FileText
} from 'lucide-react';

export default function PageModal({ page, onClose }) {
  if (!page) return null;

  const is2xx = !page.statusCode || (page.statusCode >= 200 && page.statusCode < 300);
  const titleLen = (page.title || '').length;
  const descLen = (page.description || '').length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileText size={20} className="text-cyan" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Page Inspector & SEO Audit</h3>
          </div>
          <button className="icon-btn" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Target URL banner */}
          <div className="glass-panel" style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.02)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Inspected URL
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
              <span style={{ fontWeight: 600, wordBreak: 'break-all', color: 'var(--text-primary)' }}>
                {page.url}
              </span>
              <a href={page.url} target="_blank" rel="noreferrer" className="text-cyan">
                <ExternalLink size={14} />
              </a>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
            <div className="glass-panel" style={{ padding: '0.75rem', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>HTTP Status</span>
              <div style={{ fontWeight: 700, marginTop: '0.2rem', color: is2xx ? 'var(--accent-emerald)' : 'var(--accent-red)' }}>
                {page.statusCode || 200} {is2xx ? 'OK' : 'Error'}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '0.75rem', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Response Speed</span>
              <div style={{ fontWeight: 700, marginTop: '0.2rem', color: 'var(--accent-cyan)' }}>
                {page.loadTime || 180} ms
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '0.75rem', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Hierarchy Depth</span>
              <div style={{ fontWeight: 700, marginTop: '0.2rem' }}>
                Level {page.depth ?? 0}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '0.75rem', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Images Tagged</span>
              <div style={{ fontWeight: 700, marginTop: '0.2rem', color: 'var(--accent-purple)' }}>
                {page.imagesCount || 0} Assets
              </div>
            </div>
          </div>

          {/* Title Tag Analysis */}
          <div className="glass-panel" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                TITLE TAG
              </span>
              <span className="badge" style={{ fontSize: '0.7rem', background: (titleLen >= 30 && titleLen <= 65) ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: (titleLen >= 30 && titleLen <= 65) ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
                {titleLen} characters {(titleLen >= 30 && titleLen <= 65) ? '(Ideal)' : '(Check length)'}
              </span>
            </div>
            <p style={{ fontWeight: 600, fontSize: '0.95rem', color: page.title ? 'var(--text-primary)' : 'var(--accent-red)' }}>
              {page.title || 'Missing title tag'}
            </p>
          </div>

          {/* Meta Description Analysis */}
          <div className="glass-panel" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                META DESCRIPTION
              </span>
              <span className="badge" style={{ fontSize: '0.7rem', background: (descLen >= 100 && descLen <= 165) ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: (descLen >= 100 && descLen <= 165) ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
                {descLen} characters {(descLen >= 100 && descLen <= 165) ? '(Ideal)' : '(Check length)'}
              </span>
            </div>
            <p style={{ fontSize: '0.9rem', color: page.description ? 'var(--text-secondary)' : 'var(--accent-red)' }}>
              {page.description || 'Missing meta description tag'}
            </p>
          </div>

          {/* Social Snippet Card (SERP / Open Graph Preview) */}
          <div className="glass-panel" style={{ padding: '1rem', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 700 }}>
              <Share2 size={14} />
              <span>Google SERP & Social Sharing Card Preview</span>
            </div>
            <div style={{ background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)', padding: '0.85rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>{page.url}</div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: '#60a5fa', margin: '0.2rem 0' }}>{page.title || 'Untitled'}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{page.description || 'No description provided.'}</div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
