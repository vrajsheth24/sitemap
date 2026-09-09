import React from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';

export default function ProgressBar({ progress, isCrawling }) {
  if (!progress || (!isCrawling && progress.status === 'idle')) {
    return null;
  }

  const { current = 0, total = 100, percent = 0, currentUrl = '', status = 'crawling' } = progress;
  const isDone = !isCrawling && status === 'completed';

  return (
    <div className="glass-panel" style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', animation: 'fadeIn 0.25s ease' }}>
      {/* Top info row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0, flex: 1 }}>
          {isDone ? (
            <CheckCircle2 size={16} className="text-emerald" />
          ) : (
            <span 
              className="status-dot crawling" 
              style={{ width: '10px', height: '10px', display: 'inline-block' }}
            />
          )}

          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: isDone ? 'var(--accent-emerald)' : 'var(--accent-cyan)' }}>
            {isDone ? 'Crawl Finished:' : 'Live Crawling:'}
          </span>

          <span 
            style={{ 
              fontSize: '0.85rem', 
              color: 'var(--text-secondary)', 
              fontFamily: 'var(--font-mono)',
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap',
              maxWidth: '550px' 
            }}
            title={currentUrl}
          >
            {currentUrl || 'Initializing crawler queue...'}
          </span>
        </div>

        {/* Counts & Percentage */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>
            <b style={{ color: 'var(--text-primary)' }}>{current}</b> {isDone ? `pages added to sitemap` : `/ ${total} pages (limit)`}
          </span>
          <span 
            className="badge" 
            style={{ 
              background: isDone ? 'rgba(16, 185, 129, 0.2)' : 'rgba(6, 182, 212, 0.2)', 
              color: isDone ? 'var(--accent-emerald)' : 'var(--accent-cyan)',
              fontWeight: 800,
              fontSize: '0.8rem',
              padding: '0.2rem 0.55rem'
            }}
          >
            {isDone ? '100%' : `${percent}%`}
          </span>
        </div>
      </div>

      {/* Progress track */}
      <div 
        style={{ 
          width: '100%', 
          height: '8px', 
          background: 'rgba(255, 255, 255, 0.08)', 
          borderRadius: '999px', 
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <div 
          style={{ 
            height: '100%', 
            width: `${isDone ? 100 : Math.min(100, Math.max(0, percent))}%`, 
            background: isDone 
              ? 'linear-gradient(90deg, #10b981, #06b6d4)' 
              : 'linear-gradient(90deg, #6366f1, #06b6d4, #10b981)',
            borderRadius: '999px', 
            transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 0 10px rgba(6, 182, 212, 0.5)'
          }} 
        />
      </div>
    </div>
  );
}
