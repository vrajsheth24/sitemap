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

function TreeNode({ node, onInspectPage, expandedNodes, toggleExpand }) {
  const isExpanded = !!expandedNodes[node.id];
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div style={{ marginLeft: node.depth > 0 ? '1.5rem' : 0, position: 'relative' }}>
      <div 
        className="tree-node-item"
        onClick={() => {
          if (hasChildren) {
            toggleExpand(node.id);
          } else if (node.page) {
            onInspectPage(node.page);
          }
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.4rem 0.6rem',
          borderRadius: 'var(--radius-sm)',
          cursor: 'pointer',
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
          <FileText size={16} className="text-secondary" />
        )}

        {/* Name and Path */}
        <span style={{ fontWeight: hasChildren ? 600 : 400, color: hasChildren ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
          {node.name || '/'}
        </span>

        {/* Badges */}
        {hasChildren && (
          <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.06)', fontSize: '0.7rem' }}>
            {node.pageCount} items
          </span>
        )}

        {node.page && (
          <span 
            className={`badge ${node.page.statusCode >= 400 ? 'badge-400' : 'badge-200'}`}
            style={{ fontSize: '0.65rem' }}
          >
            {node.page.statusCode || 200}
          </span>
        )}

        {/* Inspect button */}
        {node.page && (
          <button
            className="icon-btn"
            style={{ width: '24px', height: '24px', marginLeft: 'auto' }}
            title="Inspect Metadata"
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
        <div style={{ borderLeft: '1px dashed var(--border-subtle)', marginLeft: '0.8rem', paddingLeft: '0.2rem' }}>
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
      <div className="glass-panel" style={{ padding: '3.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
          No pages to map into a tree hierarchy
        </span>
        <span style={{ fontSize: '0.85rem' }}>
          Enter a website URL above and click <b>Start Crawl</b>, or import a sitemap file to explore its structure visually.
        </span>
      </div>
    );
  }

  return (
    <div className="tab-content-container">
      {/* Tree header toolbar */}
      <div className="glass-panel" style={{ padding: '0.85rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Visual Directory Hierarchy</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
            ({pages.length} total nodes mapped)
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={expandAll} style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
            Expand All
          </button>
          <button className="btn btn-secondary" onClick={collapseAll} style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
            Collapse All
          </button>
        </div>
      </div>

      {/* Tree view card */}
      <div className="glass-panel tree-container">
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
