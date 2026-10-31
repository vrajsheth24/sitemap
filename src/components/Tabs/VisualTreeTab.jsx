import React, { useState, useMemo } from 'react';
import { 
  Folder, 
  FolderOpen, 
  FileText, 
  ChevronRight, 
  ChevronDown, 
  ChevronsUpDown, 
  Globe, 
  Info,
  ExternalLink 
} from 'lucide-react';
import { buildDirectoryTree } from '../../utils/treeBuilder';

const decodeName = (name) => {
  try {
    return decodeURIComponent(name);
  } catch (e) {
    return name;
  }
};

function TreeNode({ node, onInspectPage, expandedNodes, toggleExpand }) {
  const isExpanded = !!expandedNodes[node.id];
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <div 
        className="tree-node-item"
        role="treeitem"
        aria-expanded={hasChildren ? isExpanded : undefined}
        tabIndex={0}
        onClick={() => {
          if (hasChildren) {
            toggleExpand(node.id);
          } else if (node.page) {
            onInspectPage(node.page);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.currentTarget.click();
          }
        }}
      >
        {/* Toggle Arrow */}
        {hasChildren ? (
          <span 
            style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand(node.id);
            }}
          >
            {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </span>
        ) : (
          <span style={{ width: '15px' }} />
        )}

        {/* Node Icon */}
        {node.depth === 0 ? (
          <Globe size={18} className="text-cyan" />
        ) : hasChildren ? (
          isExpanded ? <FolderOpen size={17} className="text-amber" /> : <Folder size={17} className="text-amber" />
        ) : (
          <FileText size={16} className="text-muted" />
        )}

        {/* Name and Path */}
        <span style={{ fontWeight: hasChildren ? 600 : 400, color: hasChildren ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
          {decodeName(node.name) || '/'}
        </span>

        {/* Badges */}
        {hasChildren && (
          <span className="badge badge-muted" style={{ fontSize: '0.7rem' }}>
            {node.pageCount} {node.pageCount === 1 ? 'page' : 'pages'}
          </span>
        )}

        {node.page && (
          <span 
            className={`badge ${node.page.fetchFailed || !node.page.statusCode ? 'badge-warn' : node.page.statusCode >= 400 ? 'badge-400' : 'badge-200'}`}
            style={{ fontSize: '0.65rem' }}
          >
            {node.page.fetchFailed || !node.page.statusCode ? 'Unreached' : node.page.statusCode}
          </span>
        )}

        {/* Inspect button */}
        {node.page && (
          <button
            className="icon-btn"
            style={{ width: '24px', height: '24px', marginLeft: 'auto' }}
            title="Inspect metadata"
            aria-label="Inspect metadata"
            onClick={(e) => {
              e.stopPropagation();
              onInspectPage(node.page);
            }}
          >
            <Info size={13} />
          </button>
        )}
      </div>

      {/* Render children if expanded */}
      {hasChildren && isExpanded && (
        <div className="tree-children" role="group">
          {node.children.map(child => (
            <TreeNode 
              key={child.id} 
              node={child} 
              onInspectPage={onInspectPage} 
              expandedNodes={expandedNodes}
              toggleExpand={toggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function VisualTreeTab({ pages, onInspectPage }) {
  const [expandedNodes, setExpandedNodes] = useState({ root: true });

  const tree = useMemo(() => {
    return buildDirectoryTree(pages);
  }, [pages]);

  const toggleExpand = (id) => {
    setExpandedNodes(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const expandAll = () => {
    if (!tree) return;
    const all = {};
    const traverse = (n) => {
      all[n.id] = true;
      if (n.children) n.children.forEach(traverse);
    };
    traverse(tree);
    setExpandedNodes(all);
  };

  const collapseAll = () => {
    setExpandedNodes({ root: true });
  };

  if (!tree || pages.length === 0) {
    return (
      <div className="glass-panel empty-state">
        <div className="empty-state-icon"><FolderOpen size={20} /></div>
        <span className="empty-state-title">Nothing to map yet</span>
        <span>
          Crawl a website or import a sitemap to explore its folder structure.
        </span>
      </div>
    );
  }

  return (
    <div className="tab-content-container">
      <div className="section-header">
        <div>
          <h2 className="section-title">Visual tree</h2>
          <p className="section-subtitle">{pages.length} pages arranged by URL path. Click a folder to expand it, or a page to inspect it.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={expandAll} style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
            <ChevronsUpDown size={14} />
            Expand all
          </button>
          <button type="button" className="btn btn-secondary" onClick={collapseAll} style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
            Collapse all
          </button>
        </div>
      </div>

      <div className="glass-panel tree-container" role="tree">
        <TreeNode 
          node={tree} 
          onInspectPage={onInspectPage} 
          expandedNodes={expandedNodes} 
          toggleExpand={toggleExpand} 
        />
      </div>
    </div>
  );
}
