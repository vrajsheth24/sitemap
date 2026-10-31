import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  Layers,
  Activity
} from 'lucide-react';

function MetricCard({ title, icon: Icon, iconColor, iconBg, value, unit, valueColor, subtitle, subtitleColor }) {
  return (
    <div className="metric-card glass-panel">
      <div className="metric-top">
        <span className="metric-title">{title}</span>
        <div className="metric-icon-box" style={{ background: iconBg, color: iconColor }}>
          <Icon size={16} />
        </div>
      </div>
      <span className="metric-val" style={value === '–' ? { color: 'var(--text-muted)' } : valueColor ? { color: valueColor } : undefined}>
        {value}
        {unit && value !== '–' && <span className="metric-unit">{unit}</span>}
      </span>
      <span className="metric-subtitle" style={subtitleColor ? { color: subtitleColor } : undefined} title={subtitle}>
        {subtitle}
      </span>
    </div>
  );
}

export default function LiveMetrics({ pages = [], seoAudit, stats }) {
  const totalPages = pages.length;
  const hasPages = totalPages > 0;
  const reachedPages = pages.filter(p => !p.fetchFailed);
  const healthy2xx = reachedPages.filter(p => !p.statusCode || (p.statusCode >= 200 && p.statusCode < 300)).length;
  const broken4xx = pages.filter(p => p.statusCode && p.statusCode >= 400).length;
  const unreachable = pages.length - reachedPages.length;

  // Only average real measurements (imported pages have no latency)
  const timedPages = pages.filter(p => p.loadTime > 0 && !p.fetchFailed);
  const avgSpeed = timedPages.length > 0
    ? Math.round(timedPages.reduce((acc, p) => acc + p.loadTime, 0) / timedPages.length)
    : null;

  const totalImages = pages.reduce((acc, p) => acc + (p.imagesCount || 0), 0);
  const score = seoAudit?.score ?? 0;
  const scoreGood = score >= 80;

  let pagesSubtitle = 'Awaiting a crawl or import';
  if (hasPages) {
    pagesSubtitle = stats && stats.skipped > 0
      ? `${stats.skipped} skipped · ${stats.discovered} links scanned`
      : `${totalImages} images found`;
  }

  let statusSubtitle = 'Ready to check links';
  let statusSubtitleColor;
  if (hasPages) {
    if (broken4xx > 0) {
      statusSubtitle = `${broken4xx} broken link${broken4xx === 1 ? '' : 's'} detected`;
      statusSubtitleColor = 'var(--accent-red)';
    } else if (unreachable > 0) {
      statusSubtitle = `${unreachable} page${unreachable === 1 ? '' : 's'} not reachable`;
      statusSubtitleColor = 'var(--accent-amber)';
    } else {
      statusSubtitle = 'All pages reachable';
    }
  }

  return (
    <div className="metrics-grid">
      <MetricCard
        title="Sitemap pages"
        icon={Layers}
        iconBg="var(--primary-soft)"
        iconColor="var(--primary)"
        value={totalPages}
        subtitle={pagesSubtitle}
      />

      <MetricCard
        title="SEO health score"
        icon={hasPages && !scoreGood ? ShieldAlert : ShieldCheck}
        iconBg={!hasPages ? 'var(--surface-hover)' : scoreGood ? 'var(--success-soft)' : 'var(--warning-soft)'}
        iconColor={!hasPages ? 'var(--text-muted)' : scoreGood ? 'var(--accent-emerald)' : 'var(--accent-amber)'}
        value={hasPages ? score : '–'}
        unit="/100"
        valueColor={!hasPages ? 'var(--text-muted)' : scoreGood ? 'var(--accent-emerald)' : 'var(--accent-amber)'}
        subtitle={hasPages ? `${seoAudit?.criticalCount || 0} critical · ${seoAudit?.warningCount || 0} warnings` : 'Audit pending'}
      />

      <MetricCard
        title="HTTP status health"
        icon={Activity}
        iconBg="var(--info-soft)"
        iconColor="var(--accent-cyan)"
        value={hasPages ? healthy2xx : '–'}
        unit={hasPages ? ` / ${totalPages}` : undefined}
        subtitle={statusSubtitle}
        subtitleColor={statusSubtitleColor}
      />

      <MetricCard
        title="Average response time"
        icon={Zap}
        iconBg="var(--violet-soft)"
        iconColor="var(--accent-purple)"
        value={avgSpeed ?? '–'}
        unit="ms"
        subtitle={avgSpeed === null
          ? (hasPages ? 'No timing data for imported pages' : 'Standby')
          : avgSpeed < 450 ? 'Fast responses' : avgSpeed < 1200 ? 'Moderate responses (includes proxy time)' : 'Slow responses (includes proxy time)'}
      />
    </div>
  );
}
