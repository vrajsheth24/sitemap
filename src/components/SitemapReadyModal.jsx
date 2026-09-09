import React, { useEffect } from 'react';
import { 
  CheckCircle2, 
  Download, 
  Eye, 
  FolderTree, 
  X, 
  Globe, 
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateSitemapXml } from '../utils/xmlGenerator';

export default function SitemapReadyModal({ 
  isOpen, 
  onClose, 
  stats, 
  targetUrl, 
  pages, 
  onNavigateTab, 
  addToast 
}) {
  useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 70,
          spread: 75,
          origin: { y: 0.5 }
        });
      } catch (e) {}
    }
  }, [isOpen]);

  if (!isOpen) return null;

  let hostname = '';
  try {
    hostname = new URL(targetUrl).hostname;
  } catch (e) {
    hostname = targetUrl || 'website.com';
  }

  const { discovered = pages?.length || 0, added = pages?.length || 0, skipped = 0 } = stats || {};

  // Donut gauge calculations
  const radius = 56;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const total = Math.max(1, discovered);
  const addedRatio = Math.min(1, Math.max(0, added / total));
  const addedStroke = addedRatio * circumference;
  const skippedStroke = circumference - addedStroke;

  const handleDownloadXml = () => {
    try {
      const xml = generateSitemapXml(pages, { includeImages: true });
      const blob = new Blob([xml], { type: 'application/xml;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${hostname.replace(/[^a-z0-9]/gi, '_')}_sitemap.xml`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (e) {}

      if (addToast) addToast(`Downloaded ${hostname}_sitemap.xml successfully!`, 'success');
    } catch (err) {
      if (addToast) addToast(`Download failed: ${err.message}`, 'error');
    }
  };

  const handleViewDetails = () => {
    if (onNavigateTab) onNavigateTab('generator');
    onClose();
  };

  const handleViewTree = () => {
    if (onNavigateTab) onNavigateTab('tree');
    onClose();
  };

  const firstPage = pages && pages.length > 0 ? pages[0] : null;

  return (
    <div 
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div 
        className="glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(640px, 95vw)',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-strong)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(6, 182, 212, 0.15)',
          borderRadius: '18px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Top Header */}
        <div 
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface-elevated)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <CheckCircle2 size={24} style={{ color: 'var(--accent-emerald)' }} />
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              Your Sitemap is ready!
            </h2>
          </div>

          <button 
            type="button"
            className="icon-btn" 
            onClick={onClose}
            style={{ width: '32px', height: '32px', borderRadius: '8px' }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Target Website Subheader */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Website:</span>
            <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
              {hostname}
            </span>
          </div>

          {/* Central Grid: Circular Donut Gauge & Website Mockup */}
          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
              gap: '1.25rem', 
              alignItems: 'stretch' 
            }}
          >
            {/* Donut Gauge Box */}
            <div 
              style={{ 
                padding: '1.5rem 1rem', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '0.85rem',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '14px'
              }}
            >
              {/* Circular SVG Donut */}
              <div style={{ position: 'relative', width: '140px', height: '140px' }}>
                <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
                  {/* Track */}
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                  />
                  {/* Skipped arc (amber/orange) */}
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    stroke="var(--accent-amber)"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={0}
                    fill="transparent"
                  />
                  {/* Added arc (emerald green) */}
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    stroke="var(--accent-emerald)"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - addedStroke}
                    strokeLinecap="round"
                    fill="transparent"
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                  />
                </svg>

                {/* Donut Center: Number + DISCOVERED */}
                <div 
                  style={{ 
                    position: 'absolute', 
                    inset: 0, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}
                >
                  <span style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                    {discovered}
                  </span>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    DISCOVERED
                  </span>
                </div>
              </div>

              {/* Added vs Skipped Stats */}
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                    ADDED
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '0.1rem' }}>
                    {added}
                  </div>
                </div>

                <div style={{ width: '1px', height: '26px', background: 'var(--border-subtle)' }} />

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                    SKIPPED
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: skipped > 0 ? 'var(--accent-amber)' : 'var(--text-muted)', marginTop: '0.1rem' }}>
                    {skipped}
                  </div>
                </div>
              </div>

              {/* Completed Status Tag */}
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.4rem', 
                  fontSize: '0.88rem', 
                  fontWeight: 700, 
                  color: 'var(--accent-emerald)',
                  marginTop: '0.2rem' 
                }}
              >
                <CheckCircle2 size={16} />
                <span>Completed.</span>
              </div>
            </div>

            {/* Website Preview Card */}
            <div 
              style={{
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '14px',
                justifyContent: 'space-between'
              }}
            >
              {/* Browser mockup top bar */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', paddingBottom: '0.65rem', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                  <div 
                    style={{ 
                      flex: 1, 
                      marginLeft: '0.5rem', 
                      background: 'rgba(255, 255, 255, 0.05)', 
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    https://{hostname}
                  </div>
                </div>

                {/* Page Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.75rem' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', wordBreak: 'break-word', lineHeight: 1.3 }}>
                    {firstPage?.title || `${hostname} Web Portal`}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45, maxHeight: '60px', overflow: 'hidden' }}>
                    {firstPage?.description || `Sitemap generated with ${added} live indexed pages and complete XML hierarchy.`}
                  </div>
                </div>
              </div>

              {/* Status Badges */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                <span className="badge badge-200" style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem' }}>
                  ✓ 100% Valid XML
                </span>
                <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)', fontSize: '0.72rem', padding: '0.2rem 0.6rem' }}>
                  <ShieldCheck size={13} style={{ marginRight: '3px' }} /> Google Compliant
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div 
            style={{ 
              display: 'flex', 
              gap: '0.75rem', 
              flexWrap: 'wrap', 
              alignItems: 'center',
              justifyContent: 'space-between', 
              paddingTop: '0.85rem',
              borderTop: '1px solid var(--border-subtle)'
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              style={{ padding: '0.55rem 1.2rem', minWidth: '80px' }}
            >
              Close
            </button>

            <div style={{ display: 'flex', gap: '0.55rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleViewTree}
                style={{ padding: '0.55rem 0.85rem', color: 'var(--accent-purple)' }}
                title="Explore visual interactive directory tree"
              >
                <FolderTree size={16} />
                <span>Visual Tree</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleDownloadXml}
                style={{ padding: '0.55rem 0.95rem', color: 'var(--accent-emerald)', borderColor: 'rgba(16, 185, 129, 0.4)' }}
                title="Download standard sitemap.xml to computer"
              >
                <Download size={16} />
                <span>Download XML</span>
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleViewDetails}
                style={{ padding: '0.55rem 1.25rem', background: '#0e7490', borderColor: '#0891b2' }}
              >
                <Eye size={16} />
                <span>View sitemap details</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Banner matching xml-sitemaps.com Pro Banner */}
        <div 
          style={{ 
            padding: '0.85rem 1.75rem', 
            background: 'rgba(239, 68, 68, 0.07)', 
            borderTop: '1px solid rgba(239, 68, 68, 0.2)', 
            fontSize: '0.82rem', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '0.5rem',
            color: 'var(--text-secondary)'
          }}
        >
          <Sparkles size={16} style={{ color: '#ef4444' }} />
          <span>
            Keep your sitemap auto-updated with <strong style={{ color: '#ef4444' }}>PRO Sitemaps</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
