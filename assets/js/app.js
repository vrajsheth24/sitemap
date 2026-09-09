const state = {
  activeJobId: null,
  crawler: null,
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

const elements = {
  navTabs: document.querySelectorAll('.nav-tab'),
  viewPanels: document.querySelectorAll('.view-panel'),
  globalStatusBadge: document.getElementById('globalStatusBadge'),
  globalStatusText: document.getElementById('globalStatusText'),
  themeToggleBtn: document.getElementById('themeToggleBtn'),
  crawlForm: document.getElementById('crawlForm'),
  targetUrlInput: document.getElementById('targetUrlInput'),
  clearUrlBtn: document.getElementById('clearUrlBtn'),
  toggleAdvancedBtn: document.getElementById('toggleAdvancedBtn'),
  advancedOptionsDrawer: document.getElementById('advancedOptionsDrawer'),
  startCrawlBtn: document.getElementById('startCrawlBtn'),
  stopCrawlBtn: document.getElementById('stopCrawlBtn'),
  resetAllBtn: document.getElementById('resetAllBtn'),
  presetBtns: document.querySelectorAll('.preset-btn'),
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
  currentUrlDisplay: document.getElementById('currentUrlDisplay'),
  progressPercentDisplay: document.getElementById('progressPercentDisplay'),
  progressBarFill: document.getElementById('progressBarFill'),
  tableSearchInput: document.getElementById('tableSearchInput'),
  filterPills: document.querySelectorAll('.filter-pill'),
  filterAllCount: document.getElementById('filterAllCount'),
  filter2xxCount: document.getElementById('filter2xxCount'),
  filter3xxCount: document.getElementById('filter3xxCount'),
  filter4xxCount: document.getElementById('filter4xxCount'),
  filter5xxCount: document.getElementById('filter5xxCount'),
  pagesTableBody: document.getElementById('pagesTableBody'),
  tableShowingCount: document.getElementById('tableShowingCount'),
  paginationInfoText: document.getElementById('paginationInfoText'),
  pageSizeSelect: document.getElementById('pageSizeSelect'),
  prevPageBtn: document.getElementById('prevPageBtn'),
  nextPageBtn: document.getElementById('nextPageBtn'),
  pageNumbersList: document.getElementById('pageNumbersList'),
  downloadXmlBtn: document.getElementById('downloadXmlBtn'),
  exportMoreBtn: document.getElementById('exportMoreBtn'),
  exportDropdownMenu: document.getElementById('exportDropdownMenu'),
  exportTxtLink: document.getElementById('exportTxtLink'),
  exportCsvLink: document.getElementById('exportCsvLink'),
  exportJsonLink: document.getElementById('exportJsonLink'),
  sideTabs: document.querySelectorAll('.side-tab'),
  sideTabContents: document.querySelectorAll('.side-tab-content'),
  xmlEntriesCount: document.getElementById('xmlEntriesCount'),
  copyXmlBtn: document.getElementById('copyXmlBtn'),
  xmlPreviewCode: document.getElementById('xmlPreviewCode'),
  logsCountBadge: document.getElementById('logsCountBadge'),
  clearLogsBtn: document.getElementById('clearLogsBtn'),
  logTerminalBody: document.getElementById('logTerminalBody'),
  treeContentWrapper: document.getElementById('treeContentWrapper'),
  expandAllTreeBtn: document.getElementById('expandAllTreeBtn'),
  collapseAllTreeBtn: document.getElementById('collapseAllTreeBtn'),
  seoScoreNum: document.getElementById('seoScoreNum'),
  brokenLinksCount: document.getElementById('brokenLinksCount'),
  brokenLinksList: document.getElementById('brokenLinksList'),
  missingTitlesCount: document.getElementById('missingTitlesCount'),
  missingTitlesList: document.getElementById('missingTitlesList'),
  missingDescCount: document.getElementById('missingDescCount'),
  missingDescList: document.getElementById('missingDescList'),
  slowPagesCount: document.getElementById('slowPagesCount'),
  slowPagesList: document.getElementById('slowPagesList'),
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
  robotsBlockedBanner: document.getElementById('robotsBlockedBanner'),
  retryBypassRobotsBtn: document.getElementById('retryBypassRobotsBtn'),
  retryGooglebotBtn: document.getElementById('retryGooglebotBtn'),
  urlInspectModal: document.getElementById('urlInspectModal'),
  closeModalBtn: document.getElementById('closeModalBtn'),
  modalBodyContent: document.getElementById('modalBodyContent'),
  toastContainer: document.getElementById('toastContainer')
};

document.addEventListener('DOMContentLoaded', () => {
  initLucide();
  bindEvents();
  resetState();
});

function initLucide() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function bindEvents() {
  elements.navTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      switchMainView(tab.getAttribute('data-tab'));
    });
  });

  elements.themeToggleBtn.addEventListener('click', toggleTheme);

  elements.toggleAdvancedBtn.addEventListener('click', () => {
    const isHidden = elements.advancedOptionsDrawer.style.display === 'none';
    elements.advancedOptionsDrawer.style.display = isHidden ? 'flex' : 'none';
    elements.toggleAdvancedBtn.classList.toggle('open', isHidden);
  });

  elements.maxPagesRange.addEventListener('input', (event) => {
    elements.maxPagesVal.textContent = `${event.target.value} pages`;
    elements.crawledTarget.textContent = `Limit: ${event.target.value}`;
  });
  elements.maxDepthRange.addEventListener('input', (event) => {
    elements.maxDepthVal.textContent = `${event.target.value} levels`;
  });
  elements.concurrencyRange.addEventListener('input', (event) => {
    elements.concurrencyVal.textContent = `${event.target.value} threads`;
  });

  elements.clearUrlBtn.addEventListener('click', () => {
    elements.targetUrlInput.value = '';
    elements.targetUrlInput.focus();
  });

  elements.presetBtns.forEach((btn) => {
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

  elements.crawlForm.addEventListener('submit', (event) => {
    event.preventDefault();
    startCrawl();
  });

  elements.stopCrawlBtn.addEventListener('click', stopCrawl);

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

  elements.sideTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetSideTab = tab.getAttribute('data-sidetab');
      elements.sideTabs.forEach((item) => item.classList.remove('active'));
      elements.sideTabContents.forEach((content) => content.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(targetSideTab).classList.add('active');
    });
  });

  elements.tableSearchInput.addEventListener('input', (event) => {
    state.searchQuery = event.target.value.toLowerCase();
    state.currentPage = 1;
    scheduleRender();
  });

  elements.filterPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      elements.filterPills.forEach((item) => item.classList.remove('active'));
      pill.classList.add('active');
      state.tableFilter = pill.getAttribute('data-status');
      state.currentPage = 1;
      scheduleRender();
    });
  });

  elements.pageSizeSelect.addEventListener('change', (event) => {
    state.pageSize = parseInt(event.target.value, 10);
    state.currentPage = 1;
    scheduleRender();
  });

  elements.prevPageBtn.addEventListener('click', () => {
    if (state.currentPage > 1) {
      state.currentPage -= 1;
      renderPagesTable();
    }
  });

  elements.nextPageBtn.addEventListener('click', () => {
    state.currentPage += 1;
    renderPagesTable();
  });

  elements.copyXmlBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(elements.xmlPreviewCode.textContent).then(() => {
      showToast('sitemap.xml copied to clipboard!', 'success');
    }).catch(() => {
      showToast('Failed to copy XML', 'error');
    });
  });

  elements.clearLogsBtn.addEventListener('click', () => {
    state.logs = [];
    elements.logTerminalBody.innerHTML = '';
    elements.logsCountBadge.textContent = '0';
    showToast('Terminal logs cleared', 'info');
  });

  elements.downloadXmlBtn.addEventListener('click', () => {
    if (state.pages.length === 0) return;
    const xml = SitemapGenerator.generateXml(state.pages, { includeImages: elements.includeImagesToggle.checked });
    downloadBlob(xml, 'sitemap.xml', 'application/xml;charset=utf-8');
  });

  elements.exportMoreBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    elements.exportDropdownMenu.parentElement.classList.toggle('open');
  });

  document.addEventListener('click', () => {
    elements.exportDropdownMenu.parentElement.classList.remove('open');
  });

  elements.exportTxtLink.addEventListener('click', (event) => {
    event.preventDefault();
    if (state.pages.length === 0) return;
    downloadBlob(SitemapGenerator.generateTxt(state.pages), 'url-list.txt', 'text/plain;charset=utf-8');
  });

  elements.exportCsvLink.addEventListener('click', (event) => {
    event.preventDefault();
    if (state.pages.length === 0) return;
    downloadBlob(SitemapGenerator.generateCsv(state.pages), 'sitemap-report.csv', 'text/csv;charset=utf-8');
  });

  elements.exportJsonLink.addEventListener('click', (event) => {
    event.preventDefault();
    if (state.pages.length === 0) return;
    downloadBlob(SitemapGenerator.generateJson(state.pages), 'sitemap-report.json', 'application/json;charset=utf-8');
  });

  elements.expandAllTreeBtn.addEventListener('click', () => {
    document.querySelectorAll('.tree-node-item').forEach((item) => item.classList.add('expanded'));
  });

  elements.collapseAllTreeBtn.addEventListener('click', () => {
    document.querySelectorAll('.tree-node-item').forEach((item) => item.classList.remove('expanded'));
  });

  elements.vTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const vtabId = tab.getAttribute('data-vtab');
      elements.vTabs.forEach((item) => item.classList.remove('active'));
      elements.vTabContents.forEach((content) => content.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(vtabId).classList.add('active');
    });
  });

  elements.runValidateXmlBtn.addEventListener('click', validateXmlText);
  elements.runValidateUrlBtn.addEventListener('click', validateExternalSitemapUrl);

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

  elements.closeModalBtn.addEventListener('click', closeModal);
  elements.urlInspectModal.addEventListener('click', (event) => {
    if (event.target === elements.urlInspectModal) closeModal();
  });
}

function switchMainView(viewId) {
  elements.navTabs.forEach((tab) => {
    tab.classList.toggle('active', tab.getAttribute('data-tab') === viewId);
  });
  elements.viewPanels.forEach((panel) => {
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

async function startCrawl() {
  const url = elements.targetUrlInput.value.trim();
  if (!url) {
    showToast('Please enter a target URL', 'error');
    return;
  }

  resetState();
  state.crawling = true;
  state.startTime = Date.now();

  setUIStatus('crawling', 'Crawling website...');
  elements.startCrawlBtn.style.display = 'none';
  elements.stopCrawlBtn.style.display = 'inline-flex';
  elements.downloadXmlBtn.disabled = true;
  elements.exportMoreBtn.disabled = true;

  startTimer();
  switchMainView('generator-view');

  const crawlConfig = {
    url,
    maxPages: parseInt(elements.maxPagesRange.value, 10),
    maxDepth: parseInt(elements.maxDepthRange.value, 10),
    concurrency: parseInt(elements.concurrencyRange.value, 10),
    delay: 100,
    userAgent: elements.userAgentSelect.value,
    respectRobots: elements.respectRobotsToggle.checked,
    includeImages: elements.includeImagesToggle.checked,
    includeSubdomains: elements.includeSubdomainsToggle.checked,
    excludePatterns: elements.excludePatternsInput.value,
    includePatterns: elements.includePatternsInput.value
  };

  try {
    const crawler = new BrowserCrawler({
      ...crawlConfig,
      onPage: (page) => {
        state.pages.push(page);
        scheduleRender();
      },
      onProgress: (progress) => {
        elements.currentUrlDisplay.textContent = progress.currentUrl || '';
        elements.progressPercentDisplay.textContent = `${progress.percent || 0}%`;
        elements.progressBarFill.style.width = `${progress.percent || 0}%`;
        elements.queuedCount.textContent = progress.queued || 0;
      },
      onLog: (log) => {
        appendLog(log);
      },
      onComplete: (summary) => {
        state.tree = SitemapGenerator.generateTreeStructure(state.pages);
        setUIStatus('completed', 'Crawl Completed');

        if (state.pages.length === 0 && summary && summary.blockedByRobots) {
          if (elements.robotsBlockedBanner) {
            elements.robotsBlockedBanner.style.display = 'flex';
          }
          showToast('Crawl was blocked by the target site robots.txt.', 'warning');
        } else if (state.pages.length === 0) {
          showToast('Finished crawling! Discovered 0 pages.', 'info');
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
      },
      onError: (error) => {
        showToast(error.message || 'Crawl error', 'error');
      }
    });

    state.crawler = crawler;
    state.activeJobId = `local-${Date.now()}`;
    showToast(`Crawl initiated for ${url}`, 'info');
    await crawler.start();
  } catch (error) {
    setUIStatus('error', 'Error starting crawl');
    showToast(error.message || 'Failed to initiate crawl', 'error');
    cleanupCrawlState();
  }
}

async function stopCrawl() {
  if (!state.crawler) return;

  try {
    state.crawler.abort();
    setUIStatus('ready', 'Crawl Stopped');
    showToast('Crawl was stopped by user.', 'warning');
    cleanupCrawlState();
    elements.downloadXmlBtn.disabled = state.pages.length === 0;
    elements.exportMoreBtn.disabled = state.pages.length === 0;
    scheduleRender();
  } catch (error) {
    showToast(`Error stopping crawl: ${error.message}`, 'error');
  }
}

function cleanupCrawlState() {
  state.crawling = false;
  clearInterval(state.timerInterval);
  elements.startCrawlBtn.style.display = 'inline-flex';
  elements.stopCrawlBtn.style.display = 'none';
  state.crawler = null;
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

  elements.progressBarFill.style.width = '0%';
  elements.progressPercentDisplay.textContent = '0%';
  elements.currentUrlDisplay.textContent = 'Ready to start...';

  renderPagesTable();

  elements.logTerminalBody.innerHTML = `
    <div class="log-entry info">
      <span class="log-time">[System]</span> Ready. Awaiting crawl initiation...
    </div>
  `;
  elements.logsCountBadge.textContent = '0';

  elements.xmlEntriesCount.textContent = '0 URLs in sitemap';
  elements.xmlPreviewCode.textContent = '<!-- sitemap.xml will be generated automatically as URLs are crawled -->';

  elements.treeContentWrapper.innerHTML = `
    <div class="tree-empty-state">
      <i data-lucide="network"></i>
      <p>Visual tree will be generated automatically after starting a website crawl.</p>
    </div>
  `;

  updateSeoAudit();

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

function updateMetrics() {
  const total = state.pages.length;
  elements.crawledCount.textContent = total;

  let s2xx = 0;
  let s3xx = 0;
  let s4xx = 0;
  let s5xx = 0;
  let totalImages = 0;
  let totalSpeed = 0;

  for (let i = 0; i < total; i += 1) {
    const page = state.pages[i];
    if (page.status >= 200 && page.status < 300) s2xx += 1;
    else if (page.status >= 300 && page.status < 400) s3xx += 1;
    else if (page.status >= 400 && page.status < 500) s4xx += 1;
    else if (page.status >= 500) s5xx += 1;

    if (page.images) totalImages += page.images.length;
    if (page.responseTime) totalSpeed += page.responseTime;
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

  elements.filterAllCount.textContent = total;
  elements.filter2xxCount.textContent = s2xx;
  elements.filter3xxCount.textContent = s3xx;
  elements.filter4xxCount.textContent = s4xx;
  elements.filter5xxCount.textContent = s5xx;
}

function renderPagesTable() {
  const filtered = state.pages.filter((page) => {
    if (state.tableFilter === '2xx' && (page.status < 200 || page.status >= 300)) return false;
    if (state.tableFilter === '3xx' && (page.status < 300 || page.status >= 400)) return false;
    if (state.tableFilter === '4xx' && (page.status < 400 || page.status >= 500)) return false;
    if (state.tableFilter === '5xx' && page.status < 500) return false;

    if (state.searchQuery) {
      const matchUrl = page.url.toLowerCase().includes(state.searchQuery);
      const matchTitle = page.title && page.title.toLowerCase().includes(state.searchQuery);
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
  for (let i = 0; i < pageItems.length; i += 1) {
    const page = pageItems[i];
    let statusClass = 's2xx';
    if (page.status >= 300 && page.status < 400) statusClass = 's3xx';
    else if (page.status >= 400 && page.status < 500) statusClass = 's4xx';
    else if (page.status >= 500) statusClass = 's5xx';

    const formattedSize = page.size ? `${(page.size / 1024).toFixed(1)} KB` : '0 KB';
    const imagesCount = page.images ? page.images.length : 0;
    const titleText = page.title || '<span style="color:var(--text-muted);">(No &lt;title&gt;)</span>';

    rowsHtml += `
      <tr>
        <td><span class="status-badge ${statusClass}">${page.status || 'ERR'}</span></td>
        <td>
          <div class="url-cell">
            <a href="${escapeHtml(page.url)}" target="_blank" rel="noopener" class="url-cell-link" title="${escapeHtml(page.url)}">
              ${escapeHtml(page.url)}
            </a>
            <span class="url-cell-title" title="${escapeHtml(page.title || '')}">${titleText}</span>
          </div>
        </td>
        <td><span class="badge">d:${page.depth}</span></td>
        <td>${page.responseTime} ms</td>
        <td>${formattedSize}</td>
        <td>
          <span title="Internal: ${page.internalLinksCount || 0}, External: ${page.externalLinksCount || 0}">
            ${page.internalLinksCount || 0} int
          </span>
        </td>
        <td>${imagesCount}</td>
        <td>
          <button class="inspect-btn" onclick="inspectPage('${encodeURIComponent(page.url)}')">
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

  for (let i = start; i <= end; i += 1) {
    btnHtml += `
      <button class="btn-page ${i === current ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>
    `;
  }

  elements.pageNumbersList.innerHTML = btnHtml;
}

window.goToPage = function (pageNum) {
  state.currentPage = pageNum;
  renderPagesTable();
};

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

function updateXmlLivePreview() {
  const validPages = state.pages.filter((page) => page.status >= 200 && page.status < 300);
  elements.xmlEntriesCount.textContent = `${validPages.length} URLs in sitemap`;

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  xml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

  const sample = validPages.slice(0, 20);
  for (let i = 0; i < sample.length; i += 1) {
    const page = sample[i];
    const lastmod = page.lastModified ? page.lastModified.split('T')[0] : new Date().toISOString().split('T')[0];
    const priority = page.depth === 0 ? '1.0' : (page.depth === 1 ? '0.8' : (page.depth === 2 ? '0.6' : '0.4'));
    const changefreq = page.depth === 0 ? 'daily' : 'weekly';

    xml += '  <url>\n';
    xml += `    <loc>${escapeHtml(page.url)}</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `    <changefreq>${changefreq}</changefreq>\n`;
    xml += `    <priority>${priority}</priority>\n`;

    if (page.images && page.images.length > 0) {
      const sampleImgs = page.images.slice(0, 2);
      for (let j = 0; j < sampleImgs.length; j += 1) {
        const img = sampleImgs[j];
        xml += '    <image:image>\n';
        xml += `      <image:loc>${escapeHtml(img.url)}</image:loc>\n`;
        if (img.title) xml += `      <image:title>${escapeHtml(img.title)}</image:title>\n`;
        xml += '    </image:image>\n';
      }
    }

    xml += '  </url>\n';
  }

  if (validPages.length > 20) {
    xml += `  <!-- ... and ${validPages.length - 20} more URLs in full sitemap.xml ... -->\n`;
  }

  xml += '</urlset>';
  elements.xmlPreviewCode.textContent = xml;
}

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
      html += '<div class="tree-children">';
      for (let i = 0; i < node.children.length; i += 1) {
        html += buildNodeHtml(node.children[i], depth + 1);
      }
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  function countNodePages(node) {
    let count = node.isPage ? 1 : 0;
    if (node.children) {
      for (let i = 0; i < node.children.length; i += 1) {
        count += countNodePages(node.children[i]);
      }
    }
    return count;
  }

  elements.treeContentWrapper.innerHTML = buildNodeHtml(treeNode);
  initLucide();
}

window.toggleTreeNode = function (rowElement) {
  const nodeItem = rowElement.closest('.tree-node-item');
  if (nodeItem) {
    nodeItem.classList.toggle('expanded');
  }
};

function updateSeoAudit() {
  const brokenLinks = [];
  const missingTitles = [];
  const missingDescs = [];
  const slowPages = [];

  const total = state.pages.length;
  for (let i = 0; i < total; i += 1) {
    const page = state.pages[i];
    if (page.status >= 400 || page.error) {
      brokenLinks.push(page);
    }
    if (page.status >= 200 && page.status < 300) {
      if (!page.title || page.title.trim().length === 0) {
        missingTitles.push(page);
      }
      if (!page.description || page.description.trim().length === 0) {
        missingDescs.push(page);
      }
      if (page.responseTime > 1500) {
        slowPages.push(page);
      }
    }
  }

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

  elements.brokenLinksCount.textContent = brokenLinks.length;
  if (brokenLinks.length > 0) {
    elements.brokenLinksList.innerHTML = brokenLinks.slice(0, 10).map((page) => `
      <li><strong>[${page.status || 'ERR'}]</strong> ${escapeHtml(page.url)}</li>
    `).join('');
  } else {
    elements.brokenLinksList.innerHTML = '<li class="empty-list-item">No broken links found.</li>';
  }

  elements.missingTitlesCount.textContent = missingTitles.length;
  if (missingTitles.length > 0) {
    elements.missingTitlesList.innerHTML = missingTitles.slice(0, 10).map((page) => `<li>${escapeHtml(page.url)}</li>`).join('');
  } else {
    elements.missingTitlesList.innerHTML = '<li class="empty-list-item">All crawled pages have title tags.</li>';
  }

  elements.missingDescCount.textContent = missingDescs.length;
  if (missingDescs.length > 0) {
    elements.missingDescList.innerHTML = missingDescs.slice(0, 10).map((page) => `<li>${escapeHtml(page.url)}</li>`).join('');
  } else {
    elements.missingDescList.innerHTML = '<li class="empty-list-item">Meta descriptions audit clear.</li>';
  }

  elements.slowPagesCount.textContent = slowPages.length;
  if (slowPages.length > 0) {
    elements.slowPagesList.innerHTML = slowPages.slice(0, 10).map((page) => `<li>${escapeHtml(page.url)} (${page.responseTime}ms)</li>`).join('');
  } else {
    elements.slowPagesList.innerHTML = '<li class="empty-list-item">All pages respond swiftly.</li>';
  }
}

window.inspectPage = function (targetUrl) {
  const page = state.pages.find((item) => item.url === decodeURIComponent(targetUrl));
  if (!page) return;

  const imagesHtml = page.images && page.images.length > 0
    ? page.images.slice(0, 50).map((img) => `<div class="inspect-val" style="margin-bottom:4px;font-size:0.75rem;"><strong>${escapeHtml(img.alt || 'No alt')}:</strong> ${escapeHtml(img.url)}</div>`).join('')
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

function validateXmlText() {
  const xml = elements.validateXmlInput.value.trim();
  if (!xml) {
    showToast('Please paste XML content to validate', 'error');
    return;
  }

  const data = SitemapGenerator.validateSitemapXml(xml);
  displayValidationResults(data);
}

async function validateExternalSitemapUrl() {
  const url = elements.validateSitemapUrlInput.value.trim();
  if (!url) {
    showToast('Please enter a sitemap URL to fetch', 'error');
    return;
  }

  showToast(`Fetching sitemap from ${url}...`, 'info');

  try {
    const response = await fetch(url, { method: 'GET', mode: 'cors', credentials: 'omit' });
    if (!response.ok) {
      throw new Error(`Failed to fetch sitemap (${response.status})`);
    }
    const xml = await response.text();
    const parsed = SitemapGenerator.validateSitemapXml(xml);
    displayValidationResults(parsed);

    const locMatches = xml.match(/<loc>([\s\S]*?)<\/loc>/g) || [];
    const pages = locMatches.map((locTag) => ({
      url: locTag.replace(/<\/?loc>/g, '').trim(),
      depth: 0,
      status: 200,
      title: '',
      description: '',
      h1: '',
      canonical: '',
      metaRobots: '',
      responseTime: 0,
      size: 0,
      lastModified: new Date().toISOString(),
      images: []
    }));

    state.tree = SitemapGenerator.generateTreeStructure(pages);
    renderVisualTree(state.tree);
    showToast(`Successfully validated sitemap with ${parsed.stats.totalUrls} URLs!`, 'success');
  } catch (error) {
    const message = error && error.message ? error.message : 'Unable to fetch sitemap due to browser restrictions';
    showToast(message, 'error');
    if (message.includes('CORS') || message.includes('Failed to fetch')) {
      showToast('This website does not allow browser-based crawling because of CORS restrictions. A server-side crawler is required for this domain.', 'warning');
    }
  }
}

function displayValidationResults(valData) {
  elements.validationResultsBox.style.display = 'block';

  if (valData.isValid) {
    elements.valResultsSummary.innerHTML = '<span class="text-green"><i data-lucide="check-circle-2"></i> Valid Sitemap. Compliant with Sitemaps 0.9 standard.</span>';
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
    elements.valIssuesList.innerHTML = valData.issues.map((issue) => `<li>&bull; ${escapeHtml(issue)}</li>`).join('');
  } else {
    elements.valIssuesList.innerHTML = '<li style="color:var(--accent-emerald);">&bull; No syntax or schema errors found.</li>';
  }

  initLucide();
}

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

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
