import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Eye, 
  Filter,
  Check,
  AlertTriangle,
  XCircle,
  Clock
} from 'lucide-react';

export default function GeneratorTab({ 
  pages, 
  onUpdatePage, 
  onDeletePage, 
  onAddPage, 
  onInspectPage 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [newUrlInput, setNewUrlInput] = useState('');
  const [showAddRow, setShowAddRow] = useState(false);

  // Filtered pages
  const filteredPages = pages.filter(p => {
    const matchesSearch = p.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.title && p.title.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (!matchesSearch) return false;

    if (statusFilter === '200') return p.statusCode === 200;
    if (statusFilter === 'broken') return p.statusCode >= 400;
    if (statusFilter === 'missing-meta') return !p.description || p.description.length < 30;

    return true;
  });

  const handleAddNew = (e) => {
    e.preventDefault();
    if (!newUrlInput.trim()) return;

    let finalUrl = newUrlInput.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }

    try {
      const u = new URL(finalUrl);
      const path = u.pathname;
      const depth = path.split('/').filter(Boolean).length;
      const slug = path.split('/').filter(Boolean).pop() || 'Home';
      const inferredTitle = slug.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

      onAddPage({
        url: finalUrl,
        title: inferredTitle,
        description: `Custom added URL: ${finalUrl}`,
        h1: inferredTitle,
        statusCode: 200,
        loadTime: 180,
        sizeKb: 30,
        depth,
        imagesCount: 2,
        hasCanonical: true,
        isIndexable: true,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: 0.8,
      });

      setNewUrlInput('');
      setShowAddRow(false);
    } catch (err) {
      alert('Invalid URL format');
    }
  };

  return (
    <div className="tab-content-container">
      {/* Controls Bar */}
      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
          {/* Search box */}
          <div className="url-input-box" style={{ maxWidth: '340px', flex: 1 }}>
            <Search size={16} className="text-secondary" />
            <input
              type="text"
              className="url-input-field"
              placeholder="Search URLs or titles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ fontSize: '0.875rem' }}
            />
          </div>

          {/* Filter Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16} className="text-secondary" />
            <select
              className="option-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Pages ({pages.length})</option>
              <option value="200">200 OK Only</option>
              <option value="broken">Broken Links (4xx/5xx)</option>
              <option value="missing-meta">Missing Description</option>
            </select>
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setShowAddRow(!showAddRow)}
          style={{ fontSize: '0.8rem', padding: '0.5rem 0.9rem' }}
        >
          <Plus size={15} />
          <span>Add URL</span>
        </button>
      </div>

      {/* Inline Add Row Form */}
      {showAddRow && (
        <form onSubmit={handleAddNew} className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', background: 'rgba(99, 102, 241, 0.08)' }}>
          <input
            type="text"
            className="option-input"
            style={{ flex: 1 }}
            placeholder="Enter full URL (e.g. https://mysite.com/features/analytics)"
            value={newUrlInput}
            onChange={(e) => setNewUrlInput(e.target.value)}
            autoFocus
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '0.45rem 1rem' }}>
            Save URL
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setShowAddRow(false)} style={{ padding: '0.45rem 0.75rem' }}>
            Cancel
          </button>
        </form>
      )}

      {/* Pages Table */}
      <div className="glass-panel table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th style={{ width: '40%' }}>URL & Title</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Changefreq</th>
              <th>Depth</th>
              <th>Latency</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pages.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      No pages to display yet
                    </span>
                    <span style={{ fontSize: '0.85rem' }}>
                      Enter a website URL above and click <b>Start Crawl</b>, or click <b>Import</b> to load an existing sitemap.
                    </span>
                  </div>
                </td>
              </tr>
            ) : filteredPages.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  No pages match the current filter or search criteria.
                </td>
              </tr>
            ) : (
              filteredPages.map((page, index) => {
                const is2xx = !page.statusCode || (page.statusCode >= 200 && page.statusCode < 300);
                const is4xx = page.statusCode && page.statusCode >= 400;

                return (
                  <tr key={page.url + index}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                            {page.url}
                          </span>
                          <a 
                            href={page.url} 
                            target="_blank" 
                            rel="noreferrer" 
                            title="Open external link"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            <ExternalLink size={13} />
                          </a>
                        </div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          {page.title || <span style={{ color: 'var(--accent-red)' }}>Missing Title Tag</span>}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span className={`badge ${is2xx ? 'badge-200' : is4xx ? 'badge-400' : 'badge-300'}`}>
                        {is2xx && <Check size={12} />}
                        {is4xx && <XCircle size={12} />}
                        {page.statusCode || 200}
                      </span>
                    </td>

                    <td>
                      <select
                        className="option-select"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                        value={page.priority !== undefined ? page.priority : 0.8}
                        onChange={(e) => onUpdatePage(page.url, { priority: parseFloat(e.target.value) })}
                      >
                        <option value={1.0}>1.0 (Critical)</option>
                        <option value={0.9}>0.9 (High)</option>
                        <option value={0.8}>0.8 (Primary)</option>
                        <option value={0.6}>0.6 (Standard)</option>
                        <option value={0.4}>0.4 (Low)</option>
                        <option value={0.2}>0.2 (Archive)</option>
                      </select>
                    </td>

                    <td>
                      <select
                        className="option-select"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                        value={page.changefreq || 'weekly'}
                        onChange={(e) => onUpdatePage(page.url, { changefreq: e.target.value })}
                      >
                        <option value="always">always</option>
                        <option value="hourly">hourly</option>
                        <option value="daily">daily</option>
                        <option value="weekly">weekly</option>
                        <option value="monthly">monthly</option>
                        <option value="yearly">yearly</option>
                        <option value="never">never</option>
                      </select>
                    </td>

                    <td>
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        Level {page.depth ?? 1}
                      </span>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <Clock size={13} />
                        <span>{page.loadTime || 180}ms</span>
                      </div>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button
                          className="icon-btn"
                          style={{ width: '32px', height: '32px' }}
                          title="Inspect Page Details & SEO"
                          onClick={() => onInspectPage(page)}
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          className="icon-btn"
                          style={{ width: '32px', height: '32px', color: 'var(--accent-red)' }}
                          title="Delete from Sitemap"
                          onClick={() => onDeletePage(page.url)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
