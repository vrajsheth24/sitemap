// State Management
const state = {
  activeJobId: null,
  eventSource: null,
  crawling: false,
  startTime: null,
  timerInterval: null,
  pages: [],
  logs: [],
  tree: null,
  activeTab: 'generator-view',
  tableFilter: 'all',
  searchQuery: '',
  theme: 'dark',
  currentPage: 1,
  pageSize: 25,
  renderScheduled: false
};

// DOM Elements
const elements = {
  // Navigation & Badges
  navTabs: document.querySelectorAll('.nav-tab'),
  viewPanels: document.querySelectorAll('.view-panel'),
  globalStatusBadge: document.getElementById('globalStatusBadge'),
  globalStatusText: document.getElementById('globalStatusText'),
  themeToggleBtn: document.getElementById('themeToggleBtn'),

  // Form Controls
  crawlForm: document.getElementById('crawlForm'),
  targetUrlInput: document.getElementById('targetUrlInput'),
  clearUrlBtn: document.getElementById('clearUrlBtn'),
  toggleAdvancedBtn: document.getElementById('toggleAdvancedBtn'),
  advancedOptionsDrawer: document.getElementById('advancedOptionsDrawer'),
  startCrawlBtn: document.getElementById('startCrawlBtn'),
  stopCrawlBtn: document.getElementById('stopCrawlBtn'),
  resetAllBtn: document.getElementById('resetAllBtn'),
  presetBtns: document.querySelectorAll('.preset-btn'),

  // Slider inputs
  maxPagesRange: document.getElementById('maxPagesRange'),
  maxPagesVal: document.getElementById('maxPagesVal'),
  maxDepthRange: document.getElementById('maxDepthRange'),
  maxDepthVal: document.getElementById('maxDepthVal'),
  concurrencyRange: document.getElementById('concurrencyRange'),
  concurrencyVal: document.getElementById('concurrencyVal'),
  userAgentSelect: document.getElementById('userAgentSelect'),
  respectRobotsToggle: document.getElementById('respectRobotsToggle'),
  includeImagesToggle: document.getElementById('includeImagesToggle'),
  includeSubdomainsToggle: document.getElementById('includeSubdomainsToggle'),
  filterNoindexToggle: document.getElementById('filterNoindexToggle'),
  excludePatternsInput: document.getElementById('excludePatternsInput'),
  includePatternsInput: document.getElementById('includePatternsInput'),

  // Metrics
  crawledCount: document.getElementById('crawledCount'),
  crawledTarget: document.getElementById('crawledTarget'),
  queuedCount: document.getElementById('queuedCount'),
  successCount: document.getElementById('successCount'),
  successRate: document.getElementById('successRate'),
  issuesCount: document.getElementById('issuesCount'),
  issuesRate: document.getElementById('issuesRate'),
  imagesCount: document.getElementById('imagesCount'),
  avgSpeed: document.getElementById('avgSpeed'),
  durationDisplay: document.getElementById('durationDisplay'),

  // Progress Bar
  currentUrlDisplay: document.getElementById('currentUrlDisplay'),
  progressPercentDisplay: document.getElementById('progressPercentDisplay'),
  progressBarFill: document.getElementById('progressBarFill'),

  // Toolbar & Data Grid
  tableSearchInput: document.getElementById('tableSearchInput'),
  filterPills: document.querySelectorAll('.filter-pill'),
  filterAllCount: document.getElementById('filterAllCount'),
  filter2xxCount: document.getElementById('filter2xxCount'),
  filter3xxCount: document.getElementById('filter3xxCount'),
  filter4xxCount: document.getElementById('filter4xxCount'),
  filter5xxCount: document.getElementById('filter5xxCount'),
  pagesTableBody: document.getElementById('pagesTableBody'),
  tableShowingCount: document.getElementById('tableShowingCount'),

  // Pagination
  paginationInfoText: document.getElementById('paginationInfoText'),
  pageSizeSelect: document.getElementById('pageSizeSelect'),
  prevPageBtn: document.getElementById('prevPageBtn'),
  nextPageBtn: document.getElementById('nextPageBtn'),
  pageNumbersList: document.getElementById('pageNumbersList'),

  // Exports
  downloadXmlBtn: document.getElementById('downloadXmlBtn'),
  exportMoreBtn: document.getElementById('exportMoreBtn'),
  exportDropdownMenu: document.getElementById('exportDropdownMenu'),
  exportTxtLink: document.getElementById('exportTxtLink'),
  exportCsvLink: document.getElementById('exportCsvLink'),
  exportJsonLink: document.getElementById('exportJsonLink'),

  // Side Panel Tabs
  sideTabs: document.querySelectorAll('.side-tab'),
  sideTabContents: document.querySelectorAll('.side-tab-content'),
  xmlEntriesCount: document.getElementById('xmlEntriesCount'),
  copyXmlBtn: document.getElementById('copyXmlBtn'),
  xmlPreviewCode: document.getElementById('xmlPreviewCode'),
  logsCountBadge: document.getElementById('logsCountBadge'),
  clearLogsBtn: document.getElementById('clearLogsBtn'),
  logTerminalBody: document.getElementById('logTerminalBody'),

  // Tree View
  treeContentWrapper: document.getElementById('treeContentWrapper'),
  expandAllTreeBtn: document.getElementById('expandAllTreeBtn'),
  collapseAllTreeBtn: document.getElementById('collapseAllTreeBtn'),

  // SEO Health Audit
  seoScoreNum: document.getElementById('seoScoreNum'),
  brokenLinksCount: document.getElementById('brokenLinksCount'),
  brokenLinksList: document.getElementById('brokenLinksList'),
  missingTitlesCount: document.getElementById('missingTitlesCount'),
  missingTitlesList: document.getElementById('missingTitlesList'),
  missingDescCount: document.getElementById('missingDescCount'),
  missingDescList: document.getElementById('missingDescList'),
  slowPagesCount: document.getElementById('slowPagesCount'),
  slowPagesList: document.getElementById('slowPagesList'),

  // Sitemap Validator
  vTabs: document.querySelectorAll('.v-tab'),
  vTabContents: document.querySelectorAll('.v-tab-content'),
  validateXmlInput: document.getElementById('validateXmlInput'),
  runValidateXmlBtn: document.getElementById('runValidateXmlBtn'),
  validateSitemapUrlInput: document.getElementById('validateSitemapUrlInput'),
  runValidateUrlBtn: document.getElementById('runValidateUrlBtn'),
  validationResultsBox: document.getElementById('validationResultsBox'),
  valResultsSummary: document.getElementById('valResultsSummary'),
  valStatsPills: document.getElementById('valStatsPills'),
  valIssuesList: document.getElementById('valIssuesList'),

  // Robots Blocked Alert Banner
  robotsBlockedBanner: document.getElementById('robotsBlockedBanner'),
  retryBypassRobotsBtn: document.getElementById('retryBypassRobotsBtn'),
  retryGooglebotBtn: document.getElementById('retryGooglebotBtn'),

  // Modal
  urlInspectModal: document.getElementById('urlInspectModal'),
  closeModalBtn: document.getElementById('closeModalBtn'),
  modalBodyContent: document.getElementById('modalBodyContent'),
  toastContainer: document.getElementById('toastContainer')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initLucide();
  bindEvents();
});

function initLucide() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Event Bindings
function bindEvents() {
  // Navigation Tabs
  elements.navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetView = tab.getAttribute('data-tab');
      switchMainView(targetView);
    });
  });

  // Theme Toggle
  elements.themeToggleBtn.addEventListener('click', toggleTheme);

  // Advanced Options Drawer Toggle
  elements.toggleAdvancedBtn.addEventListener('click', () => {
    const isHidden = elements.advancedOptionsDrawer.style.display === 'none';
    elements.advancedOptionsDrawer.style.display = isHidden ? 'flex' : 'none';
    elements.toggleAdvancedBtn.classList.toggle('open', isHidden);
  });

  // Slider Displays
  elements.maxPagesRange.addEventListener('input', (e) => {
    elements.maxPagesVal.textContent = `${e.target.value} pages`;
    elements.crawledTarget.textContent = `Limit: ${e.target.value}`;
  });
  elements.maxDepthRange.addEventListener('input', (e) => {
    elements.maxDepthVal.textContent = `${e.target.value} levels`;
  });
  elements.concurrencyRange.addEventListener('input', (e) => {
    elements.concurrencyVal.textContent = `${e.target.value} threads`;
  });

  // Clear URL button
  elements.clearUrlBtn.addEventListener('click', () => {
    elements.targetUrlInput.value = '';
    elements.targetUrlInput.focus();
  });

  // Quick Preset buttons
  elements.presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.targetUrlInput.value = btn.getAttribute('data-url');
      if (btn.getAttribute('data-pages')) {
        elements.maxPagesRange.value = btn.getAttribute('data-pages');
        elements.maxPagesVal.textContent = `${btn.getAttribute('data-pages')} pages`;
        elements.crawledTarget.textContent = `Limit: ${btn.getAttribute('data-pages')}`;
      }
      if (btn.getAttribute('data-depth')) {
        elements.maxDepthRange.value = btn.getAttribute('data-depth');
        elements.maxDepthVal.textContent = `${btn.getAttribute('data-depth')} levels`;
      }
      showToast(`Selected preset: ${btn.getAttribute('data-url')}`, 'info');
    });
  });

  // Form Submit / Crawl Start
  elements.crawlForm.addEventListener('submit', (e) => {
    e.preventDefault();
    startCrawl();
  });

  // Stop Crawl
  elements.stopCrawlBtn.addEventListener('click', stopCrawl);

  // Reset All Button
  if (elements.resetAllBtn) {
    elements.resetAllBtn.addEventListener('click', () => {
      if (state.crawling) {
        stopCrawl();
      }
      elements.targetUrlInput.value = '';
      resetState();
      setUIStatus('ready', 'Ready to Crawl');
      showToast('All crawler data reset successfully', 'info');
    });
  }

  // Side panel tabs (XML preview vs Logs)
  elements.sideTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetSideTab = tab.getAttribute('data-sidetab');
      elements.sideTabs.forEach(t => t.classList.remove('active'));
      elements.sideTabContents.forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(targetSideTab).classList.add('active');
    });
  });

  // Table Search & Filter Pills
  elements.tableSearchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.toLowerCase();
    state.currentPage = 1;
    scheduleRender();
  });

  elements.filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      elements.filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.tableFilter = pill.getAttribute('data-status');
      state.currentPage = 1;
      scheduleRender();
    });
  });

  // Pagination controls
  elements.pageSizeSelect.addEventListener('change', (e) => {
    state.pageSize = parseInt(e.target.value);
    state.currentPage = 1;
    scheduleRender();
  });

  elements.prevPageBtn.addEventListener('click', () => {
    if (state.currentPage > 1) {
      state.currentPage--;
      renderPagesTable();
    }
  });

  elements.nextPageBtn.addEventListener('click', () => {
    state.currentPage++;
    renderPagesTable();
  });

  // Copy XML to clipboard
  elements.copyXmlBtn.addEventListener('click', () => {
    const xmlContent = elements.xmlPreviewCode.textContent;
    navigator.clipboard.writeText(xmlContent).then(() => {
      showToast('sitemap.xml copied to clipboard!', 'success');
    }).catch(() => {
      showToast('Failed to copy XML', 'error');
    });
  });

  // Clear Logs
  elements.clearLogsBtn.addEventListener('click', () => {
    state.logs = [];
    elements.logTerminalBody.innerHTML = '';
    elements.logsCountBadge.textContent = '0';
    showToast('Terminal logs cleared', 'info');
  });

  // Export buttons
  elements.downloadXmlBtn.addEventListener('click', () => {
    if (!state.activeJobId) return;
    window.open(`/api/crawl/export/${state.activeJobId}/xml`, '_blank');
  });

  elements.exportMoreBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    elements.exportDropdownMenu.parentElement.classList.toggle('open');
  });

  document.addEventListener('click', () => {
    elements.exportDropdownMenu.parentElement.classList.remove('open');
  });

  elements.exportTxtLink.addEventListener('click', (e) => {
    e.preventDefault();
    if (!state.activeJobId) return;
    window.open(`/api/crawl/export/${state.activeJobId}/txt`, '_blank');
  });

  elements.exportCsvLink.addEventListener('click', (e) => {
    e.preventDefault();
    if (!state.activeJobId) return;
    window.open(`/api/crawl/export/${state.activeJobId}/csv`, '_blank');
  });

  elements.exportJsonLink.addEventListener('click', (e) => {
    e.preventDefault();
    if (!state.activeJobId) return;
    window.open(`/api/crawl/export/${state.activeJobId}/json`, '_blank');
  });

  // Tree Controls
  elements.expandAllTreeBtn.addEventListener('click', () => {
    document.querySelectorAll('.tree-node-item').forEach(item => item.classList.add('expanded'));
  });

  elements.collapseAllTreeBtn.addEventListener('click', () => {
    document.querySelectorAll('.tree-node-item').forEach(item => item.classList.remove('expanded'));
  });

  // Sitemap Validator Tabs
  elements.vTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const vtabId = tab.getAttribute('data-vtab');
      elements.vTabs.forEach(t => t.classList.remove('active'));
      elements.vTabContents.forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(vtabId).classList.add('active');
    });
  });

  elements.runValidateXmlBtn.addEventListener('click', validateXmlText);
  elements.runValidateUrlBtn.addEventListener('click', validateExternalSitemapUrl);

  // Robots Blocked Retry Buttons
  if (elements.retryBypassRobotsBtn) {
    elements.retryBypassRobotsBtn.addEventListener('click', () => {
      elements.respectRobotsToggle.checked = false;
      elements.robotsBlockedBanner.style.display = 'none';
      startCrawl();
    });
  }

  if (elements.retryGooglebotBtn) {
    elements.retryGooglebotBtn.addEventListener('click', () => {
      elements.userAgentSelect.value = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
      elements.robotsBlockedBanner.style.display = 'none';
      startCrawl();
    });
  }

  // Modal close
  elements.closeModalBtn.addEventListener('click', closeModal);
  elements.urlInspectModal.addEventListener('click', (e) => {
    if (e.target === elements.urlInspectModal) closeModal();
  });
}

function switchMainView(viewId) {
  elements.navTabs.forEach(tab => {
    tab.classList.toggle('active', tab.getAttribute('data-tab') === viewId);
  });
  elements.viewPanels.forEach(panel => {
    panel.classList.toggle('active', panel.id === viewId);
  });
  state.activeTab = viewId;

  if (viewId === 'tree-view' && state.tree) {
    renderVisualTree(state.tree);
  }
  initLucide();
}

function toggleTheme() {
  const isDark = document.body.classList.contains('theme-dark');
  if (isDark) {
    document.body.classList.remove('theme-dark');
    document.body.classList.add('theme-light');
    elements.themeToggleBtn.innerHTML = '<i data-lucide="moon"></i>';
    state.theme = 'light';
  } else {
    document.body.classList.remove('theme-light');
    document.body.classList.add('theme-dark');
    elements.themeToggleBtn.innerHTML = '<i data-lucide="sun"></i>';
    state.theme = 'dark';
  }
  initLucide();
}

// Throttled UI Render Batcher (ensures silky smooth 60fps even with 1000s of URLs)
function scheduleRender() {
  if (state.renderScheduled) return;
  state.renderScheduled = true;
  requestAnimationFrame(() => {
    renderPagesTable();
    updateMetrics();
    updateSeoAudit();
    updateXmlLivePreview();
    state.renderScheduled = false;
  });
}

// Start Crawl Flow
async function startCrawl() {
  const url = elements.targetUrlInput.value.trim();
  if (!url) {
    showToast('Please enter a target URL', 'error');
    return;
  }

  // Reset UI & State
  resetState();
  state.crawling = true;
  state.startTime = Date.now();

  setUIStatus('crawling', 'Crawling website...');
  elements.startCrawlBtn.style.display = 'none';
  elements.stopCrawlBtn.style.display = 'inline-flex';
  elements.downloadXmlBtn.disabled = true;
  elements.exportMoreBtn.disabled = true;

  // Start timer
  startTimer();

  // Switch to main view
  switchMainView('generator-view');

  const crawlConfig = {
    url,
    maxPages: parseInt(elements.maxPagesRange.value),
    maxDepth: parseInt(elements.maxDepthRange.value),
    concurrency: parseInt(elements.concurrencyRange.value),
    userAgent: elements.userAgentSelect.value,
    respectRobots: elements.respectRobotsToggle.checked,
    includeImages: elements.includeImagesToggle.checked,
    includeSubdomains: elements.includeSubdomainsToggle.checked,
    filterNoindex: elements.filterNoindexToggle.checked,
    excludePatterns: elements.excludePatternsInput.value,
    includePatterns: elements.includePatternsInput.value
  };

  try {
    const res = await fetch('/api/crawl/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(crawlConfig)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to initiate crawl');
    }

    state.activeJobId = data.jobId;
    connectSSE(data.jobId);
    showToast(`Crawl initiated for ${url}`, 'info');
  } catch (err) {
    setUIStatus('error', 'Error starting crawl');
    showToast(err.message, 'error');
    cleanupCrawlState();
  }
}

// Connect to Server-Sent Events
function connectSSE(jobId) {
  if (state.eventSource) {
    state.eventSource.close();
  }

  const sse = new EventSource(`/api/crawl/stream/${jobId}`);
  state.eventSource = sse;

  sse.addEventListener('init', (e) => {
    const initData = JSON.parse(e.data);
    if (initData.pages && initData.pages.length > 0) {
      state.pages = initData.pages;
      scheduleRender();
    }
  });

  sse.addEventListener('page', (e) => {
    const page = JSON.parse(e.data);
    state.pages.push(page);
    scheduleRender();
  });

  sse.addEventListener('progress', (e) => {
    const p = JSON.parse(e.data);
    elements.currentUrlDisplay.textContent = p.currentUrl || '';
    elements.progressPercentDisplay.textContent = `${p.percent}%`;
    elements.progressBarFill.style.width = `${p.percent}%`;
    elements.queuedCount.textContent = p.queued || 0;
  });

  sse.addEventListener('log', (e) => {
    const log = JSON.parse(e.data);
    appendLog(log);
  });

  sse.addEventListener('complete', (e) => {
    const completeData = JSON.parse(e.data);
    state.tree = completeData.tree;
    setUIStatus('completed', 'Crawl Completed');
    
    if (state.pages.length === 0 && completeData.summary && completeData.summary.blockedByRobots) {
      if (elements.robotsBlockedBanner) {
        elements.robotsBlockedBanner.style.display = 'flex';
      }
      showToast(`Crawl was blocked by the target site's robots.txt.`, 'warning');
    } else if (state.pages.length === 0) {
      showToast(`Finished crawling! Discovered 0 pages.`, 'info');
    } else {
      showToast(`Finished crawling! Discovered ${state.pages.length} pages.`, 'success');
      if (elements.robotsBlockedBanner) {
        elements.robotsBlockedBanner.style.display = 'none';
      }
    }

    cleanupCrawlState();
    elements.downloadXmlBtn.disabled = state.pages.length === 0;
    elements.exportMoreBtn.disabled = state.pages.length === 0;

    scheduleRender();
    if (state.activeTab === 'tree-view') {
      renderVisualTree(state.tree);
    }
  });

  sse.addEventListener('cancelled', (e) => {
    setUIStatus('ready', 'Crawl Stopped');
    showToast('Crawl was stopped by user.', 'warning');
    cleanupCrawlState();
    elements.downloadXmlBtn.disabled = state.pages.length === 0;
    elements.exportMoreBtn.disabled = state.pages.length === 0;
    scheduleRender();
  });

  sse.addEventListener('error', (e) => {
    console.error('SSE connection error', e);
  });
}

// Stop active crawl
async function stopCrawl() {
  if (!state.activeJobId) return;

  try {
    await fetch(`/api/crawl/stop/${state.activeJobId}`, { method: 'POST' });
    showToast('Stopping crawler...', 'info');
  } catch (err) {
    showToast(`Error stopping crawl: ${err.message}`, 'error');
  }
}

function cleanupCrawlState() {
  state.crawling = false;
  clearInterval(state.timerInterval);
  elements.startCrawlBtn.style.display = 'inline-flex';
  elements.stopCrawlBtn.style.display = 'none';
  if (state.eventSource) {
    state.eventSource.close();
    state.eventSource = null;
  }
}

function resetState() {
  cleanupCrawlState();
  state.pages = [];
  state.logs = [];
  state.tree = null;
  state.currentPage = 1;
  state.activeJobId = null;

  if (elements.robotsBlockedBanner) {
    elements.robotsBlockedBanner.style.display = 'none';
  }

  // Reset Metrics
  elements.crawledCount.textContent = '0';
  elements.queuedCount.textContent = '0';
  elements.successCount.textContent = '0';
  elements.issuesCount.textContent = '0';
  elements.imagesCount.textContent = '0';
  elements.avgSpeed.textContent = '0 ms';
  elements.durationDisplay.textContent = 'Elapsed: 0s';
  elements.successRate.textContent = '100% valid';
  elements.issuesRate.textContent = '0 broken links';
  elements.filterAllCount.textContent = '0';
  elements.filter2xxCount.textContent = '0';
  elements.filter3xxCount.textContent = '0';
  elements.filter4xxCount.textContent = '0';
  elements.filter5xxCount.textContent = '0';

  // Reset Progress
  elements.progressBarFill.style.width = '0%';
  elements.progressPercentDisplay.textContent = '0%';
  elements.currentUrlDisplay.textContent = 'Ready to start...';

  // Reset Table
  renderPagesTable();

  // Reset Logs
  elements.logTerminalBody.innerHTML = `
    <div class="log-entry info">
      <span class="log-time">[System]</span> Ready. Awaiting crawl initiation...
    </div>
  `;
  elements.logsCountBadge.textContent = '0';

  // Reset XML Preview
  elements.xmlEntriesCount.textContent = '0 URLs in sitemap';
  elements.xmlPreviewCode.textContent = '<!-- sitemap.xml will be generated automatically as URLs are crawled -->';

  // Reset Tree
  elements.treeContentWrapper.innerHTML = `
    <div class="tree-empty-state">
      <i data-lucide="network"></i>
      <p>Visual tree will be generated automatically after starting a website crawl.</p>
    </div>
  `;

  // Reset SEO Audit
  updateSeoAudit();

  // Disable export buttons
  elements.downloadXmlBtn.disabled = true;
  elements.exportMoreBtn.disabled = true;

  initLucide();
}

function startTimer() {
  if (state.timerInterval) clearInterval(state.timerInterval);
  state.timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    elements.durationDisplay.textContent = `Elapsed: ${mins > 0 ? mins + 'm ' : ''}${secs}s`;
  }, 1000);
}

function setUIStatus(type, message) {
  const dot = elements.globalStatusBadge.querySelector('.status-dot');
  dot.className = `status-dot ${type}`;
  elements.globalStatusText.textContent = message;
}

// Update Top Metric Dashboard Cards
function updateMetrics() {
  const total = state.pages.length;
  elements.crawledCount.textContent = total;

  let s2xx = 0, s3xx = 0, s4xx = 0, s5xx = 0;
  let totalImages = 0;
  let totalSpeed = 0;

  for (let i = 0; i < total; i++) {
    const p = state.pages[i];
    if (p.status >= 200 && p.status < 300) s2xx++;
    else if (p.status >= 300 && p.status < 400) s3xx++;
    else if (p.status >= 400 && p.status < 500) s4xx++;
    else if (p.status >= 500) s5xx++;

    if (p.images) totalImages += p.images.length;
    if (p.responseTime) totalSpeed += p.responseTime;
  }

  const issues = s4xx + s5xx;
  elements.successCount.textContent = s2xx;
  elements.issuesCount.textContent = issues;
  elements.imagesCount.textContent = totalImages;

  const validRate = total > 0 ? Math.round((s2xx / total) * 100) : 100;
  elements.successRate.textContent = `${validRate}% valid index`;
  elements.issuesRate.textContent = `${issues} issue${issues === 1 ? '' : 's'} detected`;

  const avgMs = total > 0 ? Math.round(totalSpeed / total) : 0;
  elements.avgSpeed.textContent = `${avgMs} ms`;

  // Update filter pill counters
  elements.filterAllCount.textContent = total;
  elements.filter2xxCount.textContent = s2xx;
  elements.filter3xxCount.textContent = s3xx;
  elements.filter4xxCount.textContent = s4xx;
  elements.filter5xxCount.textContent = s5xx;
}

// Render Paginated Pages Data Table
function renderPagesTable() {
  const filtered = state.pages.filter(p => {
    // Status filter
    if (state.tableFilter === '2xx' && (p.status < 200 || p.status >= 300)) return false;
    if (state.tableFilter === '3xx' && (p.status < 300 || p.status >= 400)) return false;
    if (state.tableFilter === '4xx' && (p.status < 400 || p.status >= 500)) return false;
    if (state.tableFilter === '5xx' && (p.status < 500)) return false;

    // Search query filter
    if (state.searchQuery) {
      const matchUrl = p.url.toLowerCase().includes(state.searchQuery);
      const matchTitle = p.title && p.title.toLowerCase().includes(state.searchQuery);
      if (!matchUrl && !matchTitle) return false;
    }

    return true;
  });

  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / state.pageSize));
  
  if (state.currentPage > totalPages) {
    state.currentPage = totalPages;
  }

  const startIndex = (state.currentPage - 1) * state.pageSize;
  const endIndex = Math.min(startIndex + state.pageSize, totalFiltered);
  const pageItems = filtered.slice(startIndex, endIndex);

  elements.tableShowingCount.textContent = `Showing ${totalFiltered > 0 ? startIndex + 1 : 0}-${endIndex} of ${totalFiltered} pages (${state.pages.length} total)`;
  elements.paginationInfoText.textContent = `Page ${state.currentPage} of ${totalPages}`;

  elements.prevPageBtn.disabled = state.currentPage <= 1;
  elements.nextPageBtn.disabled = state.currentPage >= totalPages;

  renderPaginationButtons(totalPages);

  if (pageItems.length === 0) {
    elements.pagesTableBody.innerHTML = `
      <tr class="empty-row">
        <td colspan="8">
          <div class="table-empty-state">
            <i data-lucide="search-x"></i>
            <p>${state.pages.length === 0 ? 'No URLs crawled yet.' : 'No URLs matched the filter criteria.'}</p>
          </div>
        </td>
      </tr>
    `;
    initLucide();
    return;
  }

  let rowsHtml = '';
  for (let i = 0; i < pageItems.length; i++) {
    const p = pageItems[i];
    let statusClass = 's2xx';
    if (p.status >= 300 && p.status < 400) statusClass = 's3xx';
    else if (p.status >= 400 && p.status < 500) statusClass = 's4xx';
    else if (p.status >= 500) statusClass = 's5xx';

    const formattedSize = p.size ? `${(p.size / 1024).toFixed(1)} KB` : '0 KB';
    const imagesCount = p.images ? p.images.length : 0;
    const titleText = p.title || '<span style="color:var(--text-muted);">(No &lt;title&gt;)</span>';

    rowsHtml += `
      <tr>
        <td>
          <span class="status-badge ${statusClass}">${p.status || 'ERR'}</span>
        </td>
        <td>
          <div class="url-cell">
            <a href="${escapeHtml(p.url)}" target="_blank" rel="noopener" class="url-cell-link" title="${escapeHtml(p.url)}">
              ${escapeHtml(p.url)}
            </a>
            <span class="url-cell-title" title="${escapeHtml(p.title || '')}">${titleText}</span>
          </div>
        </td>
        <td><span class="badge">d:${p.depth}</span></td>
        <td>${p.responseTime} ms</td>
        <td>${formattedSize}</td>
        <td>
          <span title="Internal: ${p.internalLinksCount || 0}, External: ${p.externalLinksCount || 0}">
            ${p.internalLinksCount || 0} int
          </span>
        </td>
        <td>${imagesCount}</td>
        <td>
          <button class="inspect-btn" onclick="inspectPage('${escapeHtml(p.url)}')">
            <i data-lucide="eye"></i>
            <span>View</span>
          </button>
        </td>
      </tr>
    `;
  }

  elements.pagesTableBody.innerHTML = rowsHtml;
  initLucide();
}

function renderPaginationButtons(totalPages) {
  if (!elements.pageNumbersList) return;

  let btnHtml = '';
  const current = state.currentPage;
  const maxButtons = 5;

  let start = Math.max(1, current - 2);
  let end = Math.min(totalPages, start + maxButtons - 1);

  if (end - start < maxButtons - 1) {
    start = Math.max(1, end - maxButtons + 1);
  }

  for (let i = start; i <= end; i++) {
    btnHtml += `
      <button class="btn-page ${i === current ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>
    `;
  }

  elements.pageNumbersList.innerHTML = btnHtml;
}

window.goToPage = function(pageNum) {
  state.currentPage = pageNum;
  renderPagesTable();
};

// Append Live Terminal Logs (Capped at 150 items to keep DOM super light)
function appendLog(log) {
  state.logs.push(log);
  elements.logsCountBadge.textContent = state.logs.length;

  const timeStr = new Date().toLocaleTimeString();
  const entry = document.createElement('div');
  entry.className = `log-entry ${log.type || 'info'}`;
  entry.innerHTML = `<span class="log-time">[${timeStr}]</span> ${escapeHtml(log.message)}`;

  elements.logTerminalBody.appendChild(entry);

  if (elements.logTerminalBody.children.length > 150) {
    elements.logTerminalBody.removeChild(elements.logTerminalBody.firstElementChild);
  }

  elements.logTerminalBody.scrollTop = elements.logTerminalBody.scrollHeight;
}

// Generate & Update Live XML Preview (Lightweight representation)
function updateXmlLivePreview() {
  const validPages = state.pages.filter(p => p.status >= 200 && p.status < 300);
  elements.xmlEntriesCount.textContent = `${validPages.length} URLs in sitemap`;

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
  xml += `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

  const sample = validPages.slice(0, 20);
  for (let i = 0; i < sample.length; i++) {
    const p = sample[i];
    const lastmod = p.lastModified ? p.lastModified.split('T')[0] : new Date().toISOString().split('T')[0];
    const priority = p.depth === 0 ? '1.0' : (p.depth === 1 ? '0.8' : (p.depth === 2 ? '0.6' : '0.4'));
    const changefreq = p.depth === 0 ? 'daily' : 'weekly';

    xml += `  <url>\n`;
    xml += `    <loc>${escapeHtml(p.url)}</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `    <changefreq>${changefreq}</changefreq>\n`;
    xml += `    <priority>${priority}</priority>\n`;

    if (p.images && p.images.length > 0) {
      const sampleImgs = p.images.slice(0, 2);
      for (let j = 0; j < sampleImgs.length; j++) {
        const img = sampleImgs[j];
        xml += `    <image:image>\n`;
        xml += `      <image:loc>${escapeHtml(img.url)}</image:loc>\n`;
        if (img.title) xml += `      <image:title>${escapeHtml(img.title)}</image:title>\n`;
        xml += `    </image:image>\n`;
      }
    }

    xml += `  </url>\n`;
  }

  if (validPages.length > 20) {
    xml += `  <!-- ... and ${validPages.length - 20} more URLs in full sitemap.xml ... -->\n`;
  }

  xml += `</urlset>`;
  elements.xmlPreviewCode.textContent = xml;
}

// Render Visual Site Hierarchy Tree
function renderVisualTree(treeNode) {
  if (!treeNode || (!treeNode.children && !treeNode.name)) {
    elements.treeContentWrapper.innerHTML = `
      <div class="tree-empty-state">
        <i data-lucide="folder-x"></i>
        <p>No directory structure available.</p>
      </div>
    `;
    initLucide();
    return;
  }

  function buildNodeHtml(node, depth = 0) {
    const hasChildren = node.children && node.children.length > 0;
    const isFile = node.isPage;
    const iconName = isFile ? 'file-text' : (hasChildren ? 'folder' : 'folder-open');
    const childPagesCount = countNodePages(node);
    const isInitiallyExpanded = depth < 2;

    let html = `
      <div class="tree-node-item ${isInitiallyExpanded ? 'expanded' : ''}">
        <div class="tree-node-row" onclick="toggleTreeNode(this)">
          ${hasChildren ? '<i data-lucide="chevron-right" class="tree-expander"></i>' : '<span style="width:16px;"></span>'}
          <i data-lucide="${iconName}" class="tree-icon"></i>
          <span class="tree-name">${escapeHtml(node.name || '/')}</span>
          ${node.url ? `<a href="${escapeHtml(node.url)}" target="_blank" class="url-cell-link" style="margin-left:0.5rem;font-size:0.75rem;">(open)</a>` : ''}
          ${childPagesCount > 0 ? `<span class="tree-badge">${childPagesCount} pages</span>` : ''}
        </div>
    `;

    if (hasChildren) {
      html += `<div class="tree-children">`;
      for (let i = 0; i < node.children.length; i++) {
        html += buildNodeHtml(node.children[i], depth + 1);
      }
      html += `</div>`;
    }

    html += `</div>`;
    return html;
  }

  function countNodePages(node) {
    let count = node.isPage ? 1 : 0;
    if (node.children) {
      for (let i = 0; i < node.children.length; i++) {
        count += countNodePages(node.children[i]);
      }
    }
    return count;
  }

  elements.treeContentWrapper.innerHTML = buildNodeHtml(treeNode);
  initLucide();
}

window.toggleTreeNode = function(rowElement) {
  const nodeItem = rowElement.closest('.tree-node-item');
  if (nodeItem) {
    nodeItem.classList.toggle('expanded');
  }
};

// SEO Health Audit Calculation
function updateSeoAudit() {
  const brokenLinks = [];
  const missingTitles = [];
  const missingDescs = [];
  const slowPages = [];

  const total = state.pages.length;
  for (let i = 0; i < total; i++) {
    const p = state.pages[i];
    if (p.status >= 400 || p.error) {
      brokenLinks.push(p);
    }
    if (p.status >= 200 && p.status < 300) {
      if (!p.title || p.title.trim().length === 0) {
        missingTitles.push(p);
      }
      if (!p.description || p.description.trim().length === 0) {
        missingDescs.push(p);
      }
      if (p.responseTime > 1500) {
        slowPages.push(p);
      }
    }
  }

  // Calculate SEO Health Score (0 - 100)
  const safeTotal = Math.max(total, 1);
  let deductions = 0;
  deductions += (brokenLinks.length / safeTotal) * 40;
  deductions += (missingTitles.length / safeTotal) * 30;
  deductions += (missingDescs.length / safeTotal) * 15;
  deductions += (slowPages.length / safeTotal) * 15;

  const seoScore = Math.max(0, Math.round(100 - deductions));
  elements.seoScoreNum.textContent = seoScore;
  if (seoScore >= 80) elements.seoScoreNum.className = 'score-number text-green';
  else if (seoScore >= 50) elements.seoScoreNum.className = 'score-number text-amber';
  else elements.seoScoreNum.className = 'score-number text-red';

  // Broken Links
  elements.brokenLinksCount.textContent = brokenLinks.length;
  if (brokenLinks.length > 0) {
    elements.brokenLinksList.innerHTML = brokenLinks.slice(0, 10).map(p => `
      <li><strong>[${p.status || 'ERR'}]</strong> ${escapeHtml(p.url)}</li>
    `).join('');
  } else {
    elements.brokenLinksList.innerHTML = '<li class="empty-list-item">No broken links found.</li>';
  }

  // Missing Titles
  elements.missingTitlesCount.textContent = missingTitles.length;
  if (missingTitles.length > 0) {
    elements.missingTitlesList.innerHTML = missingTitles.slice(0, 10).map(p => `
      <li>${escapeHtml(p.url)}</li>
    `).join('');
  } else {
    elements.missingTitlesList.innerHTML = '<li class="empty-list-item">All crawled pages have title tags.</li>';
  }

  // Missing Descriptions
  elements.missingDescCount.textContent = missingDescs.length;
  if (missingDescs.length > 0) {
    elements.missingDescList.innerHTML = missingDescs.slice(0, 10).map(p => `
      <li>${escapeHtml(p.url)}</li>
    `).join('');
  } else {
    elements.missingDescList.innerHTML = '<li class="empty-list-item">Meta descriptions audit clear.</li>';
  }

  // Slow Pages
  elements.slowPagesCount.textContent = slowPages.length;
  if (slowPages.length > 0) {
    elements.slowPagesList.innerHTML = slowPages.slice(0, 10).map(p => `
      <li>${escapeHtml(p.url)} (${p.responseTime}ms)</li>
    `).join('');
  } else {
    elements.slowPagesList.innerHTML = '<li class="empty-list-item">All pages respond swiftly.</li>';
  }
}

// Page Inspection Modal
window.inspectPage = function(targetUrl) {
  const page = state.pages.find(p => p.url === targetUrl);
  if (!page) return;

  const imagesHtml = page.images && page.images.length > 0
    ? page.images.slice(0, 50).map(img => `<div class="inspect-val" style="margin-bottom:4px;font-size:0.75rem;"><strong>${escapeHtml(img.alt || 'No alt')}:</strong> ${escapeHtml(img.url)}</div>`).join('')
    : '<div class="inspect-val" style="color:var(--text-muted);">No images detected</div>';

  elements.modalBodyContent.innerHTML = `
    <div class="inspect-section">
      <span class="inspect-label">Target URL</span>
      <div class="inspect-val">${escapeHtml(page.url)}</div>
    </div>

    <div class="inspect-section">
      <span class="inspect-label">HTTP Status Code & Speed</span>
      <div class="inspect-val">${page.status} ${escapeHtml(page.statusText || '')} &bull; ${page.responseTime} ms &bull; Depth: ${page.depth}</div>
    </div>

    <div class="inspect-section">
      <span class="inspect-label">Page Title (&lt;title&gt;)</span>
      <div class="inspect-val">${escapeHtml(page.title || 'N/A')}</div>
    </div>

    <div class="inspect-section">
      <span class="inspect-label">Meta Description</span>
      <div class="inspect-val">${escapeHtml(page.description || 'N/A')}</div>
    </div>

    <div class="inspect-section">
      <span class="inspect-label">Main Heading (&lt;h1&gt;)</span>
      <div class="inspect-val">${escapeHtml(page.h1 || 'N/A')}</div>
    </div>

    <div class="inspect-section">
      <span class="inspect-label">Canonical Link & Robots Tag</span>
      <div class="inspect-val">Canonical: ${escapeHtml(page.canonical || 'None declared')} | Robots: ${escapeHtml(page.metaRobots || 'index, follow')}</div>
    </div>

    <div class="inspect-section">
      <span class="inspect-label">Extracted Images (${page.images ? page.images.length : 0})</span>
      <div style="max-height:160px;overflow-y:auto;">${imagesHtml}</div>
    </div>
  `;

  elements.urlInspectModal.style.display = 'flex';
  initLucide();
};

function closeModal() {
  elements.urlInspectModal.style.display = 'none';
}

// Validate XML Text
async function validateXmlText() {
  const xml = elements.validateXmlInput.value.trim();
  if (!xml) {
    showToast('Please paste XML content to validate', 'error');
    return;
  }

  try {
    const res = await fetch('/api/sitemap/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ xml })
    });

    const data = await res.json();
    displayValidationResults(data);
  } catch (err) {
    showToast(`Validation request failed: ${err.message}`, 'error');
  }
}

// Fetch & Validate External Sitemap URL
async function validateExternalSitemapUrl() {
  const url = elements.validateSitemapUrlInput.value.trim();
  if (!url) {
    showToast('Please enter a sitemap URL to fetch', 'error');
    return;
  }

  showToast(`Fetching sitemap from ${url}...`, 'info');

  try {
    const res = await fetch('/api/sitemap/fetch-and-parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to fetch external sitemap');
    }

    displayValidationResults(data.validation);
    if (data.tree) {
      state.tree = data.tree;
      renderVisualTree(data.tree);
    }
    showToast(`Successfully validated sitemap with ${data.validation.stats.totalUrls} URLs!`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function displayValidationResults(valData) {
  elements.validationResultsBox.style.display = 'block';

  if (valData.isValid) {
    elements.valResultsSummary.innerHTML = `<span class="text-green"><i data-lucide="check-circle-2"></i> Valid Sitemap. Compliant with Sitemaps 0.9 standard.</span>`;
  } else {
    elements.valResultsSummary.innerHTML = `<span class="text-red"><i data-lucide="alert-octagon"></i> Sitemap Issues Detected (${valData.issues.length} errors/warnings)</span>`;
  }

  elements.valStatsPills.innerHTML = `
    <span class="val-stat-pill">Total &lt;loc&gt;: ${valData.stats.totalUrls}</span>
    <span class="val-stat-pill">With &lt;lastmod&gt;: ${valData.stats.withLastmod}</span>
    <span class="val-stat-pill">With &lt;priority&gt;: ${valData.stats.withPriority}</span>
    <span class="val-stat-pill">With &lt;changefreq&gt;: ${valData.stats.withChangefreq}</span>
    <span class="val-stat-pill">Images: ${valData.stats.withImages}</span>
  `;

  if (valData.issues && valData.issues.length > 0) {
    elements.valIssuesList.innerHTML = valData.issues.map(issue => `<li>&bull; ${escapeHtml(issue)}</li>`).join('');
  } else {
    elements.valIssuesList.innerHTML = '<li style="color:var(--accent-emerald);">&bull; No syntax or schema errors found.</li>';
  }

  initLucide();
}

// Toast notification helper
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = 'toast';

  let icon = 'info';
  if (type === 'success') icon = 'check-circle';
  else if (type === 'error') icon = 'alert-triangle';
  else if (type === 'warning') icon = 'alert-circle';

  toast.innerHTML = `<i data-lucide="${icon}" class="text-${type === 'success' ? 'green' : (type === 'error' ? 'red' : 'amber')}"></i> <span>${escapeHtml(message)}</span>`;

  elements.toastContainer.appendChild(toast);
  initLucide();

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Utility: HTML Escaping
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
