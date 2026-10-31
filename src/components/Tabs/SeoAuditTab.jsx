import React, { useState } from 'react';
import {
  AlertTriangle,
  XCircle,
  CheckCircle,
  Info,
  Eye,
  FileSearch,
  ShieldCheck
} from 'lucide-react';

const ISSUE_PAGE_SIZE = 50;

const ISSUE_STYLES = {
  critical: { className: 'badge-400' },
  warning: { className: 'badge-warn' },
  info: { className: 'badge-300' }
};

function BreakdownCard({ label, passed, passedLabel = 'passed', failed, failedLabel, failedColor }) {
  const total = passed + failed;
  const pct = total > 0 ? Math.round((passed / total) * 100) : 0;
  return (
    <div className="glass-panel" style={{ padding: '1.1rem 1.2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <span className="metric-title">{label}</span>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem' }}>
        <span style={{ fontSize: '1.35rem', fontWeight: 700, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
          {passed} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>{passedLabel}</span>
        </span>
        <span style={{ fontSize: '0.8rem', color: failed > 0 ? failedColor : 'var(--text-muted)' }}>
          {failed > 0 ? `${failed} ${failedLabel}` : 'All valid'}
        </span>
      </div>
      <div className="progress-track" style={{ height: '4px' }}>
        <div className="progress-fill" style={{ width: `${pct}%`, background: failed > 0 ? failedColor : 'var(--accent-emerald)' }} />
      </div>
    </div>
  );
}

export default function SeoAuditTab({ seoAudit, onInspectUrl, pages }) {
  const [visibleIssues, setVisibleIssues] = useState(ISSUE_PAGE_SIZE);
  const { score, criticalCount, warningCount, issues, breakdown } = seoAudit;

  // Calculate SVG circular stroke
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  if (!pages || pages.length === 0) {
    return (
      <div className="glass-panel empty-state">
        <div className="empty-state-icon"><ShieldCheck size={20} /></div>
        <span className="empty-state-title">No audit data yet</span>
        <span>
          Crawl a website or import a sitemap to audit titles, descriptions, headings and status codes.
        </span>
      </div>
    );
  }

  const scoreColor = score >= 85 ? 'var(--accent-emerald)' : score >= 65 ? 'var(--accent-amber)' : 'var(--accent-red)';
  const infoCount = issues.length - criticalCount - warningCount;

  return (
    <div className="tab-content-container">
      <div className="section-header">
        <div>
          <h2 className="section-title">SEO health</h2>
          <p className="section-subtitle">On-page checks for every URL in your sitemap.</p>
        </div>
      </div>

      {/* Score Gauge & Summary */}
      <div className="glass-panel score-gauge-box">
        <div className="circular-gauge">
          <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
            <circle
              cx="70"
              cy="70"
              r={radius}
              style={{ stroke: 'var(--bg-surface-elevated)' }}
              strokeWidth="10"
              fill="transparent"
            />
            <circle
              cx="70"
              cy="70"
              r={radius}
              style={{ stroke: scoreColor, transition: 'stroke-dashoffset 0.8s ease' }}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <div className="gauge-center-text">
            <span className="gauge-number" style={{ color: scoreColor }}>
              {score}
            </span>
            <span className="gauge-label">out of 100</span>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.015em', marginBottom: '0.35rem' }}>
            {score >= 90 ? 'Excellent SEO health' : score >= 75 ? 'Good health, minor warnings' : 'Action required'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem', maxWidth: '600px' }}>
            Checked {seoAudit.totalChecked} pages for HTTP status, title and description length, H1 headings, canonical tags and response time.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className="badge badge-400" style={{ padding: '0.35rem 0.75rem' }}>
              <XCircle size={13} />
              {criticalCount} critical
            </span>
            <span className="badge badge-warn" style={{ padding: '0.35rem 0.75rem' }}>
              <AlertTriangle size={13} />
              {warningCount} warnings
            </span>
            {infoCount > 0 && (
              <span className="badge badge-300" style={{ padding: '0.35rem 0.75rem' }}>
                <Info size={13} />
                {infoCount} notes
              </span>
            )}
            <span className="badge badge-200" style={{ padding: '0.35rem 0.75rem' }}>
              <CheckCircle size={13} />
              {seoAudit.healthyCount} healthy pages
            </span>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="metrics-grid">
        <BreakdownCard label="Page titles" passed={breakdown.titles.passed} failed={breakdown.titles.failed} failedLabel="issues" failedColor="var(--accent-red)" />
        <BreakdownCard label="Meta descriptions" passed={breakdown.descriptions.passed} failed={breakdown.descriptions.failed} failedLabel="warnings" failedColor="var(--accent-amber)" />
        <BreakdownCard label="H1 headings" passed={breakdown.h1.passed} failed={breakdown.h1.failed} failedLabel="missing" failedColor="var(--accent-amber)" />
        <BreakdownCard label="HTTP status" passed={breakdown.statusCodes.passed} passedLabel="OK" failed={breakdown.statusCodes.failed} failedLabel="broken" failedColor="var(--accent-red)" />
      </div>

      {/* Findings */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 650, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileSearch size={17} style={{ color: 'var(--primary)' }} />
          <span>Findings ({issues.length})</span>
        </h3>

        {issues.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem 1rem' }}>
            <div className="empty-state-icon" style={{ color: 'var(--accent-emerald)', background: 'var(--success-soft)' }}>
              <CheckCircle size={20} />
            </div>
            <span className="empty-state-title">No issues found</span>
            <span>Every page passed all checks.</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {issues.slice(0, visibleIssues).map((issue, idx) => (
              <div key={`${issue.url}-${issue.category}-${idx}`} className={`issue-row ${issue.type}`}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className={`badge ${(ISSUE_STYLES[issue.type] || ISSUE_STYLES.warning).className}`}>
                      {issue.category}
                    </span>
                    <span style={{ fontWeight: 550, fontSize: '0.9rem' }}>
                      {issue.message}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
                    {issue.url}
                  </span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {issue.recommendation}
                  </span>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', flexShrink: 0 }}
                  onClick={() => {
                    const matchedPage = pages.find(p => p.url === issue.url);
                    if (matchedPage) onInspectUrl(matchedPage);
                  }}
                >
                  <Eye size={14} />
                  <span>Inspect</span>
                </button>
              </div>
            ))}

            {issues.length > visibleIssues && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ alignSelf: 'center', marginTop: '0.4rem' }}
                onClick={() => setVisibleIssues(v => v + ISSUE_PAGE_SIZE)}
              >
                Show more ({issues.length - visibleIssues} remaining)
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
