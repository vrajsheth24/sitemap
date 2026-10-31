import React, { useState, useMemo, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import CrawlerBar from './components/CrawlerBar';
import LiveMetrics from './components/LiveMetrics';
import GeneratorTab from './components/Tabs/GeneratorTab';
import VisualTreeTab from './components/Tabs/VisualTreeTab';
import SeoAuditTab from './components/Tabs/SeoAuditTab';
import XmlStudioTab from './components/Tabs/XmlStudioTab';
import ValidatorTab from './components/Tabs/ValidatorTab';
import SeoToolsTab from './components/Tabs/SeoToolsTab';
import SchemaTab from './components/Tabs/SchemaTab';
import RobotsTab from './components/Tabs/RobotsTab';
import PageModal from './components/PageModal';
import Toast from './components/Toast';
import ProgressBar from './components/ProgressBar';

import { runSeoAudit } from './utils/seoAuditor';
import { ClientCrawler } from './utils/clientCrawler';
import { generateSitemapXml } from './utils/xmlGenerator';

export default function App() {
  // Start with clean empty state - no demo data
  const [pages, setPages] = useState([]);
  const [targetUrl, setTargetUrl] = useState('');
  const [activeTab, setActiveTab] = useState('generator');
  const [isCrawling, setIsCrawling] = useState(false);
  const [inspectedPage, setInspectedPage] = useState(null);
  const [completionStats, setCompletionStats] = useState(null);
  const [skippedPages, setSkippedPages] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [isDark, setIsDark] = useState(() => !document.body.classList.contains('theme-light'));

  const [crawlProgress, setCrawlProgress] = useState({
    current: 0,
    total: 100,
    percent: 0,
    currentUrl: '',
    status: 'idle'
  });

  const [crawlConfig, setCrawlConfig] = useState({
    maxPages: 100,
    maxDepth: 4,
    concurrency: 6,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    respectRobots: true,
    includeImages: true,
    includeSubdomains: false,
    filterNoindex: true,
    excludePatterns: '',
    includePatterns: '',
    useCorsProxy: true,
    customCorsProxy: '',
    restrictToPath: false
  });

  const crawlerRef = useRef(null);

  // Auto-calculated SEO Audit
  const seoAudit = useMemo(() => {
    return runSeoAudit(pages);
  }, [pages]);

  // Toast notification helper
  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Theme: keep body class in sync and remember the choice
  useEffect(() => {
    document.body.classList.toggle('theme-dark', isDark);
    document.body.classList.toggle('theme-light', !isDark);
    try {
      localStorage.setItem('sitemapflow-theme', isDark ? 'dark' : 'light');
    } catch (e) {}
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  // Crawl Handlers
  const handleStartCrawl = (urlOverride) => {
    let finalUrl = (urlOverride || targetUrl).trim();
    if (!finalUrl) return;

    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
      setTargetUrl(finalUrl);
    }

    try {
      const parsed = new URL(finalUrl);
      const host = parsed.hostname;
      if (!host.includes('.') && host !== 'localhost' && !host.startsWith('[')) throw new Error();
    } catch (e) {
      addToast('That does not look like a valid website URL.', 'error');
      return;
    }

    // Abort any previous run so its late callbacks can't leak into this one
    if (crawlerRef.current) crawlerRef.current.abort();

    setIsCrawling(true);
    setPages([]); // reset current pages for fresh crawl
    setCompletionStats(null);
    setSkippedPages([]);
    setCrawlProgress({
      current: 0,
      total: crawlConfig.maxPages,
      percent: 0,
      currentUrl: finalUrl,
      status: 'crawling'
    });

    const crawler = new ClientCrawler({
      url: finalUrl,
      maxPages: crawlConfig.maxPages,
      maxDepth: crawlConfig.maxDepth,
      concurrency: crawlConfig.concurrency,
      userAgent: crawlConfig.userAgent,
      respectRobots: crawlConfig.respectRobots,
      includeImages: crawlConfig.includeImages,
      includeSubdomains: crawlConfig.includeSubdomains,
      filterNoindex: crawlConfig.filterNoindex,
      excludePatterns: crawlConfig.excludePatterns,
      includePatterns: crawlConfig.includePatterns,
      useCorsProxy: crawlConfig.useCorsProxy,
      customCorsProxy: crawlConfig.customCorsProxy,
      restrictToPath: crawlConfig.restrictToPath,
      onPage: (newPage) => {
        if (crawlerRef.current !== crawler) return;
        setPages(prev => {
          // Avoid duplicate URLs
          if (prev.some(p => p.url === newPage.url)) return prev;
          return [...prev, newPage];
        });
      },
      onProgress: (prog) => {
        if (crawlerRef.current !== crawler || crawler.isAborted) return;
        const percent = Math.min(100, Math.round((prog.current / (prog.total || crawlConfig.maxPages)) * 100));
        setCrawlProgress({
          current: prog.current,
          total: prog.total || crawlConfig.maxPages,
          percent,
          currentUrl: prog.url || '',
          status: 'crawling'
        });
      },
      onLog: (msg, type) => {
        if (crawlerRef.current !== crawler) return;
        if (type === 'error') {
          addToast(msg, 'error');
        }
      },
      onComplete: (discoveredResult, maybeStats) => {
        if (crawlerRef.current !== crawler) return;
        const discovered = Array.isArray(discoveredResult) ? discoveredResult : (discoveredResult?.pages || []);
        const stats = maybeStats || discoveredResult?.stats || {
          discovered: discovered.length,
          added: discovered.length,
          skipped: 0
        };
        setIsCrawling(false);
        setCompletionStats(stats);
        setSkippedPages(stats.skippedPages || discoveredResult?.skippedPages || []);

        const isSingleFailed = discovered.length === 1 && discovered[0]?.fetchFailed;

        if (stats.aborted) {
          // Stop handler already updated the UI; just keep the final count accurate
          setCrawlProgress(prev => ({
            ...prev,
            current: discovered.length,
            currentUrl: `Crawl stopped — ${discovered.length} pages collected`,
            status: 'stopped'
          }));
        } else if (discovered.length === 0) {
          setCrawlProgress({
            current: 0,
            total: 0,
            percent: 100,
            currentUrl: 'No pages could be added. Check the URL, robots/noindex settings or include/exclude patterns.',
            status: 'warning'
          });
          addToast('Crawl finished but no pages were added.', 'warn');
        } else if (isSingleFailed) {
          setCrawlProgress({
            current: 1,
            total: 1,
            percent: 100,
            currentUrl: `Warning: Unable to fetch page content cross-origin. Check URL or configure a custom CORS proxy in Options.`,
            status: 'warning'
          });
          addToast('Could not fetch page content via CORS proxies. Please check target URL or add a custom proxy in Options.', 'warn');
        } else {
          const completionMsg = stats.skipped > 0 
            ? `Crawl complete — ${discovered.length} pages added to sitemap (${stats.skipped} skipped)`
            : `Crawl complete — ${discovered.length} pages added to sitemap`;
          setCrawlProgress({
            current: discovered.length,
            total: discovered.length,
            percent: 100,
            currentUrl: completionMsg,
            status: 'completed'
          });
          addToast(`Crawl finished! ${discovered.length} pages added to sitemap.`, 'success');
        }
      }
    });

    crawlerRef.current = crawler;
    crawler.start();
  };

  const handleStopCrawl = ({ silent = false } = {}) => {
    if (!crawlerRef.current) return;
    crawlerRef.current.abort();
    if (silent) crawlerRef.current = null;
    if (!isCrawling) return;
    setIsCrawling(false);
    setCrawlProgress(prev => ({ ...prev, currentUrl: 'Crawl stopped by user', status: 'stopped' }));
    if (!silent) addToast('Crawl stopped by user.', 'warn');
  };

  const handleImportPages = (newPages) => {
    handleStopCrawl({ silent: true });
    setCompletionStats(null);
    setSkippedPages([]);
    setPages(newPages);
    setCrawlProgress({
      current: newPages.length,
      total: newPages.length,
      percent: 100,
      currentUrl: `Imported ${newPages.length} pages from file`,
      status: 'completed'
    });
    if (newPages[0]?.url) {
      try {
        const u = new URL(newPages[0].url);
        setTargetUrl(`${u.protocol}//${u.hostname}`);
      } catch (e) {}
    }
  };

  const handleUpdatePage = (url, updates) => {
    setPages(prev => prev.map(p => p.url === url ? { ...p, ...updates } : p));
  };

  const handleDeletePage = (url) => {
    setPages(prev => prev.filter(p => p.url !== url));
    addToast('Removed page from sitemap.', 'info');
  };

  const handleAddPage = (newPage) => {
    if (pages.some(p => p.url === newPage.url)) {
      addToast('That URL is already in the sitemap.', 'warn');
      return false;
    }
    setPages(prev => [newPage, ...prev]);
    addToast(`Added ${newPage.url}`, 'success');
    return true;
  };

  const handleIncludeSkipped = (skippedItem) => {
    let slug = 'Page';
    let depth = 1;
    try {
      const segments = new URL(skippedItem.url).pathname.split('/').filter(Boolean);
      slug = segments[segments.length - 1] || 'Resource';
      depth = segments.length;
    } catch (e) {}
    const inferredTitle = slug.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    const newPage = {
      url: skippedItem.url,
      title: `${inferredTitle} | Sitemap`,
      description: `Included page from ${skippedItem.url}`,
      h1: inferredTitle,
      statusCode: 200,
      loadTime: 120,
      sizeKb: 20,
      depth,
      imagesCount: 0,
      images: [],
      hasCanonical: true,
      isIndexable: true,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'monthly',
      priority: 0.6
    };

    setPages(prev => prev.some(p => p.url === newPage.url) ? prev : [newPage, ...prev]);
    setSkippedPages(prev => prev.filter(s => s.url !== skippedItem.url));
    addToast(`Added ${skippedItem.url} to sitemap!`, 'success');
  };

  const handleClearAll = () => {
    handleStopCrawl({ silent: true });
    setIsCrawling(false);
    setPages([]);
    setCompletionStats(null);
    setSkippedPages([]);
    setCrawlProgress({ current: 0, total: 100, percent: 0, currentUrl: '', status: 'idle' });
    addToast('Cleared all pages.', 'info');
  };

  // Cleanup crawler on unmount
  useEffect(() => {
    return () => {
      if (crawlerRef.current) crawlerRef.current.abort();
    };
  }, []);

  // Compute live sitemap XML for ValidatorTab
  const currentXml = useMemo(() => {
    return generateSitemapXml(pages, { includeImages: crawlConfig.includeImages });
  }, [pages, crawlConfig.includeImages]);

  return (
    <div className="app-shell">
      {/* Sidebar Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCrawling={isCrawling}
        pagesCount={pages.length}
        seoScore={seoAudit.score}
        isDark={isDark}
        toggleTheme={toggleTheme}
      />

      {/* Main Workspace */}
      <main className="main-wrapper">
        {/* Crawler Input & Options */}
        <CrawlerBar
          targetUrl={targetUrl}
          setTargetUrl={setTargetUrl}
          isCrawling={isCrawling}
          onStartCrawl={handleStartCrawl}
          onStopCrawl={() => handleStopCrawl()}
          onImportPages={handleImportPages}
          onClearAll={handleClearAll}
          crawlConfig={crawlConfig}
          setCrawlConfig={setCrawlConfig}
          addToast={addToast}
        />

        {/* Live Crawl Progress Bar */}
        <ProgressBar
          progress={crawlProgress}
          isCrawling={isCrawling}
        />

        {/* Real-time Stat Cards */}
        <LiveMetrics
          pages={pages}
          seoAudit={seoAudit}
          stats={completionStats}
        />

        {/* Active Tab View */}
        {activeTab === 'generator' && (
          <GeneratorTab
            pages={pages}
            skippedPages={skippedPages}
            onIncludeSkipped={handleIncludeSkipped}
            onUpdatePage={handleUpdatePage}
            onDeletePage={handleDeletePage}
            onAddPage={handleAddPage}
            onInspectPage={setInspectedPage}
          />
        )}

        {activeTab === 'tree' && (
          <VisualTreeTab
            pages={pages}
            onInspectPage={setInspectedPage}
          />
        )}

        {activeTab === 'seo' && (
          <SeoAuditTab
            seoAudit={seoAudit}
            onInspectUrl={setInspectedPage}
            pages={pages}
          />
        )}

        {activeTab === 'tools' && (
          <SeoToolsTab
            pages={pages}
            targetUrl={targetUrl}
            addToast={addToast}
            onInspectPage={setInspectedPage}
          />
        )}

        {activeTab === 'schema' && (
          <SchemaTab
            pages={pages}
            targetUrl={targetUrl}
            addToast={addToast}
          />
        )}

        {activeTab === 'robots' && (
          <RobotsTab
            pages={pages}
            targetUrl={targetUrl}
            addToast={addToast}
          />
        )}

        {activeTab === 'xml' && (
          <XmlStudioTab
            pages={pages}
            targetUrl={targetUrl}
            addToast={addToast}
            defaultIncludeImages={crawlConfig.includeImages}
          />
        )}

        {activeTab === 'validator' && (
          <ValidatorTab
            currentXml={currentXml}
            hasPages={pages.length > 0}
            addToast={addToast}
          />
        )}
      </main>

      {/* Deep-dive Page Modal */}
      {inspectedPage && (
        <PageModal
          page={inspectedPage}
          onClose={() => setInspectedPage(null)}
        />
      )}

      {/* Toast Notifications */}
      <Toast
        toasts={toasts}
        removeToast={removeToast}
      />
    </div>
  );
}
