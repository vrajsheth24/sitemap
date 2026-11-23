import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  Share2,
  FileText,
  ShieldCheck,
  Bot,
  Sparkles,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Info,
  Layers,
  Image as ImageIcon,
  Clock,
  HelpCircle
} from 'lucide-react';
import { fetchSinglePage } from '../utils/clientCrawler';

function StatTile({ label, value, color, subtitle }) {
  return (
    <div className="glass-panel" style={{ padding: '0.75rem', background: 'var(--surface-2)', boxShadow: 'none' }}>
      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{label}</span>
      <div style={{ fontWeight: 650, marginTop: '0.15rem', color: color || 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      {subtitle && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{subtitle}</span>}
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

export default function PageModal({ page, onClose, onUpdatePage, addToast }) {
  const [activeTab, setActiveTab] = useState('seo'); // 'seo' | 'aeo' | 'geo' | 'preview'
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(page);

  useEffect(() => {
    setCurrentPage(page);
  }, [page]);

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

  if (!currentPage) return null;

  const failed = currentPage.fetchFailed || (!currentPage.statusCode && currentPage.statusCode !== 0);
  const is2xx = !failed && currentPage.statusCode >= 200 && currentPage.statusCode < 300;
  const titleLen = (currentPage.title || '').length;
  const descLen = (currentPage.description || '').length;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (addToast) addToast(`Fetching live on-page metadata for ${currentPage.url}...`, 'info');
    try {
      const enriched = await fetchSinglePage(currentPage.url, { depth: currentPage.depth || 0 });
      if (enriched) {
        setCurrentPage(enriched);
        if (onUpdatePage) {
          onUpdatePage(currentPage.url, enriched);
        }
        if (addToast) addToast('Page metadata refreshed successfully!', 'success');
      }
    } catch (e) {
      if (addToast) addToast(`Refresh failed: ${e.message}`, 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="page-modal-title"
        style={{ maxWidth: '780px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '1.1rem 1.4rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileText size={18} style={{ color: 'var(--primary)' }} />
            <div>
              <h3 id="page-modal-title" style={{ fontSize: '1.02rem', fontWeight: 650, margin: 0 }}>Page Inspector & Audit</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Deep SEO, AEO & GEO signals</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }}
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Re-crawl and audit live on-page content"
            >
              <RefreshCw size={13} className={isRefreshing ? 'spin' : ''} />
              <span>{isRefreshing ? 'Fetching...' : 'Re-Fetch Live'}</span>
            </button>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close" autoFocus>
              <X size={17} />
            </button>
          </div>
        </div>

        {/* URL Banner */}
        <div style={{ padding: '0.75rem 1.4rem', background: 'var(--surface-2)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          <div style={{ minWidth: 0 }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>TARGET URL</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.1rem' }}>
              <span style={{ fontWeight: 550, wordBreak: 'break-all', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                {currentPage.url}
              </span>
              <a href={currentPage.url} target="_blank" rel="noreferrer" className="ext-link" aria-label="Open in new tab">
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
          <span className={`badge ${failed ? 'badge-warn' : is2xx ? 'badge-200' : 'badge-400'}`} style={{ flexShrink: 0 }}>
            {failed ? 'Unreached' : `HTTP ${currentPage.statusCode}`}
          </span>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', padding: '0 1.4rem', gap: '0.5rem', background: 'var(--bg-surface)', flexShrink: 0 }}>
          <button
            type="button"
            className={`nav-tab ${activeTab === 'seo' ? 'active' : ''}`}
            style={{ borderRadius: 0, borderBottom: activeTab === 'seo' ? '2px solid var(--primary)' : 'none', padding: '0.65rem 0.8rem', fontSize: '0.82rem' }}
            onClick={() => setActiveTab('seo')}
          >
            <ShieldCheck size={14} />
            <span>SEO Checks</span>
          </button>
          <button
            type="button"
            className={`nav-tab ${activeTab === 'aeo' ? 'active' : ''}`}
            style={{ borderRadius: 0, borderBottom: activeTab === 'aeo' ? '2px solid var(--accent-purple)' : 'none', padding: '0.65rem 0.8rem', fontSize: '0.82rem' }}
            onClick={() => setActiveTab('aeo')}
          >
            <Bot size={14} />
            <span>AEO (Answer Engines)</span>
          </button>
          <button
            type="button"
            className={`nav-tab ${activeTab === 'geo' ? 'active' : ''}`}
            style={{ borderRadius: 0, borderBottom: activeTab === 'geo' ? '2px solid var(--accent-cyan)' : 'none', padding: '0.65rem 0.8rem', fontSize: '0.82rem' }}
            onClick={() => setActiveTab('geo')}
          >
            <Sparkles size={14} />
            <span>GEO (Generative AI)</span>
          </button>
          <button
            type="button"
            className={`nav-tab ${activeTab === 'preview' ? 'active' : ''}`}
            style={{ borderRadius: 0, borderBottom: activeTab === 'preview' ? '2px solid var(--accent-emerald)' : 'none', padding: '0.65rem 0.8rem', fontSize: '0.82rem' }}
            onClick={() => setActiveTab('preview')}
          >
            <Share2 size={14} />
            <span>SERP & AI Previews</span>
          </button>
        </div>

        {/* Body Content */}
        <div style={{ padding: '1.25rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', flex: 1 }}>
          
          {/* SEO TAB */}
          {activeTab === 'seo' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.6rem' }}>
                <StatTile
                  label="HTTP Status"
                  value={failed ? 'Not reached' : `${currentPage.statusCode} ${is2xx ? 'OK' : 'Error'}`}
                  color={failed ? 'var(--accent-amber)' : is2xx ? 'var(--accent-emerald)' : 'var(--accent-red)'}
                />
                <StatTile label="Load Time" value={currentPage.loadTime > 0 ? `${currentPage.loadTime} ms` : '—'} />
                <StatTile label="Depth" value={`Level ${currentPage.depth ?? 0}`} />
                <StatTile label="Word Count" value={currentPage.wordCount || 0} subtitle={currentPage.wordCount < 300 ? 'Thin content' : 'Healthy'} />
                <StatTile label="Images" value={currentPage.imagesCount || 0} subtitle={currentPage.missingAltCount > 0 ? `${currentPage.missingAltCount} missing alt` : 'All valid'} />
              </div>

              {/* Title tag */}
              <div className="glass-panel" style={{ padding: '0.9rem', boxShadow: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                  <span className="option-label">Title Tag (&lt;title&gt;)</span>
                  <LengthBadge length={titleLen} min={30} max={65} />
                </div>
                <p style={{ fontWeight: 600, fontSize: '0.92rem', color: currentPage.title ? 'var(--text-primary)' : 'var(--accent-red)', margin: 0 }}>
                  {currentPage.title || 'Missing title tag'}
                </p>
              </div>

              {/* Meta Description */}
              <div className="glass-panel" style={{ padding: '0.9rem', boxShadow: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                  <span className="option-label">Meta Description</span>
                  <LengthBadge length={descLen} min={100} max={165} />
                </div>
                <p style={{ fontSize: '0.88rem', color: currentPage.description ? 'var(--text-secondary)' : 'var(--accent-red)', margin: 0 }}>
                  {currentPage.description || 'Missing meta description tag'}
                </p>
              </div>

              {/* H1 Heading */}
              <div className="glass-panel" style={{ padding: '0.9rem', boxShadow: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                  <span className="option-label">H1 Heading</span>
                  <span className={`badge ${currentPage.h1Count === 1 ? 'badge-200' : 'badge-warn'}`}>
                    {currentPage.h1Count || (currentPage.h1 ? 1 : 0)} H1 tag(s)
                  </span>
                </div>
                <p style={{ fontSize: '0.88rem', color: currentPage.h1 ? 'var(--text-primary)' : 'var(--accent-red)', margin: 0 }}>
                  {currentPage.h1 || 'Missing <h1> tag'}
                </p>
              </div>

              {/* Canonical URL */}
              <div className="glass-panel" style={{ padding: '0.9rem', boxShadow: 'none' }}>
                <span className="option-label">Canonical URL</span>
                <p style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', wordBreak: 'break-all', marginTop: '0.2rem', color: currentPage.canonicalHref ? 'var(--text-secondary)' : 'var(--accent-amber)', margin: 0 }}>
                  {currentPage.canonicalHref || 'No canonical tag specified'}
                </p>
              </div>
            </>
          )}

          {/* AEO TAB */}
          {activeTab === 'aeo' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.6rem' }}>
                <StatTile
                  label="Direct Answer"
                  value={currentPage.hasDirectAnswer ? 'Present' : 'Missing'}
                  color={currentPage.hasDirectAnswer ? 'var(--accent-emerald)' : 'var(--accent-purple)'}
                  subtitle={currentPage.hasDirectAnswer ? 'Optimized for AI Overviews' : 'Add summary paragraph'}
                />
                <StatTile
                  label="Question Headings"
                  value={currentPage.questionHeadings?.length || 0}
                  subtitle="Natural query matching"
                />
                <StatTile
                  label="FAQ Markup"
                  value={currentPage.hasFaq ? 'Detected' : 'None'}
                  color={currentPage.hasFaq ? 'var(--accent-emerald)' : 'var(--text-muted)'}
                />
                <StatTile
                  label="Lists & Tables"
                  value={`${currentPage.listsCount || 0} lists · ${currentPage.tablesCount || 0} tables`}
                  subtitle="Step-by-step structures"
                />
              </div>

              {/* Direct Answer Definition Paragraph */}
              <div className="glass-panel" style={{ padding: '0.9rem', boxShadow: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span className="option-label" style={{ color: 'var(--accent-purple)' }}>Direct Answer / Definition Passage</span>
                  <span className={`badge ${currentPage.hasDirectAnswer ? 'badge-200' : 'badge-warn'}`}>
                    {currentPage.hasDirectAnswer ? 'AI Overview Ready' : 'Needs Summary Paragraph'}
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', color: currentPage.directAnswerSample ? 'var(--text-secondary)' : 'var(--text-muted)', lineHeight: 1.45, margin: 0 }}>
                  {currentPage.directAnswerSample || 'No concise 35–75 word definition paragraph detected in top 200 words. Add a clear answer under H1.'}
                </p>
              </div>

              {/* Question-Formatted Headings */}
              <div className="glass-panel" style={{ padding: '0.9rem', boxShadow: 'none' }}>
                <span className="option-label">Conversational Question Headings (What / How / Why)</span>
                {currentPage.questionHeadings && currentPage.questionHeadings.length > 0 ? (
                  <ul style={{ margin: '0.4rem 0 0 1rem', padding: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {currentPage.questionHeadings.map((h, i) => (
                      <li key={i} style={{ marginBottom: '0.2rem' }}>{h}</li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.3rem', margin: 0 }}>
                    No question headings detected. Rephrase subheadings as "How to...", "What is...", or "Why..." to match voice & AI queries.
                  </p>
                )}
              </div>

              {/* E-E-A-T Authority */}
              <div className="glass-panel" style={{ padding: '0.9rem', boxShadow: 'none' }}>
                <span className="option-label">E-E-A-T Credibility Signals</span>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.3rem', fontSize: '0.83rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Author: </span>
                    <strong style={{ color: currentPage.hasAuthor ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
                      {currentPage.authorName || 'Not detected'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Date: </span>
                    <strong style={{ color: currentPage.hasDate ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
                      {currentPage.datePublished || 'Not detected'}
                    </strong>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* GEO TAB */}
          {activeTab === 'geo' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.6rem' }}>
                <StatTile
                  label="Schema.org Types"
                  value={currentPage.schemas?.length || 0}
                  subtitle={currentPage.schemas?.length ? 'Semantic Entities' : 'Add JSON-LD'}
                  color={currentPage.schemas?.length ? 'var(--accent-emerald)' : 'var(--accent-amber)'}
                />
                <StatTile
                  label="Fact & Stat Density"
                  value={`${currentPage.statDensity || 0} points`}
                  subtitle="Quotable metrics & %"
                />
                <StatTile
                  label="Outbound Citations"
                  value={currentPage.externalLinksCount || 0}
                  subtitle="Authority anchor links"
                />
                <StatTile
                  label="Topical Depth"
                  value={`${currentPage.wordCount || 0} words`}
                  subtitle={currentPage.wordCount > 800 ? 'Comprehensive Guide' : 'Standard'}
                />
              </div>

              {/* Schema JSON-LD Entities */}
              <div className="glass-panel" style={{ padding: '0.9rem', boxShadow: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span className="option-label" style={{ color: 'var(--accent-cyan)' }}>Schema.org JSON-LD Entities</span>
                  <span className={`badge ${currentPage.schemas?.length ? 'badge-200' : 'badge-warn'}`}>
                    {currentPage.schemas?.length ? `${currentPage.schemas.length} type(s)` : 'Missing Schema'}
                  </span>
                </div>
                {currentPage.schemas && currentPage.schemas.length > 0 ? (
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.3rem' }}>
                    {currentPage.schemas.map((type, i) => (
                      <span key={i} className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                        @{type}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                    No Schema.org JSON-LD scripts found. Generative LLMs rely on explicit entity schemas to construct knowledge graphs.
                  </p>
                )}
              </div>

              {/* Outbound Citations */}
              <div className="glass-panel" style={{ padding: '0.9rem', boxShadow: 'none' }}>
                <span className="option-label">Outbound Citations & Reference Links</span>
                {currentPage.externalLinks && currentPage.externalLinks.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.3rem' }}>
                    {currentPage.externalLinks.slice(0, 5).map((l, i) => (
                      <a key={i} href={l} target="_blank" rel="noreferrer" style={{ fontSize: '0.78rem', color: 'var(--primary)', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
                        {l}
                      </a>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem', margin: 0 }}>
                    No external reference citations detected. LLMs ground factual accuracy in authoritative outbound links.
                  </p>
                )}
              </div>

              {/* Social / OpenGraph Card */}
              <div className="glass-panel" style={{ padding: '0.9rem', boxShadow: 'none' }}>
                <span className="option-label">OpenGraph & Social Entity Graph</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.3rem', fontSize: '0.82rem' }}>
                  <div><span style={{ color: 'var(--text-muted)' }}>og:title: </span>{currentPage.ogTitle || 'Missing'}</div>
                  <div><span style={{ color: 'var(--text-muted)' }}>og:description: </span>{currentPage.ogDescription || 'Missing'}</div>
                  <div><span style={{ color: 'var(--text-muted)' }}>og:image: </span>{currentPage.ogImage ? 'Provided' : 'Missing'}</div>
                </div>
              </div>
            </>
          )}

          {/* PREVIEWS TAB */}
          {activeTab === 'preview' && (
            <>
              {/* Google SERP Preview */}
              <div>
                <span className="option-label" style={{ marginBottom: '0.4rem', display: 'block' }}>Google Search Result Preview</span>
                <div className="serp-preview">
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>{currentPage.url}</div>
                  <div style={{ fontSize: '1.05rem', color: 'var(--link)', margin: '0.15rem 0', fontWeight: 550, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {currentPage.title || 'Untitled Page'}
                  </div>
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {(currentPage.description || 'No meta description provided. Search engines will generate an automatic snippet from on-page content.').slice(0, 160)}
                    {descLen > 160 ? '…' : ''}
                  </div>
                </div>
              </div>

              {/* AI Answer Engine / AI Overview Preview */}
              <div>
                <span className="option-label" style={{ marginBottom: '0.4rem', display: 'block', color: 'var(--accent-purple)' }}>
                  Perplexity / AI Overview Snippet Preview
                </span>
                <div style={{ background: 'var(--surface-2)', border: '1px solid var(--accent-purple)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem', color: 'var(--accent-purple)', fontSize: '0.78rem', fontWeight: 650 }}>
                    <Bot size={14} />
                    <span>AI Overview Extract</span>
                  </div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    {currentPage.directAnswerSample || (currentPage.description ? currentPage.description : 'Add a clear 40–60 word answer paragraph near top of page to generate a rich AI Overview snippet.')}
                  </div>
                  <div style={{ marginTop: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>Source:</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{new URL(currentPage.url).hostname}</span>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>

        {/* Footer */}
        <div style={{ padding: '0.9rem 1.4rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Last analyzed: {currentPage.lastmod || 'Today'}
          </span>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}