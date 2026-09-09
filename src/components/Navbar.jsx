import React from 'react';
import { 
  Network, 
  Compass, 
  FolderTree, 
  ShieldCheck, 
  Code2, 
  FileCheck2, 
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
  return (
    <header className="navbar">
      <div className="nav-container">
        {/* Brand */}
        <div className="nav-brand">
          <div className="brand-logo">
            <Network size={24} />
          </div>
          <div className="brand-text">
            <span className="brand-title">
              Sitemap<span className="gradient-text">Flow</span>
            </span>
            <span className="brand-badge">PRO • REACT SPA</span>
          </div>
        </div>

        {/* Tabs */}
        <nav className="nav-links">
          <button 
            className={`nav-tab ${activeTab === 'generator' ? 'active' : ''}`}
            onClick={() => setActiveTab('generator')}
          >
            <Compass size={16} />
            <span>URLs & Table</span>
            <span className="tab-badge">{pagesCount}</span>
          </button>

          <button 
            className={`nav-tab ${activeTab === 'tree' ? 'active' : ''}`}
            onClick={() => setActiveTab('tree')}
          >
            <FolderTree size={16} />
            <span>Visual Tree</span>
          </button>

          <button 
            className={`nav-tab ${activeTab === 'seo' ? 'active' : ''}`}
            onClick={() => setActiveTab('seo')}
          >
            <ShieldCheck size={16} />
            <span>SEO Health</span>
            <span className="tab-badge">{seoScore}%</span>
          </button>

          <button 
            className={`nav-tab ${activeTab === 'xml' ? 'active' : ''}`}
            onClick={() => setActiveTab('xml')}
          >
            <Code2 size={16} />
            <span>XML Studio</span>
          </button>

          <button 
            className={`nav-tab ${activeTab === 'validator' ? 'active' : ''}`}
            onClick={() => setActiveTab('validator')}
          >
            <FileCheck2 size={16} />
            <span>Validator & Guides</span>
          </button>
        </nav>

        {/* Actions */}
        <div className="nav-actions">
          <div className="status-badge">
            <span className={`status-dot ${isCrawling ? 'crawling' : 'ready'}`}></span>
            <span>{isCrawling ? 'Crawling...' : 'Ready'}</span>
          </div>

          <button 
            onClick={toggleTheme} 
            className="icon-btn" 
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          
        </div>
      </div>
    </header>
  );
}
