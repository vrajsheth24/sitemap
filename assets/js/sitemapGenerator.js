(function (global) {
  class SitemapGenerator {
    static escapeXml(value) {
      if (value === null || value === undefined) return '';
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    }

    static calculatePriority(page, customRules = {}) {
      if (page && page.depth === 0) return '1.0';
      if (page && page.depth === 1) return '0.8';
      if (page && page.depth === 2) return '0.6';
      if (page && page.depth === 3) return '0.5';
      return '0.4';
    }

    static calculateChangefreq(page, customFreq = null) {
      if (customFreq && customFreq !== 'auto') return customFreq;
      if (page && page.depth === 0) return 'daily';
      if (page && page.depth === 1) return 'weekly';
      if (page && page.depth === 2) return 'weekly';
      return 'monthly';
    }

    static formatLastMod(dateStr) {
      try {
        if (!dateStr) return new Date().toISOString().split('T')[0];
        const d = new Date(dateStr);
        if (Number.isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
        return d.toISOString().split('T')[0];
      } catch (e) {
        return new Date().toISOString().split('T')[0];
      }
    }

    static generateXml(pages, options = {}) {
      const {
        includeImages = true,
        defaultChangefreq = 'auto',
        customPriority = 'auto',
        filterErrors = true,
        filterNoindex = true
      } = options;

      const filteredPages = pages.filter((page) => {
        if (filterErrors && (!page || page.status < 200 || page.status >= 300)) return false;
        if (filterNoindex && page && page.metaRobots && page.metaRobots.toLowerCase().includes('noindex')) return false;
        return true;
      });

      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"';
      if (includeImages) xml += ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"';
      xml += '>\n';

      for (const page of filteredPages) {
        xml += '  <url>\n';
        xml += `    <loc>${this.escapeXml(page.url)}</loc>\n`;
        xml += `    <lastmod>${this.escapeXml(this.formatLastMod(page.lastModified))}</lastmod>\n`;
        const changefreq = this.calculateChangefreq(page, defaultChangefreq);
        xml += `    <changefreq>${this.escapeXml(changefreq)}</changefreq>\n`;
        const priority = customPriority === 'auto' ? this.calculatePriority(page) : customPriority;
        xml += `    <priority>${this.escapeXml(priority)}</priority>\n`;

        if (includeImages && Array.isArray(page.images) && page.images.length > 0) {
          const imagesToAdd = page.images.slice(0, 100);
          for (const img of imagesToAdd) {
            if (!img || !img.url) continue;
            xml += '    <image:image>\n';
            xml += `      <image:loc>${this.escapeXml(img.url)}</image:loc>\n`;
            if (img.title) xml += `      <image:title>${this.escapeXml(img.title)}</image:title>\n`;
            if (img.alt) xml += `      <image:caption>${this.escapeXml(img.alt)}</image:caption>\n`;
            xml += '    </image:image>\n';
          }
        }

        xml += '  </url>\n';
      }

      xml += '</urlset>\n';
      return xml;
    }

    static generateTxt(pages) {
      const validUrls = pages
        .filter((page) => page && page.status >= 200 && page.status < 300)
        .map((page) => page.url);
      return validUrls.join('\n');
    }

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

      const escapeCsv = (value) => {
        if (value === null || value === undefined) return '""';
        const clean = String(value).replace(/"/g, '""');
        return `"${clean}"`;
      };

      const rows = pages.map((page) => [
        escapeCsv(page.url),
        escapeCsv(page.status),
        escapeCsv(page.title),
        escapeCsv(page.description),
        escapeCsv(page.h1),
        escapeCsv(page.depth),
        escapeCsv(page.responseTime),
        escapeCsv(page.size),
        escapeCsv(page.internalLinksCount),
        escapeCsv(page.externalLinksCount),
        escapeCsv(page.images ? page.images.length : 0),
        escapeCsv(page.canonical),
        escapeCsv(page.metaRobots),
        escapeCsv(page.lastModified)
      ].join(','));

      return [headers.join(','), ...rows].join('\n');
    }

    static generateJson(pages) {
      return JSON.stringify(pages, null, 2);
    }

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
            root.stats.pagesCount += 1;
            continue;
          }

          for (let i = 0; i < pathSegments.length; i += 1) {
            const segment = pathSegments[i];
            builtPath += '/' + segment;

            if (!current.children[segment]) {
              current.children[segment] = {
                name: segment,
                path: builtPath,
                isPage: i === pathSegments.length - 1,
                pageData: i === pathSegments.length - 1 ? page : null,
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

          root.stats.pagesCount += 1;
        } catch (error) {
          // Ignore malformed entries
        }
      }

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

      const locMatches = xmlString.match(/<loc>([\s\S]*?)<\/loc>/g) || [];
      stats.totalUrls = locMatches.length;

      const seenUrls = new Set();
      locMatches.forEach((locTag) => {
        const url = locTag.replace(/<\/?loc>/g, '').trim();
        if (!url) {
          issues.push('Found empty <loc> tag.');
        } else {
          try {
            new URL(url);
          } catch (error) {
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
        isValid: issues.filter((issue) => !issue.startsWith('Warning')).length === 0,
        issues,
        stats
      };
    }
  }

  global.SitemapGenerator = SitemapGenerator;
})(typeof window !== 'undefined' ? window : globalThis);
