import React from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  XCircle, 
  CheckCircle, 
  Info, 
  Eye, 
  TrendingUp,
  FileSearch
} from 'lucide-react';

export default function SeoAuditTab({ seoAudit, onInspectUrl, pages }) {
  const { score, criticalCount, warningCount, issues, breakdown } = seoAudit;

  // Calculate SVG circular stroke
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  if (!pages || pages.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '3.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
          No SEO audit data available yet
        </span>
        <span style={{ fontSize: '0.85rem' }}>
          Enter a website URL above and click <b>Start Crawl</b>, or import a sitemap to audit titles, descriptions, status codes, and headings.
        </span>
      </div>
    );
  }

  const getScoreColor = () => {
    if (score >= 85) return 'var(--accent-emerald)';
    if (score >= 65) return 'var(--accent-amber)';
    return 'var(--accent-red)';
  };

  return (
    <div className="tab-content-container">
      {/* Top Banner: Score Gauge & Health Summary */}
      <div className="glass-panel score-gauge-box">
        {/* Circular SVG Gauge */}
        <div className="circular-gauge">
          <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="70"
              cy="70"
              r={radius}
              stroke="var(--bg-surface-elevated)"
              strokeWidth="10"
              fill="transparent"
            />
            <circle
              cx="70"
              cy="70"
              r={radius}
              stroke={getScoreColor()}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
          </svg>
          <div className="gauge-center-text">
            <span className="gauge-number" style={{ color: getScoreColor() }}>
              {score}
            </span>
            <span className="gauge-label">SEO INDEX</span>
          </div>
        </div>

        {/* Narrative analysis */}
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.4rem' }}>
            {score >= 90 ? 'Outstanding SEO Optimization' : score >= 75 ? 'Good SEO Health with Minor Warnings' : 'SEO Action Required'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem', maxWidth: '600px' }}>
            Our client-side audit analyzed {seoAudit.totalChecked} pages against Google Webmaster Guidelines, Core Web Vitals, metadata length standards, and crawling integrity.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="badge badge-400" style={{ padding: '0.4rem 0.8rem' }}>
              <XCircle size={14} />
              <span>{criticalCount} Critical Issues</span>
            </div>
            <div className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)', padding: '0.4rem 0.8rem' }}>
              <AlertTriangle size={14} />
              <span>{warningCount} Warnings</span>
            </div>
            <div className="badge badge-200" style={{ padding: '0.4rem 0.8rem' }}>
              <CheckCircle size={14} />
              <span>{seoAudit.healthyCount} Optimal Pages</span>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Checklist Grid */}
      <div className="metrics-grid">
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>PAGE TITLES</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              {breakdown.titles.passed} Passed
            </span>
            <span className="text-red" style={{ fontSize: '0.85rem' }}>
              {breakdown.titles.failed > 0 ? `${breakdown.titles.failed} issues` : 'All valid'}
            </span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>META DESCRIPTIONS</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              {breakdown.descriptions.passed} Passed
            </span>
            <span className="text-amber" style={{ fontSize: '0.85rem' }}>
              {breakdown.descriptions.failed > 0 ? `${breakdown.descriptions.failed} warnings` : 'All valid'}
            </span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>H1 HEADINGS</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              {breakdown.h1.passed} Passed
            </span>
            <span className="text-amber" style={{ fontSize: '0.85rem' }}>
              {breakdown.h1.failed > 0 ? `${breakdown.h1.failed} missing` : 'All valid'}
            </span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>HTTP STATUS CODE</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              {breakdown.statusCodes.passed} 200 OK
            </span>
            <span className="text-red" style={{ fontSize: '0.85rem' }}>
              {breakdown.statusCodes.failed > 0 ? `${breakdown.statusCodes.failed} broken` : '0 broken'}
            </span>
          </div>
        </div>
      </div>

      {/* Flagged Audit Issues List */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileSearch size={18} className="text-cyan" />
          <span>Detailed Audit Findings ({issues.length})</span>
        </h3>

        {issues.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--accent-emerald)' }}>
            <CheckCircle size={32} style={{ margin: '0 auto 0.5rem' }} />
            <p>Congratulations! Zero critical SEO issues or warnings were discovered.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {issues.map((issue, idx) => (
              <div 
                key={idx} 
                className="glass-panel"
                style={{ 
                  padding: '1rem', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderLeft: `4px solid ${issue.type === 'critical' ? 'var(--accent-red)' : 'var(--accent-amber)'}`
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span 
                      className="badge" 
                      style={{ 
                        background: issue.type === 'critical' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: issue.type === 'critical' ? 'var(--accent-red)' : 'var(--accent-amber)'
                      }}
                    >
                      {issue.category}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      {issue.message}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    URL: {issue.url}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    💡 Recommendation: {issue.recommendation}
                  </span>
                </div>

                <button
                  className="btn btn-secondary"
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
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
          </div>
        )}
      </div>
    </div>
  );
}
