import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  XCircle,
  CheckCircle,
  Info,
  Eye,
  FileSearch,
  ShieldCheck,
  Search,
  Bot,
  Sparkles,
  Download,
  RefreshCw,
  HelpCircle,
  Layers,
  ArrowRight,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  X,
  ListFilter,
  FileSpreadsheet
} from 'lucide-react';
import { fetchSinglePage } from '../../utils/clientCrawler';
import { exportAuditToExcel } from '../../utils/auditExport';

const ISSUE_PAGE_SIZE = 40;

const PILLAR_CONFIG = {
  all: { label: 'All Checks', icon: Layers, color: 'var(--primary)' },
  seo: { label: 'SEO (Search)', icon: ShieldCheck, color: 'var(--accent-cyan)' },
  aeo: { label: 'AEO (Answers)', icon: Bot, color: 'var(--accent-purple)' },
  geo: { label: 'GEO (Generative AI)', icon: Sparkles, color: 'var(--accent-emerald)' }
};

const SEVERITY_STYLES = {
  critical: { className: 'badge-400', label: 'Critical' },
  warning: { className: 'badge-warn', label: 'Warning' },
  info: { className: 'badge-300', label: 'Recommendation' }
};

function MiniGauge({ score, title, subtitle, color, icon: Icon }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="glass-panel" style={{ padding: '1.1rem', display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 210px' }}>
      <div style={{ position: 'relative', width: '88px', height: '88px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="88" height="88" style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
          <circle
            cx="44"
            cy="44"
            r={radius}
            style={{ stroke: 'var(--bg-surface-elevated)' }}
            strokeWidth="7"
            fill="transparent"
          />
          <circle
            cx="44"
            cy="44"
            r={radius}
            style={{ stroke: color, transition: 'stroke-dashoffset 0.8s ease' }}
            strokeWidth="7"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>
        <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '1.4rem', fontWeight: 750, color, lineHeight: 1 }}>{score}</span>
          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>/100</span>
        </div>
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
          {Icon && <Icon size={14} style={{ color }} />}
          <span style={{ fontSize: '0.88rem', fontWeight: 650, color: 'var(--text-primary)' }}>{title}</span>
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.35, margin: 0 }}>
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function BreakdownItem({ label, passed, failed, failedLabel = 'issues', failedColor = 'var(--accent-amber)' }) {
  const total = passed + failed;
  const pct = total > 0 ? Math.round((passed / total) * 100) : 0;
  return (
    <div className="glass-panel" style={{ padding: '0.9rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', background: 'var(--surface-2)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
        <span style={{ fontSize: '0.75rem', color: failed > 0 ? failedColor : 'var(--accent-emerald)', fontWeight: 550 }}>
          {failed > 0 ? `${failed} ${failedLabel}` : 'All passed'}
        </span>
      </div>
      <div className="progress-track" style={{ height: '4px' }}>
        <div className="progress-fill" style={{ width: `${pct}%`, background: failed > 0 ? failedColor : 'var(--accent-emerald)' }} />
      </div>
    </div>
  );
}

export default function SeoAuditTab({
  seoAudit,
  onInspectUrl,
  pages = [],
  targetUrl = '',
  onUpdatePage,
  addToast
}) {
  const [selectedPillar, setSelectedPillar] = useState('all'); // 'all' | 'seo' | 'aeo' | 'geo'
  const [selectedSeverity, setSelectedSeverity] = useState('all'); // 'all' | 'critical' | 'warning' | 'info'
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' | 'list'
  const [expandedGroups, setExpandedGroups] = useState({});
  const [copiedGroupKey, setCopiedGroupKey] = useState(null);
  const [visibleIssues, setVisibleIssues] = useState(ISSUE_PAGE_SIZE);
  const [showGuide, setShowGuide] = useState(false);
  const [isAuditingLive, setIsAuditingLive] = useState(false);
  const [liveAuditProgress, setLiveAuditProgress] = useState({ current: 0, total: 0 });

  const {
    overallScore = 100,
    seoScore = 100,
    aeoScore = 100,
    geoScore = 100,
    criticalCount = 0,
    warningCount = 0,
    infoCount = 0,
    healthyCount = 0,
    issues = [],
    breakdown = {}
  } = seoAudit || {};

  // Live Batch Audit: Re-fetches on-page HTML for all pages that have missing data or were imported
  const handleLiveAuditAll = async () => {
    if (!pages || pages.length === 0) return;
    setIsAuditingLive(true);
    setLiveAuditProgress({ current: 0, total: pages.length });
    if (addToast) addToast(`Starting live on-page audit for ${pages.length} URLs...`, 'info');

    let completed = 0;
    for (const page of pages) {
      try {
        const enriched = await fetchSinglePage(page.url, { depth: page.depth || 0 });
        if (onUpdatePage && enriched) {
          onUpdatePage(page.url, {
            ...enriched,
            // Keep user priority and custom tags if defined
            priority: page.priority || enriched.priority,
            changefreq: page.changefreq || enriched.changefreq
          });
        }
      } catch (e) {
        // Continue loop
      }
      completed++;
      setLiveAuditProgress({ current: completed, total: pages.length });
    }

    setIsAuditingLive(false);
    if (addToast) addToast(`Live audit complete! Refreshed data for ${pages.length} pages.`, 'success');
  };

  // Export Full Audit Report (Excel .xlsx with multi-sheet workbook)
  const handleExportReport = () => {
    if (!pages || pages.length === 0) return;

    let derivedHost = targetUrl;
    if (!derivedHost && pages.length > 0) {
      try {
        derivedHost = new URL(pages[0].url).hostname;
      } catch (e) {
        derivedHost = 'website';
      }
    }

    try {
      const { filename } = exportAuditToExcel({
        seoAudit,
        pages,
        hostname: derivedHost
      });
      if (addToast) addToast(`Full audit report downloaded as Excel (${filename})!`, 'success');
    } catch (err) {
      console.error('Failed to export Excel report:', err);
      if (addToast) addToast('Error generating Excel report', 'error');
    }
  };

  // Optional: Export Markdown report
  const handleExportMarkdown = () => {
    if (!pages || pages.length === 0) return;

    const dateStr = new Date().toLocaleDateString();
    let md = `# SitemapFlow Comprehensive Website Audit: SEO, AEO & GEO\n\n`;
    md += `*Generated on: ${dateStr}*\n`;
    md += `*Total Pages Audited: ${pages.length}*\n\n`;
    md += `## Executive Scores\n\n`;
    md += `- **Overall AI & Search Visibility Score:** ${overallScore}/100\n`;
    md += `- **SEO Score (Search Engine Optimization):** ${seoScore}/100\n`;
    md += `- **AEO Score (Answer Engine Optimization):** ${aeoScore}/100\n`;
    md += `- **GEO Score (Generative Engine Optimization):** ${geoScore}/100\n`;
    md += `- **Healthy Pages:** ${healthyCount} / ${pages.length}\n`;
    md += `- **Findings Summary:** ${criticalCount} Critical, ${warningCount} Warnings, ${infoCount} Recommendations\n\n`;

    md += `## Detailed Findings (${issues.length})\n\n`;
    issues.forEach((iss, idx) => {
      md += `### ${idx + 1}. [${(iss.pillar || 'SEO').toUpperCase()}] ${iss.message}\n`;
      md += `- **Severity:** ${(iss.type || 'warning').toUpperCase()}\n`;
      md += `- **Category:** ${iss.category || 'General'}\n`;
      if (iss.detail) md += `- **Detail:** ${iss.detail}\n`;
      md += `- **URL:** ${iss.url}\n`;
      md += `- **Recommendation:** ${iss.recommendation}\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `website-audit-seo-aeo-geo-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);

    if (addToast) addToast('Full audit report downloaded as Markdown!', 'success');
  };

  if (!pages || pages.length === 0) {
    return (
      <div className="tab-content-container">
        <div className="glass-panel empty-state">
          <div className="empty-state-icon"><ShieldCheck size={24} /></div>
          <span className="empty-state-title">No Audit Data Yet</span>
          <span>
            Enter a website URL above and click <strong>Crawl</strong>, or upload a sitemap XML to run a comprehensive <strong>SEO, AEO & GEO</strong> health audit.
          </span>
        </div>
      </div>
    );
  }

  // Filter issues based on user selection
  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      if (selectedPillar !== 'all' && issue.pillar !== selectedPillar) return false;
      if (selectedSeverity !== 'all' && issue.type !== selectedSeverity) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchUrl = issue.url?.toLowerCase().includes(q);
        const matchMsg = issue.message?.toLowerCase().includes(q);
        const matchCat = issue.category?.toLowerCase().includes(q);
        if (!matchUrl && !matchMsg && !matchCat) return false;
      }
      return true;
    });
  }, [issues, selectedPillar, selectedSeverity, searchTerm]);

  // Group filtered issues by type + category + message for actionable site-wide overview
  const groupedIssues = useMemo(() => {
    const groupsMap = new Map();
    filteredIssues.forEach(issue => {
      // Normalize issue messages so dynamic counts (e.g. 184 chars vs 187 chars, or 3660ms) group into ONE card!
      const normalizedTitle = (issue.message || '')
        .replace(/\s*\(\d+[\s\w]*\)/g, '')
        .replace(/:\s*https?:\/\/\S+/g, '')
        .replace(/^\d+\s+image\(s\)\s+/i, 'Images ')
        .replace(/\s*\.\s*$/, '')
        .trim();

      const key = issue.code || `${issue.pillar}::${issue.type}::${issue.category}::${normalizedTitle}`;
      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          key,
          pillar: issue.pillar,
          type: issue.type,
          category: issue.category,
          message: issue.message.includes('(') && !issue.message.includes('+') && !issue.message.includes('>') && !issue.message.includes('<')
            ? `${normalizedTitle}.`
            : issue.message,
          recommendation: issue.recommendation,
          items: [],
          urls: []
        });
      }

      const itemDetail = issue.detail || (issue.message.match(/\((\d+[\s\w]*)\)/)?.[1] || '');
      groupsMap.get(key).items.push({
        url: issue.url,
        detail: itemDetail
      });
      groupsMap.get(key).urls.push(issue.url);
    });

    const severityWeight = { critical: 3, warning: 2, info: 1 };
    return Array.from(groupsMap.values()).sort((a, b) => {
      const diff = (severityWeight[b.type] || 0) - (severityWeight[a.type] || 0);
      if (diff !== 0) return diff;
      return b.items.length - a.items.length;
    });
  }, [filteredIssues]);

  // Dynamic counts responding to active filters
  const getPillarCount = (pillarKey) => {
    return issues.filter(iss => {
      if (pillarKey !== 'all' && iss.pillar !== pillarKey) return false;
      if (selectedSeverity !== 'all' && iss.type !== selectedSeverity) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchUrl = iss.url?.toLowerCase().includes(q);
        const matchMsg = iss.message?.toLowerCase().includes(q);
        const matchCat = iss.category?.toLowerCase().includes(q);
        if (!matchUrl && !matchMsg && !matchCat) return false;
      }
      return true;
    }).length;
  };

  const getSeverityCount = (sevType) => {
    return issues.filter(iss => {
      if (selectedPillar !== 'all' && iss.pillar !== selectedPillar) return false;
      if (sevType !== 'all' && iss.type !== sevType) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchUrl = iss.url?.toLowerCase().includes(q);
        const matchMsg = iss.message?.toLowerCase().includes(q);
        const matchCat = iss.category?.toLowerCase().includes(q);
        if (!matchUrl && !matchMsg && !matchCat) return false;
      }
      return true;
    }).length;
  };

  const toggleGroup = (key) => {
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAllGroups = (expand) => {
    if (!expand) {
      setExpandedGroups({});
    } else {
      const all = {};
      groupedIssues.forEach(g => { all[g.key] = true; });
      setExpandedGroups(all);
    }
  };

  const overallColor = overallScore >= 80 ? 'var(--accent-emerald)' : overallScore >= 60 ? 'var(--accent-amber)' : 'var(--accent-red)';
  const seoColor = seoScore >= 80 ? 'var(--accent-emerald)' : seoScore >= 60 ? 'var(--accent-amber)' : 'var(--accent-red)';
  const aeoColor = aeoScore >= 80 ? 'var(--accent-purple)' : aeoScore >= 60 ? 'var(--accent-amber)' : 'var(--accent-red)';
  const geoColor = geoScore >= 80 ? 'var(--accent-cyan)' : geoScore >= 60 ? 'var(--accent-amber)' : 'var(--accent-red)';

  return (
    <div className="tab-content-container">
      {/* Top Header & Actions */}
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span>Full Website Audit</span>
            <span className="badge badge-primary" style={{ fontSize: '0.72rem', letterSpacing: '0.04em' }}>SEO · AEO · GEO</span>
          </h2>
          <p className="section-subtitle">
            Next-generation audit for traditional search (Google, Bing), AI Answer Engines (Perplexity, AI Overviews), and Generative LLMs (ChatGPT, Claude, Gemini).
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowGuide(prev => !prev)}
            title="Learn about SEO, AEO and GEO"
          >
            <BookOpen size={15} />
            <span>Audit Guide</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExportReport}
            title="Download complete 4-sheet Excel audit report (.xlsx)"
            style={{ fontWeight: 600 }}
          >
            <FileSpreadsheet size={15} style={{ color: 'var(--accent-emerald)' }} />
            <span>Export Report (.xlsx)</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExportMarkdown}
            title="Download audit report as Markdown (.md)"
            style={{ padding: '0.45rem 0.65rem' }}
          >
            <Download size={14} />
            <span style={{ fontSize: '0.78rem' }}>.MD</span>
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleLiveAuditAll}
            disabled={isAuditingLive}
            title="Fetch live on-page metadata for all URLs"
          >
            <RefreshCw size={15} className={isAuditingLive ? 'spin' : ''} />
            <span>{isAuditingLive ? `Auditing (${liveAuditProgress.current}/${liveAuditProgress.total})...` : 'Live Re-Audit All'}</span>
          </button>
        </div>
      </div>

      {/* Guide Banner Drawer */}
      {showGuide && (
        <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--primary)', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HelpCircle size={18} style={{ color: 'var(--primary)' }} />
              <span>The 3 Pillars of Modern Discovery</span>
            </h3>
            <button type="button" className="icon-btn" onClick={() => setShowGuide(false)}>✕</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
            <div style={{ background: 'var(--surface-2)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
              <strong style={{ color: 'var(--accent-cyan)', display: 'block', marginBottom: '0.25rem' }}>1. SEO (Search Engines)</strong>
              Focuses on Google & Bing crawler reachability, correct 200 HTTP codes, canonical tags, 30-60 character titles, 120-160 character meta descriptions, single H1 hierarchy, and image alt text.
            </div>
            <div style={{ background: 'var(--surface-2)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
              <strong style={{ color: 'var(--accent-purple)', display: 'block', marginBottom: '0.25rem' }}>2. AEO (Answer Engines)</strong>
              Optimizes for Perplexity, ChatGPT Search, and Google AI Overviews. Requires clear 40-60 word definition paragraphs in top content, question-based headings (What/How/Why), FAQPage schema, and structured step lists or tables.
            </div>
            <div style={{ background: 'var(--surface-2)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
              <strong style={{ color: 'var(--accent-emerald)', display: 'block', marginBottom: '0.25rem' }}>3. GEO (Generative Engines)</strong>
              Optimizes for Claude, Gemini, and ChatGPT citations. Focuses on Schema.org JSON-LD entities, high factual & statistical density (percentages, metrics), topical depth (800+ words), and credible outbound citations.
            </div>
          </div>
        </div>
      )}

      {/* 4 Score Gauges Grid */}
      <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
        <MiniGauge
          score={overallScore}
          title="Overall Visibility"
          subtitle="Combined AI & Search Health"
          color={overallColor}
          icon={Layers}
        />
        <MiniGauge
          score={seoScore}
          title="SEO Score"
          subtitle="Google & Bing On-Page"
          color={seoColor}
          icon={ShieldCheck}
        />
        <MiniGauge
          score={aeoScore}
          title="AEO Score"
          subtitle="Answer Engines & Overviews"
          color={aeoColor}
          icon={Bot}
        />
        <MiniGauge
          score={geoScore}
          title="GEO Score"
          subtitle="Generative LLMs & Citations"
          color={geoColor}
          icon={Sparkles}
        />
      </div>

      {/* Pillar Breakdown Overview */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 650, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ActivityIcon size={16} style={{ color: 'var(--primary)' }} />
            <span>Audit Check Breakdown</span>
          </h3>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Audited {pages.length} URLs across 16 core optimization factors
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.65rem' }}>
          {/* SEO Factors */}
          <BreakdownItem label="HTTP Status & Reach" passed={breakdown.statusCodes?.passed || 0} failed={breakdown.statusCodes?.failed || 0} failedLabel="unreached/error" failedColor="var(--accent-red)" />
          <BreakdownItem label="Title Tags (30–60 chars)" passed={breakdown.titles?.passed || 0} failed={breakdown.titles?.failed || 0} failedLabel="issues" failedColor="var(--accent-red)" />
          <BreakdownItem label="Meta Descriptions" passed={breakdown.descriptions?.passed || 0} failed={breakdown.descriptions?.failed || 0} failedLabel="warnings" failedColor="var(--accent-amber)" />
          <BreakdownItem label="H1 Headings" passed={breakdown.h1?.passed || 0} failed={breakdown.h1?.failed || 0} failedLabel="missing/multi" failedColor="var(--accent-red)" />
          <BreakdownItem label="Canonical Tags" passed={breakdown.canonical?.passed || 0} failed={breakdown.canonical?.failed || 0} failedLabel="missing" failedColor="var(--accent-amber)" />
          <BreakdownItem label="Image Alt Attributes" passed={breakdown.images?.passed || 0} failed={breakdown.images?.failed || 0} failedLabel="missing alts" failedColor="var(--accent-amber)" />
          
          {/* AEO Factors */}
          <BreakdownItem label="AEO Direct Answerability" passed={breakdown.directAnswer?.passed || 0} failed={breakdown.directAnswer?.failed || 0} failedLabel="no summary" failedColor="var(--accent-purple)" />
          <BreakdownItem label="AEO Question Headings" passed={breakdown.questionHeadings?.passed || 0} failed={breakdown.questionHeadings?.failed || 0} failedLabel="no Q-headings" failedColor="var(--accent-purple)" />
          <BreakdownItem label="AEO FAQ / Q&A Markup" passed={breakdown.faq?.passed || 0} failed={breakdown.faq?.failed || 0} failedLabel="missing" failedColor="var(--accent-purple)" />
          <BreakdownItem label="AEO Lists & Tables" passed={breakdown.listsAndTables?.passed || 0} failed={breakdown.listsAndTables?.failed || 0} failedLabel="unstructured" failedColor="var(--accent-purple)" />
          <BreakdownItem label="AEO E-E-A-T Author/Date" passed={breakdown.eat?.passed || 0} failed={breakdown.eat?.failed || 0} failedLabel="no author" failedColor="var(--accent-purple)" />

          {/* GEO Factors */}
          <BreakdownItem label="GEO Schema.org Entities" passed={breakdown.schema?.passed || 0} failed={breakdown.schema?.failed || 0} failedLabel="no schema" failedColor="var(--accent-cyan)" />
          <BreakdownItem label="GEO Topical Depth (>600w)" passed={breakdown.topicalDepth?.passed || 0} failed={breakdown.topicalDepth?.failed || 0} failedLabel="thin pages" failedColor="var(--accent-cyan)" />
          <BreakdownItem label="GEO Fact & Stat Density" passed={breakdown.factDensity?.passed || 0} failed={breakdown.factDensity?.failed || 0} failedLabel="low facts" failedColor="var(--accent-cyan)" />
          <BreakdownItem label="GEO Authority Citations" passed={breakdown.citations?.passed || 0} failed={breakdown.citations?.failed || 0} failedLabel="no citations" failedColor="var(--accent-cyan)" />
        </div>
      </div>

      {/* Findings Section */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        {/* Findings Header & View Switcher Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <FileSearch size={18} style={{ color: 'var(--primary)' }} />
              <h3 style={{ fontSize: '1.02rem', fontWeight: 650, margin: 0 }}>
                Audit Findings
              </h3>
              <span className="badge badge-muted" style={{ fontSize: '0.74rem' }}>
                {filteredIssues.length} of {issues.length}
              </span>
            </div>

            {/* View Mode Switcher */}
            <div className="segmented" role="tablist" aria-label="Audit findings view mode">
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'grouped'}
                className={viewMode === 'grouped' ? 'active' : ''}
                onClick={() => setViewMode('grouped')}
                title="Group findings by issue type (Site-wide Action Items)"
              >
                <Layers size={13} />
                <span>Group by Issue</span>
                <span className="count">{groupedIssues.length}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'list'}
                className={viewMode === 'list' ? 'active' : ''}
                onClick={() => setViewMode('list')}
                title="View flat list of findings by URL"
              >
                <ListFilter size={13} />
                <span>By URL</span>
                <span className="count">{filteredIssues.length}</span>
              </button>
            </div>
          </div>

          {/* Search bar inside url-input-box for perfect flex centering */}
          <div
            className="url-input-box"
            style={{
              maxWidth: '300px',
              flex: '1 1 210px',
              minHeight: '36px',
              height: '36px',
              padding: '0 0.75rem',
              gap: '0.5rem',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              type="search"
              className="url-input-field"
              placeholder="Filter by keyword or URL..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setVisibleIssues(ISSUE_PAGE_SIZE);
              }}
              style={{ fontSize: '0.84rem', padding: '0.2rem 0' }}
            />
            {searchTerm && (
              <button
                type="button"
                className="clear-input-btn"
                onClick={() => setSearchTerm('')}
                title="Clear search"
                style={{ padding: 0, display: 'flex', alignItems: 'center' }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Filter Toolbars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.15rem' }}>
          {/* Pillar Filter Tabs with Dynamic Counts */}
          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
            {Object.entries(PILLAR_CONFIG).map(([key, config]) => {
              const Icon = config.icon;
              const isActive = selectedPillar === key;
              const count = getPillarCount(key);

              return (
                <button
                  key={key}
                  type="button"
                  className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
                  onClick={() => {
                    setSelectedPillar(key);
                    setVisibleIssues(ISSUE_PAGE_SIZE);
                  }}
                >
                  <Icon size={14} />
                  <span>{config.label}</span>
                  <span className="badge" style={{ padding: '0.12rem 0.45rem', fontSize: '0.68rem', background: isActive ? 'rgba(255,255,255,0.22)' : 'var(--surface-hover)' }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Severity Pills with Synchronized Counts & High-Contrast Active States */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                type="button"
                className={`badge ${selectedSeverity === 'all' ? 'badge-primary' : 'badge-muted'}`}
                style={{
                  cursor: 'pointer',
                  padding: '0.32rem 0.7rem',
                  fontSize: '0.78rem',
                  transition: 'all 0.15s ease',
                  border: selectedSeverity === 'all' ? '1.5px solid var(--primary)' : '1.5px solid transparent'
                }}
                onClick={() => {
                  setSelectedSeverity('all');
                  setVisibleIssues(ISSUE_PAGE_SIZE);
                }}
              >
                All Severities ({getSeverityCount('all')})
              </button>

              <button
                type="button"
                className="badge badge-400"
                style={{
                  cursor: 'pointer',
                  padding: '0.32rem 0.7rem',
                  fontSize: '0.78rem',
                  transition: 'all 0.15s ease',
                  border: selectedSeverity === 'critical' ? '1.5px solid var(--accent-red)' : '1.5px solid transparent',
                  boxShadow: selectedSeverity === 'critical' ? '0 0 0 2px var(--danger-soft)' : 'none',
                  opacity: selectedSeverity === 'all' || selectedSeverity === 'critical' ? 1 : 0.65,
                  fontWeight: selectedSeverity === 'critical' ? 700 : 600
                }}
                onClick={() => {
                  setSelectedSeverity(s => s === 'critical' ? 'all' : 'critical');
                  setVisibleIssues(ISSUE_PAGE_SIZE);
                }}
              >
                <XCircle size={13} />
                <span>{getSeverityCount('critical')} Critical</span>
              </button>

              <button
                type="button"
                className="badge badge-warn"
                style={{
                  cursor: 'pointer',
                  padding: '0.32rem 0.7rem',
                  fontSize: '0.78rem',
                  transition: 'all 0.15s ease',
                  border: selectedSeverity === 'warning' ? '1.5px solid var(--accent-amber)' : '1.5px solid transparent',
                  boxShadow: selectedSeverity === 'warning' ? '0 0 0 2px var(--warning-soft)' : 'none',
                  opacity: selectedSeverity === 'all' || selectedSeverity === 'warning' ? 1 : 0.65,
                  fontWeight: selectedSeverity === 'warning' ? 700 : 600
                }}
                onClick={() => {
                  setSelectedSeverity(s => s === 'warning' ? 'all' : 'warning');
                  setVisibleIssues(ISSUE_PAGE_SIZE);
                }}
              >
                <AlertTriangle size={13} />
                <span>{getSeverityCount('warning')} Warnings</span>
              </button>

              <button
                type="button"
                className="badge badge-300"
                style={{
                  cursor: 'pointer',
                  padding: '0.32rem 0.7rem',
                  fontSize: '0.78rem',
                  transition: 'all 0.15s ease',
                  border: selectedSeverity === 'info' ? '1.5px solid var(--accent-cyan)' : '1.5px solid transparent',
                  boxShadow: selectedSeverity === 'info' ? '0 0 0 2px var(--info-soft)' : 'none',
                  opacity: selectedSeverity === 'all' || selectedSeverity === 'info' ? 1 : 0.65,
                  fontWeight: selectedSeverity === 'info' ? 700 : 600
                }}
                onClick={() => {
                  setSelectedSeverity(s => s === 'info' ? 'all' : 'info');
                  setVisibleIssues(ISSUE_PAGE_SIZE);
                }}
              >
                <Info size={13} />
                <span>{getSeverityCount('info')} Recommendations</span>
              </button>
            </div>

            {/* Quick Expand / Collapse All when in Grouped view */}
            {viewMode === 'grouped' && groupedIssues.length > 0 && (
              <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.2rem 0.55rem', fontSize: '0.74rem' }}
                  onClick={() => toggleAllGroups(true)}
                  title="Expand all issue groups"
                >
                  Expand all
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.2rem 0.55rem', fontSize: '0.74rem' }}
                  onClick={() => toggleAllGroups(false)}
                  title="Collapse all issue groups"
                >
                  Collapse all
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Empty State */}
        {filteredIssues.length === 0 ? (
          <div className="empty-state" style={{ padding: '2.5rem 1rem' }}>
            <div className="empty-state-icon" style={{ color: 'var(--accent-emerald)', background: 'var(--success-soft)' }}>
              <CheckCircle size={22} />
            </div>
            <span className="empty-state-title">No matching issues found</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {searchTerm || selectedSeverity !== 'all' || selectedPillar !== 'all'
                ? 'Try clearing your filters or search term to see all findings.'
                : 'All pages passed every audit check for this criteria!'}
            </span>
          </div>
        ) : viewMode === 'grouped' ? (
          /* View 1: Grouped by Issue Type (Action Items) */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {groupedIssues.slice(0, visibleIssues).map((group) => {
              const isExpanded = !!expandedGroups[group.key];
              const pillarBadgeColor = group.pillar === 'seo' ? 'var(--accent-cyan)' : group.pillar === 'aeo' ? 'var(--accent-purple)' : 'var(--accent-emerald)';
              const pillarBadgeBg = group.pillar === 'seo' ? 'var(--info-soft)' : group.pillar === 'aeo' ? 'var(--violet-soft)' : 'var(--success-soft)';
              const isCopied = copiedGroupKey === group.key;

              return (
                <div key={group.key} className={`issue-group-card ${group.type}`}>
                  <div
                    className="issue-group-header"
                    onClick={() => toggleGroup(group.key)}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span className="badge" style={{ background: pillarBadgeBg, color: pillarBadgeColor, textTransform: 'uppercase', fontWeight: 700, fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                          {group.pillar.toUpperCase()}
                        </span>
                        <span className={`badge ${(SEVERITY_STYLES[group.type] || SEVERITY_STYLES.warning).className}`} style={{ fontSize: '0.72rem' }}>
                          {group.category}
                        </span>
                        <span style={{ fontWeight: 650, fontSize: '0.94rem', color: 'var(--text-primary)' }}>
                          {group.message}
                        </span>
                        <span className="badge badge-muted" style={{ fontSize: '0.72rem', marginLeft: 'auto' }}>
                          {group.urls.length} {group.urls.length === 1 ? 'page affected' : 'pages affected'}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4, display: 'flex', alignItems: 'flex-start', gap: '0.4rem', marginTop: '0.1rem' }}>
                        <ArrowRight size={13} style={{ flexShrink: 0, marginTop: '3px', color: 'var(--primary)' }} />
                        <span>{group.recommendation}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0, marginLeft: '0.75rem' }}>
                      <button
                        type="button"
                        className="icon-btn"
                        style={{ width: '28px', height: '28px' }}
                        aria-label={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="issue-group-body">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          Affected Pages ({group.urls.length}):
                        </span>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.6rem', fontSize: '0.74rem' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(group.urls.join('\n'));
                            setCopiedGroupKey(group.key);
                            setTimeout(() => setCopiedGroupKey(null), 2000);
                            if (addToast) addToast(`Copied ${group.urls.length} URLs to clipboard!`, 'success');
                          }}
                        >
                          {isCopied ? <Check size={12} style={{ color: 'var(--accent-emerald)' }} /> : <Copy size={12} />}
                          <span>{isCopied ? 'Copied!' : 'Copy All URLs'}</span>
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '320px', overflowY: 'auto' }}>
                        {(group.items || group.urls.map(u => ({ url: u }))).map((item, uIdx) => {
                          const url = typeof item === 'string' ? item : item.url;
                          const detail = typeof item === 'object' ? item.detail : '';
                          const matchedPage = pages.find(p => p.url === url);
                          return (
                            <div key={`${url}-${uIdx}`} className="issue-url-item">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minWidth: 0, flex: 1 }}>
                                <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {url}
                                </span>
                                {detail && (
                                  <span className="badge badge-muted" style={{ fontSize: '0.7rem', padding: '0.1rem 0.45rem', flexShrink: 0 }}>
                                    {detail}
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', flexShrink: 0 }}
                                onClick={() => {
                                  if (matchedPage && onInspectUrl) onInspectUrl(matchedPage);
                                }}
                              >
                                <Eye size={13} />
                                <span>Inspect</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {groupedIssues.length > visibleIssues && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ alignSelf: 'center', marginTop: '0.5rem' }}
                onClick={() => setVisibleIssues(v => v + ISSUE_PAGE_SIZE)}
              >
                Show more issues ({groupedIssues.length - visibleIssues} remaining)
              </button>
            )}
          </div>
        ) : (
          /* View 2: Flat List by URL */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {filteredIssues.slice(0, visibleIssues).map((issue, idx) => {
              const pillarBadgeColor = issue.pillar === 'seo' ? 'var(--accent-cyan)' : issue.pillar === 'aeo' ? 'var(--accent-purple)' : 'var(--accent-emerald)';
              const pillarBadgeBg = issue.pillar === 'seo' ? 'var(--info-soft)' : issue.pillar === 'aeo' ? 'var(--violet-soft)' : 'var(--success-soft)';

              return (
                <div key={`${issue.url}-${issue.category}-${idx}`} className={`issue-row ${issue.type}`}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {/* Pillar badge */}
                      <span className="badge" style={{ background: pillarBadgeBg, color: pillarBadgeColor, textTransform: 'uppercase', fontWeight: 700, fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                        {issue.pillar.toUpperCase()}
                      </span>

                      {/* Severity badge */}
                      <span className={`badge ${(SEVERITY_STYLES[issue.type] || SEVERITY_STYLES.warning).className}`} style={{ fontSize: '0.72rem' }}>
                        {issue.category}
                      </span>

                      <span style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                        {issue.message}
                      </span>
                    </div>

                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
                      {issue.url}
                    </span>

                    <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.4, display: 'flex', alignItems: 'flex-start', gap: '0.4rem', marginTop: '0.1rem' }}>
                      <ArrowRight size={13} style={{ flexShrink: 0, marginTop: '3px', color: 'var(--primary)' }} />
                      <span>{issue.recommendation}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', flexShrink: 0, alignSelf: 'center' }}
                    onClick={() => {
                      const matchedPage = pages.find(p => p.url === issue.url);
                      if (matchedPage && onInspectUrl) onInspectUrl(matchedPage);
                    }}
                  >
                    <Eye size={14} />
                    <span>Inspect</span>
                  </button>
                </div>
              );
            })}

            {filteredIssues.length > visibleIssues && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ alignSelf: 'center', marginTop: '0.5rem' }}
                onClick={() => setVisibleIssues(v => v + ISSUE_PAGE_SIZE)}
              >
                Show more ({filteredIssues.length - visibleIssues} remaining)
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityIcon(props) {
  return (
    <svg width={props.size || 16} height={props.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}