import React from 'react';
import { 
  FileText, 
  ShieldAlert, 
  ShieldCheck, 
  Zap, 
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function LiveMetrics({ pages = [], seoAudit, stats }) {
  const totalPages = pages.length;
  const healthy2xx = pages.filter(p => !p.statusCode || (p.statusCode >= 200 && p.statusCode < 300)).length;
  const broken4xx = pages.filter(p => p.statusCode && p.statusCode >= 400).length;

  const avgSpeed = totalPages > 0
    ? Math.round(pages.reduce((acc, p) => acc + (p.loadTime || 180), 0) / totalPages)
    : 0;

  const totalImages = pages.reduce((acc, p) => acc + (p.imagesCount || 0), 0);
  const score = seoAudit?.score || 100;

  // Clear subtitle showing breakdown
  let card1Subtitle = 'Awaiting website crawl';
  if (totalPages > 0) {
    if (stats && (stats.skipped > 0 || (stats.discovered && stats.discovered > totalPages))) {
      card1Subtitle = `${totalPages} added, ${stats.skipped} skipped (${stats.discovered} links scanned)`;
    } else {
      card1Subtitle = `${totalPages} indexed • ${totalImages} image tags`;
    }
  }

  return (
    <div className="metrics-grid">
      {/* 1. Total Sitemap Pages */}
      <div className="metric-card glass-panel">
        <div className="metric-icon-box" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)' }}>
          <Layers size={26} />
        </div>
        <div className="metric-content">
          <span className="metric-title">Sitemap Pages</span>
          <span className="metric-val">{totalPages}</span>
          <span className="metric-subtitle">
            {card1Subtitle}
          </span>
        </div>
      </div>

      {/* 2. SEO Health Score */}
      <div className="metric-card glass-panel">
        <div 
          className="metric-icon-box" 
          style={{ 
            background: totalPages === 0 ? 'rgba(255, 255, 255, 0.05)' : score >= 80 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', 
            color: totalPages === 0 ? 'var(--text-muted)' : score >= 80 ? 'var(--accent-emerald)' : 'var(--accent-amber)' 
          }}
        >
          {score >= 80 ? <ShieldCheck size={26} /> : <ShieldAlert size={26} />}
        </div>
        <div className="metric-content">
          <span className="metric-title">SEO Health Score</span>
          <span className="metric-val" style={{ color: totalPages === 0 ? 'var(--text-secondary)' : score >= 80 ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
            {totalPages > 0 ? `${score}/100` : '--/100'}
          </span>
          <span className="metric-subtitle">
            {totalPages > 0 ? `${seoAudit?.criticalCount || 0} critical, ${seoAudit?.warningCount || 0} warnings` : 'Audit pending'}
          </span>
        </div>
      </div>

      {/* 3. HTTP Health Ratio */}
      <div className="metric-card glass-panel">
        <div className="metric-icon-box" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)' }}>
          <CheckCircle2 size={26} />
        </div>
        <div className="metric-content">
          <span className="metric-title">HTTP Status Health</span>
          <span className="metric-val text-cyan">
            {healthy2xx} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ {totalPages}</span>
          </span>
          <span className="metric-subtitle" style={{ color: broken4xx > 0 ? 'var(--accent-red)' : 'var(--text-muted)' }}>
            {totalPages === 0 ? 'Ready to check links' : broken4xx > 0 ? `${broken4xx} broken links detected` : '100% reachable status'}
          </span>
        </div>
      </div>

      {/* 4. Avg Page Latency */}
      <div className="metric-card glass-panel">
        <div className="metric-icon-box" style={{ background: 'rgba(168, 85, 247, 0.15)', color: 'var(--accent-purple)' }}>
          <Zap size={26} />
        </div>
        <div className="metric-content">
          <span className="metric-title">Average Latency</span>
          <span className="metric-val text-purple">
            {totalPages > 0 ? avgSpeed : '--'} <span style={{ fontSize: '1rem' }}>ms</span>
          </span>
          <span className="metric-subtitle">
            {totalPages > 0 ? (avgSpeed < 300 ? 'Lightning fast response' : 'Standard network latency') : 'Standby'}
          </span>
        </div>
      </div>
    </div>
  );
}
