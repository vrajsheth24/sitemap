import React, { useState } from 'react';
import {
  Search,
  Plus,
  Trash2,
  ExternalLink,
  Eye,
  Filter,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  Ban,
  Globe
} from 'lucide-react';

const PRIORITY_OPTIONS = ['1.0', '0.9', '0.8', '0.7', '0.6', '0.5', '0.4', '0.3', '0.2', '0.1', '0.0'];
const CHANGEFREQ_OPTIONS = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'];

const formatPriority = (value) => {
  const n = Number(value);
  if (value === undefined || value === null || Number.isNaN(n)) return '0.8';
  return (Math.round(Math.min(1, Math.max(0, n)) * 10) / 10).toFixed(1);
};

const getReasonBadgeStyle = (reason = '') => {
  const r = reason.toLowerCase();
  if (r.includes('asset')) {
    return { background: 'var(--warning-soft)', color: 'var(--accent-amber)' };
  }
  if (r.includes('external')) {
    return { background: 'var(--info-soft)', color: 'var(--accent-cyan)' };
  }
  if (r.includes('noindex') || r.includes('robots')) {
    return { background: 'var(--danger-soft)', color: 'var(--accent-red)' };
  }
  return { background: 'var(--violet-soft)', color: 'var(--accent-purple)' };
};

function StatusBadge({ page }) {
  if (page.fetchFailed || !page.statusCode) {
    return <span className="badge badge-warn" title="The page could not be fetched">Unreached</span>;
  }
  const code = page.statusCode;
  const cls = code >= 400 ? 'badge-400' : code >= 300 ? 'badge-300' : 'badge-200';
  return <span className={`badge ${cls}`}>{code}</span>;
}

export default function GeneratorTab({
  pages = [],
  skippedPages = [],
  onIncludeSkipped,
  onUpdatePage,
  onDeletePage,
  onAddPage,
  onInspectPage
}) {
  const [subView, setSubView] = useState('sitemap'); // 'sitemap' | 'skipped'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [skippedFilter, setSkippedFilter] = useState('all');
  const [newUrlInput, setNewUrlInput] = useState('');
  const [addError, setAddError] = useState('');
  const [showAddRow, setShowAddRow] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const term = searchTerm.trim().toLowerCase();

  // Filtered sitemap pages
  const filteredPages = pages.filter(p => {
    const matchesSearch = !term || p.url.toLowerCase().includes(term) ||
      (p.title && p.title.toLowerCase().includes(term));

    if (!matchesSearch) return false;

    if (statusFilter === '200') return !p.fetchFailed && p.statusCode >= 200 && p.statusCode < 300;
    if (statusFilter === 'broken') return p.fetchFailed || !p.statusCode || p.statusCode >= 400;
    if (statusFilter === 'missing-meta') return !p.description || p.description.length < 50;

    return true;
  });

  // Filtered skipped pages
  const filteredSkipped = (skippedPages || []).filter(item => {
    const reason = (item.reason || '').toLowerCase();
    const matchesSearch = !term || item.url.toLowerCase().includes(term) || reason.includes(term);

    if (!matchesSearch) return false;

    if (skippedFilter === 'asset') return reason.includes('asset');
    if (skippedFilter === 'external') return reason.includes('external');
    if (skippedFilter === 'pattern') return reason.includes('pattern') || reason.includes('filter');
    if (skippedFilter === 'noindex') return reason.includes('noindex') || reason.includes('robots');
    if (skippedFilter === 'limit') return reason.includes('limit');

    return true;
  });

  // Active items based on current subView
  const activeItems = subView === 'sitemap' ? filteredPages : filteredSkipped;
  const totalItems = activeItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedItems = activeItems.slice(startIndex, endIndex);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleSkippedFilterChange = (e) => {
    setSkippedFilter(e.target.value);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleSubViewSwitch = (newView) => {
    setSubView(newView);
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Helper to generate smart windowed page numbers
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (validCurrentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }
    if (validCurrentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', validCurrentPage - 1, validCurrentPage, validCurrentPage + 1, '...', totalPages];
  };

  const handleAddNew = (e) => {
    e.preventDefault();
    if (!newUrlInput.trim()) return;

    let finalUrl = newUrlInput.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }

    let u;
    try {
      u = new URL(finalUrl);
      if (!u.hostname.includes('.') && u.hostname !== 'localhost') throw new Error();
    } catch (err) {
      setAddError('Please enter a valid URL, e.g. https://mysite.com/about');
      return;
    }

    const segments = u.pathname.split('/').filter(Boolean);
    const depth = segments.length;
    const slug = segments[segments.length - 1] || 'Home';
    const inferredTitle = slug.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    const added = onAddPage({
      url: u.href,
      title: inferredTitle,
      description: `Custom added URL: ${u.href}`,
      h1: inferredTitle,
      statusCode: 200,
      loadTime: 0,
      sizeKb: 0,
      depth,
      imagesCount: 0,
      images: [],
      hasCanonical: true,
      isIndexable: true,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: 0.8,
    });

    if (added !== false) {
      setNewUrlInput('');
      setAddError('');
      setShowAddRow(false);
    }
  };

  const renderEmptyRow = (colSpan, icon, title, text) => (
    <tr>
      <td colSpan={colSpan}>
        <div className="empty-state">
          {icon && <div className="empty-state-icon">{icon}</div>}
          {title && <span className="empty-state-title">{title}</span>}
          <span>{text}</span>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="tab-content-container">
      {/* Section header with sub-view switcher */}
      <div className="section-header">
        <div>
          <h2 className="section-title">URLs</h2>
          <p className="section-subtitle">Review crawled pages, tune priority and change frequency, or add URLs by hand.</p>
        </div>
        <div className="segmented" role="tablist" aria-label="URL list">
          <button
            type="button"
            role="tab"
            aria-selected={subView === 'sitemap'}
            className={subView === 'sitemap' ? 'active' : ''}
            onClick={() => handleSubViewSwitch('sitemap')}
          >
            <FileText size={14} />
            <span>In sitemap</span>
            <span className="count">{pages.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={subView === 'skipped'}
            className={subView === 'skipped' ? 'active' : ''}
            onClick={() => handleSubViewSwitch('skipped')}
          >
            <Ban size={14} />
            <span>Skipped</span>
            <span className="count">{skippedPages.length}</span>
          </button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="glass-panel toolbar">
        <div className="toolbar-group" style={{ flex: 1 }}>
          <div className="url-input-box" style={{ maxWidth: '340px', flex: '1 1 220px' }}>
            <Search size={15} className="text-muted" />
            <input
              type="search"
              className="url-input-field"
              aria-label="Search"
              placeholder={subView === 'sitemap' ? 'Search URLs or titles…' : 'Search skipped URLs or reasons…'}
              value={searchTerm}
              onChange={handleSearchChange}
              style={{ fontSize: '0.875rem' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Filter size={15} className="text-muted" />
            {subView === 'sitemap' ? (
              <select className="option-select" aria-label="Filter pages" value={statusFilter} onChange={handleFilterChange}>
                <option value="all">All pages ({pages.length})</option>
                <option value="200">2xx OK only</option>
                <option value="broken">Broken or unreached</option>
                <option value="missing-meta">Short or missing description</option>
              </select>
            ) : (
              <select className="option-select" aria-label="Filter skipped URLs" value={skippedFilter} onChange={handleSkippedFilterChange}>
                <option value="all">All skipped ({skippedPages.length})</option>
                <option value="asset">Assets (.png, .pdf, .css)</option>
                <option value="external">External domains</option>
                <option value="pattern">Excluded by patterns</option>
                <option value="noindex">Noindex / robots.txt</option>
                <option value="limit">Over page limit</option>
              </select>
            )}
          </div>

          <select className="option-select" aria-label="Rows per page" value={pageSize} onChange={handlePageSizeChange}>
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>
        </div>

        {subView === 'sitemap' && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => { setShowAddRow(!showAddRow); setAddError(''); }}
            style={{ fontSize: '0.84rem' }}
          >
            <Plus size={15} />
            <span>Add URL</span>
          </button>
        )}
      </div>

      {/* Inline Add Row Form */}
      {subView === 'sitemap' && showAddRow && (
        <form onSubmit={handleAddNew} className="glass-panel" style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', borderColor: 'var(--primary)' }}>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              className="option-input"
              style={{ flex: '1 1 260px' }}
              aria-label="URL to add"
              placeholder="https://mysite.com/features/analytics"
              value={newUrlInput}
              onChange={(e) => { setNewUrlInput(e.target.value); setAddError(''); }}
              autoFocus
            />
            <button type="submit" className="btn btn-primary">Save URL</button>
            <button type="button" className="btn btn-secondary" onClick={() => { setShowAddRow(false); setAddError(''); }}>
              Cancel
            </button>
          </div>
          {addError && <span className="field-error">{addError}</span>}
        </form>
      )}

      {/* Informational Banner for Skipped URLs */}
      {subView === 'skipped' && skippedPages.length > 0 && (
        <div className="env-banner" style={{ borderColor: 'var(--warning-border)', background: 'var(--warning-soft)', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Ban size={15} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} />
            <span>
              These links were found while crawling but filtered out (assets, patterns, noindex, robots.txt or the page limit). Use <b>Add</b> to include any of them.
            </span>
          </div>
        </div>
      )}

      {/* Main Table: Either Sitemap Pages OR Skipped Pages */}
      {subView === 'sitemap' ? (
        <div className="glass-panel table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '42%' }}>URL & title</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Changefreq</th>
                <th>Depth</th>
                <th>Response</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.length === 0 ? (
                renderEmptyRow(7, <Globe size={20} />, 'No pages yet',
                  <>Enter a website URL above and press <b>Start crawl</b>, or <b>Import</b> an existing sitemap.</>)
              ) : filteredPages.length === 0 ? (
                renderEmptyRow(7, null, null, 'No pages match the current filter or search.')
              ) : (
                paginatedItems.map((page) => (
                  <tr key={page.url}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', minWidth: '220px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span className="cell-url">{page.url}</span>
                          <a href={page.url} target="_blank" rel="noreferrer" title="Open in new tab" className="ext-link">
                            <ExternalLink size={13} />
                          </a>
                        </div>
                        <span className="cell-sub" title={page.title}>{page.title || 'Untitled page'}</span>
                      </div>
                    </td>

                    <td><StatusBadge page={page} /></td>

                    <td>
                      <select
                        className="table-select"
                        aria-label="Priority"
                        value={formatPriority(page.priority)}
                        onChange={(e) => onUpdatePage(page.url, { priority: parseFloat(e.target.value) })}
                      >
                        {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </td>

                    <td>
                      <select
                        className="table-select"
                        aria-label="Change frequency"
                        value={CHANGEFREQ_OPTIONS.includes(page.changefreq) ? page.changefreq : 'weekly'}
                        onChange={(e) => onUpdatePage(page.url, { changefreq: e.target.value })}
                      >
                        {CHANGEFREQ_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </td>

                    <td><span className="cell-mono">L{page.depth ?? 1}</span></td>

                    <td><span className="cell-mono">{page.loadTime > 0 ? `${page.loadTime} ms` : '—'}</span></td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => onInspectPage(page)}
                          title="Inspect SEO tags"
                          aria-label="Inspect SEO tags"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn hover-danger"
                          onClick={() => onDeletePage(page.url)}
                          title="Remove from sitemap"
                          aria-label="Remove from sitemap"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Skipped URLs Table */
        <div className="glass-panel table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '6%' }}>#</th>
                <th style={{ width: '52%' }}>Skipped URL</th>
                <th style={{ width: '24%' }}>Reason</th>
                <th style={{ width: '10%' }}>Found at</th>
                <th style={{ width: '8%', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {skippedPages.length === 0 ? (
                renderEmptyRow(5, <Check size={20} style={{ color: 'var(--accent-emerald)' }} />, 'Nothing skipped',
                  'Every candidate link found during the crawl was included in your sitemap.')
              ) : filteredSkipped.length === 0 ? (
                renderEmptyRow(5, null, null, 'No skipped URLs match your search or filter.')
              ) : (
                paginatedItems.map((item, index) => (
                  <tr key={item.url}>
                    <td><span className="cell-mono">{startIndex + index + 1}</span></td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '220px' }}>
                        <span className="cell-url">{item.url}</span>
                        <a href={item.url} target="_blank" rel="noreferrer" title="Open in new tab" className="ext-link">
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    </td>

                    <td>
                      <span className="badge" style={getReasonBadgeStyle(item.reason)}>
                        {item.reason}
                      </span>
                    </td>

                    <td><span className="cell-mono">{item.timestamp || '—'}</span></td>

                    <td style={{ textAlign: 'right' }}>
                      {onIncludeSkipped && (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => onIncludeSkipped(item)}
                          title="Include this link in the sitemap"
                          style={{ fontSize: '0.76rem', padding: '0.3rem 0.65rem' }}
                        >
                          <Plus size={13} />
                          <span>Add</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer Toolbar */}
      {totalItems > 0 && (
        <div className="glass-panel pagination-bar">
          <div>
            Showing <b style={{ color: 'var(--text-primary)' }}>{startIndex + 1}–{endIndex}</b> of <b style={{ color: 'var(--text-primary)' }}>{totalItems}</b> {subView === 'sitemap' ? 'pages' : 'skipped URLs'}
          </div>

          <div className="pagination-controls">
            <button type="button" className="icon-btn" disabled={validCurrentPage === 1} onClick={() => setCurrentPage(1)} aria-label="First page">
              <ChevronsLeft size={15} />
            </button>
            <button type="button" className="icon-btn" disabled={validCurrentPage === 1} onClick={() => setCurrentPage(validCurrentPage - 1)} aria-label="Previous page">
              <ChevronLeft size={15} />
            </button>

            {getPageNumbers().map((num, i) => (
              num === '...' ? (
                <span key={`ellipsis-${i}`} style={{ padding: '0 0.3rem', color: 'var(--text-muted)' }}>…</span>
              ) : (
                <button
                  key={num}
                  type="button"
                  className={`page-btn ${num === validCurrentPage ? 'active' : ''}`}
                  aria-current={num === validCurrentPage ? 'page' : undefined}
                  onClick={() => setCurrentPage(num)}
                >
                  {num}
                </button>
              )
            ))}

            <button type="button" className="icon-btn" disabled={validCurrentPage === totalPages} onClick={() => setCurrentPage(validCurrentPage + 1)} aria-label="Next page">
              <ChevronRight size={15} />
            </button>
            <button type="button" className="icon-btn" disabled={validCurrentPage === totalPages} onClick={() => setCurrentPage(totalPages)} aria-label="Last page">
              <ChevronsRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
