const { create } = require('xmlbuilder2');

class SitemapGenerator {
  /**
   * Calculate priority based on URL depth or path characteristics
   */
  static calculatePriority(page, customRules = {}) {
    if (page.depth === 0) return '1.0';
    if (page.depth === 1) return '0.8';
    if (page.depth === 2) return '0.6';
    if (page.depth === 3) return '0.5';
    return '0.4';
  }

  /**
   * Calculate changefreq based on depth or custom settings
   */
  static calculateChangefreq(page, customFreq = null) {
    if (customFreq && customFreq !== 'auto') return customFreq;
    if (page.depth === 0) return 'daily';
    if (page.depth === 1) return 'weekly';
    if (page.depth === 2) return 'weekly';
    return 'monthly';
  }

  /**
   * Format lastmod date to ISO format YYYY-MM-DD or YYYY-MM-DDThh:mm:ssTZD
   */
  static formatLastMod(dateStr) {
    try {
      if (!dateStr) return new Date().toISOString().split('T')[0];
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
      return d.toISOString().split('T')[0];
    } catch (e) {
      return new Date().toISOString().split('T')[0];
    }
  }

  /**
   * Generate clean compliant sitemap.xml
   */
  static generateXml(pages, options = {}) {
    const {
      includeImages = true,
      defaultChangefreq = 'auto',
      customPriority = 'auto',
      filterErrors = true,
      filterNoindex = true
    } = options;

    // Filter valid pages (2xx status codes, not noindex if enabled)
    let filteredPages = pages.filter(p => {
      if (filterErrors && (p.status < 200 || p.status >= 300)) return false;
      if (filterNoindex && p.metaRobots && p.metaRobots.toLowerCase().includes('noindex')) return false;
      return true;
    });

    const rootAttributes = {
      xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9',
      'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
      'xsi:schemaLocation': 'http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd'
    };

    if (includeImages) {
      rootAttributes['xmlns:image'] = 'http://www.google.com/schemas/sitemap-image/1.1';
    }

    const doc = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('urlset', rootAttributes);

    for (const page of filteredPages) {
      const urlEle = doc.ele('url');
      urlEle.ele('loc').txt(page.url);

      const lastmod = this.formatLastMod(page.lastModified);
      urlEle.ele('lastmod').txt(lastmod);

      const changefreq = this.calculateChangefreq(page, defaultChangefreq);
      urlEle.ele('changefreq').txt(changefreq);

      const priority = customPriority === 'auto' ? this.calculatePriority(page) : customPriority;
      urlEle.ele('priority').txt(priority);

      // Add image tags if present
      if (includeImages && Array.isArray(page.images) && page.images.length > 0) {
        // Cap to first 1000 images per page (Google guideline max 1,000)
        const imagesToAdd = page.images.slice(0, 100);
        for (const img of imagesToAdd) {
          if (!img.url) continue;
          const imgEle = urlEle.ele('image:image');
          imgEle.ele('image:loc').txt(img.url);
          if (img.title) {
            imgEle.ele('image:title').txt(img.title);
          }
          if (img.alt) {
            imgEle.ele('image:caption').txt(img.alt);
          }
        }
      }
    }

    return doc.end({ prettyPrint: true });
  }

  /**
   * Plain text list of URLs
   */
  static generateTxt(pages) {
    const validUrls = pages
      .filter(p => p.status >= 200 && p.status < 300)
      .map(p => p.url);
    return validUrls.join('\n');
  }

  /**
   * CSV Export with rich SEO metrics
   */
  static generateCsv(pages) {
    const headers = [
      'URL',
      'Status Code',
      'Title',
      'Meta Description',
      'H1',
      'Depth',
      'Response Time (ms)',
      'Page Size (bytes)',
      'Internal Links',
      'External Links',
      'Images Count',
      'Canonical',
      'Meta Robots',
      'Last Modified'
    ];

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const clean = String(str).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const rows = pages.map(p => [
      escapeCsv(p.url),
      escapeCsv(p.status),
      escapeCsv(p.title),
      escapeCsv(p.description),
      escapeCsv(p.h1),
      escapeCsv(p.depth),
      escapeCsv(p.responseTime),
      escapeCsv(p.size),
      escapeCsv(p.internalLinksCount),
      escapeCsv(p.externalLinksCount),
      escapeCsv(p.images ? p.images.length : 0),
      escapeCsv(p.canonical),
      escapeCsv(p.metaRobots),
      escapeCsv(p.lastModified)
    ].join(','));

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Structured JSON export
   */
  static generateJson(pages) {
    return JSON.stringify(pages, null, 2);
  }

  /**
   * Convert flat list of URLs into a hierarchical tree structure
   */
  static generateTreeStructure(pages) {
    const root = {
      name: '/',
      path: '/',
      isPage: false,
      children: {},
      stats: { pagesCount: 0 }
    };

    for (const page of pages) {
      try {
        const parsed = new URL(page.url);
        const pathSegments = parsed.pathname.split('/').filter(Boolean);

        let current = root;
        let builtPath = parsed.origin;

        if (pathSegments.length === 0) {
          current.isPage = true;
          current.pageData = page;
          current.url = page.url;
          root.stats.pagesCount++;
          continue;
        }

        for (let i = 0; i < pathSegments.length; i++) {
          const segment = pathSegments[i];
          builtPath += '/' + segment;

          if (!current.children[segment]) {
            current.children[segment] = {
              name: segment,
              path: builtPath,
              isPage: (i === pathSegments.length - 1),
              pageData: (i === pathSegments.length - 1) ? page : null,
              children: {},
              stats: { pagesCount: 0 }
            };
          }

          if (i === pathSegments.length - 1) {
            current.children[segment].isPage = true;
            current.children[segment].pageData = page;
            current.children[segment].url = page.url;
          }

          current = current.children[segment];
        }
        root.stats.pagesCount++;
      } catch (e) {
        // Skip malformed URLs
      }
    }

    // Convert children objects into arrays recursively
    function formatNode(node) {
      const childArray = Object.values(node.children).map(formatNode);
      return {
        name: node.name,
        path: node.path,
        isPage: node.isPage,
        url: node.url || null,
        pageData: node.pageData || null,
        children: childArray
      };
    }

    return formatNode(root);
  }

  /**
   * Sitemap XML validator
   */
  static validateSitemapXml(xmlString) {
    const issues = [];
    const stats = { totalUrls: 0, withLastmod: 0, withPriority: 0, withChangefreq: 0, withImages: 0 };

    if (!xmlString || !xmlString.trim()) {
      return { isValid: false, issues: ['XML content is completely empty'], stats };
    }

    if (!xmlString.includes('<urlset') && !xmlString.includes('<sitemapindex')) {
      issues.push('Missing standard <urlset> or <sitemapindex> root element.');
    }

    if (!xmlString.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')) {
      issues.push('Warning: Root element is missing standard sitemap schema namespace xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
    }

    // Extract all <loc>
    const locMatches = xmlString.match(/<loc>([\s\S]*?)<\/loc>/g) || [];
    stats.totalUrls = locMatches.length;

    const seenUrls = new Set();
    locMatches.forEach(locTag => {
      const url = locTag.replace(/<\/?loc>/g, '').trim();
      if (!url) {
        issues.push('Found empty <loc> tag.');
      } else {
        try {
          new URL(url);
        } catch (e) {
          issues.push(`Invalid URL format in <loc>: "${url}"`);
        }
        if (seenUrls.has(url)) {
          issues.push(`Duplicate URL found in sitemap: "${url}"`);
        }
        seenUrls.add(url);
      }
    });

    const lastmodMatches = xmlString.match(/<lastmod>([\s\S]*?)<\/lastmod>/g) || [];
    stats.withLastmod = lastmodMatches.length;

    const priorityMatches = xmlString.match(/<priority>([\s\S]*?)<\/priority>/g) || [];
    stats.withPriority = priorityMatches.length;

    const changefreqMatches = xmlString.match(/<changefreq>([\s\S]*?)<\/changefreq>/g) || [];
    stats.withChangefreq = changefreqMatches.length;

    const imageMatches = xmlString.match(/<image:loc>([\s\S]*?)<\/image:loc>/g) || [];
    stats.withImages = imageMatches.length;

    return {
      isValid: issues.filter(i => !i.startsWith('Warning')).length === 0,
      issues,
      stats
    };
  }
}

module.exports = SitemapGenerator;
