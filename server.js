const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const WebCrawler = require('./crawler');
const SitemapGenerator = require('./sitemapGenerator');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// In-memory store for crawl jobs
const jobs = new Map();

// Cleanup old jobs after 1 hour
setInterval(() => {
  const now = Date.now();
  for (const [jobId, job] of jobs.entries()) {
    if (now - job.createdAt > 3600000) {
      if (job.crawler && !job.crawler.isAborted) {
        job.crawler.abort();
      }
      jobs.delete(jobId);
    }
  }
}, 300000);

/**
 * Start a new crawl job
 */
app.post('/api/crawl/start', (req, res) => {
  const {
    url,
    maxPages = 100,
    maxDepth = 5,
    concurrency = 3,
    delay = 100,
    userAgent,
    respectRobots = true,
    includeSubdomains = false,
    includeImages = true,
    includePatterns = '',
    excludePatterns = ''
  } = req.body;

  if (!url || !url.trim()) {
    return res.status(400).json({ error: 'URL is required.' });
  }

  let formattedUrl = url.trim();
  if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    formattedUrl = 'https://' + formattedUrl;
  }

  const jobId = 'job_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

  const jobState = {
    id: jobId,
    url: formattedUrl,
    status: 'initializing',
    createdAt: Date.now(),
    crawler: null,
    clients: new Set(),
    pages: [],
    logs: [],
    progress: { crawled: 0, queued: 0, percent: 0, currentUrl: formattedUrl },
    stats: null,
    tree: null,
    xml: null
  };

  try {
    const crawler = new WebCrawler({
      url: formattedUrl,
      maxPages,
      maxDepth,
      concurrency,
      delay,
      userAgent,
      respectRobots,
      includeSubdomains,
      includeImages,
      includePatterns,
      excludePatterns,
      onPage: (pageData) => {
        jobState.pages.push(pageData);
        broadcast(jobState, 'page', pageData);
      },
      onProgress: (progressData) => {
        jobState.progress = progressData;
        broadcast(jobState, 'progress', progressData);
      },
      onLog: (logData) => {
        jobState.logs.push(logData);
        broadcast(jobState, 'log', logData);
      },
      onComplete: (summary) => {
        jobState.status = 'completed';
        jobState.stats = summary;
        jobState.tree = SitemapGenerator.generateTreeStructure(jobState.pages);
        jobState.xml = SitemapGenerator.generateXml(jobState.pages, { includeImages });

        broadcast(jobState, 'complete', {
          summary,
          tree: jobState.tree,
          pagesCount: jobState.pages.length
        });
      },
      onError: (err) => {
        jobState.status = 'error';
        broadcast(jobState, 'error', { message: err.message });
      }
    });

    jobState.crawler = crawler;
    jobState.status = 'running';
    jobs.set(jobId, jobState);

    // Run crawler asynchronously
    crawler.start().catch((err) => {
      jobState.status = 'error';
      broadcast(jobState, 'error', { message: err.message });
    });

    res.json({ success: true, jobId, targetUrl: formattedUrl });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Helper to broadcast SSE events to all connected clients for a job
 */
function broadcast(jobState, event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of jobState.clients) {
    try {
      client.write(payload);
    } catch (e) {
      jobState.clients.delete(client);
    }
  }
}

/**
 * SSE Stream endpoint
 */
app.get('/api/crawl/stream/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Crawl job not found.' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Send current state immediately
  res.write(`event: init\ndata: ${JSON.stringify({
    status: job.status,
    url: job.url,
    progress: job.progress,
    pagesCount: job.pages.length,
    pages: job.pages.slice(-50), // last 50
    logs: job.logs.slice(-30)
  })}\n\n`);

  if (job.status === 'completed') {
    res.write(`event: complete\ndata: ${JSON.stringify({
      summary: job.stats,
      tree: job.tree,
      pagesCount: job.pages.length
    })}\n\n`);
  }

  job.clients.add(res);

  req.on('close', () => {
    job.clients.delete(res);
  });
});

/**
 * Stop/Cancel crawl job
 */
app.post('/api/crawl/stop/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  if (job.crawler) {
    job.crawler.abort();
  }
  job.status = 'cancelled';
  broadcast(job, 'cancelled', { message: 'Crawl cancelled by user.' });

  // Generate tree and xml for what we have so far
  job.tree = SitemapGenerator.generateTreeStructure(job.pages);
  job.xml = SitemapGenerator.generateXml(job.pages);

  res.json({ success: true, message: 'Crawl stopped.', totalPages: job.pages.length });
});

/**
 * Export sitemap in various formats
 */
app.get('/api/crawl/export/:jobId/:format', (req, res) => {
  const { jobId, format } = req.params;
  const job = jobs.get(jobId);

  if (!job) {
    return res.status(404).send('Job not found.');
  }

  const hostname = new URL(job.url).hostname.replace(/[^a-z0-9]/gi, '_');

  switch (format.toLowerCase()) {
    case 'xml': {
      const xml = SitemapGenerator.generateXml(job.pages, req.query);
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="sitemap_${hostname}.xml"`);
      return res.send(xml);
    }
    case 'txt': {
      const txt = SitemapGenerator.generateTxt(job.pages);
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="urllist_${hostname}.txt"`);
      return res.send(txt);
    }
    case 'csv': {
      const csv = SitemapGenerator.generateCsv(job.pages);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="sitemap_report_${hostname}.csv"`);
      return res.send(csv);
    }
    case 'json': {
      const json = SitemapGenerator.generateJson(job.pages);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="sitemap_${hostname}.json"`);
      return res.send(json);
    }
    default:
      return res.status(400).send('Invalid export format. Available: xml, txt, csv, json');
  }
});

/**
 * Regenerate / preview XML with custom filter options
 */
app.post('/api/crawl/generate-xml', (req, res) => {
  const { jobId, options = {} } = req.body;
  const job = jobs.get(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  const xml = SitemapGenerator.generateXml(job.pages, options);
  res.json({ success: true, xml, count: job.pages.length });
});

/**
 * Validate raw XML string
 */
app.post('/api/sitemap/validate', (req, res) => {
  const { xml } = req.body;
  if (!xml) {
    return res.status(400).json({ error: 'XML string is required' });
  }

  const validation = SitemapGenerator.validateSitemapXml(xml);
  res.json(validation);
});

/**
 * Fetch and parse an existing external sitemap.xml URL to audit
 */
app.post('/api/sitemap/fetch-and-parse', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const response = await axios.get(url, {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SitemapAuditor/1.0)' }
    });

    const xmlData = response.data.toString();
    const validation = SitemapGenerator.validateSitemapXml(xmlData);

    // Extract pages for visual hierarchy
    const locMatches = xmlData.match(/<loc>([\s\S]*?)<\/loc>/g) || [];
    const pages = locMatches.map(locTag => {
      const pageUrl = locTag.replace(/<\/?loc>/g, '').trim();
      return {
        url: pageUrl,
        depth: 0,
        status: 200,
        title: pageUrl,
        responseTime: 0,
        size: 0,
        lastModified: new Date().toISOString()
      };
    });

    const tree = SitemapGenerator.generateTreeStructure(pages);

    res.json({
      success: true,
      xml: xmlData,
      validation,
      pages,
      tree
    });
  } catch (err) {
    res.status(400).json({ error: `Failed to fetch sitemap: ${err.message}` });
  }
});

// Serve frontend for all unmatched routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Sitemap Generator running on http://localhost:${PORT}`);
  console.log(`====================================================`);
});
