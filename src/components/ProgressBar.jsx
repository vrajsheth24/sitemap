import React from 'react';
import { CheckCircle2, AlertTriangle, PauseCircle } from 'lucide-react';

export default function ProgressBar({ progress, isCrawling }) {
  if (!progress || (!isCrawling && progress.status === 'idle')) {
    return null;
  }

  const { current = 0, total = 100, percent = 0, currentUrl = '', status = 'crawling' } = progress;
  const isDone = !isCrawling && status === 'completed';
  const isWarning = !isCrawling && status === 'warning';
  const isStopped = !isCrawling && status === 'stopped';

  const stateClass = isCrawling ? 'is-crawling' : isDone ? 'is-done' : isWarning ? 'is-warning' : 'is-stopped';
  const accent = isDone ? 'var(--accent-emerald)' : isWarning || isStopped ? 'var(--accent-amber)' : 'var(--primary)';
  const label = isDone ? 'Crawl finished' : isWarning ? 'Crawl notice' : isStopped ? 'Crawl stopped' : 'Crawling';
  const fillWidth = isDone || isWarning ? 100 : Math.min(100, Math.max(0, percent));

  return (
    <div className={`glass-panel progress-card ${stateClass}`} role="status" aria-live="polite">
      <div className="progress-row">
        <div className="progress-label">
          {isDone ? (
            <CheckCircle2 size={16} style={{ color: accent, flexShrink: 0 }} />
          ) : isWarning ? (
            <AlertTriangle size={16} style={{ color: accent, flexShrink: 0 }} />
          ) : isStopped ? (
            <PauseCircle size={16} style={{ color: accent, flexShrink: 0 }} />
          ) : (
            <span className="status-dot crawling" />
          )}

          <strong style={{ color: accent }}>{label}</strong>

          <span
            className="progress-url"
            style={isWarning ? { color: 'var(--accent-amber)', fontFamily: 'var(--font-sans)', whiteSpace: 'normal' } : undefined}
            title={currentUrl}
          >
            {currentUrl || 'Initializing crawler queue…'}
          </span>
        </div>

        <div className="progress-count">
          <span>
            <b>{current}</b> {isCrawling ? `/ ${total} page limit` : 'pages in sitemap'}
          </span>
          {!isWarning && (
            <span className="badge" style={{ background: 'var(--surface-hover)', color: accent }}>
              {isDone ? '100%' : `${percent}%`}
            </span>
          )}
        </div>
      </div>

      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${fillWidth}%` }} />
      </div>
    </div>
  );
}
