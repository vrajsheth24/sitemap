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
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  Ban,
  ShieldAlert,
  FolderPlus
} from 'lucide-react';

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
  const [showAddRow, setShowAddRow] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Filtered sitemap pages
  const filteredPages = pages.filter(p => {
    const matchesSearch = p.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.title && p.title.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (!matchesSearch) return false;

    if (statusFilter === '200') return p.statusCode === 200;
    if (statusFilter === 'broken') return p.statusCode >= 400;
    if (statusFilter === 'missing-meta') return !p.description || p.description.length < 30;

    return true;
  });

  // Filtered skipped pages
  const filteredSkipped = (skippedPages || []).filter(item => {
    const matchesSearch = item.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.reason && item.reason.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (!matchesSearch) return false;

    if (skippedFilter === 'asset') return item.reason.toLowerCase().includes('asset');
    if (skippedFilter === 'external') return item.reason.toLowerCase().includes('external');
    if (skippedFilter === 'pattern') return item.reason.toLowerCase().includes('pattern');
    if (skippedFilter === 'noindex') return item.reason.toLowerCase().includes('noindex');

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

  const getReasonBadgeStyle = (reason = '') => {
    const r = reason.toLowerCase();
    if (r.includes('asset')) {
      return { background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)', border: '1px solid rgba(245, 158, 11, 0.3)' };
    }
    if (r.includes('external')) {
      return { background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)', border: '1px solid rgba(6, 182, 212, 0.3)' };
    }
    if (r.includes('noindex')) {
      return { background: 'rgba(239, 68, 68, 0.15)', color: 'var(--accent-red)', border: '1px solid rgba(239, 68, 68, 0.3)' };
    }
    return { background: 'rgba(168, 85, 247, 0.15)', color: 'var(--accent-purple)', border: '1px solid rgba(168, 85, 247, 0.3)' };
  };

  return (
    <div className="tab-content-container">
      {/* Sub-view Switcher: Sitemap Pages vs Skipped URLs */}
      <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          className={`btn ${subView === 'sitemap' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => handleSubViewSwitch('sitemap')}
          style={{ fontSize: '0.85rem', padding: '0.55rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <FileText size={16} />
          <span>Sitemap Pages</span>
          <span 
            className="badge" 
            style={{ 
              background: subView === 'sitemap' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)', 
              color: '#fff',
              padding: '0.15rem 0.5rem',
              fontWeight: 800 
            }}
          >
            {pages.length}
          </span>
        </button>

        <button
          type="button"
          className={`btn ${subView === 'skipped' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => handleSubViewSwitch('skipped')}
          style={{ 
            fontSize: '0.85rem', 
            padding: '0.55rem 1.1rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            color: subView === 'skipped' ? '#fff' : 'var(--accent-amber)',
            borderColor: subView === 'skipped' ? 'transparent' : 'rgba(245, 158, 11, 0.35)'
          }}
        >
          <Ban size={16} />
          <span>Skipped & Filtered</span>
          <span 
            className="badge" 
            style={{ 
              background: subView === 'skipped' ? 'rgba(255,255,255,0.25)' : 'rgba(245, 158, 11, 0.2)', 
              color: subView === 'skipped' ? '#fff' : 'var(--accent-amber)', 
              padding: '0.15rem 0.5rem',
              fontWeight: 800
            }}
          >
            {skippedPages.length}
          </span>
        </button>
      </div>

      {/* Controls Bar */}
      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
          {/* Search box */}
          <div className="url-input-box" style={{ maxWidth: '340px', flex: 1 }}>
            <Search size={16} className="text-secondary" />
            <input
              type="text"
              className="url-input-field"
              placeholder={subView === 'sitemap' ? "Search URLs or titles..." : "Search skipped URLs or reasons..."}
              value={searchTerm}
              onChange={handleSearchChange}
              style={{ fontSize: '0.875rem' }}
            />
          </div>

          {/* Filter Dropdown */}
          {subView === 'sitemap' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={16} className="text-secondary" />
              <select
                className="option-select"
                value={statusFilter}
                onChange={handleFilterChange}
              >
                <option value="all">All Pages ({pages.length})</option>
                <option value="200">200 OK Only</option>
                <option value="broken">Broken Links (4xx/5xx)</option>
                <option value="missing-meta">Missing Description</option>
              </select>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={16} className="text-secondary" />
              <select
                className="option-select"
                value={skippedFilter}
                onChange={handleSkippedFilterChange}
              >
                <option value="all">All Skipped ({skippedPages.length})</option>
                <option value="asset">Assets Only (.png, .pdf, .css)</option>
                <option value="external">External Domains</option>
                <option value="pattern">Excluded Patterns</option>
                <option value="noindex">NoIndex Directives</option>
              </select>
            </div>
          )}

          {/* Rows Per Page Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '0.8rem' }}>Show:</span>
            <select
              className="option-select"
              value={pageSize}
              onChange={handlePageSizeChange}
              style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
            >
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
          </div>
        </div>

        {subView === 'sitemap' && (
          <button
            className="btn btn-primary"
            onClick={() => setShowAddRow(!showAddRow)}
            style={{ fontSize: '0.8rem', padding: '0.5rem 0.9rem' }}
          >
            <Plus size={15} />
            <span>Add URL</span>
          </button>
        )}
      </div>

      {/* Inline Add Row Form */}
      {subView === 'sitemap' && showAddRow && (
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

      {/* Informational Banner for Skipped URLs */}
      {subView === 'skipped' && (
        <div 
          className="glass-panel" 
          style={{ 
            padding: '0.75rem 1.25rem', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            gap: '1rem',
            background: 'rgba(245, 158, 11, 0.05)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            fontSize: '0.82rem',
            color: 'var(--text-secondary)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Ban size={16} style={{ color: 'var(--accent-amber)' }} />
            <span>
              These URLs were discovered in page links but filtered out (assets like images/PDFs, external sites, or noindex directives). You can click <b>+ Add to Sitemap</b> to include any link.
            </span>
          </div>
          <span style={{ fontWeight: 700, color: 'var(--accent-amber)', whiteSpace: 'nowrap' }}>
            {filteredSkipped.length} skipped links
          </span>
        </div>
      )}

      {/* Main Table: Either Sitemap Pages OR Skipped Pages */}
      {subView === 'sitemap' ? (
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
                paginatedItems.map((page, index) => {
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
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '480px' }}>
                            {page.title || 'Untitled Page'}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className={`badge ${is2xx ? 'badge-200' : is4xx ? 'badge-404' : 'badge-300'}`}>
                          {page.statusCode || 200}
                        </span>
                      </td>

                      <td>
                        <select
                          className="table-select"
                          value={page.priority ?? 0.8}
                          onChange={(e) => onUpdatePage(page.url, { priority: parseFloat(e.target.value) })}
                        >
                          <option value="1.0">1.0 (Highest)</option>
                          <option value="0.9">0.9</option>
                          <option value="0.8">0.8 (Default)</option>
                          <option value="0.7">0.7</option>
                          <option value="0.6">0.6</option>
                          <option value="0.5">0.5</option>
                          <option value="0.3">0.3</option>
                          <option value="0.1">0.1 (Lowest)</option>
                        </select>
                      </td>

                      <td>
                        <select
                          className="table-select"
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
                        <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          L{page.depth ?? 1}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {page.loadTime ? `${page.loadTime}ms` : '--'}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          <button
                            className="icon-btn"
                            onClick={() => onInspectPage(page)}
                            title="Inspect SEO tags"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            className="icon-btn hover-danger"
                            onClick={() => onDeletePage(page.url)}
                            title="Remove from sitemap"
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
      ) : (
        /* Skipped URLs Table */
        <div className="glass-panel table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '6%' }}>#</th>
                <th style={{ width: '52%' }}>Skipped URL</th>
                <th style={{ width: '24%' }}>Exclusion Reason</th>
                <th style={{ width: '10%' }}>Detected</th>
                <th style={{ width: '8%', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {skippedPages.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
                      <Check size={26} style={{ color: 'var(--accent-emerald)' }} />
                      <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        No skipped links recorded
                      </span>
                      <span style={{ fontSize: '0.85rem' }}>
                        All candidate links found during crawling were included in your sitemap.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredSkipped.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                    No skipped URLs match your search or filter.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, index) => {
                  const badgeStyle = getReasonBadgeStyle(item.reason);
                  const globalIndex = startIndex + index + 1;

                  return (
                    <tr key={item.url + index}>
                      <td>
                        <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          {globalIndex}
                        </span>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-all', fontSize: '0.875rem' }}>
                            {item.url}
                          </span>
                          <a 
                            href={item.url} 
                            target="_blank" 
                            rel="noreferrer" 
                            title="Open external link"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            <ExternalLink size={13} />
                          </a>
                        </div>
                      </td>

                      <td>
                        <span 
                          className="badge" 
                          style={{ 
                            ...badgeStyle, 
                            fontSize: '0.75rem', 
                            padding: '0.2rem 0.6rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                        >
                          {item.reason}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {item.timestamp || 'Crawl'}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        {onIncludeSkipped && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => onIncludeSkipped(item)}
                            title="Force include this link in sitemap"
                            style={{ 
                              fontSize: '0.75rem', 
                              padding: '0.3rem 0.65rem', 
                              color: 'var(--accent-emerald)', 
                              borderColor: 'rgba(16, 185, 129, 0.4)',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            <Plus size={13} />
                            <span>Add</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer Toolbar */}
      {totalItems > 0 && (
        <div 
          className="glass-panel" 
          style={{ 
            marginTop: '0.75rem', 
            padding: '0.75rem 1.25rem', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: '1rem' 
          }}
        >
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Showing <b style={{ color: 'var(--text-primary)' }}>{startIndex + 1}</b> to <b style={{ color: 'var(--text-primary)' }}>{endIndex}</b> of <b style={{ color: 'var(--accent-cyan)' }}>{totalItems}</b> {subView === 'sitemap' ? 'pages' : 'skipped URLs'}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button
              type="button"
              className="icon-btn"
              disabled={validCurrentPage === 1}
              onClick={() => setCurrentPage(1)}
              title="First Page"
              style={{ opacity: validCurrentPage === 1 ? 0.35 : 1, cursor: validCurrentPage === 1 ? 'not-allowed' : 'pointer' }}
            >
              <ChevronsLeft size={16} />
            </button>

            <button
              type="button"
              className="icon-btn"
              disabled={validCurrentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              title="Previous Page"
              style={{ opacity: validCurrentPage === 1 ? 0.35 : 1, cursor: validCurrentPage === 1 ? 'not-allowed' : 'pointer' }}
            >
              <ChevronLeft size={16} />
            </button>

            {/* Page number buttons */}
            {getPageNumbers().map((num, i) => (
              num === '...' ? (
                <span key={`ellipsis-${i}`} style={{ padding: '0 0.35rem', color: 'var(--text-muted)' }}>...</span>
              ) : (
                <button
                  key={num}
                  type="button"
                  onClick={() => setCurrentPage(num)}
                  style={{
                    minWidth: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    border: num === validCurrentPage ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                    background: num === validCurrentPage ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                    color: num === validCurrentPage ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                    fontWeight: num === validCurrentPage ? '700' : '500',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {num}
                </button>
              )
            ))}

            <button
              type="button"
              className="icon-btn"
              disabled={validCurrentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              title="Next Page"
              style={{ opacity: validCurrentPage === totalPages ? 0.35 : 1, cursor: validCurrentPage === totalPages ? 'not-allowed' : 'pointer' }}
            >
              <ChevronRight size={16} />
            </button>

            <button
              type="button"
              className="icon-btn"
              disabled={validCurrentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
              title="Last Page"
              style={{ opacity: validCurrentPage === totalPages ? 0.35 : 1, cursor: validCurrentPage === totalPages ? 'not-allowed' : 'pointer' }}
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
