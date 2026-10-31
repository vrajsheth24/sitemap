import React, { useState } from 'react';
import {
  Share2,
  CopyX,
  Bot,
  Languages,
  BarChart3
} from 'lucide-react';
import InternalLinksTool from '../Tools/InternalLinksTool';
import ContentIssuesTool from '../Tools/ContentIssuesTool';
import RobotsTesterTool from '../Tools/RobotsTesterTool';
import HreflangTool from '../Tools/HreflangTool';
import KeywordTool from '../Tools/KeywordTool';

const TOOLS = [
  { id: 'links', label: 'Internal links', desc: 'Orphans, inlinks & broken links', icon: Share2, usesCrawl: true },
  { id: 'content', label: 'Duplicates & URLs', desc: 'Duplicate tags, thin pages, URL hygiene', icon: CopyX, usesCrawl: true },
  { id: 'robots', label: 'robots.txt tester', desc: 'Check URLs against crawl rules', icon: Bot },
  { id: 'hreflang', label: 'Hreflang generator', desc: 'Language & region alternates', icon: Languages },
  { id: 'keywords', label: 'Keyword density', desc: 'Top words, phrases & focus keyword', icon: BarChart3 }
];

export default function SeoToolsTab({ pages, targetUrl, addToast, onInspectPage }) {
  const [activeTool, setActiveTool] = useState('links');

  return (
    <div className="tab-content-container">
      <div className="section-header">
        <div>
          <h2 className="section-title">SEO tools</h2>
          <p className="section-subtitle">Deeper analysis of your crawl, plus standalone utilities for on-page SEO.</p>
        </div>
      </div>

      <div className="tool-grid" role="tablist" aria-label="SEO tools">
        {TOOLS.map(({ id, label, desc, icon: Icon, usesCrawl }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeTool === id}
            className={`tool-card ${activeTool === id ? 'active' : ''}`}
            onClick={() => setActiveTool(id)}
          >
            <span className="tool-card-icon"><Icon size={16} /></span>
            <span className="tool-card-text">
              <span className="tool-card-title">
                {label}
                {usesCrawl && <span className="tool-card-tag">Crawl</span>}
              </span>
              <span className="tool-card-desc">{desc}</span>
            </span>
          </button>
        ))}
      </div>

      {activeTool === 'links' && <InternalLinksTool pages={pages} onInspectPage={onInspectPage} />}
      {activeTool === 'content' && <ContentIssuesTool pages={pages} onInspectPage={onInspectPage} />}
      {activeTool === 'robots' && <RobotsTesterTool pages={pages} targetUrl={targetUrl} />}
      {activeTool === 'hreflang' && <HreflangTool addToast={addToast} />}
      {activeTool === 'keywords' && <KeywordTool />}
    </div>
  );
}
