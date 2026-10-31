import React from 'react';
import {
  Network,
  Compass,
  FolderTree,
  ShieldCheck,
  Code2,
  FileCheck2,
  Wrench,
  Braces,
  FileCog,
  Sun,
  Moon
} from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  isCrawling,
  pagesCount,
  seoScore,
  isDark,
  toggleTheme
}) {
  const navItems = [
    { id: 'generator', label: 'URLs & Table', icon: Compass, badge: pagesCount },
    { id: 'tree', label: 'Visual Tree', icon: FolderTree },
    { id: 'seo', label: 'SEO Health', icon: ShieldCheck, badge: pagesCount > 0 ? seoScore : '–' },
    { id: 'tools', label: 'SEO Tools', icon: Wrench },
    { id: 'schema', label: 'Schema Generator', icon: Braces },
    { id: 'robots', label: 'robots.txt Generator', icon: FileCog },
    { id: 'xml', label: 'XML Studio', icon: Code2 },
    { id: 'validator', label: 'Validator & Guides', icon: FileCheck2 }
  ];

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="nav-brand">
        <div className="brand-logo">
          <Network size={20} />
        </div>
        <div className="brand-text">
          <span className="brand-title">
            Sitemap<span className="gradient-text">Flow</span>
          </span>
          <span className="brand-badge">Sitemap & SEO toolkit</span>
        </div>
      </div>

      {/* Sections */}
      <div className="sidebar-nav">
        <div className="sidebar-section-label">Workspace</div>
        <nav className="nav-links" aria-label="Sections">
          {navItems.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              type="button"
              className={`nav-tab ${activeTab === id ? 'active' : ''}`}
              aria-current={activeTab === id ? 'page' : undefined}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={16} />
              <span>{label}</span>
              {badge !== undefined && <span className="tab-badge">{badge}</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* Status & theme */}
      <div className="nav-actions">
        <div className="status-badge" role="status">
          <span className={`status-dot ${isCrawling ? 'crawling' : 'ready'}`}></span>
          <span>{isCrawling ? 'Crawling…' : 'Ready'}</span>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          className="icon-btn"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </aside>
  );
}
