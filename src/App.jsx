import React, { useState, useMemo, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import CrawlerBar from './components/CrawlerBar';
import LiveMetrics from './components/LiveMetrics';
import GeneratorTab from './components/Tabs/GeneratorTab';
import VisualTreeTab from './components/Tabs/VisualTreeTab';
import SeoAuditTab from './components/Tabs/SeoAuditTab';
import XmlStudioTab from './components/Tabs/XmlStudioTab';
import ValidatorTab from './components/Tabs/ValidatorTab';
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
  const [toasts, setToasts] = useState([]);
  const [isDark, setIsDark] = useState(true);

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
    concurrency: 4,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    respectRobots: true,
    includeImages: true,
    includeSubdomains: false,
    filterNoindex: true,
    excludePatterns: '',
    includePatterns: '',
    useCorsProxy: true
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
    }, 3800);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Theme toggle
  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      if (next) {
        document.body.classList.remove('theme-light');
        document.body.classList.add('theme-dark');
      } else {
        document.body.classList.remove('theme-dark');
        document.body.classList.add('theme-light');
      }
      return next;
    });
  };

  // Crawl Handlers
  const handleStartCrawl = () => {
    if (!targetUrl.trim()) return;

    setIsCrawling(true);
    setPages([]); // reset current pages for fresh crawl
    setCrawlProgress({
      current: 0,
      total: crawlConfig.maxPages,
      percent: 0,
      currentUrl: targetUrl,
      status: 'crawling'
    });

    const crawler = new ClientCrawler({
      url: targetUrl,
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
      onPage: (newPage) => {
        setPages(prev => {
          // Avoid duplicate URLs
          if (prev.some(p => p.url === newPage.url)) return prev;
          return [...prev, newPage];
        });
      },
      onProgress: (prog) => {
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
        // Log feedback can trigger brief info toast for important discovery
        if (type === 'error') {
          addToast(msg, 'error');
        }
      },
      onComplete: (discovered) => {
        setIsCrawling(false);
        setCrawlProgress(prev => ({
          ...prev,
          current: discovered.length,
          percent: 100,
          status: 'completed'
        }));
        addToast(`Crawl finished! Discovered ${discovered.length} total pages.`, 'success');
      }
    });

    crawlerRef.current = crawler;
    crawler.start();
  };

  const handleStopCrawl = () => {
    if (crawlerRef.current) {
      crawlerRef.current.abort();
      setIsCrawling(false);
      setCrawlProgress(prev => ({ ...prev, status: 'completed' }));
      addToast('Crawl stopped by user.', 'warn');
    }
  };

  const handleImportPages = (newPages) => {
    if (isCrawling) handleStopCrawl();
    setPages(newPages);
    setCrawlProgress({
      current: newPages.length,
      total: newPages.length,
      percent: 100,
      currentUrl: newPages[0]?.url || '',
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
    setPages(prev => [newPage, ...prev]);
    addToast(`Added ${newPage.url}`, 'success');
  };

  const handleClearAll = () => {
    if (isCrawling) handleStopCrawl();
    setPages([]);
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
    <>
      {/* Background Ambience */}
      <div className="bg-grid-pattern" />
      <div className="glow-orb orb-1" />
      <div className="glow-orb orb-2" />

      {/* Navigation Bar */}
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
          onStopCrawl={handleStopCrawl}
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
        />

        {/* Active Tab View */}
        {activeTab === 'generator' && (
          <GeneratorTab
            pages={pages}
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

        {activeTab === 'xml' && (
          <XmlStudioTab
            pages={pages}
            targetUrl={targetUrl}
            addToast={addToast}
          />
        )}

        {activeTab === 'validator' && (
          <ValidatorTab
            currentXml={currentXml}
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
    </>
  );
}
